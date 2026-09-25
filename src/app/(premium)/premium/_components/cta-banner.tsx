import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Soleil } from "./ornements";

/** Bandeau d'appel avant le pied de page, sur le bleu profond, sous un soleil Art déco. */
export function CtaBanner({ dashboardHref }: { dashboardHref?: string | null }) {
  return (
    <section className="relative overflow-hidden bg-bg-subtle py-24">
      <Soleil className="absolute bottom-0 left-1/2 w-[900px] max-w-none -translate-x-1/2 opacity-20" />
      <div className="apparition relative mx-auto flex max-w-3xl flex-col items-center gap-7 px-6 text-center">
        <h2 className="font-display text-4xl leading-tight text-balance sm:text-6xl">
          {dashboardHref ? (
            <>
              Votre espace <em className="text-accent-hover">vous attend.</em>
            </>
          ) : (
            <>
              Votre première demande, <em className="text-accent-hover">aujourd&apos;hui.</em>
            </>
          )}
        </h2>
        <p className="max-w-md text-lg leading-relaxed text-fg-muted">
          {dashboardHref
            ? "Retrouvez vos demandes en cours et confiez-nous votre prochaine mission."
            : "Créez votre compte en une minute et confiez-nous votre première mission — sans engagement."}
        </p>
        <Link
          href={dashboardHref ?? "/signup"}
          className="group inline-flex min-h-14 items-center gap-3 bg-accent px-8 text-base font-medium tracking-wide text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg"
        >
          {dashboardHref ? "Accéder à mon espace" : "Créer mon compte"}
          <ArrowRight
            aria-hidden="true"
            strokeWidth={1.5}
            className="h-5 w-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
          />
        </Link>
      </div>
    </section>
  );
}
