import type { ReactNode } from "react";
import { requireRole } from "@/server/auth/guards";
import { CadreEspace } from "@/components/espace/cadre-espace";

/** « Mon compte » est commun à tous les rôles : il garde le cadre de l'espace de chacun. */
export default async function AccountLayout({ children }: { children: ReactNode }) {
  const profile = await requireRole("client", "concierge", "admin", "partner");
  return <CadreEspace profile={profile}>{children}</CadreEspace>;
}
