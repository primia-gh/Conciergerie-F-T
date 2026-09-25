import Image from "next/image";
import Link from "next/link";
import { SelecteurActivite } from "@/components/site/selecteur-activite";

/**
 * Habillage du site public F&T (maquette « Piste 1 — Lin & forêt ») : sélecteur,
 * en-tête et pied de page. Seuls les liens vers des pages qui existent sont
 * affichés ; logements, contact et estimation arriveront avec leurs pages.
 */
export default function FtSiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SelecteurActivite actif="ft" />
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/location"
            className="flex items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            <Image src="/brand/cle-ft-clair.svg" alt="" width={40} height={44} className="h-11 w-auto" unoptimized priority />
            <span className="flex flex-col">
              <span className="font-display text-xl text-brand">Conciergerie F&amp;T</span>
              <span className="text-[0.7rem] font-semibold tracking-[0.16em] text-fg-muted uppercase">
                Conciergerie de location
              </span>
            </span>
          </Link>
          <nav aria-label="Site F&T">
            <Link
              href="/proprietaires"
              className="flex min-h-11 items-center text-[0.95rem] font-medium text-fg underline-offset-4 hover:underline"
            >
              Propriétaires
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
      <footer className="border-t border-border bg-bg-subtle">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left">
          <div className="flex items-center gap-3">
            <Image src="/brand/cle-ft-clair.svg" alt="" width={28} height={31} className="h-8 w-auto" unoptimized />
            <span className="font-display text-lg text-brand">Conciergerie F&amp;T</span>
          </div>
          <nav aria-label="Liens utiles" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link href="/proprietaires" className="text-fg-muted hover:text-fg">
              Propriétaires
            </Link>
            <Link href="/confidentialite" className="text-fg-muted hover:text-fg">
              Confidentialité
            </Link>
          </nav>
          <p className="text-xs text-fg-muted">© {new Date().getFullYear()} Conciergerie F&amp;T</p>
        </div>
      </footer>
    </>
  );
}
