import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/server/auth/session";
import { getClientQuota } from "@/server/subscriptions/quota";
import type { DemandeForfait } from "@/server/subscriptions/actions";
import { LimiteAtteinte } from "./limite-atteinte";
import { RequestWizard } from "./request-wizard";

export const metadata: Metadata = { title: "Nouvelle demande" };

export type CategoryOption = { id: string; name: string; slug: string; icon: string | null };

export default async function NewRequestPage({ searchParams }: PageProps<"/client/requests/new">) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const quota = profile ? await getClientQuota(supabase, profile.id) : null;

  if (quota && !quota.canCreateRequest) {
    const { data: ligne } = await supabase
      .from("client_profiles")
      .select("preferences")
      .eq("profile_id", profile?.id ?? "")
      .maybeSingle<{ preferences: { demande_forfait?: DemandeForfait } | null }>();
    return (
      <LimiteAtteinte
        code={quota.planCode}
        nom={quota.planName}
        limite={quota.requestLimit}
        demande={ligne?.preferences?.demande_forfait ?? null}
      />
    );
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, icon")
    .eq("active", true)
    .order("name")
    .returns<CategoryOption[]>();

  // ?categorie=restaurant : lien d'une suggestion du tableau de bord.
  const { categorie } = await searchParams;
  const slug = typeof categorie === "string" ? categorie : undefined;
  const categorieInitiale = slug ? categories?.find((c) => c.slug === slug)?.id : undefined;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <RequestWizard categories={categories ?? []} categorieInitiale={categorieInitiale} />
    </div>
  );
}
