import type { ReactNode } from "react";
import { requireRole } from "@/server/auth/guards";

export default async function ConciergeSpaceLayout({ children }: { children: ReactNode }) {
  await requireRole("concierge");
  return <>{children}</>;
}
