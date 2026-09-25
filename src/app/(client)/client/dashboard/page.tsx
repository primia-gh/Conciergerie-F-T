import type { Metadata } from "next";
import { getCurrentProfile } from "@/server/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getClientQuota } from "@/server/subscriptions/quota";
import { requestStatusLabel } from "@/server/requests/status-labels";
import { TableauDeBord, type CategorieSuggeree } from "./tableau-de-bord";

export const metadata: Metadata = { title: "Mes demandes" };

type RequestRow = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  concierge_id: string | null;
  categories: { name: string; icon: string | null } | null;
};

type ActivityRow = {
  id: string;
  request_id: string | null;
  note: string | null;
  to_status: string;
  created_at: string;
};

export default async function ClientDashboardPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const quota = profile ? await getClientQuota(supabase, profile.id) : null;

  const [{ data: requests }, { data: nextBooking }, { data: activity }] = await Promise.all([
    supabase
      .from("requests")
      .select("id, title, status, created_at, concierge_id, categories(name, icon)")
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<RequestRow[]>(),
    supabase
      .from("bookings")
      .select("scheduled_at")
      .in("status", ["pending", "confirmed"])
      .not("scheduled_at", "is", null)
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .maybeSingle<{ scheduled_at: string }>(),
    supabase
      .from("request_status_history")
      .select("id, request_id, note, to_status, created_at")
      .order("created_at", { ascending: false })
      .limit(6)
      .returns<ActivityRow[]>(),
  ]);

  const allRequests = requests ?? [];

  const conciergeIds = [...new Set(allRequests.map((r) => r.concierge_id).filter((id): id is string => !!id))];
  const { data: concierges } = conciergeIds.length
    ? await supabase
        .from("profiles")
        .select("id, first_name")
        .in("id", conciergeIds)
        .returns<{ id: string; first_name: string | null }[]>()
    : { data: [] as { id: string; first_name: string | null }[] };
  const conciergeNames = new Map((concierges ?? []).map((c) => [c.id, c.first_name ?? "votre concierge"]));

  // Suggestions de l'état vide : seulement quand il n'y a rien en cours.
  const hasActive = allRequests.some((r) => r.status !== "COMPLETED" && r.status !== "CANCELLED");
  const { data: categories } = hasActive
    ? { data: [] as CategorieSuggeree[] }
    : await supabase
        .from("categories")
        .select("slug, nom:name, icone:icon")
        .eq("active", true)
        .order("name")
        .returns<CategorieSuggeree[]>();

  return (
    <TableauDeBord
      d={{
        prenom: profile?.first_name ?? null,
        demandes: allRequests.map((r) => ({
          id: r.id,
          titre: r.title,
          status: r.status,
          creeLe: r.created_at,
          categorie: r.categories?.name ?? null,
          icone: r.categories?.icon ?? null,
          concierge: r.concierge_id ? (conciergeNames.get(r.concierge_id) ?? null) : null,
        })),
        prochaineReservation: nextBooking?.scheduled_at ?? null,
        activite: (activity ?? []).map((a) => ({
          id: a.id,
          texte: a.note ?? requestStatusLabel(a.to_status),
          le: a.created_at,
          demandeId: a.request_id,
        })),
        forfait: quota
          ? {
              nom: quota.planName,
              limite: quota.requestLimit,
              utilisees: quota.usedThisMonth,
              peutCreer: quota.canCreateRequest,
            }
          : null,
        categories: categories ?? [],
      }}
    />
  );
}
