import type { Viewport } from "next";
import { cormorant, montserrat } from "@/app/fonts";
import { SelecteurActivite } from "@/components/site/selecteur-activite";

export const viewport: Viewport = {
  themeColor: "#fafaf9",
};

/**
 * Pages publiques de Conciergerie Premium, palette « Noir & or » (choix du
 * Gérant, 2026-09-25). L'en-tête de la page propose déjà « Se connecter » :
 * le sélecteur ne le répète pas.
 */
export default function PremiumLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${cormorant.variable} ${montserrat.variable} theme-premium flex flex-1 flex-col`}>
      <SelecteurActivite actif="premium" lienConnexion={false} />
      {children}
    </div>
  );
}
