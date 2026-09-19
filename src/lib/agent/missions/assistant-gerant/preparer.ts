import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { jouerTourAgent } from "../../core";
import { contientDonneeBancaire, masquerDonneesBancaires } from "../../donnees-bancaires";
import { lireFichesPourAssistant } from "../../fiches";
import { detecterCodesProbables, masquerCodes } from "../../fiches-modele";
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
 * - le modèle ne lit jamais d'autres fiches que celles chargées ici ;
 * - ce qui ressemble à un code d'accès est masqué dans les fiches AVANT le
 *   prompt, et les données bancaires sont masquées dans le message reçu : le
 *   modèle ne voit pas ce qu'il ne doit pas recopier ;
 * - filet de sortie : un brouillon qui contient malgré tout un code ou une
 *   donnée bancaire est retiré et remplacé par une escalade.
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

  // Ceinture et bretelles : l'appelant masque déjà les données bancaires avant
  // d'enregistrer le message, mais cette fonction ne s'y fie pas.
  const contenuRecu = masquerDonneesBancaires(params.contenuRecu).texte;
  const expediteur = params.expediteur ? masquerDonneesBancaires(params.expediteur).texte : params.expediteur;
  const fichesPourLeModele = fiches.map((f) => ({ ...f, contenu: masquerCodes(f.contenu).contenu }));

  await jouerTour({
    mission,
    systemPrompt: buildPromptAssistantGerant({ activite: params.activite, fiches: fichesPourLeModele }),
    historique: [
      {
        role: "user",
        content: buildMessageRecu({ contenu: contenuRecu, expediteur }),
      },
    ],
    executeurOutil: collecteur.executeurOutil,
  });

  let { brouillon, escalade } = collecteur.resultat();

  // Filet de sortie : un modèle manipulé (ou qui a mal lu) ne doit pas pouvoir
  // faire passer un code ou une donnée bancaire dans un brouillon.
  if (brouillon) {
    const contientCode = detecterCodesProbables(brouillon.texte).length > 0;
    if (contientCode || contientDonneeBancaire(brouillon.texte)) {
      brouillon = null;
      const motif =
        "Le brouillon contenait ce qui ressemble à un code d'accès ou à une donnée bancaire : il a été retiré.";
      escalade = escalade
        ? { ...escalade, motif: `${escalade.motif} ${motif}` }
        : { categorie: contientCode ? "acces_code" : "argent", motif, urgent: false };
    }
  }

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
