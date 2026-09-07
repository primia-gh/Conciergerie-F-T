import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/server/auth/session";
import { Badge } from "@/components/ui/badge";
import {
  AttachmentsCard,
  HistoryCard,
  RequestDetailCard,
  type AttachmentLink,
  type HistoryRow,
} from "@/components/features/request-detail-card";
import { MessageThread, type ThreadMessage } from "@/components/features/message-thread";
import { Card, CardContent } from "@/components/ui/card";
import { AssignButton } from "./assign-button";
import { InternalNotes, type NoteRow } from "./internal-notes";
import { StartProposalButton } from "./start-proposal-button";

const STARTABLE_STATUSES = new Set(["ASSIGNED", "IN_PROGRESS", "RESEARCHING", "REJECTED"]);

type ProposalRow = { id: string; status: string; created_at: string };

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

  const [{ data: history }, { data: attachments }, { data: notes }, { data: messages }, { data: clientProfile }, { data: proposals }] =
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
        .from("messages")
        .select("id, body, created_at, sender_id")
        .eq("request_id", id)
        .eq("is_internal_note", false)
        .order("created_at", { ascending: true })
        .returns<ThreadMessage[]>(),
      supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", request.client_id)
        .maybeSingle<{ first_name: string | null; last_name: string | null }>(),
      supabase
        .from("proposals")
        .select("id, status, created_at")
        .eq("request_id", id)
        .order("created_at", { ascending: false })
        .returns<ProposalRow[]>(),
    ]);

  const attachmentLinks: AttachmentLink[] = await Promise.all(
    (attachments ?? []).map(async (attachment) => {
      const { data: signed } = await supabase.storage
        .from("request-attachments")
        .createSignedUrl(attachment.storage_path, 60 * 10);
      return { id: attachment.id, file_name: attachment.file_name, url: signed?.signedUrl ?? null };
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

      <RequestDetailCard request={request} />
      <AttachmentsCard attachments={attachmentLinks} />
      <HistoryCard history={history ?? []} />

      {isMine && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
              Propositions
            </h2>
            {STARTABLE_STATUSES.has(request.status) && (
              <StartProposalButton
                requestId={request.id}
                label={request.status === "REJECTED" ? "Relancer une proposition" : "Créer une proposition"}
              />
            )}
          </div>
          <div className="mt-3">
            {!proposals || proposals.length === 0 ? (
              <p className="text-sm text-fg-muted">Aucune proposition pour l&apos;instant.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {proposals.map((proposal) => (
                  <li key={proposal.id}>
                    <Link href={`/concierge/requests/${request.id}/proposals/${proposal.id}`}>
                      <Card className="transition-colors hover:bg-bg-subtle">
                        <CardContent className="flex items-center justify-between pt-5">
                          <span className="text-sm text-fg">
                            Proposition du{" "}
                            {new Date(proposal.created_at).toLocaleDateString("fr-FR")}
                          </span>
                          <Badge variant={proposal.status === "draft" ? "neutral" : "accent"}>
                            {proposal.status}
                          </Badge>
                        </CardContent>
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {isMine && profile && (
        <div className="mt-6">
          <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
            Messages avec le client
          </h2>
          <div className="mt-3">
            <MessageThread
              requestId={request.id}
              currentUserId={profile.id}
              initialMessages={messages ?? []}
            />
          </div>
        </div>
      )}

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
