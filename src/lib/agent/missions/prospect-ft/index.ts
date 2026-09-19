import type { Mission } from "../../types";
import { OUTILS_PROSPECTION } from "./outils";

export { buildPromptProspectProprietaire, buildQualificationSummaryLine } from "./prompt";

/**
 * Mission "prospection propriétaire" (lot L1) : le chat public de F&T qui
 * présente l'offre, qualifie le bien et propose un rendez-vous.
 *
 * Sans ANTHROPIC_API_KEY, pas d'appel au modèle : on renvoie une réponse fixe,
 * clairement annoncée comme telle, plutôt que de faire échouer toute la
 * conversation. Ça permet de tester le reste du circuit (site, base de
 * données, tableau de bord Gérant) avant d'avoir la clé en main — mais aucune
 * qualification ni rendez-vous n'est simulé : ce serait inventer des données,
 * ce que l'agent ne doit jamais faire même en mode démonstration.
 */
export const MISSION_PROSPECT_FT: Mission = {
  nom: "prospect_ft",
  activite: "ft",
  outils: OUTILS_PROSPECTION,
  reponseSansCle:
    "Mode démonstration (clé Claude non configurée) : votre message a bien été reçu et enregistré. " +
    "Une fois ANTHROPIC_API_KEY renseignée, je pourrai vraiment répondre à partir de la fiche offre F&T.",
  reponseSiTropDeTours:
    "Je transmets votre demande à un membre de l'équipe F&T, qui revient vers vous rapidement.",
};
