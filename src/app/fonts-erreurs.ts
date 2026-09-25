import { Bodoni_Moda, Fraunces, Karla } from "next/font/google";

/**
 * Polices des pages d'erreur racine (not-found.tsx, error.tsx), communes aux
 * deux activités. Sans préchargement : ces pages sont rares, inutile de faire
 * télécharger ces polices d'avance (voir fonts.ts). Mêmes réglages que
 * fonts.ts et fonts-ft.ts.
 */
export const bodoniErreurs = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  preload: false,
});

export const karlaErreurs = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
  preload: false,
});

export const frauncesErreurs = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  preload: false,
});
