import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-16 px-6 py-20 lg:flex-row lg:py-28">
        <div className="max-w-xl text-center lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-hover">
            Conciergerie privée
          </p>
          <h1 className="mt-6 font-display text-4xl font-medium leading-tight text-fg sm:text-5xl">
            Ce que vous imaginez,
            <br className="hidden sm:block" /> nous l&apos;organisons.
          </h1>
          <p className="mt-7 text-lg leading-relaxed text-fg-muted">
            Décrivez votre besoin, un concierge dédié s&apos;en occupe. Restaurants, voyages,
            événements ou démarches du quotidien : vous recevez des solutions prêtes à valider,
            jamais une liste de liens à trier vous-même.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-6 sm:flex-row lg:justify-start">
            <Button asChild size="lg">
              <Link href="/signup">Faire une demande</Link>
            </Button>
            <a
              href="#comment-ca-marche"
              className="text-sm text-fg underline decoration-border underline-offset-4 hover:decoration-fg"
            >
              Voir comment ça marche
            </a>
          </div>
        </div>

        {/* Panneau éditorial en attente de la photographie de marque (voir DECISIONS.md) */}
        <div className="relative hidden aspect-[4/5] w-full max-w-sm shrink-0 overflow-hidden rounded-sm bg-gradient-to-br from-bg-subtle via-border/40 to-bg-subtle lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(201,162,92,0.12),transparent_55%)]" />
          <div className="absolute left-8 top-8 h-10 w-10 rounded-full border border-accent/50" />
          <p className="absolute bottom-8 left-8 right-8 text-xs tracking-wide text-fg-faint">
            PHOTOGRAPHIE ÉDITORIALE — À VENIR
          </p>
        </div>
      </div>
    </section>
  );
}
