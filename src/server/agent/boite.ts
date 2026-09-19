"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertRole } from "@/server/auth/guards";
import { createServiceClient } from "@/lib/supabase/service";
import { ecrireAuJournal } from "@/lib/agent/journal";
import { masquerDonneesBancaires } from "@/lib/agent/donnees-bancaires";
import { preparerReponseAssistant } from "@/lib/agent/missions/assistant-gerant/preparer";
import { missionAssistantGerant } from "@/lib/agent/missions/assistant-gerant";
import {
  LONGUEUR_MAX_MESSAGE,
  decisionCloture,
  miseAJourApresErreur,
  miseAJourApresPreparation,
  nouvelleDemandeSchema,
  type DemandeStatut,
  type MiseAJourPreparation,
} from "@/lib/agent/demande";
import type { FormState } from "./ft-admin";

/**
 * Le Gérant colle un message reçu, l'assistant prépare un brouillon, et on
 * ouvre la demande. RIEN n'est envoyé nulle part : le brouillon est un texte
 * que le Gérant relit puis envoie lui-même (voir cloturerDemande).
 *
 * Accès par la service role après assertRole("admin") : l'agent passe par le
 * serveur, pas par la session du navigateur (voir migration 0016).
 */
export async function creerDemande(_prevState: FormState, formData: FormData): Promise<FormState> {
  await assertRole("admin");

  const parsed = nouvelleDemandeSchema.safeParse({
    activite: formData.get("activite") ?? undefined,
    logementId: formData.get("logementId") ?? undefined,
    expediteur: formData.get("expediteur") ?? undefined,
    contenu: formData.get("contenu") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  const { activite, logementId } = parsed.data;

  // « Aucune donnée bancaire ne transite par l'agent » : numéros de carte et IBAN
  // sont masqués AVANT l'enregistrement et avant tout envoi au modèle.
  const messageMasque = masquerDonneesBancaires(parsed.data.contenu);
  const expediteurMasque = parsed.data.expediteur ? masquerDonneesBancaires(parsed.data.expediteur) : null;
  const contenu = messageMasque.texte;
  const expediteur = expediteurMasque ? expediteurMasque.texte : parsed.data.expediteur;
  const donneesBancairesMasquees = messageMasque.masques + (expediteurMasque?.masques ?? 0);

  const supabase = createServiceClient();

  // Vérifié côté serveur, pas seulement dans la liste proposée : seul un logement
  // ACTIVÉ (fiche complète) peut être confié à l'assistant.
  if (logementId) {
    const { data: logement } = await supabase
      .from("logement")
      .select("id, statut")
      .eq("id", logementId)
      .maybeSingle();
    if (!logement) return { error: "Logement introuvable." };
    if (logement.statut !== "actif") {
      return { error: "Ce logement n'est pas activé : complétez sa fiche puis activez-le." };
    }
  }

  // Le message est enregistré AVANT tout traitement : si l'assistant plante,
  // la demande n'est pas perdue (cahier des charges, § Règles communes aux canaux).
  const { data: demande, error: erreurCreation } = await supabase
    .from("demande")
    .insert({
      activite,
      logement_id: logementId,
      expediteur,
      contenu_recu: contenu,
      statut: "nouveau",
    })
    .select("id")
    .single();
  if (erreurCreation || !demande) {
    return { error: "Impossible d'enregistrer la demande, réessayez." };
  }
  const demandeId = demande.id as string;

  let miseAJour: MiseAJourPreparation;
  let detailErreur: string | undefined;
  try {
    const preparation = await preparerReponseAssistant(supabase, {
      activite,
      contenuRecu: contenu,
      expediteur,
      logementId,
    });
    miseAJour = miseAJourApresPreparation(preparation);
  } catch (e) {
    miseAJour = miseAJourApresErreur();
    detailErreur = e instanceof Error ? e.message : "erreur inconnue";
  }

  const { error: erreurMiseAJour } = await supabase
    .from("demande")
    .update({ ...miseAJour.demande, updated_at: new Date().toISOString() })
    .eq("id", demandeId);
  if (erreurMiseAJour) {
    return { error: "La demande est enregistrée mais son brouillon n'a pas pu l'être. Rouvrez-la depuis la liste." };
  }

  await ecrireAuJournal({
    activite,
    type: "preparation_brouillon",
    entiteType: "demande",
    entiteId: demandeId,
    decision: miseAJour.journal.decision,
    regleAppliquee: missionAssistantGerant(activite).nom,
    autonomieAuMoment: "propose",
    auteur: "agent",
    justification:
      [detailErreur, donneesBancairesMasquees > 0 ? `${donneesBancairesMasquees} donnée(s) bancaire(s) masquée(s) avant enregistrement` : null]
        .filter(Boolean)
        .join(" ; ") || undefined,
    resultat: miseAJour.journal.resultat,
  });

  revalidatePath("/admin/boite");
  // Hors du try/catch : redirect() fonctionne en levant une exception interne.
  redirect(`/admin/boite/${demandeId}`);
}

const demandeIdSchema = z.string().uuid();

/**
 * Le Gérant clôture une demande : il valide le brouillon (éventuellement
 * corrigé) ou reprend la main sur une escalade. Le texte final est celui qu'il
 * a copié pour l'envoyer — l'application, elle, n'envoie rien.
 */
export async function cloturerDemande(
  demandeId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await assertRole("admin");

  if (!demandeIdSchema.safeParse(demandeId).success) return { error: "Demande introuvable." };

  const reponse = String(formData.get("reponse") ?? "");
  if (reponse.length > LONGUEUR_MAX_MESSAGE) {
    return { error: `La réponse est trop longue (${LONGUEUR_MAX_MESSAGE} caractères maximum).` };
  }

  const supabase = createServiceClient();

  const { data: demande } = await supabase
    .from("demande")
    .select("id, activite, statut, brouillon, traite_le")
    .eq("id", demandeId)
    .maybeSingle();
  if (!demande) return { error: "Demande introuvable." };
  if (demande.traite_le) return { error: "Cette demande a déjà été traitée." };

  const decision = decisionCloture({
    statut: demande.statut as DemandeStatut,
    brouillon: demande.brouillon as string | null,
    reponseSaisie: reponse,
  });
  if (!decision.ok) return { error: decision.error };

  // Conditionnée à « pas encore traitée » : deux onglets ouverts sur la même
  // demande ne peuvent pas la clôturer deux fois.
  const maintenant = new Date().toISOString();
  const { data: misesAJour, error } = await supabase
    .from("demande")
    .update({
      statut: decision.statut,
      reponse_finale: decision.reponseFinale,
      traite_le: maintenant,
      updated_at: maintenant,
    })
    .eq("id", demandeId)
    .is("traite_le", null)
    .select("id");
  if (error) return { error: "Impossible d'enregistrer, réessayez." };
  if (!misesAJour || misesAJour.length === 0) return { error: "Cette demande a déjà été traitée." };

  await ecrireAuJournal({
    activite: demande.activite as "ft" | "premium",
    type: decision.journal.type,
    entiteType: "demande",
    entiteId: demandeId,
    decision: decision.journal.decision,
    autonomieAuMoment: "propose",
    auteur: "gerant",
    resultat: decision.statut,
  });

  revalidatePath("/admin/boite");
  revalidatePath(`/admin/boite/${demandeId}`);
  return { error: null, success: true };
}
