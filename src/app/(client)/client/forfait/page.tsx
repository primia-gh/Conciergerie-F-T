import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/server/auth/session";
import { getClientQuota } from "@/server/subscriptions/quota";
import { forfait, type CodeForfait } from "@/lib/forfaits";
import type { DemandeForfait } from "@/server/subscriptions/actions";
import { VueFormule } from "./vue-formule";

export const metadata: Metadata = { title: "Ma formule" };

export default async function ClientFormulePage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [quota, { data: ligne }] = await Promise.all([
    profile ? getClientQuota(supabase, profile.id) : Promise.resolve(null),
    supabase
      .from("client_profiles")
      .select("preferences")
      .eq("profile_id", profile?.id ?? "")
      .maybeSingle<{ preferences: { demande_forfait?: DemandeForfait } | null }>(),
  ]);

  const code = (forfait(quota?.planCode)?.code ?? "free") as CodeForfait;
  const demande = ligne?.preferences?.demande_forfait;

  return (
    <VueFormule
      d={{
        actuelle: {
          code,
          nom: quota?.planName ?? "Free",
          limite: quota?.requestLimit ?? null,
          utilisees: quota?.usedThisMonth ?? 0,
        },
        demande: demande && forfait(demande.code) ? demande : null,
      }}
    />
  );
}
