import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarCheck, Percent, PhoneCall } from "lucide-react";
import { DONNEES_FT, DonneesStructurees } from "@/components/site/donnees-structurees";

const description =
  "Conciergerie F&T : nous gérons votre logement en location courte durée de A à Z, et nous accueillons chaque voyageur comme un invité.";

export const metadata: Metadata = {
  title: { absolute: "Conciergerie F&T — Location courte durée" },
  description,
  openGraph: { title: "Conciergerie F&T", description, type: "website" },
  alternates: { canonical: "/location" },
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
    <>
      <DonneesStructurees donnees={DONNEES_FT} />
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
              <span className="text-sm opacity-90">Confiez-nous votre logement. Rappel sous 24 h.</span>
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
          className="hidden aspect-[11/14] w-full max-w-sm shrink-0 items-center justify-center rounded-t-[999px] rounded-b-2xl bg-[radial-gradient(ellipse_at_50%_35%,#3a4a3f_0%,#22302a_70%)] ring-1 ring-filet lg:flex"
        >
          <Image src="/brand/cle-ft-clair.svg" alt="" width={120} height={132} className="h-32 w-auto opacity-80" unoptimized />
        </div>
      </section>

      {/* Pour les propriétaires : l'essentiel de l'offre validée (fiche offre, 2026-09-17). */}
      <section className="bg-bg-subtle py-20 sm:py-24">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6">
          <div className="apparition flex max-w-2xl flex-col gap-4">
            <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">Pour les propriétaires</p>
            <h2 className="font-display text-3xl font-light sm:text-5xl">
              Vous percevez les revenus. <em className="text-accent">Nous nous occupons du reste.</em>
            </h2>
          </div>
          <ul className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: CalendarCheck,
                titre: "Une gestion complète",
                texte: "Annonce, prix, voyageurs 24 h/24, ménage, arrivées et départs, maintenance, relevé mensuel.",
              },
              {
                icon: Percent,
                titre: "20 %, sans engagement",
                texte: "Une commission sur les revenus locatifs, résiliable avec un mois de préavis.",
              },
              {
                icon: PhoneCall,
                titre: "Rappel sous 24 h",
                texte: "Laissez vos coordonnées : nous vous rappelons pour parler de votre logement.",
              },
            ].map((item) => (
              <li key={item.titre} className="apparition flex flex-col gap-3 rounded-xl bg-bg p-6 ring-1 ring-border">
                <item.icon aria-hidden="true" strokeWidth={1.5} className="h-7 w-7 text-accent" />
                <h3 className="font-display text-xl">{item.titre}</h3>
                <p className="leading-relaxed text-fg-muted">{item.texte}</p>
              </li>
            ))}
          </ul>
          <div className="apparition flex flex-col gap-5 sm:flex-row sm:items-center">
            <Link
              href="/proprietaires#estimation"
              className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-brand px-8 font-bold text-brand-fg transition-colors hover:bg-[#e6dccb] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              Estimer mes revenus
              <ArrowRight aria-hidden="true" className="h-5 w-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
            </Link>
            <Link href="/proprietaires" className="self-start border-b border-accent pb-1 text-fg transition-colors hover:text-accent sm:self-auto">
              Découvrir toute l&apos;offre
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
