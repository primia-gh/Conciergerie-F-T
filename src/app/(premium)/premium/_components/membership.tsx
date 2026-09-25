import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Surtitre } from "./ornements";

/**
 * Reflète les plans définis dans src/server/db/seed.sql (Phase M1).
 * Garder les prix synchronisés avec la table `plans` jusqu'à l'intégration
 * Stripe Billing (Phase M14). Prix encore provisoires (voir seed.sql).
 */
const PLANS = [
  {
    code: "free",
    name: "Free",
    price: "0€",
    period: "/mois",
    description: "Découverte du service, demandes ponctuelles.",
    features: ["2 demandes par mois", "Réponse sous 48h"],
    highlighted: false,
  },
  {
    code: "premium",
    name: "Premium",
    price: "49€",
    period: "/mois",
    description: "Accès prioritaire, volume de demandes plus élevé.",
    features: ["10 demandes par mois", "Réponse prioritaire", "Historique complet"],
    highlighted: true,
  },
  {
    code: "vip",
    name: "VIP",
    price: "149€",
    period: "/mois",
    description: "Concierge dédié, demandes illimitées.",
    features: ["Demandes illimitées", "Concierge dédié", "Réponse sous 4h"],
    highlighted: false,
  },
  {
    code: "private",
    name: "Private",
    price: "499€",
    period: "/mois",
    description: "Service sur-mesure, disponibilité étendue.",
    features: ["Tout VIP inclus", "Disponibilité étendue", "Avantages partenaires exclusifs"],
    highlighted: false,
  },
];

export function Membership() {
  return (
    <section id="tarifs" className="grain scroll-mt-20 py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-6">
        <div className="apparition flex flex-col items-center gap-5 text-center">
          <Surtitre>Formules</Surtitre>
          <h2 className="font-display text-4xl leading-tight text-balance sm:text-5xl">
            Le niveau d&apos;accompagnement <em className="text-accent-hover">qui vous ressemble.</em>
          </h2>
          <p className="text-lg text-fg-muted">Choisissez le niveau d&apos;accompagnement adapté à votre rythme.</p>
        </div>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <li
              key={plan.code}
              className={cn(
                "apparition flex flex-col gap-6 border px-7 py-9",
                plan.highlighted ? "border-accent bg-surface-raised" : "border-border bg-surface",
              )}
            >
              <h3 className={cn("font-display text-3xl italic", plan.highlighted && "text-accent-hover")}>{plan.name}</h3>
              <p className="flex items-baseline gap-1.5">
                <span className="font-display text-5xl">{plan.price}</span>
                <span className="text-sm text-fg-muted">{plan.period}</span>
              </p>
              <p className="min-h-12 leading-relaxed text-fg-muted">{plan.description}</p>
              <span aria-hidden="true" className="h-px bg-filet" />
              <ul className="flex flex-1 flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check aria-hidden="true" strokeWidth={1.5} className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={cn(
                  "inline-flex min-h-12 items-center justify-center text-sm font-medium tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg",
                  plan.highlighted
                    ? "bg-accent text-accent-fg hover:bg-accent-hover"
                    : "border border-accent text-fg hover:bg-accent hover:text-accent-fg",
                )}
              >
                Choisir {plan.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
