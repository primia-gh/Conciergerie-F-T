import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { REQUEST_STATUSES } from "@/server/requests/state-machine";

type RequestRow = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  concierge_id: string | null;
  categories: { name: string } | null;
};

const PAGE_SIZE = 20;

export default async function AdminRequestsPage({
  searchParams,
}: PageProps<"/admin/requests">) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const categoryId = typeof params.category === "string" ? params.category : "";
  const conciergeId = typeof params.concierge === "string" ? params.concierge : "";
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
    .select("id, title, status, created_at, concierge_id, categories(name)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (conciergeId) query = query.eq("concierge_id", conciergeId);

  const offset = (page - 1) * PAGE_SIZE;
  const { data: requests, count } = await query
    .range(offset, offset + PAGE_SIZE - 1)
    .returns<RequestRow[]>();

  const totalCount = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  function pageHref(targetPage: number) {
    const query = new URLSearchParams();
    if (status) query.set("status", status);
    if (categoryId) query.set("category", categoryId);
    if (conciergeId) query.set("concierge", conciergeId);
    if (targetPage > 1) query.set("page", String(targetPage));
    const qs = query.toString();
    return qs ? `/admin/requests?${qs}` : "/admin/requests";
  }

  const conciergeNames = new Map(
    (concierges ?? []).map((c) => [c.id, `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim()]),
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display text-2xl font-medium text-fg">Toutes les demandes</h1>

      <form className="mt-6 flex flex-wrap items-end gap-3" method="get">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className="text-sm text-fg-muted">
            Statut
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-fg"
          >
            <option value="">Tous</option>
            {REQUEST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="category" className="text-sm text-fg-muted">
            Catégorie
          </label>
          <select
            id="category"
            name="category"
            defaultValue={categoryId}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-fg"
          >
            <option value="">Toutes</option>
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="concierge" className="text-sm text-fg-muted">
            Concierge
          </label>
          <select
            id="concierge"
            name="concierge"
            defaultValue={conciergeId}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-fg"
          >
            <option value="">Tous</option>
            {(concierges ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {`${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || c.id}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="secondary">
          Filtrer
        </Button>
        {(status || categoryId || conciergeId) && (
          <Button asChild variant="ghost">
            <Link href="/admin/requests">Réinitialiser</Link>
          </Button>
        )}
      </form>

      <p className="mt-4 text-sm text-fg-muted">
        {totalCount} demande{totalCount > 1 ? "s" : ""}
        {pageCount > 1 ? ` — page ${page}/${pageCount}` : ""}
      </p>

      <ul className="mt-3 flex flex-col gap-3">
        {(requests ?? []).map((request) => (
          <li key={request.id}>
            <Card>
              <CardContent className="flex items-center justify-between pt-5">
                <div>
                  <p className="font-medium text-fg">{request.title}</p>
                  <p className="text-sm text-fg-muted">
                    {request.categories?.name ?? "—"} ·{" "}
                    {request.concierge_id
                      ? conciergeNames.get(request.concierge_id) || "Concierge inconnu"
                      : "Non assignée"}
                  </p>
                </div>
                <Badge variant="accent">{request.status}</Badge>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      {pageCount > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-1" aria-label="Pagination">
          {page > 1 ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={pageHref(page - 1)}>Précédent</Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" disabled>
              Précédent
            </Button>
          )}
          <span className="px-2 text-sm text-fg-muted">
            {page} / {pageCount}
          </span>
          {page < pageCount ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={pageHref(page + 1)}>Suivant</Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" disabled>
              Suivant
            </Button>
          )}
        </nav>
      )}
    </div>
  );
}
