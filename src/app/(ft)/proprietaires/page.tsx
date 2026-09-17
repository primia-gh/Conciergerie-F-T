import type { Metadata } from "next";
import { ChatWidget } from "./_components/chat-widget";

const description =
  "Conciergerie F&T gère votre location courte durée de bout en bout : annonce, tarifs, voyageurs, ménage et suivi mensuel. Discutez avec notre assistant pour un premier échange.";

export const metadata: Metadata = {
  title: { absolute: "Conciergerie F&T — Gestion locative courte durée" },
  description,
};

export default function ProprietairesPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-10 px-6 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="text-sm font-medium tracking-wide text-accent uppercase">
          Conciergerie F&amp;T
        </span>
        <h1 className="text-3xl font-semibold text-fg sm:text-4xl">
          Votre bien géré de bout en bout, sans y passer vos soirées.
        </h1>
        <p className="max-w-xl text-fg-muted">
          Annonce, tarifs, voyageurs, ménage, suivi des revenus : décrivez votre bien à notre
          assistant, il répond à vos questions et vous propose un rendez-vous si ça correspond.
        </p>
      </div>
      <ChatWidget />
    </div>
  );
}
