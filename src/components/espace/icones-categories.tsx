import { createElement } from "react";
import {
  BedDouble,
  CalendarDays,
  Car,
  Ellipsis,
  Heart,
  Plane,
  ShoppingBag,
  Sparkles,
  Star,
  UtensilsCrossed,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

/**
 * Icône d'une catégorie de demande, d'après la colonne `categories.icon`
 * (noms Lucide posés par seed.sql). Liste fermée : une valeur inconnue
 * retombe sur une icône neutre plutôt que d'importer toute la bibliothèque.
 */
const ICONES: Record<string, LucideIcon> = {
  utensils: UtensilsCrossed,
  plane: Plane,
  bed: BedDouble,
  car: Car,
  calendar: CalendarDays,
  sparkles: Sparkles,
  heart: Heart,
  "shopping-bag": ShoppingBag,
  star: Star,
  "more-horizontal": Ellipsis,
};

/** Toujours décorative : le nom de la catégorie est écrit à côté. */
export function IconeCategorie({ nom, ...props }: { nom: string | null | undefined } & LucideProps) {
  return createElement((nom && ICONES[nom]) || Sparkles, { "aria-hidden": true, strokeWidth: 1.5, ...props });
}
