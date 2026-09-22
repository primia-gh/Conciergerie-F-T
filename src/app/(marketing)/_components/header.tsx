"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "#comment-ca-marche", label: "Comment ça marche" },
  { href: "#services", label: "Services" },
  { href: "#selection", label: "Sélection" },
  { href: "#tarifs", label: "Tarifs" },
  { href: "#faq", label: "FAQ" },
];

export function MarketingHeader({ dashboardHref }: { dashboardHref?: string | null }) {
  const [menuOuvert, setMenuOuvert] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="shrink-0 font-display text-lg font-medium text-fg"
          onClick={() => setMenuOuvert(false)}
        >
          Conciergerie Premium
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-fg-muted transition-colors hover:text-fg"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {dashboardHref ? (
            <Button asChild size="sm">
              <Link href={dashboardHref}>Mon espace</Link>
            </Button>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-fg-muted hover:text-fg">
                Se connecter
              </Link>
              <Button asChild size="sm">
                <Link href="/signup">Faire une demande</Link>
              </Button>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => setMenuOuvert((ouvert) => !ouvert)}
          aria-expanded={menuOuvert}
          aria-controls="menu-mobile"
          aria-label={menuOuvert ? "Fermer le menu" : "Ouvrir le menu"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-fg md:hidden"
        >
          {menuOuvert ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {menuOuvert && (
        <div id="menu-mobile" className="border-t border-border px-6 py-5 md:hidden">
          <nav className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOuvert(false)}
                className="text-sm text-fg-muted transition-colors hover:text-fg"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5">
            {dashboardHref ? (
              <Button asChild size="sm">
                <Link href={dashboardHref} onClick={() => setMenuOuvert(false)}>
                  Mon espace
                </Link>
              </Button>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOuvert(false)}
                  className="text-sm font-medium text-fg-muted hover:text-fg"
                >
                  Se connecter
                </Link>
                <Button asChild size="sm">
                  <Link href="/signup" onClick={() => setMenuOuvert(false)}>
                    Faire une demande
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
