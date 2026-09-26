import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/server/auth/session";
import type { OptionRow } from "./option-list";
import { VueProposition } from "./vue-proposition";

export const metadata: Metadata = { title: "Proposition" };

export default async function ProposalEditorPage({
  params,
}: PageProps<"/concierge/requests/[id]/proposals/[proposalId]">) {
  const { id: requestId, proposalId } = await params;
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("id, status, request_id, concierge_id, created_at, sent_at")
    .eq("id", proposalId)
    .maybeSingle<{
      id: string;
      status: string;
      request_id: string;
      concierge_id: string;
      created_at: string;
      sent_at: string | null;
    }>();

  if (!proposal || proposal.request_id !== requestId || proposal.concierge_id !== profile?.id) {
    notFound();
  }

  const [{ data: options }, { data: partners }, { data: request }] = await Promise.all([
    supabase
      .from("proposal_options")
      .select("id, name, description, price, address, conditions, advantages")
      .eq("proposal_id", proposalId)
      .returns<OptionRow[]>(),
    supabase
      .from("partners")
      .select("id, name")
      .eq("status", "active")
      .order("name")
      .returns<{ id: string; name: string }[]>(),
    supabase.from("requests").select("title").eq("id", requestId).maybeSingle<{ title: string }>(),
  ]);

  return (
    <VueProposition
      d={{
        requestId,
        titreDemande: request?.title ?? null,
        proposition: proposal,
        options: options ?? [],
        partenaires: partners ?? [],
      }}
    />
  );
}
