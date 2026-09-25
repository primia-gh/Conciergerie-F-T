import type { ReactNode } from "react";
import { requireRole } from "@/server/auth/guards";
import { CadreEspace } from "@/components/espace/cadre-espace";

export default async function ClientSpaceLayout({ children }: { children: ReactNode }) {
  const profile = await requireRole("client");
  return <CadreEspace profile={profile}>{children}</CadreEspace>;
}
