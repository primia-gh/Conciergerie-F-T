import type { ReactNode } from "react";
import type { Viewport } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { bodoni, jost } from "@/app/fonts";
import { PhotoCadree, Soleil } from "@/components/premium/ornements";
import { PHOTOS } from "@/components/premium/photos";

export const viewport: Viewport = {
  themeColor: "#0e1a31",
};

/**
 * Connexion, inscription, mot de passe oublié : en « Marine & or », comme les
 * espaces connectés (décision du Gérant, 2026-09-25). Formulaire à gauche,
 * photo d'ambiance à droite sur grand écran.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${bodoni.variable} ${jost.variable} theme-premium grain flex min-h-dvh flex-1`}>
      <main id="contenu" className="flex w-full flex-col px-6 py-8 sm:px-10 lg:w-1/2 lg:px-16">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="font-display text-xl tracking-wide whitespace-nowrap sm:text-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Conciergerie <em className="text-accent-hover">Premium</em>
          </Link>
          <Link
            href="/"
            className="flex min-h-11 items-center gap-2 text-sm whitespace-nowrap text-fg-muted transition-colors hover:text-fg"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Retour au site</span>
            <span aria-hidden="true" className="sm:hidden">Retour</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center py-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
      <aside aria-hidden="true" className="relative hidden overflow-hidden bg-bg-subtle lg:flex lg:w-1/2 lg:items-center lg:justify-center">
        <Soleil className="absolute bottom-0 left-1/2 w-[900px] max-w-none -translate-x-1/2 opacity-20" />
        <div className="relative flex flex-col items-center gap-10 px-12">
          <PhotoCadree photo={PHOTOS.tableDuSoir} sizes="360px" cadre className="aspect-[4/5] w-[360px]" />
          <p className="max-w-sm text-center font-display text-3xl leading-snug">
            Ce que vous imaginez, <em className="text-accent-hover">nous l&apos;organisons.</em>
          </p>
        </div>
      </aside>
    </div>
  );
}
