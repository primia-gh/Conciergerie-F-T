import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Surtitre } from "@/components/premium/ornements";

/** Titre commun des pages de connexion : surtitre doré + grand titre Bodoni. */
export function TitreAuth({ surtitre, titre, texte }: { surtitre: string; titre: string; texte?: string }) {
  return (
    <div className="flex flex-col gap-4">
      <Surtitre>{surtitre}</Surtitre>
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">{titre}</h1>
      {texte && <p className="leading-relaxed text-fg-muted">{texte}</p>}
    </div>
  );
}

/** Bouton d'envoi or, désactivé pendant l'envoi pour éviter les doubles clics. */
export function BoutonEnvoi({
  enCours,
  texteEnCours,
  children,
}: {
  enCours: boolean;
  texteEnCours: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={enCours}
      aria-busy={enCours}
      className="group mt-1 inline-flex min-h-12 items-center justify-center gap-3 bg-accent px-6 text-base font-medium tracking-wide text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg disabled:cursor-wait disabled:opacity-70"
    >
      {enCours ? texteEnCours : children}
      {!enCours && (
        <ArrowRight
          aria-hidden="true"
          strokeWidth={1.5}
          className="h-5 w-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
        />
      )}
    </button>
  );
}
