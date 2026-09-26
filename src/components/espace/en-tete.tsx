import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export const surtitre = "text-xs font-medium tracking-[0.2em] uppercase";

/** Largeurs de page des espaces connectés. */
export const PAGE = {
  large: "mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12",
  moyenne: "mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12",
  etroite: "mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12",
};

/** Lien de retour en haut d'une page de détail. */
export function LienRetour({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group mb-4 inline-flex min-h-11 items-center gap-2 text-sm text-fg-muted transition-colors hover:text-fg"
    >
      <ArrowLeft
        aria-hidden="true"
        className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none"
      />
      {children}
    </Link>
  );
}

/** En-tête commun : surtitre doré, grand titre, phrase d'explication, actions à droite. */
export function EnTetePage({
  surtitre: sur,
  titre,
  children,
  actions,
  className,
}: {
  surtitre?: ReactNode;
  titre: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {sur && <p className={cn(surtitre, "flex items-center gap-2 text-accent")}>{sur}</p>}
        <h1 className={cn("font-display text-4xl break-words text-fg", sur && "mt-3")}>{titre}</h1>
        {children && <div className="mt-3 max-w-2xl leading-relaxed text-fg-muted">{children}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}

/** Titre de section en petites capitales, avec un compteur facultatif. */
export function TitreSection({
  id,
  children,
  compte,
  className,
}: {
  id?: string;
  children: ReactNode;
  compte?: number;
  className?: string;
}) {
  return (
    <h2 id={id} className={cn(surtitre, "flex items-center gap-2 text-fg-muted", className)}>
      {children}
      {compte !== undefined && (
        <span className="rounded-full bg-surface px-2 py-0.5 text-[0.7rem] tracking-normal text-fg">{compte}</span>
      )}
    </h2>
  );
}

/** Carte cliquable d'une liste (demande, prospect, partenaire…). */
export const carteLien =
  "group flex items-center gap-4 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent/60 hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:p-5";
