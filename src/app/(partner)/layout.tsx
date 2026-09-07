import type { ReactNode } from "react";
import { requireRole } from "@/server/auth/guards";

export default async function PartnerSpaceLayout({ children }: { children: ReactNode }) {
  await requireRole("partner");
  return <>{children}</>;
}
