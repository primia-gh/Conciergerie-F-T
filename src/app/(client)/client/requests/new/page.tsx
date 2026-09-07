import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/server/auth/session";
import { getClientQuota } from "@/server/subscriptions/quota";
import { Button } from "@/components/ui/button";
import { RequestWizard } from "./request-wizard";

export const metadata: Metadata = { title: "Nouvelle demande" };

export type CategoryOption = { id: string; name: string; slug: string };

export default async function NewRequestPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const quota = profile ? await getClientQuota(supabase, profile.id) : null;

  if (quota && !quota.canCreateRequest) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-warning">
          Limite atteinte
        </p>
        <h1 className="mt-2 font-display text-2xl font-medium text-fg">
          Vous avez atteint votre limite mensuelle
        </h1>
        <p className="mt-3 text-fg-muted">
          Votre forfait {quota.planName} autorise {quota.requestLimit} demande
          {quota.requestLimit && quota.requestLimit > 1 ? "s" : ""} par mois. Passez à un forfait
          supérieur pour continuer à faire appel à votre concierge.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild variant="secondary">
            <Link href="/client/dashboard">Retour au dashboard</Link>
          </Button>
          <Button asChild>
            <Link href="/#tarifs">Voir les forfaits</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("active", true)
    .order("name")
    .returns<CategoryOption[]>();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <RequestWizard categories={categories ?? []} />
    </div>
  );
}
