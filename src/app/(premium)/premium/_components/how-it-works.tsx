import { CheckCircle2, ListChecks, MessageSquarePlus, Search } from "lucide-react";
import { Surtitre } from "@/components/premium/ornements";

const STEPS = [
  {
    numero: "I",
    icon: MessageSquarePlus,
    title: "Vous exprimez un besoin",
    description: "En quelques étapes simples : catégorie, description, date, budget.",
  },
  {
    numero: "II",
    icon: Search,
    title: "Votre concierge recherche",
    description: "Il identifie, compare et contacte les meilleures options pour vous.",
  },
  {
    numero: "III",
    icon: ListChecks,
    title: "Nous vous proposons",
    description: "Une ou plusieurs solutions concrètes, avec prix et détails complets.",
  },
  {
    numero: "IV",
    icon: CheckCircle2,
    title: "Vous validez",
    description: "Un clic suffit pour accepter. La réservation se fait sans vous.",
  },
];

export function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="scroll-mt-20 bg-bg-subtle py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-6">
        <div className="apparition flex flex-col gap-5">
          <Surtitre>Comment ça marche</Surtitre>
          <h2 className="font-display text-4xl leading-tight text-balance sm:text-5xl">
            Du besoin exprimé à la <em className="text-accent-hover">réservation confirmée.</em>
          </h2>
        </div>
        <ol className="relative grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <span aria-hidden="true" className="absolute top-[34px] right-0 left-0 hidden h-px bg-filet lg:block" />
          {STEPS.map((step) => (
            <li key={step.numero} className="apparition relative flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <span
                  aria-hidden="true"
                  className="flex h-[68px] w-[68px] items-center justify-center rounded-full border border-accent bg-bg-subtle font-display text-2xl text-accent-hover italic"
                >
                  {step.numero}
                </span>
                <step.icon aria-hidden="true" strokeWidth={1.25} className="h-7 w-7 text-accent" />
              </div>
              <h3 className="font-display text-2xl">
                <span className="sr-only">Étape {step.numero} : </span>
                {step.title}
              </h3>
              <p className="leading-relaxed text-fg-muted">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
