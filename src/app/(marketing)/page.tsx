import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/server/auth/session";
import { dashboardPathForRole } from "@/server/auth/guards";
import { MarketingHeader } from "./_components/header";
import { Hero } from "./_components/hero";
import { HowItWorks } from "./_components/how-it-works";
import { Services } from "./_components/services";
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

export default async function MarketingHomePage() {
  // Un utilisateur déjà connecté qui atterrit sur "/" (ex. raccourci PWA,
  // voir manifest.ts) est envoyé directement à son espace plutôt que de
  // revoir la page marketing.
  const profile = await getCurrentProfile();
  if (profile) {
    redirect(dashboardPathForRole(profile.role));
  }

  return (
    <div className="flex flex-1 flex-col">
      <MarketingHeader />
      <main>
        <Hero />
        <HowItWorks />
        <Services />
        <Membership />
        <Testimonials />
        <Faq />
        <CtaBanner />
      </main>
      <MarketingFooter />
    </div>
  );
}
