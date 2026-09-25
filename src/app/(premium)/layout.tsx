import type { Viewport } from "next";
import { bodoni, jost } from "@/app/fonts";
import { Apparitions } from "@/components/site/apparitions";
import { SelecteurActivite } from "@/components/site/selecteur-activite";

export const viewport: Viewport = {
  themeColor: "#0e1a31",
};

/**
 * Pages publiques de Conciergerie Premium, palette « Marine & or » (choix du
 * Gérant, 2026-09-25). L'en-tête de la page propose déjà « Se connecter » :
 * le sélecteur ne le répète pas.
 */
export default function PremiumLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${bodoni.variable} ${jost.variable} theme-premium flex flex-1 flex-col`}>
      <SelecteurActivite actif="premium" lienConnexion={false} />
      {children}
      <Apparitions />
    </div>
  );
}
