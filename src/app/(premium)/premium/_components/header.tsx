"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/premium#comment-ca-marche", label: "Comment ça marche" },
  { href: "/premium#services", label: "Services" },
  { href: "/premium#selection", label: "Sélection" },
  { href: "/premium#tarifs", label: "Formules" },
  { href: "/premium#faq", label: "FAQ" },
];

const lienNav =
  "whitespace-nowrap text-xs font-medium tracking-[0.18em] text-fg uppercase transition-colors hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";
const boutonOr =
  "inline-flex min-h-11 items-center justify-center whitespace-nowrap bg-accent px-6 text-sm font-medium tracking-wide text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg";

export function MarketingHeader({ dashboardHref }: { dashboardHref?: string | null }) {
  const [menuOuvert, setMenuOuvert] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-filet bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Link
          href="/premium"
          className="shrink-0 font-display text-2xl tracking-wide text-fg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          onClick={() => setMenuOuvert(false)}
        >
          Conciergerie <em className="text-accent-hover">Premium</em>
        </Link>
        <nav aria-label="Sections de la page" className="hidden items-center gap-7 xl:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className={lienNav}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-6 lg:flex">
            {dashboardHref ? (
              <Link href={dashboardHref} className={boutonOr}>
                Mon espace
              </Link>
            ) : (
              <>
                <Link href="/login" className="whitespace-nowrap text-sm text-fg-muted transition-colors hover:text-fg">
                  Se connecter
                </Link>
                <Link href="/signup" className={boutonOr}>
                  Faire une demande
                </Link>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => setMenuOuvert((ouvert) => !ouvert)}
            aria-expanded={menuOuvert}
            aria-controls="menu-mobile"
            aria-label={menuOuvert ? "Fermer le menu" : "Ouvrir le menu"}
            className="flex h-11 w-11 shrink-0 items-center justify-center text-fg focus-visible:outline-2 focus-visible:outline-accent xl:hidden"
          >
            {menuOuvert ? <X className="h-6 w-6" strokeWidth={1.5} /> : <Menu className="h-6 w-6" strokeWidth={1.5} />}
          </button>
        </div>
      </div>
      {menuOuvert && (
        <div id="menu-mobile" className="border-t border-filet px-6 py-6 xl:hidden">
          <nav aria-label="Sections de la page" className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOuvert(false)}
                className={`${lienNav} flex min-h-11 items-center`}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-5 flex flex-col gap-3 border-t border-filet pt-5">
            {dashboardHref ? (
              <Link href={dashboardHref} onClick={() => setMenuOuvert(false)} className={boutonOr}>
                Mon espace
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOuvert(false)}
                  className="flex min-h-11 items-center text-sm text-fg-muted hover:text-fg"
                >
                  Se connecter
                </Link>
                <Link href="/signup" onClick={() => setMenuOuvert(false)} className={boutonOr}>
                  Faire une demande
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
