import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowRight,
  Camera,
  Check,
  FileText,
  KeyRound,
  Megaphone,
  MessagesSquare,
  Receipt,
  Sofa,
  Sparkles,
  TrendingUp,
  Wrench,
  X,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { chatProspectionActif } from "@/lib/agent/flags";
import { DONNEES_FT, DonneesStructurees } from "@/components/site/donnees-structurees";
import { ChatWidget } from "./_components/chat-widget";
import { FormulaireEstimation } from "./_components/formulaire-estimation";

const description =
  "Conciergerie F&T gère votre logement en location courte durée dans le Grand Est : annonce, prix, voyageurs, ménage, suivi mensuel. Commission de 20 %, sans engagement. Rappel sous 24 h.";

export const metadata: Metadata = {
  title: { absolute: "Propriétaires — Conciergerie F&T, gestion locative courte durée" },
  description,
  openGraph: { title: "Confiez votre logement à Conciergerie F&T", description, type: "website" },
  alternates: { canonical: "/proprietaires" },
};

/*
 * Contenu tiré mot pour mot, ou presque, de la fiche offre F&T validée par le
 * Gérant (2026-09-17, migration 0019, modifiable dans /admin/fiches) ; sa
 * publication a été autorisée le 2026-09-25, ainsi que le « rappel sous
 * 24 h ». Si la fiche change, mettre cette page à jour en même temps.
 */
const EN_BREF = [
  { valeur: "20 %", texte: "de commission sur les revenus locatifs" },
  { valeur: "Sans engagement", texte: "résiliable avec un mois de préavis" },
  { valeur: "24 h", texte: "pour vous rappeler après votre demande" },
  { valeur: "Grand Est", texte: "secteur couvert aujourd'hui" },
];

const SERVICES = [
  { icon: Megaphone, titre: "Annonce", texte: "Création et optimisation de l'annonce sur Airbnb et Booking." },
  { icon: TrendingUp, titre: "Prix", texte: "Fixation et ajustement des prix selon la saison, la demande et les événements locaux." },
  { icon: MessagesSquare, titre: "Voyageurs", texte: "Communication avec les voyageurs, 24 h/24." },
  { icon: Sparkles, titre: "Ménage", texte: "Coordination du ménage entre chaque séjour." },
  { icon: KeyRound, titre: "Arrivées et départs", texte: "Gestion des arrivées et des départs des voyageurs." },
  { icon: Wrench, titre: "Maintenance", texte: "Suivi de la maintenance du logement." },
  { icon: FileText, titre: "Relevé mensuel", texte: "Relevé mensuel de vos revenus et dépenses." },
];

const OPTIONS = [
  { icon: Camera, texte: "Photographie professionnelle du logement" },
  { icon: Sofa, texte: "Home staging avant la mise en location" },
  { icon: Receipt, texte: "Gestion de la taxe de séjour" },
];

const ETAPES = [
  { titre: "Visite et estimation", texte: "Nous visitons votre logement et estimons ses revenus potentiels." },
  { titre: "Mandat de gestion", texte: "Nous signons ensemble le mandat de gestion." },
  { titre: "Préparation", texte: "Nous créons l'annonce et les fiches du logement : accès, équipements, règles." },
  { titre: "Mise en ligne", texte: "Le logement est en ligne, jusqu'à la première réservation." },
  { titre: "Suivi mensuel", texte: "Chaque mois, vous recevez le relevé de vos revenus et dépenses." },
];

const NE_FAIT_PAS = [
  "Fixer un prix sans plafond validé par vous.",
  "Manipuler vos données bancaires : les paiements passent par un prestataire sécurisé.",
  "Intervenir sur le juridique ou le fiscal : nous vous orientons vers un professionnel.",
];

const FAQ = [
  {
    q: "Combien coûte la gestion de mon logement ?",
    r: "Une commission de 20 % sur les revenus locatifs. Les options (photographie professionnelle, home staging, gestion de la taxe de séjour) sont sur devis, au cas par cas.",
  },
  { q: "Suis-je engagé sur la durée ?", r: "Non. Le mandat est sans engagement, résiliable à tout moment avec un préavis d'un mois." },
  {
    q: "Quels logements acceptez-vous ?",
    r: "Les appartements et maisons meublés, éligibles à la location courte durée dans leur commune, sans surface minimale imposée.",
  },
  {
    q: "Comment sont fixés les prix ?",
    r: "Ils sont ajustés selon la saison, la demande et les événements locaux, sans jamais dépasser le plafond que vous avez validé.",
  },
  {
    q: "Et si un voyageur cause un dégât ?",
    r: "Il est couvert par la caution demandée au voyageur. Nous le déclarons et en assurons le suivi.",
  },
  {
    q: "Puis-je récupérer mon logement pour mes vacances ?",
    r: "Oui, sur demande, avec un délai de prévenance : les dates sont alors bloquées dans le calendrier.",
  },
  {
    q: "Où intervenez-vous ?",
    r: "Dans le Grand Est. Une extension à toute la France est prévue, sans date fixée pour l'instant.",
  },
];

const surtitre = "text-xs font-semibold tracking-[0.2em] text-accent uppercase";

export default function ProprietairesPage() {
  return (
    <>
      <DonneesStructurees donnees={DONNEES_FT} />

      {/* Ouverture */}
      <section className="grain relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(58,74,63,0.7),transparent_60%)]"
        />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-14 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:gap-16 lg:py-24">
          <div className="flex max-w-2xl flex-col gap-7">
            <p className={surtitre}>Propriétaires · Grand Est</p>
            <h1 className="font-display text-4xl leading-[1.05] font-light tracking-tight text-balance sm:text-6xl">
              Votre bien géré de bout en bout, <em className="text-accent">sans y passer vos soirées.</em>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-fg-muted">
              Annonce, prix, voyageurs, ménage, suivi des revenus : nous nous occupons de tout, vous suivez vos
              résultats chaque mois.
            </p>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <a
                href="#estimation"
                className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-brand px-8 font-bold text-brand-fg transition-colors hover:bg-[#e6dccb] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              >
                Estimer mes revenus
                <ArrowRight aria-hidden="true" className="h-5 w-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
              </a>
              <a href="#deroule" className="self-start border-b border-accent pb-1 text-fg transition-colors hover:text-accent sm:self-auto">
                Voir comment ça se passe
              </a>
            </div>
          </div>

          <aside aria-label="En bref" className="w-full shrink-0 rounded-2xl bg-surface p-7 ring-1 ring-filet lg:w-96">
            <div className="flex items-center gap-4 border-b border-border pb-5">
              <Image src="/brand/cle-ft-clair.svg" alt="" width={40} height={44} className="h-11 w-auto" unoptimized />
              <p className="font-display text-xl">En bref</p>
            </div>
            <dl className="mt-2 divide-y divide-border">
              {EN_BREF.map((item) => (
                <div key={item.valeur} className="flex flex-col gap-0.5 py-4">
                  <dt className="font-display text-2xl text-accent">{item.valeur}</dt>
                  <dd className="text-sm text-fg-muted">{item.texte}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </section>

      {/* Services inclus */}
      <section className="bg-bg-subtle py-20 sm:py-24">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6">
          <div className="apparition flex max-w-2xl flex-col gap-4">
            <p className={surtitre}>Ce qui est inclus</p>
            <h2 className="font-display text-3xl font-light sm:text-5xl">
              Une gestion complète, <em className="text-accent">du premier clic au relevé mensuel.</em>
            </h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <li key={service.titre} className="apparition flex gap-4 rounded-xl bg-bg p-6 ring-1 ring-border">
                <service.icon aria-hidden="true" strokeWidth={1.5} className="mt-0.5 h-6 w-6 shrink-0 text-accent" />
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-display text-xl">{service.titre}</h3>
                  <p className="leading-relaxed text-fg-muted">{service.texte}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="apparition flex flex-col gap-4 rounded-xl p-6 ring-1 ring-filet sm:flex-row sm:items-center sm:gap-8">
            <p className="font-display text-lg text-accent">En option, sur devis</p>
            <ul className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-8">
              {OPTIONS.map((option) => (
                <li key={option.texte} className="flex items-center gap-2.5 text-fg-muted">
                  <option.icon aria-hidden="true" strokeWidth={1.5} className="h-5 w-5 text-accent" />
                  {option.texte}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Déroulé */}
      <section id="deroule" className="scroll-mt-8 py-20 sm:py-24">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6">
          <div className="apparition flex max-w-2xl flex-col gap-4">
            <p className={surtitre}>Comment ça se passe</p>
            <h2 className="font-display text-3xl font-light sm:text-5xl">
              Cinq étapes, <em className="text-accent">de la visite au premier relevé.</em>
            </h2>
          </div>
          <ol className="grid gap-8 md:grid-cols-5 md:gap-6">
            {ETAPES.map((etape, i) => (
              <li key={etape.titre} className="apparition relative flex flex-col gap-3 md:pt-2">
                <span className="font-display text-5xl font-light text-accent italic" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="font-display text-xl">
                  <span className="sr-only">Étape {i + 1} : </span>
                  {etape.titre}
                </h3>
                <p className="leading-relaxed text-fg-muted">{etape.texte}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Biens acceptés / ce que F&T ne fait pas */}
      <section className="bg-bg-subtle py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 md:grid-cols-2">
          <div className="apparition flex flex-col gap-5 rounded-xl bg-bg p-7 ring-1 ring-border">
            <h2 className="font-display text-2xl">Les logements que nous gérons</h2>
            <ul className="flex flex-col gap-3 text-fg-muted">
              {[
                "Appartements et maisons meublés.",
                "Éligibles à la location courte durée dans leur commune.",
                "Sans surface minimale imposée.",
                "Dans le Grand Est pour l'instant.",
              ].map((texte) => (
                <li key={texte} className="flex items-start gap-3">
                  <Check aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  {texte}
                </li>
              ))}
            </ul>
          </div>
          <div className="apparition flex flex-col gap-5 rounded-xl bg-bg p-7 ring-1 ring-border">
            <h2 className="font-display text-2xl">Ce que nous ne faisons pas</h2>
            <ul className="flex flex-col gap-3 text-fg-muted">
              {NE_FAIT_PAS.map((texte) => (
                <li key={texte} className="flex items-start gap-3">
                  <X aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-fg-faint" />
                  {texte}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Questions fréquentes */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:flex-row lg:gap-20">
          <div className="apparition flex flex-col gap-4 lg:w-80 lg:shrink-0">
            <p className={surtitre}>Questions fréquentes</p>
            <h2 className="font-display text-3xl font-light sm:text-5xl">
              Vos questions, <em className="text-accent">nos réponses.</em>
            </h2>
          </div>
          <Accordion type="single" collapsible className="apparition flex-1">
            {FAQ.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger className="min-h-11 py-5 font-display text-lg font-normal sm:text-xl [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-accent">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="max-w-2xl pb-5 text-base leading-relaxed">{item.r}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Estimation */}
      <section id="estimation" className="scroll-mt-8 bg-bg-subtle py-20 sm:py-24">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:flex-row lg:gap-16">
          <div className="flex flex-col gap-5 lg:w-96 lg:shrink-0">
            <p className={surtitre}>Estimer mes revenus</p>
            <h2 className="font-display text-3xl font-light sm:text-5xl">
              Parlons de <em className="text-accent">votre logement.</em>
            </h2>
            <p className="text-lg leading-relaxed text-fg-muted">
              Laissez-nous vos coordonnées : nous vous rappelons sous 24 h pour en parler et convenir d&apos;une
              visite, point de départ de l&apos;estimation.
            </p>
            <ul className="flex flex-col gap-3 text-fg-muted">
              {["Rappel sous 24 h", "Votre demande ne vous engage à rien", "Vos informations ne servent qu'à vous recontacter"].map(
                (texte) => (
                  <li key={texte} className="flex items-center gap-3">
                    <Check aria-hidden="true" className="h-5 w-5 shrink-0 text-accent" />
                    {texte}
                  </li>
                ),
              )}
            </ul>
          </div>
          <div className="flex-1">
            <FormulaireEstimation />
          </div>
        </div>
      </section>

      {chatProspectionActif() && (
        <section className="py-20">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 text-center sm:px-6">
            <h2 className="font-display text-3xl font-light">Une question avant de nous appeler ?</h2>
            <p className="text-fg-muted">Notre assistant répond à partir de notre offre, et nous transmet le reste.</p>
            <ChatWidget />
          </div>
        </section>
      )}

      {/* Barre d'action fixe sur mobile : l'estimation reste à portée de pouce. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 p-3 backdrop-blur sm:hidden">
        <a
          href="#estimation"
          className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand font-bold text-brand-fg"
        >
          Estimer mes revenus
          <ArrowRight aria-hidden="true" className="h-5 w-5" />
        </a>
      </div>
      <div aria-hidden="true" className="h-20 sm:hidden" />
    </>
  );
}
