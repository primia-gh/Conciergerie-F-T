import { z } from "zod";
import type { ExecuteurOutil } from "../../core";
import {
  CATEGORIES_ESCALADE,
  LANGUES,
  LONGUEUR_MAX_BROUILLON,
  type CategorieEscalade,
  type Langue,
} from "./outils";

export type BrouillonPropose = {
  texte: string;
  langue: Langue;
  sectionsUtilisees: string[];
};

export type EscaladePropose = {
  categorie: CategorieEscalade;
  motif: string;
  urgent: boolean;
};

const brouillonSchema = z.object({
  texte: z.string().trim().min(1).max(LONGUEUR_MAX_BROUILLON),
  langue: z.enum(LANGUES),
  sections_utilisees: z.array(z.string().trim().min(1).max(100)).max(50),
});

const escaladeSchema = z.object({
  categorie: z.enum(CATEGORIES_ESCALADE),
  motif: z.string().trim().min(1).max(1000),
  urgent: z.boolean().optional(),
});

/**
 * Reçoit les appels d'outils du modèle, les valide, et garde en mémoire le
 * brouillon et l'escalade demandés. Rien n'est écrit ailleurs : c'est
 * l'appelant qui décide quoi en faire. Le modèle n'est pas digne de confiance
 * (il peut se tromper, ou être manipulé par le message reçu), donc tout ce
 * qu'il rend est validé ici : langue parmi les six prévues, catégorie connue,
 * longueur bornée. Une entrée invalide est refusée avec un message que le
 * modèle peut lire pour se corriger, jamais acceptée telle quelle.
 */
export function creerCollecteur() {
  let brouillon: BrouillonPropose | null = null;
  let escalade: EscaladePropose | null = null;

  const executeurOutil: ExecuteurOutil = async (appel) => {
    if (appel.nom === "proposer_reponse") {
      const parsed = brouillonSchema.safeParse(appel.input);
      if (!parsed.success) {
        return `Brouillon refusé : ${parsed.error.issues[0]?.message ?? "entrée invalide"}. Corrige et rappelle proposer_reponse.`;
      }
      if (brouillon) {
        return "Un brouillon a déjà été enregistré. Ne rappelle pas proposer_reponse.";
      }
      brouillon = {
        texte: parsed.data.texte,
        langue: parsed.data.langue,
        sectionsUtilisees: parsed.data.sections_utilisees,
      };
      return "Brouillon enregistré pour relecture par le Gérant.";
    }

    if (appel.nom === "escalader") {
      const parsed = escaladeSchema.safeParse(appel.input);
      if (!parsed.success) {
        return `Escalade refusée : ${parsed.error.issues[0]?.message ?? "entrée invalide"}. Corrige et rappelle escalader.`;
      }
      // Une première escalade fait foi : un second appel ne doit pas
      // l'adoucir (ex. passer d'urgence_securite à doute).
      if (!escalade) {
        escalade = {
          categorie: parsed.data.categorie,
          motif: parsed.data.motif,
          urgent: parsed.data.urgent ?? false,
        };
      }
      return "Le Gérant sera prévenu de ce cas.";
    }

    return "Outil inconnu.";
  };

  return {
    executeurOutil,
    resultat: () => ({ brouillon, escalade }),
  };
}
