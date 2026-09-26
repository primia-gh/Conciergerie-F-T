import { CalendarDays, FileText, Flag, MapPin, Paperclip, Sparkles, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dateCourte, dateLongue, euros, heure } from "@/lib/dates";
import { PRIORITE_LABELS, requestStatusLabel } from "@/server/requests/status-labels";

export type RequestDetailFields = {
  description: string;
  priority: string;
  location_text: string | null;
  requested_date: string | null;
  requested_time: string | null;
  budget_min: string | null;
  budget_max: string | null;
  preferences: string | null;
};

export type HistoryRow = {
  id: string;
  from_status: string | null;
  to_status: string;
  note: string | null;
  created_at: string;
};

export type AttachmentLink = {
  id: string;
  file_name: string;
  url: string | null;
};

function budget(min: string | null, max: string | null): string {
  if (min && max) return `${euros(min)} à ${euros(max)}`;
  if (max) return `Jusqu'à ${euros(max)}`;
  if (min) return `À partir de ${euros(min)}`;
  return "Non précisé";
}

function dateSouhaitee(date: string | null, time: string | null): string {
  if (!date) return "Non précisée";
  // Date saisie sans fuseau (« 2026-10-02 ») : midi UTC évite tout décalage de jour.
  const jour = dateLongue(`${date}T12:00:00Z`);
  return time ? `${jour} à ${time.slice(0, 5)}` : jour;
}

function Ligne({ icone: Icone, libelle, children }: { icone: typeof MapPin; libelle: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <Icone aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={1.5} />
      <div className="min-w-0">
        <dt className="text-xs text-fg-muted">{libelle}</dt>
        <dd className="mt-0.5 text-sm break-words text-fg first-letter:uppercase">{children}</dd>
      </div>
    </div>
  );
}

export function RequestDetailCard({
  request,
  afficherPriorite = true,
  className = "mt-6",
}: {
  request: RequestDetailFields;
  /** La priorité est un outil de l'équipe : le client ne la choisit pas. */
  afficherPriorite?: boolean;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText aria-hidden="true" className="h-4 w-4 text-accent" strokeWidth={1.5} />
          La demande
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <p className="text-sm leading-relaxed whitespace-pre-line text-fg">{request.description}</p>
        <dl className="flex flex-col gap-4 border-t border-border pt-5">
          <Ligne icone={CalendarDays} libelle="Date souhaitée">
            {dateSouhaitee(request.requested_date, request.requested_time)}
          </Ligne>
          <Ligne icone={MapPin} libelle="Lieu">
            {request.location_text || "Non précisé"}
          </Ligne>
          <Ligne icone={Wallet} libelle="Budget">
            {budget(request.budget_min, request.budget_max)}
          </Ligne>
          {request.preferences && (
            <Ligne icone={Sparkles} libelle="Préférences">
              {request.preferences}
            </Ligne>
          )}
          {afficherPriorite && (
            <Ligne icone={Flag} libelle="Priorité">
              {PRIORITE_LABELS[request.priority] ?? request.priority}
            </Ligne>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}

export function AttachmentsCard({ attachments, className = "mt-4" }: { attachments: AttachmentLink[]; className?: string }) {
  if (attachments.length === 0) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip aria-hidden="true" className="h-4 w-4 text-accent" strokeWidth={1.5} />
          Pièces jointes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-1 text-sm">
          {attachments.map((attachment) => (
            <li key={attachment.id}>
              {attachment.url ? (
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-10 items-center gap-2 break-all text-accent hover:underline"
                >
                  {attachment.file_name}
                  <span className="sr-only"> (s&apos;ouvre dans un nouvel onglet)</span>
                </a>
              ) : (
                <span className="text-fg-muted">{attachment.file_name} (lien indisponible)</span>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function HistoryCard({
  history,
  className = "mt-4",
  pourEquipe = false,
}: {
  history: HistoryRow[];
  className?: string;
  /** Libellés vus par l'équipe (« En attente du client ») plutôt que par le client. */
  pourEquipe?: boolean;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Historique</CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-fg-muted">Aucun historique visible.</p>
        ) : (
          <ol className="flex flex-col">
            {history.map((entry, i) => (
              <li key={entry.id} className="relative flex gap-4 pb-5 last:pb-0">
                {i < history.length - 1 && (
                  <span aria-hidden="true" className="absolute top-3 left-[3px] h-full w-px bg-border" />
                )}
                <span
                  aria-hidden="true"
                  className={`relative mt-1.5 h-[7px] w-[7px] shrink-0 rounded-full ${i === history.length - 1 ? "bg-accent" : "bg-fg-faint"}`}
                />
                <div className="min-w-0 text-sm">
                  <p className="font-medium text-fg">{requestStatusLabel(entry.to_status, pourEquipe)}</p>
                  {entry.note && <p className="mt-0.5 text-fg-muted">{entry.note}</p>}
                  <p className="mt-0.5 text-xs text-fg-faint">
                    {dateCourte(entry.created_at)} à {heure(entry.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
