import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ_ITEMS = [
  {
    question: "Combien de temps pour recevoir une proposition ?",
    answer:
      "Le délai dépend de votre formule et de la complexité de la demande. Les membres Premium et VIP bénéficient d'une réponse prioritaire.",
  },
  {
    question: "Puis-je refuser une proposition ?",
    answer:
      "Oui, vous pouvez refuser ou demander une modification. Votre concierge revient vers vous avec de nouvelles options si besoin.",
  },
  {
    question: "Comment se passe le paiement ?",
    answer:
      "Le paiement s'effectue en ligne via Stripe une fois la proposition acceptée. Aucune donnée bancaire n'est stockée sur nos serveurs.",
  },
  {
    question: "Puis-je annuler mon abonnement à tout moment ?",
    answer:
      "Oui, sans engagement. La résiliation prend effet à la fin de la période en cours.",
  },
  {
    question: "Mes données sont-elles protégées ?",
    answer:
      "Vos informations restent confidentielles et ne sont utilisées que pour traiter vos demandes, conformément au RGPD.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="py-20">
      <div className="mx-auto max-w-2xl px-6">
        <h2 className="text-center font-display text-3xl font-medium text-fg">
          Questions fréquentes
        </h2>
        <Accordion type="single" collapsible className="mt-10">
          {FAQ_ITEMS.map((item) => (
            <AccordionItem key={item.question} value={item.question}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
