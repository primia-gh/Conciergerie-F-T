import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export function RequestDetailCard({ request }: { request: RequestDetailFields }) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Détails</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <p className="text-fg">{request.description}</p>
        <div className="grid grid-cols-2 gap-3 text-fg-muted">
          <p>
            Date : {request.requested_date ?? "Non précisée"} {request.requested_time ?? ""}
          </p>
          <p>Lieu : {request.location_text ?? "Non précisé"}</p>
          <p>
            Budget :{" "}
            {request.budget_min || request.budget_max
              ? `${request.budget_min ?? "0"}€ – ${request.budget_max ?? "?"}€`
              : "Non précisé"}
          </p>
          <p>Priorité : {request.priority}</p>
        </div>
        {request.preferences && <p className="text-fg-muted">Préférences : {request.preferences}</p>}
      </CardContent>
    </Card>
  );
}

export function AttachmentsCard({ attachments }: { attachments: AttachmentLink[] }) {
  if (attachments.length === 0) return null;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Pièces jointes</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2 text-sm">
          {attachments.map((attachment) => (
            <li key={attachment.id}>
              {attachment.url ? (
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  {attachment.file_name}
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

export function HistoryCard({ history }: { history: HistoryRow[] }) {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Historique</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-2 text-sm">
          {history.length === 0 && <p className="text-fg-muted">Aucun historique visible.</p>}
          {history.map((entry) => (
            <li key={entry.id} className="text-fg-muted">
              <span className="font-medium text-fg">
                {entry.from_status ?? "—"} → {entry.to_status}
              </span>{" "}
              — {new Date(entry.created_at).toLocaleString("fr-FR")}
              {entry.note && <span> · {entry.note}</span>}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
