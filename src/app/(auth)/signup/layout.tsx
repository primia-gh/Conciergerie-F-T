import type { Metadata } from "next";

// Titre d'onglet : la page elle-même est un composant interactif, qui ne peut pas le déclarer.
export const metadata: Metadata = {
  title: { absolute: "Créer un compte — Espace membres" },
  robots: { index: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
