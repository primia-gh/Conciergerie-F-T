import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Rien à afficher : dire pourquoi, et proposer la suite (jamais un blanc). */
export function EtatVide({
  icone: Icone,
  titre,
  children,
  action,
  className,
}: {
  icone: LucideIcon;
  titre: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
        <Icone aria-hidden="true" className="h-6 w-6 text-accent" strokeWidth={1.5} />
      </span>
      <p className="font-display text-xl text-fg">{titre}</p>
      {children && <div className="max-w-md text-sm leading-relaxed text-fg-muted">{children}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
