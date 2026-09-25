import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { cormorant, karla, montserrat } from "@/app/fonts";
import { getCurrentProfile } from "@/server/auth/session";
import { dashboardPathForRole } from "@/server/auth/guards";
import { cn } from "@/lib/utils";

const description =
  "Conciergerie F&T, location courte durée, et Conciergerie Premium, conciergerie privée : deux activités, un même site.";

export const metadata: Metadata = {
  title: { absolute: "Conciergerie F&T · Conciergerie Premium" },
  description,
  openGraph: { title: "Conciergerie F&T · Conciergerie Premium", description, type: "website" },
};

// Chaque moitié s'élargit au survol ou au focus clavier (maquette), sauf si le
// visiteur a demandé moins d'animations.
const moitie =
  "relative flex flex-1 flex-col justify-between gap-12 overflow-hidden px-6 py-12 sm:px-10 md:px-16 md:py-24 transition-[flex-grow] duration-700 ease-[cubic-bezier(.2,.7,.2,1)] motion-reduce:transition-none md:hover:grow-[1.22] md:focus-visible:grow-[1.22] focus-visible:outline-3 focus-visible:-outline-offset-8";

/**
 * Page d'arrivée : le visiteur choisit son activité (maquette « Page de choix »
 * du canevas « Conciergerie F&T — Accueil », décision du Gérant du 2026-09-25).
 * Chaque moitié porte le thème de son activité. Aucun prix affiché tant que
 * les tarifs Premium restent provisoires (décision du 2026-09-25).
 */
export default async function PageDeChoix({ searchParams }: PageProps<"/">) {
  // Un utilisateur connecté qui arrive sur "/" (ex. raccourci PWA, voir
  // manifest.ts) va directement à son espace. Exception : ?from=app montre la
  // page malgré tout.
  const params = await searchParams;
  const profile = await getCurrentProfile();
  if (profile && params.from !== "app") {
    redirect(dashboardPathForRole(profile.role));
  }

  return (
    <div
      className={`${karla.variable} ${cormorant.variable} ${montserrat.variable} relative flex min-h-dvh flex-1 flex-col md:flex-row`}
    >
      <h1 className="sr-only">Conciergerie F&amp;T et Conciergerie Premium</h1>

      <p className="bg-[#121412] py-3 text-center text-xs tracking-[0.18em] text-[#d8d4c8] md:pointer-events-none md:absolute md:top-10 md:left-1/2 md:z-10 md:-translate-x-1/2 md:rounded-full md:px-5 md:py-2.5">
        DEUX MAISONS, UN MÊME SOIN
      </p>

      <Link href="/location" className={cn("theme-ft", moitie, "focus-visible:outline-brand")}>
        <span
          aria-hidden="true"
          className="absolute -right-24 -bottom-32 h-96 w-72 rounded-t-[999px] bg-gradient-to-b from-[#d8ccb6] to-[#b9a98c] opacity-55 md:-right-32 md:-bottom-36 md:h-[680px] md:w-[520px]"
        />
        <Image src="/brand/cle-ft.svg" alt="" width={65} height={72} className="relative h-16 w-auto self-start" unoptimized priority />
        <div className="relative flex max-w-lg flex-col items-start gap-6">
          <span className="text-xs font-semibold tracking-[0.2em] text-[#4a5d4f]">LOCATION COURTE DURÉE</span>
          <h2 className="font-display text-5xl leading-none font-light tracking-tight md:text-7xl">
            Conciergerie <em className="text-accent">F&amp;T</em>
          </h2>
          <span className="text-lg leading-relaxed text-fg-muted">
            Propriétaires : nous gérons votre logement.
          </span>
          <span className="flex items-center gap-3 rounded-full bg-brand px-7 py-4 font-bold text-brand-fg">
            Entrer <ArrowRight aria-hidden="true" className="h-5 w-5" />
          </span>
        </div>
        <span className="relative text-sm text-fg-faint">Gestion locative · Accueil · Ménage · Séjours</span>
      </Link>

      <Link href="/premium" className={cn("theme-premium", moitie, "focus-visible:outline-accent")}>
        <span
          aria-hidden="true"
          className="absolute inset-x-8 inset-y-32 hidden border border-[rgba(161,98,7,0.3)] md:block lg:inset-x-10"
        />
        <span className="relative self-start font-display text-2xl tracking-wide md:self-end">
          Conciergerie <em className="text-accent">Premium</em>
        </span>
        <div className="relative flex max-w-lg flex-col items-start gap-6 md:items-end md:self-end md:text-right">
          <span className="flex items-center gap-3 text-xs tracking-[0.25em] text-accent">
            CONCIERGERIE PRIVÉE
            <span aria-hidden="true" className="h-px w-10 bg-accent" />
          </span>
          <h2 className="font-display text-5xl leading-[1.02] font-normal md:text-7xl">
            Ce que vous imaginez, <em className="text-accent">nous l&apos;organisons.</em>
          </h2>
          <span className="text-lg leading-relaxed text-fg-muted">
            Restaurants, voyages, événements : un concierge dédié, des solutions prêtes à valider.
          </span>
          <span className="flex items-center gap-3 bg-accent px-7 py-4 font-semibold tracking-wide text-accent-fg">
            Entrer <ArrowRight aria-hidden="true" className="h-5 w-5" />
          </span>
        </div>
        <span aria-hidden="true" />
      </Link>

      <div className="flex justify-center bg-[#121412] py-4 md:absolute md:bottom-7 md:left-1/2 md:z-10 md:-translate-x-1/2 md:bg-transparent md:py-0">
        <Link
          href="/login"
          className="flex min-h-11 items-center rounded-full bg-[#f6f1e8] px-5 text-sm font-medium text-[#121412] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f6f1e8]"
        >
          Se connecter
        </Link>
      </div>
    </div>
  );
}
