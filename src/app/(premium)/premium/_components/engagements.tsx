import { HandHeart, ShieldCheck, Undo2 } from "lucide-react";
import { Surtitre } from "@/components/premium/ornements";

/**
 * Remplace l'ancienne section « Ils nous font confiance », restée vide faute
 * de clients réels (jamais de faux avis, voir brief §34). N'affiche que des
 * engagements déjà écrits dans la FAQ. De vrais témoignages viendront
 * s'ajouter ici après les premières missions honorées, avec l'accord de
 * leurs auteurs. Section sur fond ivoire.
 */
const ENGAGEMENTS = [
  {
    icon: Undo2,
    title: "Sans engagement",
    description:
      "Votre abonnement se résilie à tout moment ; la résiliation prend effet à la fin de la période en cours.",
  },
  {
    icon: HandHeart,
    title: "Vous gardez la main",
    description:
      "Refusez une proposition ou demandez une modification : votre concierge revient vers vous avec de nouvelles options.",
  },
  {
    icon: ShieldCheck,
    title: "Données confidentielles",
    description: "Vos informations ne servent qu'à traiter vos demandes, conformément au RGPD.",
  },
];

export function Engagements() {
  return (
    <section className="theme-premium-clair py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-6">
        <div className="apparition flex flex-col gap-5">
          <Surtitre>Nos engagements</Surtitre>
          <h2 className="font-display text-4xl leading-tight text-balance sm:text-5xl">
            Ce que nous vous <em className="text-accent">garantissons.</em>
          </h2>
        </div>
        <ul className="grid gap-12 md:grid-cols-3">
          {ENGAGEMENTS.map((engagement) => (
            <li key={engagement.title} className="apparition flex flex-col gap-4 border-t border-filet pt-7">
              <engagement.icon aria-hidden="true" strokeWidth={1.25} className="h-8 w-8 text-accent" />
              <h3 className="font-display text-2xl">{engagement.title}</h3>
              <p className="leading-relaxed text-fg-muted">{engagement.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
