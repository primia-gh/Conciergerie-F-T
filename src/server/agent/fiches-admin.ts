"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { assertRole } from "@/server/auth/guards";
import { ecrireAuJournal } from "@/lib/agent/journal";
import type { ActiviteMetier } from "@/lib/agent/types";
import {
  completudeLogement,
  dernieresVersions,
  detecterCodesProbables,
  normaliserContenuFiche,
} from "@/lib/agent/fiches-modele";
import { enregistrerFicheSchema, nouveauLogementSchema } from "@/lib/agent/fiches-saisie";

export type FicheFormState = {
  error: string | null;
  success?: boolean;
  /** Lignes de la fiche qui ressemblent à un code d'accès : avertissement, jamais un blocage. */
  avertissements?: string[];
};

const uuidSchema = z.string().uuid();
const CODE_CONFLIT = "23505"; // violation d'unicité Postgres (voir migration 0026)
const MESSAGE_CONFLIT =
  "Cette section vient d'être modifiée par ailleurs. Rechargez la page avant de réessayer.";

type Portee = { activite: ActiviteMetier; logementId: string | null; section: string };
type VersionExistante = { id: string; version: number; contenu: string };

async function derniereVersion(supabase: SupabaseClient, portee: Portee): Promise<VersionExistante | null> {
  let requete = supabase
    .from("fiche_connaissance")
    .select("id, version, contenu")
    .eq("activite", portee.activite)
    .eq("section", portee.section);
  requete = portee.logementId ? requete.eq("logement_id", portee.logementId) : requete.is("logement_id", null);

  const { data } = await requete.order("version", { ascending: false }).limit(1).maybeSingle<VersionExistante>();
  return data ?? null;
}

/** Ajoute une version : jamais de mise à jour en place, l'historique est conservé. */
async function insererVersion(
  supabase: SupabaseClient,
  portee: Portee,
  contenu: string,
  precedente: VersionExistante | null,
): Promise<{ ok: true; id: string; version: number } | { ok: false; conflit: boolean }> {
  const version = (precedente?.version ?? 0) + 1;
  const { data, error } = await supabase
    .from("fiche_connaissance")
    .insert({
      activite: portee.activite,
      logement_id: portee.logementId,
      section: portee.section,
      contenu,
      version,
      auteur: "gerant",
    })
    .select("id, version")
    .single();

  if (error || !data) return { ok: false, conflit: error?.code === CODE_CONFLIT };
  return { ok: true, id: data.id as string, version };
}

function rafraichirFiches() {
  revalidatePath("/admin/fiches", "layout");
}

/**
 * Nouvelle version d'une section de fiche, pour une activité et, pour F&T,
 * éventuellement un logement. Accès par la session du Gérant (donc sous RLS) :
 * ce n'est pas l'agent qui écrit ici, c'est le Gérant.
 */
export async function enregistrerFiche(_prevState: FicheFormState, formData: FormData): Promise<FicheFormState> {
  await assertRole("admin");

  const parsed = enregistrerFicheSchema.safeParse({
    activite: formData.get("activite") ?? undefined,
    logementId: formData.get("logementId") ?? undefined,
    section: formData.get("section") ?? "",
    contenu: formData.get("contenu") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const { activite, logementId, section, contenu } = parsed.data;

  const supabase = await createClient();

  if (logementId) {
    const { data: logement } = await supabase.from("logement").select("id").eq("id", logementId).maybeSingle();
    if (!logement) return { error: "Logement introuvable." };
  }

  const portee: Portee = { activite, logementId, section };
  const precedente = await derniereVersion(supabase, portee);
  if (precedente && normaliserContenuFiche(precedente.contenu) === contenu) {
    return { error: "Le contenu est identique à la version actuelle." };
  }

  const resultat = await insererVersion(supabase, portee, contenu, precedente);
  if (!resultat.ok) {
    return { error: resultat.conflit ? MESSAGE_CONFLIT : "Impossible d'enregistrer, réessayez." };
  }

  await ecrireAuJournal({
    activite,
    type: "mise_a_jour_fiche",
    entiteType: "fiche_connaissance",
    entiteId: resultat.id,
    decision: `Section « ${section} » : version ${resultat.version}${logementId ? ` (logement ${logementId})` : ""}`,
    auteur: "gerant",
  });

  rafraichirFiches();
  return { error: null, success: true, avertissements: detecterCodesProbables(contenu) };
}

/**
 * Restaure une ancienne version : son contenu devient une NOUVELLE version.
 * L'historique n'est jamais réécrit (« chaque version est conservée »).
 */
export async function restaurerVersion(ficheId: string): Promise<FicheFormState> {
  await assertRole("admin");

  if (!uuidSchema.safeParse(ficheId).success) return { error: "Version introuvable." };

  const supabase = await createClient();
  const { data: ancienne } = await supabase
    .from("fiche_connaissance")
    .select("id, activite, logement_id, section, version, contenu")
    .eq("id", ficheId)
    .maybeSingle();
  if (!ancienne) return { error: "Version introuvable." };

  const portee: Portee = {
    activite: ancienne.activite as ActiviteMetier,
    logementId: (ancienne.logement_id as string | null) ?? null,
    section: ancienne.section as string,
  };
  const actuelle = await derniereVersion(supabase, portee);
  if (
    actuelle &&
    (actuelle.id === ancienne.id ||
      normaliserContenuFiche(actuelle.contenu) === normaliserContenuFiche(ancienne.contenu as string))
  ) {
    return { error: "C'est déjà le contenu de la version actuelle." };
  }

  const contenu = normaliserContenuFiche(ancienne.contenu as string);
  const resultat = await insererVersion(supabase, portee, contenu, actuelle);
  if (!resultat.ok) {
    return { error: resultat.conflit ? MESSAGE_CONFLIT : "Impossible de restaurer, réessayez." };
  }

  await ecrireAuJournal({
    activite: portee.activite,
    type: "restauration_fiche",
    entiteType: "fiche_connaissance",
    entiteId: resultat.id,
    decision: `Section « ${portee.section} » : restauration de la version ${ancienne.version} (nouvelle version ${resultat.version})`,
    auteur: "gerant",
  });

  rafraichirFiches();
  return { error: null, success: true, avertissements: detecterCodesProbables(contenu) };
}

/**
 * Crée un logement F&T (inactif : il ne sera utilisable par l'assistant
 * qu'une fois sa fiche complète et activée). Le propriétaire est soit un
 * propriétaire existant, soit créé ici avec le statut « client ».
 */
export async function creerLogement(_prevState: FicheFormState, formData: FormData): Promise<FicheFormState> {
  await assertRole("admin");

  const parsed = nouveauLogementSchema.safeParse({
    nom: formData.get("nom") ?? "",
    adresse: formData.get("adresse") ?? "",
    capacite: formData.get("capacite") ?? undefined,
    proprietaireId: formData.get("proprietaireId") ?? undefined,
    nouveauProprietaire: formData.get("nouveauProprietaire") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const { nom, adresse, capacite, proprietaireId, nouveauProprietaire } = parsed.data;

  const supabase = await createClient();

  let proprietaire = proprietaireId;
  let proprietaireCree = false;
  if (proprietaire) {
    const { data } = await supabase.from("proprietaire").select("id").eq("id", proprietaire).maybeSingle();
    if (!data) return { error: "Propriétaire introuvable." };
  } else {
    const { data, error } = await supabase
      .from("proprietaire")
      .insert({ nom: nouveauProprietaire, statut: "client", source: "saisie_gerant" })
      .select("id")
      .single();
    if (error || !data) return { error: "Impossible de créer le propriétaire, réessayez." };
    proprietaire = data.id as string;
    proprietaireCree = true;
  }

  const { data: logement, error: erreurLogement } = await supabase
    .from("logement")
    .insert({ proprietaire_id: proprietaire, nom, adresse, capacite, statut: "inactif" })
    .select("id")
    .single();
  if (erreurLogement || !logement) {
    // Ne pas laisser un propriétaire orphelin créé pour ce logement seulement.
    if (proprietaireCree) await supabase.from("proprietaire").delete().eq("id", proprietaire);
    return { error: "Impossible de créer le logement, réessayez." };
  }
  const logementId = logement.id as string;

  await ecrireAuJournal({
    activite: "ft",
    type: "creation_logement",
    entiteType: "logement",
    entiteId: logementId,
    decision: `Logement « ${nom} » créé (inactif)${proprietaireCree ? ", nouveau propriétaire créé" : ""}`,
    auteur: "gerant",
  });

  rafraichirFiches();
  // Hors de tout try/catch : redirect() fonctionne en levant une exception interne.
  redirect(`/admin/fiches/ft/logements/${logementId}`);
}

/**
 * Active un logement pour l'assistant. Refusé tant que les sections
 * obligatoires (accès, équipements, règles, dépannage) ne sont pas remplies :
 * « un logement n'est activé que si sa fiche est complète » (cahier des charges).
 */
export async function activerLogement(logementId: string): Promise<FicheFormState> {
  await assertRole("admin");

  if (!uuidSchema.safeParse(logementId).success) return { error: "Logement introuvable." };

  const supabase = await createClient();
  const { data: logement } = await supabase
    .from("logement")
    .select("id, nom, statut")
    .eq("id", logementId)
    .maybeSingle();
  if (!logement) return { error: "Logement introuvable." };
  if (logement.statut === "actif") return { error: "Ce logement est déjà activé." };

  const { data: fiches } = await supabase
    .from("fiche_connaissance")
    .select("section, contenu, version")
    .eq("logement_id", logementId)
    .returns<{ section: string; contenu: string; version: number }[]>();

  const completude = completudeLogement(dernieresVersions(fiches ?? []));
  if (!completude.complete) {
    return {
      error: `Fiche incomplète : il manque ${completude.manquantes.map((s) => s.libelle).join(", ")}.`,
    };
  }

  const { error } = await supabase.from("logement").update({ statut: "actif" }).eq("id", logementId);
  if (error) return { error: "Impossible d'activer le logement, réessayez." };

  await ecrireAuJournal({
    activite: "ft",
    type: "activation_logement",
    entiteType: "logement",
    entiteId: logementId,
    decision: `Logement « ${logement.nom} » activé pour l'assistant`,
    auteur: "gerant",
  });

  rafraichirFiches();
  return { error: null, success: true };
}

/** Retire un logement de l'assistant (réversible, aucune donnée supprimée). */
export async function desactiverLogement(logementId: string): Promise<FicheFormState> {
  await assertRole("admin");

  if (!uuidSchema.safeParse(logementId).success) return { error: "Logement introuvable." };

  const supabase = await createClient();
  const { data: logement } = await supabase
    .from("logement")
    .select("id, nom, statut")
    .eq("id", logementId)
    .maybeSingle();
  if (!logement) return { error: "Logement introuvable." };
  if (logement.statut !== "actif") return { error: "Ce logement n'est pas activé." };

  const { error } = await supabase.from("logement").update({ statut: "inactif" }).eq("id", logementId);
  if (error) return { error: "Impossible de désactiver le logement, réessayez." };

  await ecrireAuJournal({
    activite: "ft",
    type: "desactivation_logement",
    entiteType: "logement",
    entiteId: logementId,
    decision: `Logement « ${logement.nom} » retiré de l'assistant`,
    auteur: "gerant",
  });

  rafraichirFiches();
  return { error: null, success: true };
}
