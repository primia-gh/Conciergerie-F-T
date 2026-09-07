import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * S'appuie sur <input type="date"> natif (accessible, zéro JS, cohérent
 * mobile/desktop) plutôt qu'un calendrier custom — suffisant pour le MVP.
 * Un composant calendrier dédié pourra être ajouté plus tard si l'UX
 * premium visée le justifie.
 */
export const DatePicker = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="date"
        className={cn(
          "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
DatePicker.displayName = "DatePicker";
