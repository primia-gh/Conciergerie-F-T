import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/server/auth/session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignButton } from "./assign-button";
import { InternalNotes, type NoteRow } from "./internal-notes";

type RequestDetail = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  location_text: string | null;
  requested_date: string | null;
  requested_time: string | null;
  budget_min: string | null;
  budget_max: string | null;
  preferences: string | null;
  client_id: string;
  concierge_id: string | null;
  categories: { name: string } | null;
};

type HistoryRow = {
  id: string;
  from_status: string | null;
  to_status: string;
  note: string | null;
  created_at: string;
};

type AttachmentRow = {
  id: string;
  file_name: string;
  storage_path: string;
  size_bytes: number;
};

export default async function ConciergeRequestDetailPage({
  params,
}: PageProps<"/concierge/requests/[id]">) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("requests")
    .select(
      "id, title, description, status, priority, location_text, requested_date, requested_time, budget_min, budget_max, preferences, client_id, concierge_id, categories(name)",
    )
    .eq("id", id)
    .maybeSingle<RequestDetail>();

  if (!request) {
    notFound();
  }

  const [{ data: history }, { data: attachments }, { data: notes }, { data: clientProfile }] =
    await Promise.all([
      supabase
        .from("request_status_history")
        .select("id, from_status, to_status, note, created_at")
        .eq("request_id", id)
        .order("created_at", { ascending: true })
        .returns<HistoryRow[]>(),
      supabase
        .from("request_attachments")
        .select("id, file_name, storage_path, size_bytes")
        .eq("request_id", id)
        .returns<AttachmentRow[]>(),
      supabase
        .from("messages")
        .select("id, body, created_at, sender_id")
        .eq("request_id", id)
        .eq("is_internal_note", true)
        .order("created_at", { ascending: true })
        .returns<NoteRow[]>(),
      supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", request.client_id)
        .maybeSingle<{ first_name: string | null; last_name: string | null }>(),
    ]);

  const attachmentLinks = await Promise.all(
    (attachments ?? []).map(async (attachment) => {
      const { data: signed } = await supabase.storage
        .from("request-attachments")
        .createSignedUrl(attachment.storage_path, 60 * 10);
      return { ...attachment, url: signed?.signedUrl ?? null };
    }),
  );

  const canAssign = request.status === "NEW" && request.concierge_id === null;
  const isMine = request.concierge_id === profile?.id;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/concierge/dashboard" className="text-sm text-fg-muted hover:text-fg">
        ← Retour au dashboard
      </Link>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <p className="text-sm text-fg-muted">{request.categories?.name}</p>
          <h1 className="font-display text-2xl font-medium text-fg">{request.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="accent">{request.status}</Badge>
          {canAssign && <AssignButton requestId={request.id} />}
        </div>
      </div>

      {!canAssign && (
        <p className="mt-2 text-sm text-fg-muted">
          Client : {clientProfile?.first_name ?? "—"} {clientProfile?.last_name ?? ""}
          {isMine && " (assignée à vous)"}
        </p>
      )}

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
          {request.preferences && (
            <p className="text-fg-muted">Préférences : {request.preferences}</p>
          )}
        </CardContent>
      </Card>

      {attachmentLinks.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Pièces jointes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm">
              {attachmentLinks.map((attachment) => (
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
      )}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Historique</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-2 text-sm">
            {(history ?? []).map((entry) => (
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

      <div className="mt-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
          Notes internes
        </h2>
        <div className="mt-3">
          <InternalNotes requestId={request.id} notes={notes ?? []} />
        </div>
      </div>
    </div>
  );
}
