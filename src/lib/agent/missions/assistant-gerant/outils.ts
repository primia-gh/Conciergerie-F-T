import type Anthropic from "@anthropic-ai/sdk";

/** Les six langues du cahier des charges (§ Objet, périmètre et interlocuteurs). */
export const LANGUES = ["fr", "en", "de", "es", "it", "nl"] as const;
export type Langue = (typeof LANGUES)[number];

/**
 * Motifs d'escalade immédiate vers le Gérant (cahier des charges, § Niveaux
 * d'autonomie : « urgence ou sécurité, argent, litige, menace de mauvais avis,
 * mécontentement répété, question juridique ou fiscale, demande hors
 * périmètre, doute de l'agent sur sa propre réponse, absence d'information
 * dans la base de connaissances »), plus `acces_code` pour toute demande de
 * code d'accès. Une catégorie structurée, plutôt qu'un texte libre, permet de
 * compter les transmissions par motif (indicateurs de fiabilité).
 */
export const CATEGORIES_ESCALADE = [
  "urgence_securite",
  "acces_code",
  "argent",
  "litige",
  "mauvais_avis",
  "juridique",
  "hors_perimetre",
  "information_absente",
  "doute",
] as const;
export type CategorieEscalade = (typeof CATEGORIES_ESCALADE)[number];

export const LONGUEUR_MAX_BROUILLON = 4000;

/**
 * Les seuls outils de l'assistant du Gérant. Aucun ne permet d'envoyer un
 * message, de modifier une fiche ou de lire la base : l'assistant ne fait que
 * rendre un brouillon et/ou signaler un cas. Les fiches sont fournies dans le
 * prompt par le code (voir ../../fiches.ts), pas lues par le modèle — c'est ce
 * qui rend impossible, par construction, de lire les fiches de l'autre activité.
 */
export const OUTILS_ASSISTANT_GERANT: Anthropic.Tool[] = [
  {
    name: "proposer_reponse",
    description:
      "Rend le brouillon de réponse que le Gérant va relire puis envoyer lui-même. À appeler une seule fois, avec le texte complet prêt à être envoyé.",
    input_schema: {
      type: "object",
      properties: {
        texte: {
          type: "string",
          description: "Le texte complet de la réponse, signature comprise, dans la langue du message reçu.",
        },
        langue: {
          type: "string",
          enum: [...LANGUES],
          description: "Langue du brouillon (celle du message reçu).",
        },
        sections_utilisees: {
          type: "array",
          items: { type: "string" },
          description:
            "Noms des sections de fiche dont vient chaque information du brouillon, exactement comme indiqués dans les fiches.",
        },
      },
      required: ["texte", "langue", "sections_utilisees"],
    },
  },
  {
    name: "escalader",
    description:
      "Signale au Gérant qu'il doit traiter ce message lui-même. À utiliser dès qu'un des motifs d'escalade s'applique. Peut être combiné avec proposer_reponse pour un court brouillon d'attente qui n'engage ni argent ni délai.",
    input_schema: {
      type: "object",
      properties: {
        categorie: {
          type: "string",
          enum: [...CATEGORIES_ESCALADE],
          description: "Le motif d'escalade qui s'applique le mieux.",
        },
        motif: {
          type: "string",
          description: "Explication en une ou deux phrases, pour le Gérant.",
        },
        urgent: {
          type: "boolean",
          description: "true si le Gérant doit réagir sans attendre (sécurité des personnes, dégât en cours).",
        },
      },
      required: ["categorie", "motif"],
    },
  },
];
