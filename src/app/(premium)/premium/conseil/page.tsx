import type { Metadata } from "next";
import { getCurrentProfile } from "@/server/auth/session";
import { dashboardPathForRole } from "@/server/auth/guards";
import { Surtitre } from "@/components/premium/ornements";
import { MarketingHeader } from "../_components/header";
import { MarketingFooter } from "../_components/footer";
import { Questionnaire } from "./questionnaire";

const description =
  "Trois questions pour savoir quelle formule de Conciergerie Premium vous correspond : Free, Premium, VIP ou Private.";

export const metadata: Metadata = {
  title: { absolute: "Quelle formule pour moi ? — Conciergerie Premium" },
  description,
  openGraph: { title: "Quelle formule Conciergerie Premium pour moi ?", description, type: "website" },
  alternates: { canonical: "/premium/conseil" },
};

export default async function ConseilPage() {
  const profile = await getCurrentProfile();
  const dashboardHref = profile ? dashboardPathForRole(profile.role) : null;

  return (
    <div className="flex flex-1 flex-col">
      <MarketingHeader dashboardHref={dashboardHref} />
      <main id="contenu" className="grain">
        <div className="mx-auto flex max-w-4xl flex-col gap-12 px-6 py-16 sm:py-20">
          <header className="flex flex-col gap-5">
            <Surtitre>Trois questions</Surtitre>
            <h1 className="font-display text-4xl leading-tight text-balance sm:text-6xl">
              Quelle formule <em className="text-accent-hover">pour vous ?</em>
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-fg-muted">
              Répondez en quelques secondes : nous vous conseillons la formule la plus adaptée. Vous pourrez en
              changer à tout moment.
            </p>
          </header>
          <Questionnaire estClient={profile?.role === "client"} />
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
