"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { bodoniErreurs } from "@/app/fonts-erreurs";

/**
 * Erreur inattendue dans une page : message clair, bouton pour réessayer,
 * et un chemin de sortie. Le détail technique ne part que dans la console
 * (et dans les journaux Vercel), jamais à l'écran.
 */
export default function ErreurPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      id="contenu"
      className={`${bodoniErreurs.variable} theme-premium grain flex min-h-dvh flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center`}
    >
      <div className="flex flex-col items-center gap-4">
        <h1 className="font-display text-4xl sm:text-5xl">Un imprévu est survenu.</h1>
        <p className="max-w-md text-lg leading-relaxed text-fg-muted">
          La page n&apos;a pas pu s&apos;afficher. Réessayez dans un instant ; si le problème continue,
          revenez à l&apos;accueil.
        </p>
        {error.digest && <p className="text-xs text-fg-faint">Référence : {error.digest}</p>}
      </div>
      <div className="flex flex-col items-center gap-5 sm:flex-row">
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex min-h-12 items-center gap-2 bg-accent px-7 font-medium tracking-wide text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg"
        >
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          Réessayer
        </button>
        <Link href="/" className="border-b border-accent pb-1 text-fg transition-colors hover:text-accent-hover">
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
