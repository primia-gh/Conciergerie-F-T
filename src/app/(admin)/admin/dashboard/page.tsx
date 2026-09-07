import { getCurrentProfile } from "@/server/auth/session";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/features/sign-out-button";
import { StatTile } from "@/components/features/stat-tile";
import { HorizontalBarChart } from "@/components/features/horizontal-bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const OPEN_STATUSES_EXCLUDED = ["COMPLETED", "CANCELLED"];

export default async function AdminDashboardPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [
    { count: totalRequests },
    { count: openRequests },
    { count: completedRequests },
    { count: totalBookings },
    { count: totalClients },
    { count: totalConcierges },
    { data: requestsWithCategory },
    { data: requestsWithDate },
    { data: distinctClients },
    { data: assignmentTimes },
  ] = await Promise.all([
    supabase.from("requests").select("id", { count: "exact", head: true }),
    supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .not("status", "in", `(${OPEN_STATUSES_EXCLUDED.join(",")})`),
    supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "COMPLETED"),
    supabase.from("bookings").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "client"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "concierge"),
    supabase.from("requests").select("categories(name)").returns<{ categories: { name: string } | null }[]>(),
    supabase.from("requests").select("created_at").returns<{ created_at: string }[]>(),
    supabase.from("requests").select("client_id").returns<{ client_id: string }[]>(),
    supabase
      .from("request_status_history")
      .select("created_at, requests(created_at)")
      .eq("to_status", "ASSIGNED")
      .returns<{ created_at: string; requests: { created_at: string } | null }[]>(),
  ]);

  const categoryCounts = new Map<string, number>();
  for (const r of requestsWithCategory ?? []) {
    const name = r.categories?.name ?? "Autre";
    categoryCounts.set(name, (categoryCounts.get(name) ?? 0) + 1);
  }
  const categoryData = [...categoryCounts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const dayCounts = new Map<string, number>();
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dayCounts.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of requestsWithDate ?? []) {
    const key = r.created_at.slice(0, 10);
    if (dayCounts.has(key)) {
      dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
    }
  }
  const dailyData = [...dayCounts.entries()].map(([label, value]) => ({
    label: label.slice(5).replace("-", "/"),
    value,
  }));

  const activeClients = new Set((distinctClients ?? []).map((r) => r.client_id)).size;

  const responseTimesMs = (assignmentTimes ?? [])
    .filter((row) => row.requests?.created_at)
    .map((row) => new Date(row.created_at).getTime() - new Date(row.requests!.created_at).getTime());
  const avgResponseHours =
    responseTimesMs.length > 0
      ? responseTimesMs.reduce((sum, ms) => sum + ms, 0) / responseTimesMs.length / (1000 * 60 * 60)
      : null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-fg">
            Back-office — {profile?.first_name ?? ""}
          </h1>
          <p className="mt-1 text-fg-muted">Vue d&apos;ensemble de la plateforme.</p>
        </div>
        <SignOutButton />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatTile label="Demandes totales" value={String(totalRequests ?? 0)} />
        <StatTile label="Demandes ouvertes" value={String(openRequests ?? 0)} />
        <StatTile label="Demandes terminées" value={String(completedRequests ?? 0)} />
        <StatTile label="Clients" value={String(totalClients ?? 0)} note={`${activeClients} avec ≥1 demande`} />
        <StatTile label="Concierges" value={String(totalConcierges ?? 0)} />
        <StatTile label="Réservations" value={String(totalBookings ?? 0)} />
        <StatTile
          label="Temps moyen de prise en charge"
          value={avgResponseHours !== null ? `${avgResponseHours.toFixed(1)} h` : "—"}
          note={avgResponseHours === null ? "Aucune demande assignée pour l'instant" : undefined}
        />
        <StatTile label="Chiffre d'affaires" value="—" note="Nécessite Stripe (Phase M10, non fait)" />
        <StatTile label="Satisfaction" value="—" note="Nécessite des avis clients (non implémenté)" />
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Demandes par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-sm text-fg-muted">Aucune donnée pour l&apos;instant.</p>
            ) : (
              <HorizontalBarChart data={categoryData} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Demandes par jour (14 derniers jours)</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={dailyData.filter((d) => d.value > 0)} />
            {dailyData.every((d) => d.value === 0) && (
              <p className="text-sm text-fg-muted">Aucune demande sur la période.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
