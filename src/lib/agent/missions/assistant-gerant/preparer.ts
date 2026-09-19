import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { jouerTourAgent } from "../../core";
import { lireFichesPourAssistant } from "../../fiches";
import type { ActiviteMetier } from "../../types";
import { creerCollecteur, type BrouillonPropose, type EscaladePropose } from "./collecteur";
import { missionAssistantGerant } from "./index";
import { buildMessageRecu, buildPromptAssistantGerant } from "./prompt";

export type FicheUtilisee = { id: string; section: string; version: number };

export type PreparationAssistant =
  /** Pas de clé Claude : aucun brouillon, message d'information pour le Gérant. */
  | { mode: "demo"; information: string }
  | {
      mode: "modele";
      brouillon: BrouillonPropose | null;
      escalade: EscaladePropose | null;
      /** Toutes les fiches fournies à l'assistant, pour la traçabilité (colonne `demande.fiches_utilisees`). */
      fichesUtilisees: FicheUtilisee[];
    };

/**
 * Prépare le brouillon d'une réponse à un message reçu. N'écrit RIEN : ni
 * base, ni journal, ni envoi. L'appelant (l'action serveur de la boîte de
 * réception) enregistre la demande et écrit le journal.
 *
 * Résultat garanti sûr :
 * - si le modèle ne rend ni brouillon ni escalade (il n'a pas suivi le
 *   protocole), on escalade nous-mêmes en "doute" plutôt que de présenter un
 *   texte libre comme un brouillon fiable ;
 * - le modèle ne lit jamais d'autres fiches que celles chargées ici.
 */
export async function preparerReponseAssistant(
  supabase: SupabaseClient,
  params: {
    activite: ActiviteMetier;
    contenuRecu: string;
    expediteur?: string | null;
    logementId?: string | null;
  },
  deps: { jouerTour?: typeof jouerTourAgent } = {},
): Promise<PreparationAssistant> {
  const mission = missionAssistantGerant(params.activite);

  if (!process.env.ANTHROPIC_API_KEY) {
    return { mode: "demo", information: mission.reponseSansCle };
  }

  const fiches = await lireFichesPourAssistant(supabase, {
    activite: params.activite,
    logementId: params.logementId,
  });

  const collecteur = creerCollecteur();
  const jouerTour = deps.jouerTour ?? jouerTourAgent;

  await jouerTour({
    mission,
    systemPrompt: buildPromptAssistantGerant({ activite: params.activite, fiches }),
    historique: [
      {
        role: "user",
        content: buildMessageRecu({ contenu: params.contenuRecu, expediteur: params.expediteur }),
      },
    ],
    executeurOutil: collecteur.executeurOutil,
  });

  const { brouillon, escalade } = collecteur.resultat();

  return {
    mode: "modele",
    brouillon,
    escalade:
      escalade ??
      (brouillon
        ? null
        : {
            categorie: "doute",
            motif: "L'assistant n'a produit ni brouillon exploitable ni escalade : à traiter par vous.",
            urgent: false,
          }),
    fichesUtilisees: fiches.map((f) => ({ id: f.id, section: f.section, version: f.version })),
  };
}
