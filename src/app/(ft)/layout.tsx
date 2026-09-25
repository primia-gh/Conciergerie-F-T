import type { Viewport } from "next";
import { karla } from "@/app/fonts";

export const viewport: Viewport = {
  themeColor: "#f6f1e8",
};

/**
 * Thème Conciergerie F&T pour toutes ses pages publiques : le site (`(site)`)
 * mais aussi les liens envoyés au voyageur (guide logement) et au
 * propriétaire (portail), qui n'ont ni en-tête ni sélecteur.
 */
export default function FtLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${karla.variable} theme-ft flex flex-1 flex-col`}>{children}</div>;
}
