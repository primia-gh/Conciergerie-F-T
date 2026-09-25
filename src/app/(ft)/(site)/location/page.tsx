import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const description =
  "Conciergerie F&T : nous gérons votre logement en location courte durée de A à Z, et nous accueillons chaque voyageur comme un invité.";

export const metadata: Metadata = {
  title: { absolute: "Conciergerie F&T — Location courte durée" },
  description,
  openGraph: { title: "Conciergerie F&T", description, type: "website" },
};

/**
 * Accueil du site public F&T, première version (étape 3a) : l'ouverture de la
 * maquette « Piste 1 — Lin & forêt ». Les autres sections de la maquette
 * (chiffres, services, logements, avis, zones) attendent un contenu réel
 * fourni par le Gérant (étape 3b). Le parcours « Je cherche un séjour » reste
 * caché tant que la réservation directe n'existe pas.
 */
export default function LocationPage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-14 px-4 py-16 sm:px-6 lg:flex-row lg:gap-20 lg:py-24">
      <div className="flex max-w-2xl flex-col gap-7">
        <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">
          Conciergerie de location courte durée
        </p>
        <h1 className="font-display text-4xl leading-[1.05] font-light tracking-tight text-fg sm:text-6xl">
          Votre maison entre de bonnes mains.{" "}
          <em className="text-accent">Votre séjour aussi.</em>
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-fg-muted">
          Nous gérons votre logement de A à Z pour qu&apos;il vous rapporte, et nous accueillons
          chaque voyageur comme un invité.
        </p>
        <Link
          href="/proprietaires"
          className="group flex max-w-md items-center justify-between gap-6 rounded-lg bg-brand p-6 text-brand-fg transition-colors hover:bg-[#e6dccb] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          <span className="flex flex-col gap-1">
            <span className="text-lg font-bold">Je suis propriétaire</span>
            <span className="text-sm opacity-90">Confiez-nous votre logement.</span>
          </span>
          <ArrowRight
            aria-hidden="true"
            className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
          />
        </Link>
      </div>

      {/* Emplacement de la photo d'un vrai logement (maquette), forme d'arche décorative en attendant. */}
      <div
        aria-hidden="true"
        className="hidden aspect-[11/14] w-full max-w-sm shrink-0 rounded-t-[999px] rounded-b-2xl bg-[radial-gradient(ellipse_at_50%_35%,#3a4a3f_0%,#22302a_70%)] ring-1 ring-filet lg:block"
      />
    </section>
  );
}
