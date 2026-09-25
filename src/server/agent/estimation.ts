"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit } from "@/server/security/rate-limit";
import { ecrireAuJournal } from "@/lib/agent/journal";
import { alerterGerant } from "@/lib/agent/alert";

export type EstimationState = {
  statut: "initial" | "envoye" | "erreur";
  erreur?: string;
  champs?: Record<string, string>;
  /** Numéro de tentative : le formulaire est recréé à chaque erreur, avec la saisie conservée. */
  tentative?: number;
};

/** Délai minimum entre l'affichage du formulaire et l'envoi : en dessous, c'est un robot. */
const DELAI_MINIMUM_MS = 3000;

const TYPES = ["Appartement", "Maison", "Studio", "Autre"] as const;

const schema = z.object({
  nom: z.string().trim().min(2, "Indiquez votre nom.").max(120),
  telephone: z
    .string()
    .trim()
    .min(6, "Indiquez un numéro de téléphone pour que nous puissions vous rappeler.")
    .max(25)
    .regex(/^[+0-9 ().-]+$/, "Ce numéro de téléphone ne semble pas valide."),
  email: z.union([z.literal(""), z.string().trim().email("Cette adresse e-mail ne semble pas valide.").max(200)]),
  ville: z.string().trim().min(2, "Indiquez la ville du logement.").max(160),
  type: z.enum(TYPES, { message: "Choisissez le type de logement." }),
  couchages: z.union([z.literal(""), z.coerce.number().int().min(1).max(40)]),
  residence: z.enum(["", "principale", "secondaire"]),
  message: z.string().trim().max(2000),
  consentement: z.literal("oui", { message: "Cochez la case pour que nous puissions vous recontacter." }),
});

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "inconnu";
}

/**
 * Formulaire public « Estimer mes revenus » de /proprietaires (lot B). Crée un
 * propriétaire au statut « prospect » et son bien, visibles dans /admin/ft,
 * écrit le journal et prévient le Gérant (si Resend est branché). Publique par
 * nature : protégée par un champ piège, un délai minimum de remplissage et une
 * limite de débit. Aucune relance automatique : la relance à 48 h ne concerne
 * que les conversations du chat.
 */
export async function demanderEstimation(prev: EstimationState, formData: FormData): Promise<EstimationState> {
  const tentative = (prev.tentative ?? 0) + 1;
  // Champ piège invisible : un humain ne le remplit jamais. On fait comme si
  // tout s'était bien passé, pour ne rien apprendre au robot.
  if (String(formData.get("site_web") ?? "") !== "") return { statut: "envoye" };
  // Délai minimum : l'heure d'affichage est posée par le navigateur. Sans elle
  // (JavaScript désactivé), on ne rejette pas : mieux vaut un robot de plus
  // qu'un propriétaire perdu.
  const debut = Number(formData.get("debut") ?? 0);
  if (debut && Date.now() - debut < DELAI_MINIMUM_MS) return { statut: "envoye" };

  const brut = {
    nom: String(formData.get("nom") ?? ""),
    telephone: String(formData.get("telephone") ?? ""),
    email: String(formData.get("email") ?? ""),
    ville: String(formData.get("ville") ?? ""),
    type: String(formData.get("type") ?? ""),
    couchages: String(formData.get("couchages") ?? ""),
    residence: String(formData.get("residence") ?? ""),
    message: String(formData.get("message") ?? ""),
    consentement: String(formData.get("consentement") ?? ""),
  };
  const lu = schema.safeParse(brut);
  if (!lu.success) {
    return { statut: "erreur", erreur: lu.error.issues[0]?.message ?? "Vérifiez le formulaire.", champs: brut, tentative };
  }
  const d = lu.data;

  if (!checkRateLimit(`estimation:${await clientIp()}`, 5, 60 * 60 * 1000)) {
    return { statut: "erreur", erreur: "Trop de demandes envoyées. Réessayez dans une heure.", champs: brut, tentative };
  }

  const supabase = createServiceClient();
  const { data: proprietaire, error: errProprietaire } = await supabase
    .from("proprietaire")
    .insert({
      nom: d.nom,
      telephone: d.telephone,
      email: d.email || null,
      ville: d.ville,
      statut: "prospect",
      source: "formulaire_estimation",
      notes: d.message || null,
    })
    .select("id")
    .single();
  if (errProprietaire || !proprietaire) {
    return { statut: "erreur", erreur: "L'envoi n'a pas abouti. Réessayez dans un instant.", champs: brut, tentative };
  }

  const { data: bien, error: errBien } = await supabase
    .from("bien_prospect")
    .insert({
      proprietaire_id: proprietaire.id,
      type: d.type,
      adresse: d.ville,
      capacite: d.couchages === "" ? null : d.couchages,
      residence_principale: d.residence === "" ? null : d.residence === "principale",
    })
    .select("id")
    .single();
  if (errBien || !bien) {
    await supabase.from("proprietaire").delete().eq("id", proprietaire.id);
    return { statut: "erreur", erreur: "L'envoi n'a pas abouti. Réessayez dans un instant.", champs: brut, tentative };
  }

  await ecrireAuJournal({
    activite: "ft",
    type: "demande_estimation",
    entiteType: "bien_prospect",
    entiteId: bien.id as string,
    decision: "Demande d'estimation reçue depuis /proprietaires : rappel promis sous 24 h",
    auteur: "proprietaire",
    resultat: "enregistree",
  });

  // Signal en temps réel, au mieux : l'échec d'un e-mail ne doit pas faire
  // échouer une demande déjà enregistrée (le journal et /admin/ft font foi).
  try {
    await alerterGerant({
      sujet: "Nouvelle demande d'estimation F&T",
      corps: [
        `${d.nom} — ${d.telephone}${d.email ? ` — ${d.email}` : ""}`,
        `${d.type} à ${d.ville}${d.couchages !== "" ? `, ${d.couchages} couchages` : ""}`,
        d.message ? `Message : ${d.message}` : "",
        "Rappel promis sous 24 h. Détail : /admin/ft",
      ]
        .filter(Boolean)
        .join("\n"),
    });
  } catch {
    // Volontairement ignoré, voir plus haut.
  }

  return { statut: "envoye" };
}
