import type { ReactNode } from "react";
import { requireRole } from "@/server/auth/guards";

export default async function ConciergeSpaceLayout({ children }: { children: ReactNode }) {
  await requireRole("concierge");
  return (
    <main id="contenu" className="flex flex-1 flex-col">
      {children}
    </main>
  );
}
