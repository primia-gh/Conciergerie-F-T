import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { REQUEST_STATUSES } from "@/server/requests/state-machine";
import { VueDemandes, type RequestRow } from "./vue-demandes";

export const metadata: Metadata = { title: "Demandes Premium" };

const PAGE_SIZE = 20;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminRequestsPage({ searchParams }: PageProps<"/admin/requests">) {
  const params = await searchParams;
  // Filtres lus dans l'adresse : seules des valeurs connues passent à la base.
  const status = REQUEST_STATUSES.find((s) => s === params.status) ?? "";
  const categoryId = typeof params.category === "string" && UUID.test(params.category) ? params.category : "";
  const conciergeId = typeof params.concierge === "string" && UUID.test(params.concierge) ? params.concierge : "";
  const page = Math.max(1, Number(params.page) || 1);

  const supabase = await createClient();

  const [{ data: categories }, { data: concierges }] = await Promise.all([
    supabase.from("categories").select("id, name").order("name").returns<{ id: string; name: string }[]>(),
    supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("role", "concierge")
      .returns<{ id: string; first_name: string | null; last_name: string | null }[]>(),
  ]);

  let query = supabase
    .from("requests")
    .select("id, title, status, priority, created_at, concierge_id, categories(name, icon)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (conciergeId) query = query.eq("concierge_id", conciergeId);

  const offset = (page - 1) * PAGE_SIZE;
  const { data: requests, count } = await query.range(offset, offset + PAGE_SIZE - 1).returns<RequestRow[]>();

  const total = count ?? 0;

  return (
    <VueDemandes
      d={{
        demandes: requests ?? [],
        total,
        page,
        pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
        filtres: { status, category: categoryId, concierge: conciergeId },
        categories: categories ?? [],
        concierges: (concierges ?? []).map((c) => ({
          id: c.id,
          nom: `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || "Concierge sans nom",
        })),
      }}
    />
  );
}
