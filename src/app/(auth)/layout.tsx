import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-bg px-4 py-12">
      <Link href="/" className="font-display text-lg font-medium text-fg">
        Conciergerie Premium
      </Link>
      <div className="mt-10 w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-soft">
        {children}
      </div>
    </div>
  );
}
