import { type SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Liste déroulante native (<select>) aux couleurs du thème. À préférer au
 * composant Select (Radix) dans un formulaire envoyé à une action serveur :
 * la valeur part avec le formulaire, et le clavier comme le mobile gardent le
 * comportement natif.
 */
export const NativeSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className={cn("relative", className)}>
      <select
        ref={ref}
        className="h-11 w-full appearance-none rounded-md border border-border bg-surface pr-10 pl-3 text-base text-fg outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-fg-muted"
      />
    </div>
  ),
);
NativeSelect.displayName = "NativeSelect";
