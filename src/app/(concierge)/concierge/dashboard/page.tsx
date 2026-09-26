import type { Metadata } from "next";
import { getCurrentProfile } from "@/server/auth/session";
import { createClient } from "@/lib/supabase/server";
import { VueConcierge, type RequestRow } from "./vue-concierge";

export const metadata: Metadata = { title: "Demandes" };

const SELECT = "id, title, status, priority, created_at, categories(name, icon)";

export default async function ConciergeDashboardPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [{ data: newRequests }, { data: myRequests }] = await Promise.all([
    supabase
      .from("requests")
      .select(SELECT)
      .is("concierge_id", null)
      .eq("status", "NEW")
      // Réponse prioritaire des formules payantes : les plus prioritaires d'abord
      // (ordre de l'énumération : low < normal < high < urgent), puis les plus anciennes.
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(50)
      .returns<RequestRow[]>(),
    supabase
      .from("requests")
      .select(SELECT)
      .eq("concierge_id", profile?.id ?? "")
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<RequestRow[]>(),
  ]);

  return (
    <VueConcierge prenom={profile?.first_name ?? null} newRequests={newRequests ?? []} myRequests={myRequests ?? []} />
  );
}
