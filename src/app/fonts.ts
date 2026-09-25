import { Cormorant, Karla, Montserrat } from "next/font/google";

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

/** Titres de Conciergerie Premium (« Noir & or »). */
export const cormorant = Cormorant({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

/** Texte de Conciergerie Premium (« Noir & or »). */
export const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});
