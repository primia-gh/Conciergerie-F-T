import type { ReactNode } from "react";
import Link from "next/link";
import { requireRole } from "@/server/auth/guards";

export default async function AdminSpaceLayout({ children }: { children: ReactNode }) {
  await requireRole("admin");

  return (
    <div>
      <nav className="border-b border-border bg-surface px-6 py-3">
        <div className="mx-auto flex max-w-4xl items-center gap-6">
          <span className="font-display text-sm font-medium text-fg">Back-office</span>
          <Link href="/admin/dashboard" className="text-sm text-fg-muted hover:text-fg">
            Dashboard
          </Link>
          <Link href="/admin/requests" className="text-sm text-fg-muted hover:text-fg">
            Demandes
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
}
