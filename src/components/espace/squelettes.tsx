import { cn } from "@/lib/utils";

/** Bloc gris qui annonce un contenu en cours de chargement (voir `.squelette`). */
export function Squelette({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("squelette", className)} />;
}

/**
 * Enveloppe d'un écran de chargement : annonce « Chargement » aux lecteurs
 * d'écran, et garde la mise en page de la page attendue pour éviter les sauts.
 */
export function Chargement({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14", className)}>
      <span className="sr-only">Chargement…</span>
      {children}
    </div>
  );
}

/** En-tête de page : surtitre, titre, phrase. */
export function SqueletteEnTete() {
  return (
    <div className="flex flex-col gap-3">
      <Squelette className="h-3 w-32" />
      <Squelette className="h-10 w-72 max-w-full" />
      <Squelette className="h-4 w-96 max-w-full" />
    </div>
  );
}

/** Liste de cartes (demandes, fiches…). */
export function SqueletteListe({ lignes = 3 }: { lignes?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: lignes }, (_, i) => (
        <Squelette key={i} className="h-24 rounded-lg" />
      ))}
    </div>
  );
}
