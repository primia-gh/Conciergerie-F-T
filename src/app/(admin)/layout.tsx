import type { ReactNode } from "react";
import { requireRole } from "@/server/auth/guards";

export default async function AdminSpaceLayout({ children }: { children: ReactNode }) {
  await requireRole("admin");
  return <>{children}</>;
}
