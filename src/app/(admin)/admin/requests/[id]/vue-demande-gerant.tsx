import { Lock, MessageCircle, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AttachmentsCard,
  HistoryCard,
  RequestDetailCard,
  type AttachmentLink,
  type HistoryRow,
  type RequestDetailFields,
} from "@/components/features/request-detail-card";
import { LienRetour, PAGE, TitreSection, surtitre } from "@/components/espace/en-tete";
import { IconeCategorie } from "@/components/espace/icones-categories";
import { STATUT_PROPOSITION, libelle } from "@/components/espace/libelles";
import { SuiviDetaille } from "@/components/espace/suivi-demande";
import { dateCourte, dateLongue, euros, heure } from "@/lib/dates";
import { requestStatusBadgeVariant, requestStatusLabel } from "@/server/requests/status-labels";
import { cn } from "@/lib/utils";

type Personne = { id: string; nom: string } | null;

export type DonneesDemandeGerant = {
  demande: RequestDetailFields & {
    id: string;
    title: string;
    status: string;
    created_at: string;
    categorie: string | null;
    icone: string | null;
  };
  client: Personne;
  concierge: Personne;
  historique: HistoryRow[];
  piecesJointes: AttachmentLink[];
  propositions: {
    id: string;
    status: string;
    created_at: string;
    options: { id: string; name: string; price: string; is_selected: boolean }[];
  }[];
  reservation: { optionName: string; optionPrice: string; status: string } | null;
  messages: { id: string; body: string; sender_id: string; created_at: string; is_internal_note: boolean }[];
};

const RESERVATION: Record<string, string> = {
  pending: "En attente de confirmation",
  confirmed: "Confirmée",
  cancelled: "Annulée",
  completed: "Terminée",
};

function CartePersonne({ role, personne, vide }: { role: string; personne: Personne; vide: string }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-surface p-5">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/15 font-display text-xl text-accent">
        {personne?.nom ? personne.nom[0].toUpperCase() : <UserRound aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />}
      </span>
      <div>
        <p className="text-xs text-fg-muted">{role}</p>
        <p className="mt-0.5 text-fg">{personne?.nom || vide}</p>
      </div>
    </div>
  );
}

/**
 * Une demande Premium vue par le Gérant : tout, en lecture seule (le suivi
 * et les échanges restent l'affaire du concierge). Présentation seule : les
 * données viennent de page.tsx.
 */
export function VueDemandeGerant({ d }: { d: DonneesDemandeGerant }) {
  const r = d.demande;
  const nom = (id: string) =>
    id === d.client?.id ? (d.client.nom || "Client") : id === d.concierge?.id ? (d.concierge.nom || "Concierge") : "Équipe";

  return (
    <div className={PAGE.large}>
      <LienRetour href="/admin/requests">Demandes Premium</LienRetour>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className={cn(surtitre, "flex items-center gap-2 text-accent")}>
            <IconeCategorie nom={r.icone} className="h-4 w-4" />
            {r.categorie ?? "Demande"}
          </p>
          <h1 className="mt-3 font-display text-4xl break-words text-fg sm:text-5xl">{r.title}</h1>
          <p className="mt-3 text-sm text-fg-muted">Reçue le {dateLongue(r.created_at)}</p>
        </div>
        <Badge variant={requestStatusBadgeVariant(r.status)} className="self-start px-3 py-1 text-sm">
          {requestStatusLabel(r.status, true)}
        </Badge>
      </header>

      <section aria-label="Suivi de la demande" className="mt-8 rounded-lg border border-border bg-surface px-4 py-6 sm:px-8">
        <SuiviDetaille status={r.status} />
      </section>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-12 lg:col-span-2">
          {d.reservation && (
            <section aria-labelledby="titre-reservation" className="rounded-lg border border-accent/60 bg-surface p-5 sm:p-6">
              <h2 id="titre-reservation" className={cn(surtitre, "text-fg-muted")}>
                Réservation
              </h2>
              <p className="mt-2 font-display text-2xl text-fg">{d.reservation.optionName}</p>
              <p className="mt-1 text-sm text-fg-muted">
                {euros(d.reservation.optionPrice)} · {RESERVATION[d.reservation.status] ?? d.reservation.status}
              </p>
            </section>
          )}

          <section aria-labelledby="titre-propositions">
            <TitreSection id="titre-propositions" compte={d.propositions.length}>
              Propositions
            </TitreSection>
            {d.propositions.length === 0 ? (
              <p className="mt-4 text-sm text-fg-muted">Aucune proposition envoyée pour l&apos;instant.</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-4">
                {d.propositions.map((p) => {
                  const s = libelle(STATUT_PROPOSITION, p.status);
                  return (
                    <li key={p.id} className="rounded-lg border border-border bg-surface p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-medium text-fg">Proposition du {dateCourte(p.created_at)}</p>
                        <Badge variant={s.variante}>{s.libelle}</Badge>
                      </div>
                      {p.options.length > 0 && (
                        <ul className="mt-3 flex flex-col divide-y divide-border">
                          {p.options.map((o) => (
                            <li key={o.id} className="flex items-center justify-between gap-4 py-2 text-sm">
                              <span className={o.is_selected ? "font-medium text-fg" : "text-fg-muted"}>
                                {o.name}
                                {o.is_selected && <span className="ml-2 text-success">· choisie</span>}
                              </span>
                              <span className="shrink-0 text-fg">{euros(o.price)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="titre-messages">
            <TitreSection id="titre-messages" className="gap-2">
              <MessageCircle aria-hidden="true" className="h-3.5 w-3.5" />
              Échanges et notes internes
            </TitreSection>
            {d.messages.length === 0 ? (
              <p className="mt-4 text-sm text-fg-muted">Aucun échange pour l&apos;instant.</p>
            ) : (
              <ol className="mt-4 flex flex-col gap-3">
                {d.messages.map((m) => (
                  <li
                    key={m.id}
                    className={cn(
                      "rounded-lg border px-4 py-3 text-sm",
                      m.is_internal_note ? "border-warning/30 bg-warning/5" : "border-border bg-surface",
                    )}
                  >
                    <p className="flex flex-wrap items-center gap-2 text-xs text-fg-faint">
                      <span className="font-medium text-fg-muted">{nom(m.sender_id)}</span>
                      <span>
                        {dateCourte(m.created_at)}, {heure(m.created_at)}
                      </span>
                      {m.is_internal_note && (
                        <span className="inline-flex items-center gap-1 text-warning">
                          <Lock aria-hidden="true" className="h-3 w-3" /> Note interne
                        </span>
                      )}
                    </p>
                    <p className="mt-1.5 leading-relaxed whitespace-pre-line text-fg">{m.body}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-5" aria-label="Détails de la demande">
          <CartePersonne role="Client" personne={d.client} vide="Nom non renseigné" />
          <CartePersonne role="Concierge" personne={d.concierge} vide="Pas encore attribuée" />
          <RequestDetailCard request={r} className="" />
          <AttachmentsCard attachments={d.piecesJointes} className="" />
          <HistoryCard history={d.historique} className="" pourEquipe />
        </aside>
      </div>
    </div>
  );
}
