import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/server/auth/session";
import type { AttachmentLink, HistoryRow } from "@/components/features/request-detail-card";
import type { ThreadMessage } from "@/components/features/message-thread";
import type { NoteRow } from "./internal-notes";
import { VueDemandeConcierge } from "./vue-demande-concierge";

export const metadata: Metadata = { title: "Demande" };

type ProposalRow = { id: string; status: string; created_at: string };

type BookingRow = {
  id: string;
  status: string;
  proposal_options: { name: string; price: string } | null;
};

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
  created_at: string;
  categories: { name: string; icon: string | null } | null;
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
      "id, title, description, status, priority, location_text, requested_date, requested_time, budget_min, budget_max, preferences, client_id, concierge_id, created_at, categories(name, icon)",
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

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, proposal_options(name, price)")
    .eq("request_id", id)
    .maybeSingle<BookingRow>();

  const attachmentLinks: AttachmentLink[] = await Promise.all(
    (attachments ?? []).map(async (attachment) => {
      const { data: signed } = await supabase.storage
        .from("request-attachments")
        .createSignedUrl(attachment.storage_path, 60 * 10);
      return { id: attachment.id, file_name: attachment.file_name, url: signed?.signedUrl ?? null };
    }),
  );

  return (
    <VueDemandeConcierge
      d={{
        demande: {
          ...request,
          categorie: request.categories?.name ?? null,
          icone: request.categories?.icon ?? null,
        },
        client: clientProfile ? { prenom: clientProfile.first_name, nom: clientProfile.last_name } : null,
        historique: history ?? [],
        piecesJointes: attachmentLinks,
        notes: notes ?? [],
        messages: messages ?? [],
        propositions: proposals ?? [],
        reservation: booking
          ? {
              id: booking.id,
              status: booking.status,
              optionName: booking.proposal_options?.name ?? "—",
              optionPrice: booking.proposal_options?.price ?? "0",
            }
          : null,
        moi: profile?.id ?? null,
      }}
    />
  );
}
