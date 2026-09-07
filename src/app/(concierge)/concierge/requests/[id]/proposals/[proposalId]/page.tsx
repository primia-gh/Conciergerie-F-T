import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/server/auth/session";
import { Badge } from "@/components/ui/badge";
import { AddOptionForm } from "./add-option-form";
import { OptionList, type OptionRow } from "./option-list";
import { SendProposalButton } from "./send-proposal-button";

export default async function ProposalEditorPage({
  params,
}: PageProps<"/concierge/requests/[id]/proposals/[proposalId]">) {
  const { id: requestId, proposalId } = await params;
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("id, status, request_id, concierge_id")
    .eq("id", proposalId)
    .maybeSingle<{ id: string; status: string; request_id: string; concierge_id: string }>();

  if (!proposal || proposal.request_id !== requestId || proposal.concierge_id !== profile?.id) {
    notFound();
  }

  const [{ data: options }, { data: partners }] = await Promise.all([
    supabase
      .from("proposal_options")
      .select("id, name, description, price, address")
      .eq("proposal_id", proposalId)
      .returns<OptionRow[]>(),
    supabase
      .from("partners")
      .select("id, name")
      .eq("status", "active")
      .order("name")
      .returns<{ id: string; name: string }[]>(),
  ]);

  const isDraft = proposal.status === "draft";

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href={`/concierge/requests/${requestId}`} className="text-sm text-fg-muted hover:text-fg">
        ← Retour à la demande
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-medium text-fg">Proposition</h1>
        <Badge variant={isDraft ? "neutral" : "accent"}>{proposal.status}</Badge>
      </div>

      {!isDraft && (
        <p className="mt-2 text-sm text-fg-muted">
          Cette proposition a déjà été envoyée et ne peut plus être modifiée.
        </p>
      )}

      <div className="mt-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">Options</h2>
        <div className="mt-3">
          <OptionList options={options ?? []} requestId={requestId} />
        </div>
      </div>

      {isDraft && (
        <>
          <div className="mt-6">
            <AddOptionForm proposalId={proposalId} partners={partners ?? []} />
          </div>
          <div className="mt-6 flex justify-end">
            <SendProposalButton
              proposalId={proposalId}
              requestId={requestId}
              disabled={(options ?? []).length === 0}
            />
          </div>
        </>
      )}
    </div>
  );
}
