import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { PhotoCadree, Soleil, Surtitre } from "./ornements";
import { PHOTOS } from "./photos";

// Garanties tirées des formules et de la FAQ, rien d'autre.
const GARANTIES = ["Sans engagement", "Concierge dédié (VIP)", "Réponse prioritaire (Premium)"];

export function Hero({ dashboardHref }: { dashboardHref?: string | null }) {
  return (
    <section className="grain relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_78%_40%,rgba(42,65,112,0.55),transparent_60%)]"
      />
      <Soleil className="absolute -right-24 bottom-0 hidden w-[900px] opacity-15 lg:block" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-14 px-6 py-16 lg:flex-row lg:items-center lg:gap-20 lg:py-28">
        <div className="flex max-w-2xl flex-col gap-8">
          <Surtitre>Conciergerie privée</Surtitre>
          <h1 className="font-display text-5xl leading-[1.04] tracking-tight text-balance sm:text-6xl lg:text-7xl">
            Ce que vous imaginez, <em className="text-accent-hover">nous l&apos;organisons.</em>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-fg-muted">
            Décrivez votre besoin, un concierge dédié s&apos;en occupe. Restaurants, voyages,
            événements ou démarches du quotidien : vous recevez des solutions prêtes à valider,
            jamais une liste de liens à trier vous-même.
          </p>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
            <Link
              href={dashboardHref ?? "/signup"}
              className="group inline-flex min-h-14 items-center justify-center gap-3 bg-accent px-8 text-base font-medium tracking-wide text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg"
            >
              {dashboardHref ? "Accéder à mon espace" : "Faire une demande"}
              <ArrowRight
                aria-hidden="true"
                strokeWidth={1.5}
                className="h-5 w-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
              />
            </Link>
            <a
              href="#comment-ca-marche"
              className="self-start border-b border-accent pb-1 text-base text-fg transition-colors hover:text-accent-hover sm:self-auto"
            >
              Voir comment ça marche
            </a>
          </div>
          <ul className="flex flex-col gap-3 text-sm text-fg-muted sm:flex-row sm:flex-wrap sm:gap-x-7">
            {GARANTIES.map((garantie) => (
              <li key={garantie} className="flex items-center gap-2">
                <Check aria-hidden="true" strokeWidth={1.5} className="h-4 w-4 text-accent" />
                {garantie}
              </li>
            ))}
          </ul>
        </div>

        <PhotoCadree
          photo={PHOTOS.tableDuSoir}
          sizes="(min-width: 1024px) 420px, 90vw"
          cadre
          priority
          className="order-first aspect-[4/5] w-full max-w-md self-center lg:order-none lg:w-[420px] lg:max-w-none lg:shrink-0"
        />
      </div>
    </section>
  );
}
