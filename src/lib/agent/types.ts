import type Anthropic from "@anthropic-ai/sdk";

/**
 * L'activité à laquelle appartient une règle, une fiche, un message ou une
 * ligne de journal. Miroir de l'enum Postgres `activite`. "commun" = valable
 * pour les deux, mais une mission, elle, travaille toujours pour UNE activité.
 */
export type Activite = "ft" | "premium" | "commun";
export type ActiviteMetier = Exclude<Activite, "commun">;

/** Miroir de l'enum Postgres `autonomy_level` (cahier des charges, § Niveaux d'autonomie). */
export type NiveauAutonomie = "propose" | "agit_apres_validation" | "agit_seul";

/**
 * Une mission = un cas d'usage de l'agent : son activité, les seuls outils
 * qu'il peut appeler, et ses textes de repli. Le prompt système, lui, est
 * construit par la mission au moment de l'appel (il dépend des fiches lues).
 * "Tout ce qui n'est pas dans cette liste d'outils est impossible pour
 * l'agent, par construction" — cahier des charges, § Outils.
 */
export type Mission = {
  nom: string;
  activite: ActiviteMetier;
  outils: Anthropic.Tool[];
  /** Réponse fixe, annoncée comme telle, quand ANTHROPIC_API_KEY est absente. */
  reponseSansCle: string;
  /** Réponse fixe quand le modèle réclame encore des outils après la limite de tours. */
  reponseSiTropDeTours: string;
};
