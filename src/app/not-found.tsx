import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { bodoniErreurs, frauncesErreurs, karlaErreurs } from "@/app/fonts-erreurs";

export const metadata: Metadata = {
  title: { absolute: "Page introuvable" },
  robots: { index: false },
};

/** Page 404 du site : même logique que la page de choix, une moitié par activité. */
export default function NotFound() {
  return (
    <main
      id="contenu"
      className={`${karlaErreurs.variable} ${frauncesErreurs.variable} ${bodoniErreurs.variable} theme-premium grain flex min-h-dvh flex-1 flex-col items-center justify-center gap-12 px-6 py-16 text-center`}
    >
      <div className="flex flex-col items-center gap-5">
        <p className="font-display text-7xl text-accent-hover italic sm:text-8xl">404</p>
        <h1 className="font-display text-4xl sm:text-5xl">Cette page n&apos;existe pas.</h1>
        <p className="max-w-md text-lg leading-relaxed text-fg-muted">
          Le lien est peut-être incomplet, ou la page a changé d&apos;adresse. Reprenez depuis l&apos;une de nos
          deux maisons.
        </p>
      </div>
      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        <Link
          href="/location"
          className="theme-ft group flex items-center justify-between gap-4 rounded-lg p-6 text-left ring-1 ring-filet transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none"
        >
          <span className="flex flex-col gap-1">
            <span className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">Location courte durée</span>
            <span className="font-display text-2xl">Conciergerie F&amp;T</span>
          </span>
          <ArrowRight aria-hidden="true" className="h-5 w-5 shrink-0 text-accent" />
        </Link>
        <Link
          href="/premium"
          className="group flex items-center justify-between gap-4 bg-surface p-6 text-left ring-1 ring-filet transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none"
        >
          <span className="flex flex-col gap-1">
            <span className="text-xs tracking-[0.24em] text-accent uppercase">Conciergerie privée</span>
            <span className="font-display text-2xl">
              Conciergerie <em className="text-accent-hover">Premium</em>
            </span>
          </span>
          <ArrowRight aria-hidden="true" className="h-5 w-5 shrink-0 text-accent" />
        </Link>
      </div>
      <Link href="/login" className="text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline">
        Accéder à mon espace
      </Link>
    </main>
  );
}
