import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCurrentProfile } from "@/server/auth/session";
import { dashboardPathForRole } from "@/server/auth/guards";
import { Surtitre } from "@/components/premium/ornements";
import { ComparaisonForfaits } from "@/components/premium/comparaison-forfaits";
import type { Forfait } from "@/lib/forfaits";
import { cn } from "@/lib/utils";
import { MarketingHeader } from "../_components/header";
import { MarketingFooter } from "../_components/footer";

const description =
  "Free, Premium, VIP, Private : comparez les formules de Conciergerie Premium, du service à la demande au concierge dédié. Sans engagement.";

export const metadata: Metadata = {
  title: { absolute: "Comparer les formules — Conciergerie Premium" },
  description,
  openGraph: { title: "Les formules de Conciergerie Premium", description, type: "website" },
  alternates: { canonical: "/premium/forfaits" },
};

const ETAPES = [
  { titre: "Créez votre compte", texte: "Vous commencez avec Free, sans rien payer, pour découvrir le service." },
  {
    titre: "Demandez une formule",
    texte: "Depuis votre espace, choisissez « Demander cette formule » : votre demande nous est transmise.",
  },
  { titre: "Nous l'activons", texte: "Nous revenons vers vous pour les modalités, puis nous activons la formule." },
];

export default async function ForfaitsPage() {
  const profile = await getCurrentProfile();
  const dashboardHref = profile ? dashboardPathForRole(profile.role) : null;
  const estClient = profile?.role === "client";

  const action = (f: Forfait) => (
    <Link
      href={estClient ? "/client/forfait" : "/signup"}
      className={cn(
        "inline-flex min-h-12 w-full items-center justify-center px-4 text-sm font-medium tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg",
        f.recommande ? "bg-accent text-accent-fg hover:bg-accent-hover" : "border border-accent text-fg hover:bg-accent hover:text-accent-fg",
      )}
    >
      {estClient ? "Voir mon forfait" : f.code === "free" ? "Commencer gratuitement" : `Choisir ${f.nom}`}
    </Link>
  );

  return (
    <div className="flex flex-1 flex-col">
      <MarketingHeader dashboardHref={dashboardHref} />
      <main id="contenu" className="grain">
        <section className="mx-auto flex max-w-6xl flex-col gap-6 px-6 pt-16 pb-10 text-center sm:pt-20">
          <Surtitre className="justify-center">Formules</Surtitre>
          <h1 className="font-display text-4xl leading-tight text-balance sm:text-6xl">
            Comparez les formules, <em className="text-accent-hover">en toute clarté.</em>
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-fg-muted">
            Toutes commencent sans engagement. Les tarifs des formules payantes vous sont communiqués sur demande.
          </p>
          <Link
            href="/premium/conseil"
            className="group mx-auto inline-flex min-h-11 items-center gap-2 border-b border-accent pb-1 text-fg transition-colors hover:text-accent-hover"
          >
            Vous hésitez ? Trois questions pour vous orienter
            <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
          </Link>
        </section>

        <section aria-label="Tableau comparatif" className="mx-auto max-w-6xl px-6 pb-20">
          <ComparaisonForfaits actions={action} />
        </section>

        <section aria-labelledby="changer" className="border-t border-border bg-bg-subtle">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 id="changer" className="text-center font-display text-3xl sm:text-4xl">
              Changer de formule, <em className="text-accent-hover">simplement</em>
            </h2>
            <ol className="mt-12 grid gap-8 sm:grid-cols-3">
              {ETAPES.map((e, i) => (
                <li key={e.titre} className="flex flex-col gap-3 border-t border-filet pt-6">
                  <span className="font-display text-4xl text-accent">{i + 1}</span>
                  <h3 className="font-display text-2xl">{e.titre}</h3>
                  <p className="leading-relaxed text-fg-muted">{e.texte}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
