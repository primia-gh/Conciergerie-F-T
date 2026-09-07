import { MessageSquarePlus, Search, ListChecks, CheckCircle2 } from "lucide-react";

const STEPS = [
  {
    icon: MessageSquarePlus,
    title: "Vous exprimez un besoin",
    description: "En quelques étapes simples : catégorie, description, date, budget.",
  },
  {
    icon: Search,
    title: "Votre concierge recherche",
    description: "Il identifie, compare et contacte les meilleures options pour vous.",
  },
  {
    icon: ListChecks,
    title: "Nous vous proposons",
    description: "Une ou plusieurs solutions concrètes, avec prix et détails complets.",
  },
  {
    icon: CheckCircle2,
    title: "Vous validez",
    description: "Un clic suffit pour accepter. La réservation se fait sans vous.",
  },
];

export function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="border-t border-border bg-bg-subtle/50 py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl font-medium text-fg">Comment ça marche</h2>
          <p className="mt-3 text-fg-muted">
            Quatre étapes, du besoin exprimé à la réservation confirmée.
          </p>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <div key={step.title} className="flex flex-col items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                <step.icon className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-fg-muted">Étape {index + 1}</p>
              <h3 className="font-display text-lg font-medium text-fg">{step.title}</h3>
              <p className="text-sm text-fg-muted">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
