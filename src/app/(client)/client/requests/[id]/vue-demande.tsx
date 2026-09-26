import Link from "next/link";
import { ArrowDown, ArrowLeft, MessageCircle, Sparkles, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AttachmentsCard,
  HistoryCard,
  RequestDetailCard,
  type AttachmentLink,
  type HistoryRow,
  type RequestDetailFields,
} from "@/components/features/request-detail-card";
import { MessageThread, type ThreadMessage } from "@/components/features/message-thread";
import { BookingCard, type BookingInfo } from "@/components/features/booking-card";
import { IconeCategorie } from "@/components/espace/icones-categories";
import { SuiviDetaille } from "@/components/espace/suivi-demande";
import { dateCourte, dateLongue } from "@/lib/dates";
import {
  attenteReponseClient,
  demandePrioritaire,
  requestStatusBadgeVariant,
  requestStatusLabel,
} from "@/server/requests/status-labels";
import { ProposalComparison, type OptionForComparison } from "./proposal-comparison";

export type DonneesDemande = {
  demande: RequestDetailFields & {
    id: string;
    title: string;
    status: string;
    created_at: string;
    categorie: string | null;
    icone: string | null;
  };
  concierge: { prenom: string | null; nom: string | null } | null;
  historique: HistoryRow[];
  piecesJointes: AttachmentLink[];
  propositions: { id: string; status: string; created_at: string; options: OptionForComparison[] }[];
  reservation: BookingInfo | null;
  messages: ThreadMessage[];
  /** Identifiant du client connecté (sens des bulles de messages). */
  moi: string | null;
};

const surtitre = "text-xs font-medium tracking-[0.2em] uppercase";

/** Suivi d'une demande côté client (présentation seule : les données viennent de page.tsx). */
export function VueDemande({ d }: { d: DonneesDemande }) {
  const r = d.demande;
  const attente = attenteReponseClient(r.status);
  const nomConcierge = d.concierge ? [d.concierge.prenom, d.concierge.nom].filter(Boolean).join(" ") : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/client/dashboard"
        className="group inline-flex min-h-11 items-center gap-2 text-sm text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none" />
        Mes demandes
      </Link>

      <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className={`${surtitre} flex items-center gap-2 text-accent`}>
            <IconeCategorie nom={r.icone} className="h-4 w-4" />
            {r.categorie ?? "Demande"}
          </p>
          <h1 className="mt-3 font-display text-4xl break-words text-fg sm:text-5xl">{r.title}</h1>
          <p className="mt-3 text-sm text-fg-muted">Demandée le {dateLongue(r.created_at)}</p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Badge variant={requestStatusBadgeVariant(r.status)} className="px-3 py-1 text-sm">
            {requestStatusLabel(r.status)}
          </Badge>
          {demandePrioritaire(r.priority) && (
            <span className="inline-flex items-center gap-1.5 text-xs text-accent">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.5} />
              Traitement prioritaire, grâce à votre formule
            </span>
          )}
        </div>
      </header>

      <section aria-label="Suivi de la demande" className="mt-8 rounded-lg border border-border bg-surface px-4 py-6 sm:px-8">
        <SuiviDetaille status={r.status} />
      </section>

      {attente && d.propositions.length > 0 && (
        <a
          href="#propositions"
          className="group mt-6 flex items-center justify-between gap-4 rounded-lg border border-accent/60 bg-surface px-5 py-4 text-fg transition-colors hover:bg-surface-raised"
        >
          <span>
            <span className="font-medium">Votre concierge vous a fait une proposition.</span>{" "}
            <span className="text-fg-muted">Choisissez l&apos;option qui vous convient.</span>
          </span>
          <ArrowDown aria-hidden="true" className="h-5 w-5 shrink-0 text-accent transition-transform group-hover:translate-y-0.5 motion-reduce:transition-none" />
        </a>
      )}

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-12 lg:col-span-2">
          {d.reservation && <BookingCard booking={d.reservation} requestId={r.id} canManage={false} className="" />}

          {d.propositions.length > 0 && (
            <section id="propositions" aria-labelledby="titre-propositions" className="scroll-mt-24">
              <h2 id="titre-propositions" className={`${surtitre} text-fg-muted`}>
                Propositions de votre concierge
              </h2>
              <div className="mt-5 flex flex-col gap-10">
                {d.propositions.map((p) => (
                  <ProposalComparison
                    key={p.id}
                    proposalId={p.id}
                    requestId={r.id}
                    status={p.status}
                    options={p.options}
                    envoyeeLe={dateCourte(p.created_at)}
                  />
                ))}
              </div>
            </section>
          )}

          <section id="messages" aria-labelledby="titre-messages" className="scroll-mt-24">
            <h2 id="titre-messages" className={`${surtitre} text-fg-muted`}>
              Messages
            </h2>
            <div className="mt-5">
              {d.concierge && d.moi ? (
                <MessageThread
                  requestId={r.id}
                  currentUserId={d.moi}
                  initialMessages={d.messages}
                  interlocuteur={d.concierge.prenom ?? "Votre concierge"}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-6 py-10 text-center">
                  <MessageCircle aria-hidden="true" className="h-6 w-6 text-fg-faint" strokeWidth={1.5} />
                  <p className="max-w-sm text-sm text-fg-muted">
                    Dès qu&apos;un concierge prend votre demande en charge, vous pourrez échanger avec lui ici.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-5" aria-label="Détails de la demande">
          <div className="flex items-center gap-4 rounded-lg border border-border bg-surface p-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/15 font-display text-xl text-accent">
              {nomConcierge ? (
                nomConcierge[0].toUpperCase()
              ) : (
                <UserRound aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
              )}
            </span>
            <div>
              <p className="text-xs text-fg-muted">Votre concierge</p>
              <p className="mt-0.5 text-fg">{nomConcierge ?? "Attribution en cours"}</p>
            </div>
          </div>
          <RequestDetailCard request={r} afficherPriorite={false} className="" />
          <AttachmentsCard attachments={d.piecesJointes} className="" />
          <HistoryCard history={d.historique} className="" />
        </aside>
      </div>
    </div>
  );
}
