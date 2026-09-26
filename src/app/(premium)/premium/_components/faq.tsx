import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Surtitre } from "@/components/premium/ornements";

const FAQ_ITEMS = [
  {
    question: "Combien de temps pour recevoir une proposition ?",
    answer:
      "Le délai dépend de votre formule et de la complexité de la demande. Les formules Premium, VIP et Private bénéficient d'une réponse prioritaire : leurs demandes passent en tête de la file des concierges.",
  },
  {
    question: "Puis-je refuser une proposition ?",
    answer:
      "Oui, vous pouvez refuser ou demander une modification. Votre concierge revient vers vous avec de nouvelles options si besoin.",
  },
  {
    // Le paiement en ligne n'est pas encore branché (Stripe prévu, voir ROADMAP.md) :
    // ne pas écrire qu'il fonctionne tant que ce n'est pas le cas.
    question: "Comment se passe le paiement ?",
    answer:
      "Le paiement en ligne n'est pas encore ouvert. Il passera par Stripe, un prestataire de paiement sécurisé : aucune donnée bancaire ne sera stockée sur nos serveurs.",
  },
  {
    // Lot D : activation à la main par le Gérant en attendant le paiement en ligne.
    question: "Comment changer de formule ?",
    answer:
      "Depuis votre espace, ouvrez « Ma formule » et choisissez « Demander cette formule ». Votre demande nous est transmise : nous revenons vers vous pour les modalités, puis nous l'activons.",
  },
  {
    question: "Puis-je annuler mon abonnement à tout moment ?",
    answer: "Oui, sans engagement. La résiliation prend effet à la fin de la période en cours.",
  },
  {
    question: "Mes données sont-elles protégées ?",
    answer:
      "Vos informations restent confidentielles et ne sont utilisées que pour traiter vos demandes, conformément au RGPD.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 lg:flex-row lg:gap-20">
        <div className="apparition flex flex-col gap-5 lg:w-96 lg:shrink-0">
          <Surtitre>FAQ</Surtitre>
          <h2 className="font-display text-4xl leading-tight sm:text-5xl">
            Questions <em className="text-accent-hover">fréquentes.</em>
          </h2>
        </div>
        <Accordion type="single" collapsible className="apparition flex-1">
          {FAQ_ITEMS.map((item) => (
            <AccordionItem key={item.question} value={item.question} className="border-filet">
              <AccordionTrigger className="min-h-11 py-6 font-display text-xl font-normal sm:text-2xl [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-accent">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="max-w-2xl pb-6 text-base leading-relaxed">{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
