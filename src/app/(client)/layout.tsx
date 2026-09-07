import type { ReactNode } from "react";
import { requireRole } from "@/server/auth/guards";

export default async function ClientSpaceLayout({ children }: { children: ReactNode }) {
  await requireRole("client");
  return <>{children}</>;
}
