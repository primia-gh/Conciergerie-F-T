import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/server/auth/session";
import type { AttachmentLink, HistoryRow } from "@/components/features/request-detail-card";
import type { ThreadMessage } from "@/components/features/message-thread";
import type { OptionForComparison } from "./proposal-comparison";
import { VueDemande } from "./vue-demande";

export const metadata: Metadata = { title: "Suivi de ma demande" };

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
  concierge_id: string | null;
  created_at: string;
  categories: { name: string; icon: string | null } | null;
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
      "id, title, description, status, priority, location_text, requested_date, requested_time, budget_min, budget_max, preferences, concierge_id, created_at, categories(name, icon)",
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

  // RLS (`proposals_select`) ne renvoie déjà que les propositions envoyées,
  // acceptées ou refusées — jamais un brouillon en cours de préparation.
  const { data: proposals } = await supabase
    .from("proposals")
    .select("id, status, created_at")
    .eq("request_id", id)
    .order("created_at", { ascending: false })
    .returns<ProposalRow[]>();

  const proposalsWithOptions = await Promise.all(
    (proposals ?? []).map(async (proposal) => {
      const { data: options } = await supabase
        .from("proposal_options")
        .select("id, name, description, price, address, conditions, advantages, is_selected")
        .eq("proposal_id", proposal.id)
        .returns<OptionForComparison[]>();
      return { ...proposal, options: options ?? [] };
    }),
  );

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, proposal_options(name, price)")
    .eq("request_id", id)
    .maybeSingle<BookingRow>();

  return (
    <VueDemande
      d={{
        demande: {
          ...request,
          categorie: request.categories?.name ?? null,
          icone: request.categories?.icon ?? null,
        },
        concierge: conciergeProfile
          ? { prenom: conciergeProfile.first_name, nom: conciergeProfile.last_name }
          : null,
        historique: history ?? [],
        piecesJointes: attachmentLinks,
        propositions: proposalsWithOptions,
        reservation: booking
          ? {
              id: booking.id,
              status: booking.status,
              optionName: booking.proposal_options?.name ?? "—",
              optionPrice: booking.proposal_options?.price ?? "0",
            }
          : null,
        messages: messages ?? [],
        moi: profile?.id ?? null,
      }}
    />
  );
}
