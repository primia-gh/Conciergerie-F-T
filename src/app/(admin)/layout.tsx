import type { ReactNode } from "react";
import Link from "next/link";
import { requireRole } from "@/server/auth/guards";

export default async function AdminSpaceLayout({ children }: { children: ReactNode }) {
  await requireRole("admin");

  return (
    <div>
      <nav className="border-b border-border bg-surface px-6 py-3">
        <div className="mx-auto flex max-w-4xl items-center gap-6 overflow-x-auto">
          <span className="shrink-0 whitespace-nowrap font-display text-sm font-medium text-fg">
            Back-office
          </span>
          <Link
            href="/admin/dashboard"
            className="shrink-0 whitespace-nowrap text-sm text-fg-muted hover:text-fg"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/requests"
            className="shrink-0 whitespace-nowrap text-sm text-fg-muted hover:text-fg"
          >
            Demandes
          </Link>
          <Link
            href="/admin/partners"
            className="shrink-0 whitespace-nowrap text-sm text-fg-muted hover:text-fg"
          >
            Partenaires
          </Link>
          <Link
            href="/admin/boite"
            className="shrink-0 whitespace-nowrap text-sm text-fg-muted hover:text-fg"
          >
            Boîte de réception
          </Link>
          <Link
            href="/admin/fiches"
            className="shrink-0 whitespace-nowrap text-sm text-fg-muted hover:text-fg"
          >
            Fiches
          </Link>
          <Link
            href="/admin/ft"
            className="shrink-0 whitespace-nowrap text-sm text-fg-muted hover:text-fg"
          >
            Agent F&amp;T
          </Link>
          {/* La page de choix redirige un compte connecté vers son espace, sauf avec ?from=app. */}
          <Link
            href="/?from=app"
            className="ml-auto shrink-0 whitespace-nowrap text-sm text-fg-muted hover:text-fg"
          >
            Voir le site
          </Link>
        </div>
      </nav>
      <main id="contenu">{children}</main>
    </div>
  );
}
