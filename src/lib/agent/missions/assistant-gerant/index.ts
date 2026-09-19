import type { ActiviteMetier, Mission } from "../../types";
import { OUTILS_ASSISTANT_GERANT } from "./outils";
import { marqueDeLActivite } from "./prompt";

export { buildPromptAssistantGerant, buildMessageRecu } from "./prompt";
export { creerCollecteur } from "./collecteur";
export type { BrouillonPropose, EscaladePropose } from "./collecteur";
export { CATEGORIES_ESCALADE, LANGUES } from "./outils";
export type { CategorieEscalade, Langue } from "./outils";

/**
 * Mission "assistant du Gérant" : le Gérant colle un message reçu, l'agent
 * prépare un brouillon à partir des fiches de l'activité choisie. Une mission
 * par activité, avec les mêmes outils mais des fiches et un ton propres.
 *
 * Sans ANTHROPIC_API_KEY : réponse fixe annoncée comme telle, aucun brouillon
 * simulé (ce serait inventer une réponse, ce que l'agent ne fait jamais).
 */
export function missionAssistantGerant(activite: ActiviteMetier): Mission {
  return {
    nom: `assistant_gerant_${activite}`,
    activite,
    outils: OUTILS_ASSISTANT_GERANT,
    reponseSansCle: `Mode démonstration (clé Claude non configurée) : aucun brouillon ne peut être préparé pour ${marqueDeLActivite(activite)}. Renseignez ANTHROPIC_API_KEY.`,
    reponseSiTropDeTours:
      "L'assistant n'a pas réussi à préparer un brouillon : ce message est à traiter par vous.",
  };
}
