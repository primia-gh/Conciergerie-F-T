import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Surtitre } from "@/components/premium/ornements";
import { FORFAITS, pointsForts, prixAffiche } from "@/lib/forfaits";

/**
 * Les forfaits, depuis src/lib/forfaits.ts (même source que la comparaison
 * détaillée et l'espace client). Prix « sur demande » tant que les tarifs sont
 * provisoires, sans délai chiffré (décisions du Gérant, 2026-09-26).
 */
export function Membership() {
  return (
    <section id="tarifs" className="grain scroll-mt-20 py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-6">
        <div className="apparition flex flex-col items-center gap-5 text-center">
          <Surtitre>Formules</Surtitre>
          <h2 className="font-display text-4xl leading-tight text-balance sm:text-5xl">
            Le niveau d&apos;accompagnement <em className="text-accent-hover">qui vous ressemble.</em>
          </h2>
          <p className="text-lg text-fg-muted">
            Commencez gratuitement, et changez de formule quand vous le souhaitez, sans engagement.
          </p>
        </div>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FORFAITS.map((f) => (
            <li
              key={f.code}
              className={cn(
                "apparition flex flex-col gap-6 border px-7 py-9",
                f.recommande ? "border-accent bg-surface-raised" : "border-border bg-surface",
              )}
            >
              <h3 className={cn("font-display text-3xl italic", f.recommande && "text-accent-hover")}>{f.nom}</h3>
              <p className="font-display text-3xl">{prixAffiche(f)}</p>
              <p className="min-h-12 leading-relaxed text-fg-muted">{f.accroche}</p>
              <span aria-hidden="true" className="h-px bg-filet" />
              <ul className="flex flex-1 flex-col gap-3">
                {pointsForts(f).map((point) => (
                  <li key={point} className="flex items-start gap-2.5">
                    <Check aria-hidden="true" strokeWidth={1.5} className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {point}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={cn(
                  "inline-flex min-h-12 items-center justify-center text-sm font-medium tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg",
                  f.recommande
                    ? "bg-accent text-accent-fg hover:bg-accent-hover"
                    : "border border-accent text-fg hover:bg-accent hover:text-accent-fg",
                )}
              >
                {f.code === "free" ? "Commencer gratuitement" : `Choisir ${f.nom}`}
              </Link>
            </li>
          ))}
        </ul>
        <div className="apparition flex flex-col items-center justify-center gap-x-10 gap-y-3 text-center sm:flex-row">
          <Link
            href="/premium/conseil"
            className="group inline-flex min-h-11 items-center gap-2 border-b border-accent pb-1 text-fg transition-colors hover:text-accent-hover"
          >
            Quelle formule pour moi ? 3 questions
            <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
          </Link>
          <Link
            href="/premium/forfaits"
            className="group inline-flex min-h-11 items-center gap-2 text-fg-muted transition-colors hover:text-fg"
          >
            Comparer les formules en détail
            <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
          </Link>
        </div>
        <p className="text-center text-sm text-fg-muted">
          Tarifs des formules payantes communiqués sur demande. Vous commencez avec Free, puis vous demandez la
          formule de votre choix depuis votre espace.
        </p>
      </div>
    </section>
  );
}
