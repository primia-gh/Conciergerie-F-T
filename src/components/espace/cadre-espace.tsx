import type { ReactNode } from "react";
import Link from "next/link";
import { bodoni } from "@/app/fonts";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/server/auth/session";
import type { NotificationRow } from "@/components/features/notifications-bell";
import { BarreEspace } from "./barre-espace";
import { ESPACES } from "./navigation";

/**
 * Enveloppe de tous les espaces connectés, en « Marine & or » (décision du
 * Gérant, 2026-09-25) : barre du haut commune, contenu, pied de page. Les
 * notifications sont lues ici pour que la cloche soit sur chaque page.
 */
export async function CadreEspace({ profile, children }: { profile: Profile; children: ReactNode }) {
  let notifications: NotificationRow[] = [];
  if (ESPACES[profile.role].notifications) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("notifications")
      .select("id, type, read_at, created_at, payload")
      .eq("user_id", profile.id)
      .eq("channel", "in_app")
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<NotificationRow[]>();
    notifications = data ?? [];
  }

  return (
    <CadreEspaceVue profile={profile} notifications={notifications}>
      {children}
    </CadreEspaceVue>
  );
}

/** Présentation du cadre, sans lecture en base. */
export function CadreEspaceVue({
  profile,
  notifications,
  children,
}: {
  profile: Pick<Profile, "role" | "first_name" | "last_name">;
  notifications: NotificationRow[];
  children: ReactNode;
}) {
  const nomComplet = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Mon compte";

  return (
    <div className={`${bodoni.variable} theme-premium flex min-h-dvh flex-1 flex-col`}>
      <BarreEspace
        role={profile.role}
        prenom={profile.first_name}
        nomComplet={nomComplet}
        notifications={notifications}
      />
      <main id="contenu" className="flex flex-1 flex-col">
        {children}
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-6 text-xs text-fg-muted sm:px-6">
          <p>{ESPACES[profile.role].nom}</p>
          <nav aria-label="Liens utiles" className="flex gap-6">
            <Link href="/confidentialite" className="hover:text-fg">
              Confidentialité
            </Link>
            <Link href={ESPACES[profile.role].voirLeSite} className="hover:text-fg">
              Voir le site
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
