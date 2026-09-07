import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type ClientQuota = {
  planCode: string;
  planName: string;
  requestLimit: number | null; // null = illimité
  usedThisMonth: number;
  remaining: number | null; // null = illimité
  canCreateRequest: boolean;
};

type PlanRow = { code: string; name: string; request_limit: number | null };

/**
 * Un client sans ligne `subscriptions` est implicitement sur le plan FREE —
 * pas de ligne factice créée pour un plan gratuit qui ne passe jamais par
 * Stripe (M10, non fait). Le quota se réinitialise chaque mois calendaire.
 */
export async function getClientQuota(
  supabase: SupabaseClient,
  clientId: string,
): Promise<ClientQuota> {
  const { data: clientProfile } = await supabase
    .from("client_profiles")
    .select("subscription_id")
    .eq("profile_id", clientId)
    .maybeSingle<{ subscription_id: string | null }>();

  let plan: PlanRow | null = null;

  if (clientProfile?.subscription_id) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plans(code, name, request_limit)")
      .eq("id", clientProfile.subscription_id)
      .maybeSingle<{ plans: PlanRow | null }>();
    plan = subscription?.plans ?? null;
  }

  if (!plan) {
    const { data: freePlan } = await supabase
      .from("plans")
      .select("code, name, request_limit")
      .eq("code", "free")
      .maybeSingle<PlanRow>();
    plan = freePlan;
  }

  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("requests")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId)
    .gte("created_at", startOfMonth.toISOString());

  const usedThisMonth = count ?? 0;
  const requestLimit = plan?.request_limit ?? null;
  const remaining = requestLimit === null ? null : Math.max(requestLimit - usedThisMonth, 0);

  return {
    planCode: plan?.code ?? "free",
    planName: plan?.name ?? "Free",
    requestLimit,
    usedThisMonth,
    remaining,
    canCreateRequest: requestLimit === null || usedThisMonth < requestLimit,
  };
}
