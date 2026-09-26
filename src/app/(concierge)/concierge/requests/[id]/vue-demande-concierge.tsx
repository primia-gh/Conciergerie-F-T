import Link from "next/link";
import { ChevronRight, FileText, Lock, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AttachmentsCard,
  HistoryCard,
  RequestDetailCard,
  type AttachmentLink,
  type HistoryRow,
  type RequestDetailFields,
} from "@/components/features/request-detail-card";
import {
  MessageThread,
  type ThreadMessage,
} from "@/components/features/message-thread";
import {
  BookingCard,
  type BookingInfo,
} from "@/components/features/booking-card";
import {
  LienRetour,
  PAGE,
  TitreSection,
  carteLien,
  surtitre,
} from "@/components/espace/en-tete";
import { IconeCategorie } from "@/components/espace/icones-categories";
import { STATUT_PROPOSITION, libelle } from "@/components/espace/libelles";
import { SuiviDetaille } from "@/components/espace/suivi-demande";
import { dateCourte, dateLongue } from "@/lib/dates";
import {
  requestStatusBadgeVariant,
  requestStatusLabel,
} from "@/server/requests/status-labels";
import { cn } from "@/lib/utils";
import { AssignButton } from "./assign-button";
import { InternalNotes, type NoteRow } from "./internal-notes";
import { StartProposalButton } from "./start-proposal-button";

const STARTABLE_STATUSES = new Set([
  "ASSIGNED",
  "IN_PROGRESS",
  "RESEARCHING",
  "REJECTED",
]);

export type DonneesDemandeConcierge = {
  demande: RequestDetailFields & {
    id: string;
    title: string;
    status: string;
    created_at: string;
    categorie: string | null;
    icone: string | null;
    concierge_id: string | null;
  };
  client: { prenom: string | null; nom: string | null } | null;
  historique: HistoryRow[];
  piecesJointes: AttachmentLink[];
  notes: NoteRow[];
  messages: ThreadMessage[];
  propositions: { id: string; status: string; created_at: string }[];
  reservation: BookingInfo | null;
  moi: string | null;
};

/** Une demande vue par le concierge (présentation seule : les données viennent de page.tsx). */
export function VueDemandeConcierge({ d }: { d: DonneesDemandeConcierge }) {
  const r = d.demande;
  const peutPrendre = r.status === "NEW" && r.concierge_id === null;
  const aMoi = !!d.moi && r.concierge_id === d.moi;
  const nomClient = d.client
    ? [d.client.prenom, d.client.nom].filter(Boolean).join(" ")
    : "";

  return (
    <div className={PAGE.large}>
      <LienRetour href="/concierge/dashboard">Demandes</LienRetour>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className={cn(surtitre, "flex items-center gap-2 text-accent")}>
            <IconeCategorie nom={r.icone} className="h-4 w-4" />
            {r.categorie ?? "Demande"}
          </p>
          <h1 className="mt-3 font-display text-4xl break-words text-fg sm:text-5xl">
            {r.title}
          </h1>
          <p className="mt-3 text-sm text-fg-muted">
            Reçue le {dateLongue(r.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <Badge
            variant={requestStatusBadgeVariant(r.status)}
            className="px-3 py-1 text-sm"
          >
            {requestStatusLabel(r.status, true)}
          </Badge>
          {peutPrendre && <AssignButton requestId={r.id} />}
        </div>
      </header>

      <section
        aria-label="Suivi de la demande"
        className="mt-8 rounded-lg border border-border bg-surface px-4 py-6 sm:px-8"
      >
        <SuiviDetaille status={r.status} />
      </section>

      {peutPrendre && (
        <p className="mt-6 rounded-lg border border-accent/60 bg-surface px-5 py-4 text-sm text-fg">
          Cette demande n&apos;est suivie par personne.{" "}
          <span className="text-fg-muted">
            Prenez-la en charge pour échanger avec le client et lui faire des
            propositions.
          </span>
        </p>
      )}
      {!peutPrendre && !aMoi && (
        <p className="mt-6 rounded-lg border border-border bg-surface px-5 py-4 text-sm text-fg-muted">
          Cette demande est suivie par un autre concierge : vous la voyez en
          lecture seule.
        </p>
      )}

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-12 lg:col-span-2">
          {d.reservation && (
            <BookingCard
              booking={d.reservation}
              requestId={r.id}
              canManage={aMoi}
              className=""
            />
          )}

          {aMoi && (
            <section aria-labelledby="titre-propositions">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <TitreSection
                  id="titre-propositions"
                  compte={d.propositions.length}
                >
                  Propositions
                </TitreSection>
                {STARTABLE_STATUSES.has(r.status) && (
                  <StartProposalButton
                    requestId={r.id}
                    label={
                      r.status === "REJECTED"
                        ? "Faire une nouvelle proposition"
                        : "Créer une proposition"
                    }
                  />
                )}
              </div>
              {d.propositions.length === 0 ? (
                <p className="mt-4 rounded-lg border border-dashed border-border px-5 py-6 text-sm text-fg-muted">
                  Aucune proposition pour l&apos;instant. Créez-en une : vous y
                  ajoutez une ou plusieurs options, puis vous l&apos;envoyez au
                  client, qui choisit.
                </p>
              ) : (
                <ul className="mt-4 flex flex-col gap-3">
                  {d.propositions.map((p) => {
                    const s = libelle(STATUT_PROPOSITION, p.status);
                    return (
                      <li key={p.id}>
                        <Link
                          href={`/concierge/requests/${r.id}/proposals/${p.id}`}
                          className={carteLien}
                        >
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                            <FileText
                              aria-hidden="true"
                              className="h-5 w-5"
                              strokeWidth={1.5}
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium text-fg">
                              Proposition du {dateCourte(p.created_at)}
                            </span>
                            <span className="mt-1 block text-sm text-fg-muted">
                              {p.status === "draft"
                                ? "À compléter puis envoyer"
                                : "Voir les options envoyées"}
                            </span>
                          </span>
                          <Badge variant={s.variante}>{s.libelle}</Badge>
                          <ChevronRight
                            aria-hidden="true"
                            className="h-5 w-5 shrink-0 text-fg-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent motion-reduce:transition-none"
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}

          {aMoi && d.moi && (
            <section aria-labelledby="titre-messages">
              <TitreSection id="titre-messages">
                Messages avec le client
              </TitreSection>
              <div className="mt-5">
                <MessageThread
                  requestId={r.id}
                  currentUserId={d.moi}
                  initialMessages={d.messages}
                  interlocuteur={d.client?.prenom ?? "Le client"}
                />
              </div>
            </section>
          )}

          {aMoi && (
            <section aria-labelledby="titre-notes">
              <TitreSection id="titre-notes" className="gap-2">
                <Lock aria-hidden="true" className="h-3.5 w-3.5" />
                Notes internes
              </TitreSection>
              <p className="mt-2 text-sm text-fg-muted">
                Visibles de vous et du Gérant, jamais du client.
              </p>
              <div className="mt-4">
                <InternalNotes requestId={r.id} notes={d.notes} />
              </div>
            </section>
          )}
        </div>

        <aside
          className="flex flex-col gap-5"
          aria-label="Détails de la demande"
        >
          <div className="flex items-center gap-4 rounded-lg border border-border bg-surface p-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/15 font-display text-xl text-accent">
              {nomClient ? (
                nomClient[0].toUpperCase()
              ) : (
                <UserRound
                  aria-hidden="true"
                  className="h-5 w-5"
                  strokeWidth={1.5}
                />
              )}
            </span>
            <div>
              <p className="text-xs text-fg-muted">Client</p>
              <p className="mt-0.5 text-fg">
                {nomClient || "Visible après la prise en charge"}
              </p>
            </div>
          </div>
          <RequestDetailCard request={r} className="" />
          <AttachmentsCard attachments={d.piecesJointes} className="" />
          <HistoryCard history={d.historique} className="" pourEquipe />
        </aside>
      </div>
    </div>
  );
}
