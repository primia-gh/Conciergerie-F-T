import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Gauge } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/server/auth/session";
import { getClientQuota } from "@/server/subscriptions/quota";
import { RequestWizard } from "./request-wizard";

export const metadata: Metadata = { title: "Nouvelle demande" };

export type CategoryOption = { id: string; name: string; slug: string; icon: string | null };

export default async function NewRequestPage({ searchParams }: PageProps<"/client/requests/new">) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const quota = profile ? await getClientQuota(supabase, profile.id) : null;

  if (quota && !quota.canCreateRequest) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning/10">
          <Gauge aria-hidden="true" className="h-7 w-7 text-warning" strokeWidth={1.5} />
        </span>
        <p className="mt-6 text-xs font-medium tracking-[0.2em] text-warning uppercase">Limite atteinte</p>
        <h1 className="mt-3 font-display text-4xl text-fg">Votre forfait est complet ce mois-ci</h1>
        <p className="mt-4 leading-relaxed text-fg-muted">
          Le forfait {quota.planName} comprend {quota.requestLimit} demande
          {quota.requestLimit && quota.requestLimit > 1 ? "s" : ""} par mois, et vous les avez toutes
          utilisées. Passez à un forfait supérieur pour continuer, ou attendez le mois prochain.
        </p>
        <div className="mt-8 flex flex-col-reverse items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/client/dashboard"
            className="inline-flex min-h-12 items-center px-6 text-sm text-fg-muted transition-colors hover:text-fg"
          >
            Retour à mes demandes
          </Link>
          <Link
            href="/premium#tarifs"
            className="group inline-flex min-h-12 items-center gap-3 bg-accent px-6 text-base font-medium tracking-wide text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg"
          >
            Voir les forfaits
            <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
          </Link>
        </div>
      </div>
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
