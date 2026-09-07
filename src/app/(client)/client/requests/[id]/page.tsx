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
  concierge_id: string | null;
  categories: { name: string } | null;
};

type AttachmentRow = {
  id: string;
  file_name: string;
  storage_path: string;
};

export default async function ClientRequestDetailPage({
  params,
}: PageProps<"/client/requests/[id]">) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("requests")
    .select(
      "id, title, description, status, priority, location_text, requested_date, requested_time, budget_min, budget_max, preferences, concierge_id, categories(name)",
    )
    .eq("id", id)
    .maybeSingle<RequestDetail>();

  if (!request) {
    notFound();
  }

  const [{ data: history }, { data: attachments }, { data: messages }, { data: conciergeProfile }] =
    await Promise.all([
      supabase
        .from("request_status_history")
        .select("id, from_status, to_status, note, created_at")
        .eq("request_id", id)
        .order("created_at", { ascending: true })
        .returns<HistoryRow[]>(),
      supabase
        .from("request_attachments")
        .select("id, file_name, storage_path")
        .eq("request_id", id)
        .returns<AttachmentRow[]>(),
      supabase
        .from("messages")
        .select("id, body, created_at, sender_id")
        .eq("request_id", id)
        .eq("is_internal_note", false)
        .order("created_at", { ascending: true })
        .returns<ThreadMessage[]>(),
      request.concierge_id
        ? supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("id", request.concierge_id)
            .maybeSingle<{ first_name: string | null; last_name: string | null }>()
        : Promise.resolve({ data: null }),
    ]);

  const attachmentLinks: AttachmentLink[] = await Promise.all(
    (attachments ?? []).map(async (attachment) => {
      const { data: signed } = await supabase.storage
        .from("request-attachments")
        .createSignedUrl(attachment.storage_path, 60 * 10);
      return { id: attachment.id, file_name: attachment.file_name, url: signed?.signedUrl ?? null };
    }),
  );

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/client/dashboard" className="text-sm text-fg-muted hover:text-fg">
        ← Retour au dashboard
      </Link>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <p className="text-sm text-fg-muted">{request.categories?.name}</p>
          <h1 className="font-display text-2xl font-medium text-fg">{request.title}</h1>
        </div>
        <Badge variant="accent">{request.status}</Badge>
      </div>

      <p className="mt-2 text-sm text-fg-muted">
        {conciergeProfile
          ? `Votre concierge : ${conciergeProfile.first_name ?? ""} ${conciergeProfile.last_name ?? ""}`
          : "Concierge en cours d'attribution."}
      </p>

      <RequestDetailCard request={request} />
      <AttachmentsCard attachments={attachmentLinks} />
      <HistoryCard history={history ?? []} />

      {request.concierge_id && profile && (
        <div className="mt-6">
          <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
            Messages avec votre concierge
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
    </div>
  );
}
