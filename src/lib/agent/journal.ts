import { createServiceClient } from "@/lib/supabase/service";

type NiveauAutonomie = "propose" | "agit_apres_validation" | "agit_seul";

export type JournalEntry = {
  /** Nature de l'action, ex. "reponse_factuelle", "creation_incident". */
  type: string;
  entiteType?: string;
  entiteId?: string;
  decision: string;
  regleAppliquee?: string;
  autonomieAuMoment?: NiveauAutonomie;
  /** Qui a agi : "agent", "gerant", ou un identifiant de prestataire/propriétaire. */
  auteur: string;
  justification?: string;
  resultat?: string;
  coutTraitement?: number;
};

/**
 * Écrit une ligne dans le journal `action` — jamais de update ni delete : la
 * table n'a pas de policy RLS d'écriture pour la session admin, seule cette
 * fonction (service role) peut y insérer. Voir CLAUDE.md, "Toute action
 * sensible passe par la file de validation et écrit dans le journal."
 */
export async function ecrireAuJournal(entree: JournalEntry) {
  const supabase = createServiceClient();

  const { error } = await supabase.from("action").insert({
    type: entree.type,
    entite_type: entree.entiteType,
    entite_id: entree.entiteId,
    decision: entree.decision,
    regle_appliquee: entree.regleAppliquee,
    autonomie_au_moment: entree.autonomieAuMoment,
    auteur: entree.auteur,
    justification: entree.justification,
    resultat: entree.resultat,
    cout_traitement: entree.coutTraitement,
  });

  if (error) {
    throw new Error(`Échec d'écriture dans le journal : ${error.message}`);
  }
}
