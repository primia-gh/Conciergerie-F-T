import type { Metadata } from "next";
import { getCurrentProfile } from "@/server/auth/session";
import { createClient } from "@/lib/supabase/server";
import { VueGerant } from "./vue-gerant";

export const metadata: Metadata = { title: "Tableau de bord" };

const OPEN_STATUSES_EXCLUDED = ["COMPLETED", "CANCELLED"];

export default async function AdminDashboardPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [
    { count: escalades },
    { count: escaladesUrgentes },
    { count: brouillons },
    { count: prospects },
    { count: prospectsTotal },
    { count: demandesSansConcierge },
    { count: formulesDemandees },
    { data: reglesAutonomes },
    { data: logements },
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
    // Boîte de réception : ce qui attend le Gérant, toutes activités confondues.
    supabase.from("demande").select("id", { count: "exact", head: true }).eq("statut", "escalade").is("traite_le", null),
    supabase
      .from("demande")
      .select("id", { count: "exact", head: true })
      .eq("statut", "escalade")
      .eq("escalade_urgente", true)
      .is("traite_le", null),
    supabase.from("demande").select("id", { count: "exact", head: true }).eq("statut", "brouillon_pret").is("traite_le", null),
    // F&T
    supabase.from("proprietaire").select("id", { count: "exact", head: true }).eq("statut", "prospect"),
    supabase.from("bien_prospect").select("id", { count: "exact", head: true }),
    // Premium
    supabase.from("requests").select("id", { count: "exact", head: true }).eq("status", "NEW").is("concierge_id", null),
    // Demandes de changement de formule en attente (voir server/subscriptions/actions.ts).
    supabase.from("client_profiles").select("profile_id", { count: "exact", head: true }).not("preferences->demande_forfait", "is", null),
    // Tâches de l'assistant qui peuvent agir sans clic du Gérant (celles de /admin/ft/regles).
    supabase
      .from("regle")
      .select("tache, niveau_autonomie")
      .eq("activite", "ft")
      .eq("actif", true)
      .neq("niveau_autonomie", "propose")
      .returns<{ tache: string; niveau_autonomie: string }[]>(),
    supabase.from("logement").select("statut").returns<{ statut: string }[]>(),
    supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .not("status", "in", `(${OPEN_STATUSES_EXCLUDED.join(",")})`),
    supabase.from("requests").select("id", { count: "exact", head: true }).eq("status", "COMPLETED"),
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
  const parCategorie = [...categoryCounts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  // Jours à l'heure de Paris (le serveur tourne en UTC).
  const jourParis = (d: Date) => d.toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
  const dayCounts = new Map<string, number>();
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    dayCounts.set(jourParis(new Date(today.getTime() - i * 86_400_000)), 0);
  }
  for (const r of requestsWithDate ?? []) {
    const key = jourParis(new Date(r.created_at));
    if (dayCounts.has(key)) dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
  }
  const parJour = [...dayCounts.entries()].map(([jour, value]) => ({
    label: `${jour.slice(8, 10)}/${jour.slice(5, 7)}`,
    value,
  }));

  const responseTimesMs = (assignmentTimes ?? [])
    .filter((row) => row.requests?.created_at)
    .map((row) => new Date(row.created_at).getTime() - new Date(row.requests!.created_at).getTime());
  const heuresPriseEnCharge =
    responseTimesMs.length > 0
      ? responseTimesMs.reduce((sum, ms) => sum + ms, 0) / responseTimesMs.length / (1000 * 60 * 60)
      : null;

  return (
    <VueGerant
      d={{
        prenom: profile?.first_name ?? null,
        aTraiter: {
          escalades: escalades ?? 0,
          escaladesUrgentes: escaladesUrgentes ?? 0,
          brouillons: brouillons ?? 0,
          prospects: prospects ?? 0,
          demandesSansConcierge: demandesSansConcierge ?? 0,
          formulesDemandees: formulesDemandees ?? 0,
        },
        reglesAutonomes: (reglesAutonomes ?? []).map((r) => ({ tache: r.tache, niveau: r.niveau_autonomie })),
        ft: {
          logements: logements?.length ?? 0,
          logementsActifs: (logements ?? []).filter((l) => l.statut === "actif").length,
          prospectsTotal: prospectsTotal ?? 0,
        },
        premium: {
          ouvertes: openRequests ?? 0,
          terminees: completedRequests ?? 0,
          clients: totalClients ?? 0,
          clientsActifs: new Set((distinctClients ?? []).map((r) => r.client_id)).size,
          concierges: totalConcierges ?? 0,
          reservations: totalBookings ?? 0,
          heuresPriseEnCharge,
          parCategorie,
          parJour,
        },
      }}
    />
  );
}
