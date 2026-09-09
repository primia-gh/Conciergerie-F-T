import Link from "next/link";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "#comment-ca-marche", label: "Comment ça marche" },
  { href: "#services", label: "Services" },
  { href: "#selection", label: "Sélection" },
  { href: "#tarifs", label: "Tarifs" },
  { href: "#faq", label: "FAQ" },
];

export function MarketingHeader({ dashboardHref }: { dashboardHref?: string | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-lg font-medium text-fg">
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
        <div className="flex items-center gap-3">
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
      </div>
    </header>
  );
}
