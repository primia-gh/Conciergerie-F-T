import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Reflète les plans définis dans src/server/db/seed.sql (Phase M1).
 * Garder les prix synchronisés avec la table `plans` jusqu'à l'intégration
 * Stripe Billing (Phase M14).
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
    <section id="tarifs" className="border-t border-border bg-bg-subtle/50 py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl font-medium text-fg">Membership</h2>
          <p className="mt-3 text-fg-muted">
            Choisissez le niveau d&apos;accompagnement adapté à votre rythme.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <Card
              key={plan.code}
              className={cn("flex flex-col", plan.highlighted && "border-accent ring-1 ring-accent")}
            >
              <CardHeader>
                <p className="font-display text-lg font-medium text-fg">{plan.name}</p>
                <p className="text-2xl font-medium text-fg">
                  {plan.price}
                  <span className="text-sm font-normal text-fg-muted">{plan.period}</span>
                </p>
                <p className="text-sm text-fg-muted">{plan.description}</p>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="flex flex-col gap-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-fg">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button asChild variant={plan.highlighted ? "primary" : "secondary"} className="w-full">
                  <Link href="/signup">Choisir {plan.name}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
