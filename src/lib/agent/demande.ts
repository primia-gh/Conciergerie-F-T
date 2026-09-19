import { z } from "zod";
import type { CategorieEscalade } from "./missions/assistant-gerant/outils";
import type { PreparationAssistant } from "./missions/assistant-gerant/preparer";

/** Miroir de l'enum Postgres `demande_status`. */
export type DemandeStatut = "nouveau" | "brouillon_pret" | "valide" | "corrige" | "escalade";

export const LONGUEUR_MAX_MESSAGE = 6000;

/** Les navigateurs envoient les retours à la ligne d'un textarea en \r\n : on normalise partout. */
export function normaliserSautsDeLigne(texte: string): string {
  return texte.replace(/\r\n?/g, "\n");
}

export const nouvelleDemandeSchema = z.object({
  activite: z.enum(["ft", "premium"], { message: "Choisissez F&T ou Premium." }),
  expediteur: z
    .string()
    .trim()
    .max(100, "L'expéditeur est trop long (100 caractères maximum).")
    .optional()
    .transform((v) => (v ? v : null)),
  contenu: z
    .string()
    .transform(normaliserSautsDeLigne)
    .pipe(
      z
        .string()
        .trim()
        .min(1, "Collez le message reçu.")
        .max(LONGUEUR_MAX_MESSAGE, `Le message est trop long (${LONGUEUR_MAX_MESSAGE} caractères maximum).`),
    ),
});

export const LIBELLES_ESCALADE: Record<CategorieEscalade, string> = {
  urgence_securite: "Urgence ou sécurité",
  acces_code: "Demande de code d'accès",
  argent: "Argent (remboursement, geste commercial, caution)",
  litige: "Litige",
  mauvais_avis: "Risque de mauvais avis",
  juridique: "Question juridique ou fiscale",
  hors_perimetre: "Hors périmètre",
  information_absente: "Information absente des fiches",
  doute: "Doute de l'assistant",
};

export type DecisionCloture =
  | {
      ok: true;
      statut: "valide" | "corrige" | "escalade";
      /** Texte final à enregistrer, ou null si le Gérant n'en a pas saisi (escalade traitée sans réponse). */
      reponseFinale: string | null;
      journal: { type: string; decision: string };
    }
  | { ok: false; error: string };

/**
 * Ce que devient une demande quand le Gérant la clôture.
 *
 * - brouillon prêt : sa version est obligatoire ; identique au brouillon =
 *   « validé » (compte dans les réponses validées sans correction), sinon
 *   « corrigé » — c'est l'indicateur qui déclenchera un jour l'autonomie ;
 * - escalade : le Gérant a repris la main, la réponse est facultative et le
 *   statut reste « escalade » pour que le motif reste comptable ;
 * - toute autre situation est refusée (rien à clôturer).
 */
export function decisionCloture(params: {
  statut: DemandeStatut;
  brouillon: string | null;
  reponseSaisie: string;
}): DecisionCloture {
  const saisie = normaliserSautsDeLigne(params.reponseSaisie).trim();

  if (params.statut === "brouillon_pret") {
    if (!saisie) return { ok: false, error: "La réponse ne peut pas être vide." };
    const brouillon = normaliserSautsDeLigne(params.brouillon ?? "").trim();
    return saisie === brouillon
      ? {
          ok: true,
          statut: "valide",
          reponseFinale: saisie,
          journal: { type: "validation_brouillon", decision: "Brouillon validé tel quel par le Gérant" },
        }
      : {
          ok: true,
          statut: "corrige",
          reponseFinale: saisie,
          journal: { type: "validation_brouillon", decision: "Brouillon corrigé par le Gérant" },
        };
  }

  if (params.statut === "escalade") {
    return {
      ok: true,
      statut: "escalade",
      reponseFinale: saisie || null,
      journal: {
        type: "traitement_escalade",
        decision: saisie
          ? "Escalade traitée par le Gérant, avec sa réponse"
          : "Escalade traitée par le Gérant, sans réponse enregistrée",
      },
    };
  }

  return { ok: false, error: "Cette demande n'est pas en attente de traitement." };
}

/** Colonnes de `demande` à écrire après la préparation, et la ligne de journal correspondante. */
export type MiseAJourPreparation = {
  demande: {
    statut: Extract<DemandeStatut, "brouillon_pret" | "escalade">;
    brouillon: string | null;
    langue: string | null;
    motif_escalade: string | null;
    categorie_escalade: CategorieEscalade | null;
    escalade_urgente: boolean;
    fiches_utilisees: { id: string; section: string; version: number }[];
  };
  journal: { decision: string; resultat: string };
};

const couper = (texte: string, max: number) => (texte.length > max ? `${texte.slice(0, max - 1)}…` : texte);

/** Traduit le résultat de l'assistant en enregistrement de la demande. */
export function miseAJourApresPreparation(prep: PreparationAssistant): MiseAJourPreparation {
  if (prep.mode === "demo") {
    return {
      demande: {
        statut: "escalade",
        brouillon: null,
        langue: null,
        motif_escalade: prep.information,
        categorie_escalade: null,
        escalade_urgente: false,
        fiches_utilisees: [],
      },
      journal: { decision: "Mode démonstration : aucun brouillon préparé", resultat: "demo" },
    };
  }

  const { brouillon, escalade, fichesUtilisees } = prep;
  const escalade_ = escalade
    ? {
        motif_escalade: escalade.motif,
        categorie_escalade: escalade.categorie,
        escalade_urgente: escalade.urgent,
      }
    : { motif_escalade: null, categorie_escalade: null, escalade_urgente: false };

  return {
    demande: {
      statut: escalade ? "escalade" : "brouillon_pret",
      brouillon: brouillon?.texte ?? null,
      langue: brouillon?.langue ?? null,
      ...escalade_,
      fiches_utilisees: fichesUtilisees,
    },
    journal: escalade
      ? {
          decision: couper(`Escalade « ${escalade.categorie} » : ${escalade.motif}`, 500),
          resultat: escalade.urgent ? "escalade_urgente" : "escalade",
        }
      : {
          decision: couper(
            `Brouillon préparé (${brouillon?.langue}), sections : ${brouillon?.sectionsUtilisees.join(", ") || "aucune"}`,
            500,
          ),
          resultat: "brouillon_pret",
        },
  };
}

/** Enregistrement quand la préparation a échoué techniquement : on ne laisse jamais une demande sans suite. */
export function miseAJourApresErreur(): MiseAJourPreparation {
  return {
    demande: {
      statut: "escalade",
      brouillon: null,
      langue: null,
      motif_escalade: "Erreur technique pendant la préparation du brouillon : à traiter par vous.",
      categorie_escalade: "doute",
      escalade_urgente: false,
      fiches_utilisees: [],
    },
    journal: { decision: "Préparation impossible (erreur technique)", resultat: "erreur" },
  };
}
