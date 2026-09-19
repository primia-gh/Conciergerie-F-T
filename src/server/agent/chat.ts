"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit } from "@/server/security/rate-limit";
import {
  MISSION_PROSPECT_FT,
  buildPromptProspectProprietaire,
} from "@/lib/agent/missions/prospect-ft";
import { jouerTourAgent, type MessageConversation } from "@/lib/agent/core";
import { lireNiveauAutonomie } from "@/lib/agent/regles";
import { alerterGerant } from "@/lib/agent/alert";
import { chatProspectionActif } from "@/lib/agent/flags";
import { ecrireAuJournal } from "@/lib/agent/journal";
import { prochainsCreneauxDisponibles, formatCreneauxPourPrompt } from "@/server/agent/agenda";

const inputSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  bienProspectId: z.string().uuid().optional(),
});

export type ChatProspectResult =
  | { ok: true; bienProspectId: string; reponse: string; escalade: boolean }
  | { ok: false; error: string };

async function clientKey(bienProspectId?: string): Promise<string> {
  if (bienProspectId) return `agent-chat:${bienProspectId}`;
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "inconnu";
  return `agent-chat-nouveau:${ip}`;
}

export async function envoyerMessageProprietaire(input: {
  message: string;
  bienProspectId?: string;
}): Promise<ChatProspectResult> {
  // Garde ici, dans l'action serveur, et pas seulement sur la page : une
  // action serveur reste appelable directement sans passer par l'interface.
  if (!chatProspectionActif()) {
    return {
      ok: false,
      error:
        "Le chat est momentanément indisponible. Merci de nous contacter directement.",
    };
  }

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Message invalide." };
  }
  const { message, bienProspectId: bienProspectIdEntree } = parsed.data;

  const rateLimitKey = await clientKey(bienProspectIdEntree);
  const limite = bienProspectIdEntree ? 20 : 8;
  if (!checkRateLimit(rateLimitKey, limite, 60 * 60 * 1000)) {
    return {
      ok: false,
      error: "Trop de messages envoyés. Merci de réessayer dans quelques minutes.",
    };
  }

  const supabase = createServiceClient();

  let bienProspectId = bienProspectIdEntree ?? null;
  let proprietaireId: string | null = null;
  if (bienProspectId) {
    const { data } = await supabase
      .from("bien_prospect")
      .select("id, proprietaire_id")
      .eq("id", bienProspectId)
      .maybeSingle();
    if (!data) bienProspectId = null;
    else proprietaireId = data.proprietaire_id as string;
  }

  if (!bienProspectId) {
    const { data: proprietaire, error: errProprietaire } = await supabase
      .from("proprietaire")
      .insert({ nom: "Prospect à identifier", statut: "prospect", source: "chat_site" })
      .select("id")
      .single();
    if (errProprietaire || !proprietaire) {
      return { ok: false, error: "Impossible de démarrer la conversation, réessayez." };
    }
    const { data: bienProspect, error: errBien } = await supabase
      .from("bien_prospect")
      .insert({ proprietaire_id: proprietaire.id })
      .select("id")
      .single();
    if (errBien || !bienProspect) {
      return { ok: false, error: "Impossible de démarrer la conversation, réessayez." };
    }
    bienProspectId = bienProspect.id as string;
    proprietaireId = proprietaire.id as string;
  }

  const [{ data: ficheRows }, niveauRegle, { data: historiqueRows }] = await Promise.all([
    supabase
      .from("fiche_connaissance")
      .select("contenu")
      .eq("activite", MISSION_PROSPECT_FT.activite)
      .is("logement_id", null)
      .eq("section", "offre_ft")
      .order("version", { ascending: false })
      .limit(1),
    lireNiveauAutonomie(supabase, {
      activite: MISSION_PROSPECT_FT.activite,
      domaine: "communication",
      tache: "reponse_offre_prospect",
    }),
    supabase
      .from("message_agent")
      .select("auteur, contenu, sens")
      .eq("bien_prospect_id", bienProspectId)
      .order("created_at", { ascending: true })
      .limit(20),
  ]);

  const ficheOffre = ficheRows?.[0]?.contenu ?? "Fiche offre non encore renseignée.";
  const niveauAutonomie = niveauRegle ?? "agit_apres_validation";

  await supabase.from("message_agent").insert({
    activite: MISSION_PROSPECT_FT.activite,
    bien_prospect_id: bienProspectId,
    canal: "chat_site",
    sens: "entrant",
    contenu: message,
    auteur: "proprietaire",
    statut: "envoye",
  });

  const historique: MessageConversation[] = (historiqueRows ?? []).map((m) => ({
    role: m.auteur === "agent" ? "assistant" : "user",
    content: m.contenu as string,
  }));
  historique.push({ role: "user", content: message });

  const creneaux = await prochainsCreneauxDisponibles(supabase);
  const systemPrompt = buildPromptProspectProprietaire(ficheOffre).replace(
    "{{CRENEAUX}}",
    formatCreneauxPourPrompt(creneaux),
  );

  let escalade = false;

  const { texte } = await jouerTourAgent({
    mission: MISSION_PROSPECT_FT,
    systemPrompt,
    historique,
    executeurOutil: async (appel) => {
      if (appel.nom === "enregistrer_qualification") {
        const champs = appel.input as Record<string, unknown>;
        const update: Record<string, unknown> = {};
        if (typeof champs.type === "string") update.type = champs.type;
        if (typeof champs.adresse === "string") update.adresse = champs.adresse;
        if (typeof champs.residencePrincipale === "boolean") {
          update.residence_principale = champs.residencePrincipale;
        }
        if (typeof champs.capacite === "number") update.capacite = champs.capacite;
        if (Array.isArray(champs.equipements)) update.equipements = champs.equipements;
        if (typeof champs.disponibiliteSouhaitee === "string") {
          update.disponibilite_souhaitee = champs.disponibiliteSouhaitee;
        }
        if (Object.keys(update).length > 0) {
          await supabase.from("bien_prospect").update(update).eq("id", bienProspectId);
        }
        const updateProprietaire: Record<string, unknown> = {};
        if (typeof champs.email === "string") updateProprietaire.email = champs.email;
        if (typeof champs.telephone === "string") updateProprietaire.telephone = champs.telephone;
        if (Object.keys(updateProprietaire).length > 0 && proprietaireId) {
          await supabase.from("proprietaire").update(updateProprietaire).eq("id", proprietaireId);
        }
        await ecrireAuJournal({
          activite: "ft",
          type: "qualification_prospect",
          entiteType: "bien_prospect",
          entiteId: bienProspectId!,
          decision: `Champs enregistrés : ${Object.keys(update).join(", ") || "aucun"}`,
          auteur: "agent",
        });
        return "Qualification enregistrée.";
      }

      if (appel.nom === "creer_rendez_vous") {
        const creneauIso = String((appel.input as Record<string, unknown>).creneauIso ?? "");
        const creneauDate = new Date(creneauIso);
        const estProposeInitialement = creneaux.some(
          (c) => Math.abs(c.debut.getTime() - creneauDate.getTime()) < 60 * 1000,
        );
        if (!estProposeInitialement || Number.isNaN(creneauDate.getTime())) {
          return "Ce créneau n'est plus disponible, merci d'en proposer un autre parmi la liste.";
        }
        await supabase.from("rendez_vous").insert({
          bien_prospect_id: bienProspectId,
          creneau: creneauDate.toISOString(),
          canal: String((appel.input as Record<string, unknown>).canal ?? "à définir"),
          statut: "propose",
        });
        await ecrireAuJournal({
          activite: "ft",
          type: "creation_rendez_vous",
          entiteType: "bien_prospect",
          entiteId: bienProspectId!,
          decision: `Rendez-vous proposé le ${creneauDate.toLocaleString("fr-FR")}`,
          autonomieAuMoment: "agit_seul",
          auteur: "agent",
          resultat: "cree",
        });
        return `Rendez-vous confirmé pour le ${creneauDate.toLocaleString("fr-FR")}.`;
      }

      if (appel.nom === "escalader") {
        escalade = true;
        const motif = String((appel.input as Record<string, unknown>).motif ?? "non précisé");
        await ecrireAuJournal({
          activite: "ft",
          type: "escalade",
          entiteType: "bien_prospect",
          entiteId: bienProspectId!,
          decision: motif,
          auteur: "agent",
          resultat: "transmis_au_gerant",
        });
        await alerterGerant({
          sujet: "F&T — un prospect propriétaire a besoin de vous",
          corps: `Motif : ${motif}\n\nFiche prospect : bien_prospect ${bienProspectId}`,
        });
        return "Transmis au gérant, qui revient vers vous directement.";
      }

      return "Outil inconnu.";
    },
  });

  const autoriseEnvoiDirect = niveauAutonomie === "agit_seul";
  const reponseFinale = autoriseEnvoiDirect
    ? texte
    : "Merci pour votre message. Un membre de l'équipe F&T vous répond personnellement très vite.";

  await supabase.from("message_agent").insert({
    activite: MISSION_PROSPECT_FT.activite,
    bien_prospect_id: bienProspectId,
    canal: "chat_site",
    sens: "sortant",
    contenu: reponseFinale,
    auteur: "agent",
    statut: autoriseEnvoiDirect ? "envoye" : "propose",
  });

  await ecrireAuJournal({
    activite: "ft",
    type: "reponse_offre_prospect",
    entiteType: "bien_prospect",
    entiteId: bienProspectId!,
    decision: reponseFinale.slice(0, 500),
    regleAppliquee: "reponse_offre_prospect",
    autonomieAuMoment: niveauAutonomie,
    auteur: "agent",
    resultat: autoriseEnvoiDirect ? "envoye" : "en_attente_validation",
  });

  if (!autoriseEnvoiDirect) {
    await alerterGerant({
      sujet: "F&T — réponse en attente de validation",
      corps: `Le niveau d'autonomie de "reponse_offre_prospect" n'est pas "agit_seul". Réponse proposée par l'agent :\n\n${texte}\n\nbien_prospect ${bienProspectId}`,
    });
  }

  return { ok: true, bienProspectId: bienProspectId!, reponse: reponseFinale, escalade };
}
