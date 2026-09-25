import type { Metadata } from "next";
import { getCurrentProfile } from "@/server/auth/session";
import { dashboardPathForRole } from "@/server/auth/guards";
import { MarketingHeader } from "./_components/header";
import { Hero } from "./_components/hero";
import { HowItWorks } from "./_components/how-it-works";
import { Services } from "./_components/services";
import { Selection } from "./_components/selection";
import { Membership } from "./_components/membership";
import { Engagements } from "./_components/engagements";
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

export default async function PremiumPage() {
  // Accueil Premium, déplacé de "/" vers "/premium" (étape 3a) : la redirection
  // d'un utilisateur connecté vers son espace est restée sur "/" (page de
  // choix). Ici, un visiteur connecté voit la page, avec « Mon espace » à la
  // place de « Se connecter » pour ne pas croire à une déconnexion.
  const profile = await getCurrentProfile();
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
        <Engagements />
        <Faq />
        <CtaBanner dashboardHref={dashboardHref} />
      </main>
      <MarketingFooter />
    </div>
  );
}
