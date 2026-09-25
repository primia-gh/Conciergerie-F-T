import Link from "next/link";
import { cn } from "@/lib/utils";

type Activite = "ft" | "premium";

/**
 * Barre fine en haut de chaque page publique : passer de F&T à Premium et
 * inversement (maquette « Sélecteur F&T / Premium », canevas « Conciergerie
 * F&T — Accueil »). Ses couleurs sont fixes et ne suivent pas le thème de la
 * page : c'est le seul élément commun aux deux activités. L'activité en cours
 * prend la couleur de sa marque. Contrastes vérifiés ≥ 4,5.
 */
export function SelecteurActivite({
  actif,
  lienConnexion = true,
}: {
  actif: Activite;
  /** Faux quand l'en-tête de la page propose déjà « Se connecter ». */
  lienConnexion?: boolean;
}) {
  return (
    <div className="bg-[#121412]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-1.5 sm:px-6">
        <p className="hidden text-xs tracking-[0.16em] text-[#a9a69c] md:block">
          UN SITE, DEUX MAISONS
        </p>
        <nav
          aria-label="Choisir l'activité"
          className="flex gap-1 rounded-full bg-[#1f221f] p-1"
        >
          <LienActivite
            href="/location"
            actif={actif === "ft"}
            classeActive="bg-[#f3ede2] text-[#1b241e]"
            nom="F&T"
            precision="Location courte durée"
          />
          <LienActivite
            href="/premium"
            actif={actif === "premium"}
            classeActive="bg-[#c9a24e] text-[#0e1a31]"
            nom="Premium"
            precision="Conciergerie privée"
          />
        </nav>
        {lienConnexion ? (
          <Link
            href="/login"
            className="flex min-h-11 items-center text-sm text-[#d8d4c8] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8d4c8]"
          >
            Se connecter
          </Link>
        ) : (
          <span className="hidden md:block" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

function LienActivite({
  href,
  actif,
  classeActive,
  nom,
  precision,
}: {
  href: string;
  actif: boolean;
  classeActive: string;
  nom: string;
  precision: string;
}) {
  return (
    <Link
      href={href}
      aria-current={actif ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8d4c8]",
        actif ? classeActive : "text-[#d8d4c8] hover:bg-white/10",
      )}
    >
      {nom}
      <span className="hidden sm:inline">&nbsp;· {precision}</span>
    </Link>
  );
}
