import { Badge } from "@/components/ui/badge";
import { LienRetour, PAGE, TitreSection, surtitre } from "@/components/espace/en-tete";
import { STATUT_PROPOSITION, libelle } from "@/components/espace/libelles";
import { dateCourte, dateLongue } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { AddOptionForm, type PartnerOption } from "./add-option-form";
import { OptionList, type OptionRow } from "./option-list";
import { SendProposalButton } from "./send-proposal-button";

export type DonneesProposition = {
  requestId: string;
  titreDemande: string | null;
  proposition: { id: string; status: string; created_at: string; sent_at: string | null };
  options: OptionRow[];
  partenaires: PartnerOption[];
};

/** Éditeur d'une proposition (présentation seule : les données viennent de page.tsx). */
export function VueProposition({ d }: { d: DonneesProposition }) {
  const brouillon = d.proposition.status === "draft";
  const s = libelle(STATUT_PROPOSITION, d.proposition.status);

  return (
    <div className={PAGE.large}>
      <LienRetour href={`/concierge/requests/${d.requestId}`}>Retour à la demande</LienRetour>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className={cn(surtitre, "text-accent")}>Proposition du {dateCourte(d.proposition.created_at)}</p>
          <h1 className="mt-3 font-display text-4xl break-words text-fg">{d.titreDemande ?? "Proposition"}</h1>
          <p className="mt-3 text-fg-muted">
            {brouillon
              ? "Ajoutez une ou plusieurs options, puis envoyez-les au client : il choisit celle qui lui convient."
              : `Envoyée le ${dateLongue(d.proposition.sent_at ?? d.proposition.created_at)} : elle ne peut plus être modifiée.`}
          </p>
        </div>
        <Badge variant={s.variante} className="self-start px-3 py-1 text-sm sm:self-auto">
          {s.libelle}
        </Badge>
      </header>

      <div className={cn("mt-10 grid grid-cols-1 gap-10", brouillon && "lg:grid-cols-[1fr_24rem]")}>
        <section aria-labelledby="titre-options" className="min-w-0">
          <TitreSection id="titre-options" compte={d.options.length}>
            {brouillon ? "Ce que verra le client" : "Options envoyées"}
          </TitreSection>
          <div className="mt-5">
            <OptionList options={d.options} requestId={d.requestId} modifiable={brouillon} />
          </div>
        </section>

        {brouillon && (
          <aside className="flex flex-col gap-6" aria-label="Préparer la proposition">
            <div className="rounded-lg border border-accent/60 bg-surface p-5">
              <h2 className="font-display text-xl text-fg">Envoi</h2>
              <p className="mt-2 mb-4 text-sm text-fg-muted">
                {d.options.length === 0
                  ? "Ajoutez au moins une option pour pouvoir envoyer."
                  : "Le client est prévenu et choisit une option dans son espace."}
              </p>
              <SendProposalButton
                proposalId={d.proposition.id}
                requestId={d.requestId}
                disabled={d.options.length === 0}
              />
            </div>
            <div className="rounded-lg border border-border bg-surface p-5">
              <h2 className="mb-4 font-display text-xl text-fg">Ajouter une option</h2>
              <AddOptionForm proposalId={d.proposition.id} partners={d.partenaires} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
