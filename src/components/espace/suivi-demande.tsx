import { Check } from "lucide-react";
import { ETAPES_DEMANDE, etapeDemande } from "@/server/requests/status-labels";
import { cn } from "@/lib/utils";

/** Barre de progression d'une demande, pour les listes (six segments). */
export function SuiviCompact({ status, className }: { status: string; className?: string }) {
  const etape = etapeDemande(status);
  if (etape < 0) return null;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div aria-hidden="true" className="flex flex-1 gap-1">
        {ETAPES_DEMANDE.map((nom, i) => (
          <span key={nom} className={cn("h-1 flex-1 rounded-full", i <= etape ? "bg-accent" : "bg-border")} />
        ))}
      </div>
      <span className="shrink-0 text-xs text-fg-muted">
        <span className="sr-only">Suivi : </span>
        Étape {etape + 1} sur {ETAPES_DEMANDE.length}
      </span>
    </div>
  );
}

/** Suivi détaillé d'une demande : chaque étape nommée, l'étape en cours marquée. */
export function SuiviDetaille({ status }: { status: string }) {
  const etape = etapeDemande(status);
  if (etape < 0) {
    return (
      <p className="rounded-md border border-border bg-bg-subtle px-4 py-3 text-sm text-fg-muted">
        Cette demande a été annulée.
      </p>
    );
  }
  return (
    <ol className="grid grid-cols-3 gap-x-2 gap-y-5 sm:grid-cols-6">
      {ETAPES_DEMANDE.map((nom, i) => {
        const faite = i < etape || (i === etape && i === ETAPES_DEMANDE.length - 1);
        const enCours = i === etape && !faite;
        return (
          <li
            key={nom}
            aria-current={enCours ? "step" : undefined}
            className="flex flex-col items-center gap-2 text-center"
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold",
                faite && "border-accent bg-accent text-accent-fg",
                enCours && "border-accent bg-accent/15 text-accent ring-4 ring-accent/10",
                !faite && !enCours && "border-border text-fg-faint",
              )}
            >
              {faite ? <Check aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} /> : i + 1}
            </span>
            <span className={cn("text-xs leading-tight", enCours ? "font-medium text-fg" : faite ? "text-fg-muted" : "text-fg-faint")}>
              {nom}
              {faite && <span className="sr-only"> (faite)</span>}
              {enCours && <span className="sr-only"> (en cours)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
