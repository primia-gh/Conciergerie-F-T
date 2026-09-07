import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getClientQuota } from "./quota";

type PlanRow = { code: string; name: string; request_limit: number | null };

/**
 * Double de test minimal reproduisant uniquement les appels réellement faits
 * par `getClientQuota` (.from().select().eq().maybeSingle() / .gte()). Pas de
 * vraie connexion Postgres ici — la vérification RLS/intégration réelle reste
 * couverte manuellement (voir ROADMAP.md M1, M15).
 */
function makeSupabaseMock(config: {
  clientProfile?: { subscription_id: string | null } | null;
  subscriptionPlan?: PlanRow | null;
  freePlan?: PlanRow | null;
  requestCount?: number | null;
}): SupabaseClient {
  const mock = {
    from(table: string) {
      const builder = {
        select() {
          return builder;
        },
        eq() {
          return builder;
        },
        gte() {
          return Promise.resolve({ count: config.requestCount ?? 0 });
        },
        maybeSingle() {
          if (table === "client_profiles") {
            return Promise.resolve({ data: config.clientProfile ?? null });
          }
          if (table === "subscriptions") {
            return Promise.resolve({
              data: config.subscriptionPlan ? { plans: config.subscriptionPlan } : null,
            });
          }
          if (table === "plans") {
            return Promise.resolve({ data: config.freePlan ?? null });
          }
          return Promise.resolve({ data: null });
        },
      };
      return builder;
    },
  };

  return mock as unknown as SupabaseClient;
}

const FREE_PLAN: PlanRow = { code: "free", name: "Free", request_limit: 2 };
const PREMIUM_PLAN: PlanRow = { code: "premium", name: "Premium", request_limit: 10 };
const VIP_PLAN: PlanRow = { code: "vip", name: "VIP", request_limit: null };

describe("getClientQuota", () => {
  it("retombe sur le plan FREE sans ligne subscriptions (pas de faux abonnement)", async () => {
    const supabase = makeSupabaseMock({
      clientProfile: { subscription_id: null },
      freePlan: FREE_PLAN,
      requestCount: 1,
    });

    const quota = await getClientQuota(supabase, "client-1");

    expect(quota.planCode).toBe("free");
    expect(quota.requestLimit).toBe(2);
    expect(quota.usedThisMonth).toBe(1);
    expect(quota.remaining).toBe(1);
    expect(quota.canCreateRequest).toBe(true);
  });

  it("bloque la création une fois la limite du plan atteinte", async () => {
    const supabase = makeSupabaseMock({
      clientProfile: { subscription_id: null },
      freePlan: FREE_PLAN,
      requestCount: 2,
    });

    const quota = await getClientQuota(supabase, "client-1");

    expect(quota.remaining).toBe(0);
    expect(quota.canCreateRequest).toBe(false);
  });

  it("bloque aussi au-delà de la limite (pas de compteur négatif)", async () => {
    const supabase = makeSupabaseMock({
      clientProfile: { subscription_id: null },
      freePlan: FREE_PLAN,
      requestCount: 5,
    });

    const quota = await getClientQuota(supabase, "client-1");

    expect(quota.remaining).toBe(0);
    expect(quota.canCreateRequest).toBe(false);
  });

  it("résout le plan payant via subscriptions quand un abonnement existe", async () => {
    const supabase = makeSupabaseMock({
      clientProfile: { subscription_id: "sub-1" },
      subscriptionPlan: PREMIUM_PLAN,
      requestCount: 3,
    });

    const quota = await getClientQuota(supabase, "client-1");

    expect(quota.planCode).toBe("premium");
    expect(quota.requestLimit).toBe(10);
    expect(quota.remaining).toBe(7);
    expect(quota.canCreateRequest).toBe(true);
  });

  it("traite request_limit=null comme illimité", async () => {
    const supabase = makeSupabaseMock({
      clientProfile: { subscription_id: "sub-vip" },
      subscriptionPlan: VIP_PLAN,
      requestCount: 500,
    });

    const quota = await getClientQuota(supabase, "client-1");

    expect(quota.requestLimit).toBeNull();
    expect(quota.remaining).toBeNull();
    expect(quota.canCreateRequest).toBe(true);
  });
});
