import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/server/auth/session";
import { dashboardPathForRole } from "@/server/auth/guards";
import { MarketingHeader } from "./_components/header";
import { Hero } from "./_components/hero";
import { HowItWorks } from "./_components/how-it-works";
import { Services } from "./_components/services";
import { Selection } from "./_components/selection";
import { Membership } from "./_components/membership";
import { Testimonials } from "./_components/testimonials";
import { Faq } from "./_components/faq";
import { CtaBanner } from "./_components/cta-banner";
import { MarketingFooter } from "./_components/footer";

const description =
  "Conciergerie privée : décrivez votre besoin, un concierge dédié recherche et vous propose des solutions prêtes à valider. Restaurants, voyages, événements et plus.";

export const metadata: Metadata = {
  title: { absolute: "Conciergerie Premium — Votre concierge personnel" },
  description,
  openGraph: {
    title: "Conciergerie Premium",
    description,
    type: "website",
  },
};

export default async function MarketingHomePage({ searchParams }: PageProps<"/">) {
  // Un utilisateur déjà connecté qui atterrit sur "/" (ex. raccourci PWA,
  // voir manifest.ts) est envoyé directement à son espace plutôt que de
  // revoir la page marketing. Exception : le lien "Voir le site" des
  // dashboards ajoute ?from=app pour montrer la page marketing malgré tout.
  const params = await searchParams;
  const profile = await getCurrentProfile();
  if (profile && params.from !== "app") {
    redirect(dashboardPathForRole(profile.role));
  }

  // Un visiteur qui arrive ici via ?from=app est toujours connecté — la page
  // le montre plutôt que de laisser "Se connecter" donner l'impression
  // trompeuse d'une déconnexion (voir ROADMAP.md).
  const dashboardHref = profile ? dashboardPathForRole(profile.role) : null;

  return (
    <div className="flex flex-1 flex-col">
      <MarketingHeader dashboardHref={dashboardHref} />
      <main>
        <Hero dashboardHref={dashboardHref} />
        <HowItWorks />
        <Services />
        <Selection />
        <Membership />
        <Testimonials />
        <Faq />
        <CtaBanner dashboardHref={dashboardHref} />
      </main>
      <MarketingFooter />
    </div>
  );
}
