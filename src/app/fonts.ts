import { Bodoni_Moda, Jost, Karla } from "next/font/google";

// Polices des pages publiques, auto-hébergées au build par next/font (aucune
// requête vers Google chez le visiteur, `font-src 'self'` suffit). Fraunces,
// commune aux titres F&T et aux espaces connectés, reste dans le layout racine.
// Chaque `.variable` se pose sur l'enveloppe qui porte la classe de thème
// (voir globals.css).

/** Texte de Conciergerie F&T. */
export const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
});

/**
 * Titres de Conciergerie Premium (« Marine & or ») : didone à fort contraste,
 * avec l'axe optique pour rester fine en très grand et lisible en petit.
 */
export const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
});

/** Texte de Conciergerie Premium (« Marine & or »). */
export const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});
