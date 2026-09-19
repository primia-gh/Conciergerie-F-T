import { z } from "zod";
import { LONGUEUR_MAX_FICHE, normaliserContenuFiche, trouverSection } from "./fiches-modele";

const uuidOuVide = (message: string) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(z.string().uuid(message).nullable());

/**
 * Saisie d'une nouvelle version de section de fiche. La section doit exister
 * pour cette activité ET pour cette portée (logement ou globale) : on ne peut
 * pas écrire une section « acces » hors d'un logement, ni une section Premium
 * dans une fiche F&T. Un logement n'existe que pour F&T.
 */
export const enregistrerFicheSchema = z
  .object({
    activite: z.enum(["ft", "premium"], { message: "Activité invalide." }),
    logementId: uuidOuVide("Logement invalide."),
    section: z.string().trim().min(1, "Section manquante."),
    contenu: z
      .string()
      .transform(normaliserContenuFiche)
      .pipe(
        z
          .string()
          .min(1, "Le contenu ne peut pas être vide.")
          .max(
            LONGUEUR_MAX_FICHE,
            `La fiche est trop longue (${LONGUEUR_MAX_FICHE} caractères maximum). Gardez une information par ligne.`,
          ),
      ),
  })
  .superRefine((valeur, ctx) => {
    if (valeur.logementId && valeur.activite !== "ft") {
      ctx.addIssue({ code: "custom", path: ["logementId"], message: "Un logement n'existe que pour F&T." });
      return;
    }
    const portee = valeur.logementId ? "logement" : "globale";
    if (!trouverSection(valeur.activite, portee, valeur.section)) {
      ctx.addIssue({ code: "custom", path: ["section"], message: "Cette section n'existe pas pour cette fiche." });
    }
  });

/**
 * « Ajouter cette information à la fiche » depuis une demande traitée. La
 * cible s'écrit `globale:<section>` (fiche générale de l'activité) ou
 * `logement:<section>` (fiche du logement de la demande) : le logement n'est
 * jamais donné par le formulaire, il vient de la demande elle-même.
 */
export const ajoutFicheSchema = z.object({
  cible: z
    .string()
    .regex(/^(globale|logement):[a-z_]+$/, "Choisissez la fiche à enrichir.")
    .transform((valeur) => {
      const [portee, section] = valeur.split(":") as ["globale" | "logement", string];
      return { portee, section };
    }),
  ligne: z
    .string()
    .transform(normaliserContenuFiche)
    .pipe(
      z
        .string()
        .min(1, "Écrivez l'information à ajouter.")
        .max(2000, "Trop long : gardez une information courte, par ligne."),
    ),
});

export const nouveauLogementSchema = z
  .object({
    nom: z
      .string()
      .trim()
      .min(1, "Indiquez le nom du logement.")
      .max(100, "Le nom est trop long (100 caractères maximum)."),
    adresse: z
      .string()
      .trim()
      .min(1, "Indiquez l'adresse.")
      .max(200, "L'adresse est trop longue (200 caractères maximum)."),
    capacite: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? Number(v) : null))
      .pipe(
        z
          .number()
          .int("La capacité doit être un nombre entier.")
          .min(1, "La capacité doit être d'au moins 1.")
          .max(50, "La capacité est limitée à 50.")
          .nullable(),
      ),
    proprietaireId: uuidOuVide("Propriétaire invalide."),
    nouveauProprietaire: z
      .string()
      .trim()
      .max(100, "Le nom du propriétaire est trop long (100 caractères maximum).")
      .optional()
      .transform((v) => (v ? v : null)),
  })
  .superRefine((valeur, ctx) => {
    if (!valeur.proprietaireId && !valeur.nouveauProprietaire) {
      ctx.addIssue({
        code: "custom",
        path: ["proprietaireId"],
        message: "Choisissez un propriétaire existant ou saisissez le nom d'un nouveau.",
      });
    } else if (valeur.proprietaireId && valeur.nouveauProprietaire) {
      ctx.addIssue({
        code: "custom",
        path: ["proprietaireId"],
        message: "Choisissez un propriétaire existant OU saisissez un nouveau nom, pas les deux.",
      });
    }
  });
