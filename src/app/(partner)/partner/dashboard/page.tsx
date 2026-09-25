import { Handshake } from "lucide-react";
import { getCurrentProfile } from "@/server/auth/session";
import { EtatVide } from "@/components/espace/etat-vide";

export default async function PartnerDashboardPage() {
  const profile = await getCurrentProfile();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-medium tracking-[0.2em] text-accent uppercase">Espace partenaire</p>
      <h1 className="mt-3 font-display text-4xl text-fg">Bonjour {profile?.first_name ?? ""}</h1>
      {/* Non construit : gestion des services et réservations (Phase M13, voir ROADMAP.md). */}
      <EtatVide icone={Handshake} titre="Votre espace est en préparation" className="mt-10">
        La gestion de vos services et de vos réservations arrivera ici dans une prochaine version.
        En attendant, votre contact habituel reste disponible pour toute question.
      </EtatVide>
    </div>
  );
}
