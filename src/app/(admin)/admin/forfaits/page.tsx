import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { forfait } from "@/lib/forfaits";
import type { DemandeForfait } from "@/server/subscriptions/actions";
import { VueFormules, type ClientFormule } from "./vue-formules";

export const metadata: Metadata = { title: "Formules" };

type Ligne = {
  profile_id: string;
  preferences: { demande_forfait?: DemandeForfait } | null;
  profiles: { first_name: string | null; last_name: string | null; email: string | null } | null;
  abonnement: { plans: { code: string } | null } | null;
};

/**
 * Formules des clients Premium. Toute inscription crée une ligne
 * `client_profiles` (déclencheur 0004), y compris pour un compte passé ensuite
 * admin ou concierge : on ne garde que les profils de rôle « client ».
 * La formule suit la même règle que quota.ts : l'abonnement rattaché, sinon Free.
 */
export default async function AdminFormulesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("client_profiles")
    .select(
      "profile_id, preferences, profiles!inner(first_name, last_name, email, role), abonnement:subscription_id(plans(code))",
    )
    .eq("profiles.role", "client")
    .limit(300)
    .returns<Ligne[]>();

  const clients: ClientFormule[] = (data ?? [])
    .map((l) => ({
      id: l.profile_id,
      nom: [l.profiles?.first_name, l.profiles?.last_name].filter(Boolean).join(" ") || "Client sans nom",
      email: l.profiles?.email ?? null,
      formule: forfait(l.abonnement?.plans?.code)?.code ?? "free",
      demande: l.preferences?.demande_forfait ?? null,
    }))
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

  return <VueFormules clients={clients} />;
}
