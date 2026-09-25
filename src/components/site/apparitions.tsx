"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Fait apparaître en douceur les éléments `.apparition` quand ils entrent à
 * l'écran (voir globals.css). Sans JavaScript, ou si le visiteur a demandé
 * moins d'animations, tout reste visible d'emblée. Relancé à chaque
 * changement de page, pour observer les éléments de la nouvelle page.
 */
export function Apparitions() {
  const chemin = usePathname();

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(".apparition:not(.est-visible)");
    if (!("IntersectionObserver" in window) || elements.length === 0) return;

    document.documentElement.classList.add("apparition-active");
    const observateur = new IntersectionObserver(
      (entrees) => {
        for (const entree of entrees) {
          if (entree.isIntersecting) {
            entree.target.classList.add("est-visible");
            observateur.unobserve(entree.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    elements.forEach((el) => observateur.observe(el));
    return () => observateur.disconnect();
  }, [chemin]);

  return null;
}
