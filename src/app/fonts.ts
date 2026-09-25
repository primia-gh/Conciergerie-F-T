import { Bodoni_Moda } from "next/font/google";

// Polices auto-hébergées au build par next/font (aucune requête vers Google
// chez le visiteur, `font-src 'self'` suffit). Un fichier par activité, et
// `cssChunking: "graph"` (next.config.ts) : chaque page ne précharge que les
// polices de son activité (vérifié le 2026-09-25 dans
// .next/server/next-font-manifest.json : F&T 4 fichiers, Premium et espaces
// connectés 3, page de choix 6).
// - fonts.ts : « Marine & or » (Bodoni ; Jost, commune, est dans app/layout.tsx) ;
// - fonts-ft.ts : Conciergerie F&T (Karla, Fraunces) ;
// - fonts-erreurs.ts : pages d'erreur racine, sans préchargement.
// Chaque `.variable` se pose sur l'enveloppe qui porte la classe de thème
// (voir globals.css).

/**
 * Titres de « Marine & or » (Premium, connexion, espaces connectés) : didone
 * à fort contraste, avec l'axe optique pour rester fine en très grand et
 * lisible en petit.
 */
export const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
});
