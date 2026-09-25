import { Fraunces, Karla } from "next/font/google";

// Polices de Conciergerie F&T, « Nuit en forêt » (voir fonts.ts).

/** Texte. */
export const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
});

/** Titres, avec l'italique des mots mis en valeur (maquette « Lin & forêt »). */
export const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
});
