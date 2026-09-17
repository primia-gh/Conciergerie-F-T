import type Anthropic from "@anthropic-ai/sdk";

/**
 * Les seuls outils que l'agent peut appeler en phase 1 (prospection
 * propriétaire). "Tout ce qui n'est pas dans cette liste est impossible pour
 * l'agent, par construction" — cahier des charges, § Outils.
 */
export const OUTILS_PROSPECTION: Anthropic.Tool[] = [
  {
    name: "enregistrer_qualification",
    description:
      "Enregistre ou met à jour une ou plusieurs informations de qualification du bien du prospect. Peut être appelé plusieurs fois avec des champs partiels au fil de la conversation.",
    input_schema: {
      type: "object",
      properties: {
        type: { type: "string", description: "Type de bien, ex. appartement, maison, studio." },
        adresse: { type: "string", description: "Adresse ou au moins la ville du bien." },
        residencePrincipale: {
          type: "boolean",
          description: "true si résidence principale, false si secondaire.",
        },
        capacite: { type: "integer", description: "Nombre de personnes accueillies." },
        equipements: {
          type: "array",
          items: { type: "string" },
          description: "Équipements principaux mentionnés (wifi, parking, piscine...).",
        },
        disponibiliteSouhaitee: {
          type: "string",
          description: "Quand le propriétaire souhaite démarrer, en texte libre.",
        },
        email: { type: "string", description: "E-mail du propriétaire, pour le recontacter." },
        telephone: { type: "string", description: "Téléphone du propriétaire, pour le recontacter." },
      },
    },
  },
  {
    name: "creer_rendez_vous",
    description:
      "Crée un rendez-vous confirmé par le prospect, à partir d'un des créneaux proposés dans le prompt. N'appeler qu'après confirmation explicite du prospect sur un créneau précis.",
    input_schema: {
      type: "object",
      properties: {
        creneauIso: {
          type: "string",
          description: "Date et heure ISO 8601 du créneau choisi, exactement comme indiqué dans la liste proposée.",
        },
        canal: { type: "string", description: "Canal de contact préféré, ex. téléphone, visio." },
      },
      required: ["creneauIso"],
    },
  },
  {
    name: "escalader",
    description:
      "Transmet la conversation au gérant et suspend l'automatisme sur ce sujet. À utiliser dès qu'une question sort du périmètre, qu'une information manque dans la fiche offre, ou en cas de doute.",
    input_schema: {
      type: "object",
      properties: {
        motif: { type: "string", description: "Raison de l'escalade, en une phrase." },
        urgent: { type: "boolean", description: "true si ça nécessite une réponse rapide du gérant." },
      },
      required: ["motif"],
    },
  },
];
