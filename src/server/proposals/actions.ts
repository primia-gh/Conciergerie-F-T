"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assertRole } from "@/server/auth/guards";
import { assertValidTransition, type RequestStatus } from "@/server/requests/state-machine";
import { notify } from "@/server/notifications/dispatcher";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Applique une suite de transitions validées et journalise chaque saut dans
 * `request_status_history` — un seul geste utilisateur (ex. « Créer une
 * proposition ») peut traverser plusieurs statuts intermédiaires du brief
 * (ASSIGNED → IN_PROGRESS → RESEARCHING → PROPOSAL_DRAFT) sans multiplier les
 * clics, tout en gardant un historique fidèle à chaque étape.
 */
async function applyTransitionChain(
  supabase: SupabaseClient,
  requestId: string,
  actorId: string,
  from: RequestStatus,
  chain: RequestStatus[],
  note: string,
) {
  let current = from;
  for (const next of chain) {
    assertValidTransition(current, next);
    await supabase.from("request_status_history").insert({
      request_id: requestId,
      from_status: current,
      to_status: next,
      changed_by: actorId,
      note,
    });
    current = next;
  }

  const { error } = await supabase.from("requests").update({ status: current }).eq("id", requestId);
  if (error) throw new Error("Impossible de mettre à jour le statut de la demande.");

  return current;
}

export type StartProposalState = { error: string | null; proposalId?: string };

/**
 * Crée une nouvelle proposition (draft) et fait progresser la demande jusqu'à
 * PROPOSAL_DRAFT, depuis ASSIGNED, RESEARCHING ou REJECTED (relance après refus).
 */
export async function startProposal(requestId: string): Promise<StartProposalState> {
  const profile = await assertRole("concierge");
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("requests")
    .select("status, concierge_id")
    .eq("id", requestId)
    .maybeSingle<{ status: RequestStatus; concierge_id: string | null }>();

  if (!request || request.concierge_id !== profile.id) {
    return { error: "Demande introuvable ou non assignée." };
  }

  const chains: Partial<Record<RequestStatus, RequestStatus[]>> = {
    ASSIGNED: ["IN_PROGRESS", "RESEARCHING", "PROPOSAL_DRAFT"],
    IN_PROGRESS: ["RESEARCHING", "PROPOSAL_DRAFT"],
    RESEARCHING: ["PROPOSAL_DRAFT"],
    REJECTED: ["RESEARCHING", "PROPOSAL_DRAFT"],
  };

  const chain = chains[request.status];
  if (!chain) {
    return { error: `Impossible de créer une proposition depuis le statut ${request.status}.` };
  }

  try {
    await applyTransitionChain(
      supabase,
      requestId,
      profile.id,
      request.status,
      chain,
      "Création d'une nouvelle proposition.",
    );
  } catch {
    return { error: "Impossible de mettre à jour le statut de la demande." };
  }

  const { data: proposal, error } = await supabase
    .from("proposals")
    .insert({ request_id: requestId, concierge_id: profile.id, status: "draft" })
    .select("id")
    .single<{ id: string }>();

  if (error || !proposal) {
    return { error: "Impossible de créer la proposition." };
  }

  revalidatePath(`/concierge/requests/${requestId}`);
  return { error: null, proposalId: proposal.id };
}

const optionSchema = z.object({
  proposalId: z.string().uuid(),
  name: z.string().trim().min(2, "Le nom est trop court.").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  price: z.coerce.number().nonnegative("Le prix doit être positif."),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  conditions: z.string().trim().max(1000).optional().or(z.literal("")),
  advantages: z.string().trim().max(1000).optional().or(z.literal("")),
  photoUrls: z.string().trim().max(2000).optional().or(z.literal("")),
  partnerId: z.string().uuid().optional().or(z.literal("")),
});

export type AddOptionState = { error: string | null };

function emptyToNull(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

export async function addProposalOption(
  _prevState: AddOptionState,
  formData: FormData,
): Promise<AddOptionState> {
  const profile = await assertRole("concierge");

  const parsed = optionSchema.safeParse({
    proposalId: formData.get("proposalId"),
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
    price: formData.get("price"),
    address: formData.get("address") ?? undefined,
    conditions: formData.get("conditions") ?? undefined,
    advantages: formData.get("advantages") ?? undefined,
    photoUrls: formData.get("photoUrls") ?? undefined,
    partnerId: formData.get("partnerId") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Option invalide." };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("id, request_id, status, concierge_id")
    .eq("id", data.proposalId)
    .maybeSingle<{ id: string; request_id: string; status: string; concierge_id: string }>();

  if (!proposal || proposal.concierge_id !== profile.id) {
    return { error: "Proposition introuvable." };
  }
  if (proposal.status !== "draft") {
    return { error: "Cette proposition a déjà été envoyée, elle ne peut plus être modifiée." };
  }

  const photos = emptyToNull(data.photoUrls)
    ? data.photoUrls!.split(",").map((url) => ({ url: url.trim() })).filter((p) => p.url)
    : [];

  const { error } = await supabase.from("proposal_options").insert({
    proposal_id: data.proposalId,
    partner_id: emptyToNull(data.partnerId),
    name: data.name,
    description: emptyToNull(data.description),
    price: data.price,
    address: emptyToNull(data.address),
    conditions: emptyToNull(data.conditions),
    advantages: emptyToNull(data.advantages),
    photos,
  });

  if (error) {
    return { error: "Impossible d'ajouter cette option." };
  }

  revalidatePath(`/concierge/requests/${proposal.request_id}/proposals/${data.proposalId}`);
  return { error: null };
}

export async function removeProposalOption(optionId: string, requestId: string): Promise<void> {
  await assertRole("concierge");
  const supabase = await createClient();
  await supabase.from("proposal_options").delete().eq("id", optionId);
  revalidatePath(`/concierge/requests/${requestId}`);
}

export type SendProposalState = { error: string | null };

export async function sendProposal(proposalId: string, requestId: string): Promise<SendProposalState> {
  const profile = await assertRole("concierge");
  const supabase = await createClient();

  const { count } = await supabase
    .from("proposal_options")
    .select("id", { count: "exact", head: true })
    .eq("proposal_id", proposalId);

  if (!count || count === 0) {
    return { error: "Ajoutez au moins une option avant d'envoyer la proposition." };
  }

  const { error: proposalError } = await supabase
    .from("proposals")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", proposalId)
    .eq("status", "draft");

  if (proposalError) {
    return { error: "Impossible d'envoyer la proposition." };
  }

  try {
    await applyTransitionChain(
      supabase,
      requestId,
      profile.id,
      "PROPOSAL_DRAFT",
      ["PROPOSAL_SENT", "WAITING_CLIENT"],
      "Proposition envoyée au client.",
    );
  } catch {
    return { error: "Proposition envoyée, mais le statut de la demande n'a pas pu être mis à jour." };
  }

  const { data: request } = await supabase
    .from("requests")
    .select("client_id")
    .eq("id", requestId)
    .maybeSingle<{ client_id: string }>();

  if (request) {
    await notify(supabase, {
      userId: request.client_id,
      type: "PROPOSAL_CREATED",
      payload: { requestId, proposalId },
      emailBody: "Votre concierge vient de vous envoyer une proposition à comparer.",
    });
  }

  revalidatePath(`/concierge/requests/${requestId}`);
  redirect(`/concierge/requests/${requestId}`);
}

const respondSchema = z
  .object({
    proposalId: z.string().uuid(),
    requestId: z.string().uuid(),
    optionId: z.string().uuid().optional().or(z.literal("")),
    decision: z.enum(["accepted", "rejected"]),
    feedback: z.string().trim().max(1000).optional().or(z.literal("")),
  })
  .refine((data) => data.decision !== "accepted" || !!data.optionId, {
    message: "Choisissez une option à accepter.",
  });

export type RespondToProposalState = { error: string | null };

/**
 * Réponse du client à une proposition envoyée. La policy RLS
 * `proposals_client_respond` garantit déjà côté base que seul le client de la
 * demande peut faire passer une proposition `sent` à `accepted`/`rejected` —
 * cette action est une seconde couche, pas la seule barrière.
 */
export async function respondToProposal(
  _prevState: RespondToProposalState,
  formData: FormData,
): Promise<RespondToProposalState> {
  const profile = await assertRole("client");

  const parsed = respondSchema.safeParse({
    proposalId: formData.get("proposalId"),
    requestId: formData.get("requestId"),
    optionId: formData.get("optionId"),
    decision: formData.get("decision"),
    feedback: formData.get("feedback") ?? undefined,
  });

  if (!parsed.success) {
    return { error: "Réponse invalide." };
  }

  const { proposalId, requestId, optionId, decision, feedback } = parsed.data;
  const supabase = await createClient();

  const { data: proposalBeforeResponse } = await supabase
    .from("proposals")
    .select("concierge_id")
    .eq("id", proposalId)
    .maybeSingle<{ concierge_id: string }>();

  if (decision === "accepted") {
    const { error: optionError } = await supabase
      .from("proposal_options")
      .update({ is_selected: true, client_feedback: emptyToNull(feedback) })
      .eq("id", optionId!);
    if (optionError) {
      return { error: "Impossible d'enregistrer votre choix." };
    }
  } else if (feedback) {
    // Pas de champ dédié pour un commentaire de refus : réutilise la
    // messagerie (M7) plutôt que de perdre l'information.
    await supabase.from("messages").insert({
      request_id: requestId,
      sender_id: profile.id,
      body: feedback,
      is_internal_note: false,
    });
  }

  const { error: proposalError } = await supabase
    .from("proposals")
    .update({ status: decision })
    .eq("id", proposalId)
    .eq("status", "sent");

  if (proposalError) {
    return { error: "Cette proposition ne peut plus être modifiée." };
  }

  try {
    await applyTransitionChain(
      supabase,
      requestId,
      profile.id,
      "WAITING_CLIENT",
      decision === "accepted" ? ["ACCEPTED", "BOOKING"] : ["REJECTED"],
      decision === "accepted"
        ? "Proposition acceptée par le client — réservation créée."
        : "Proposition refusée par le client.",
    );
  } catch {
    return { error: "Réponse enregistrée, mais le statut de la demande n'a pas pu être mis à jour." };
  }

  if (decision === "accepted") {
    // Création automatique de la réservation (Phase M9). RLS
    // (`bookings_insert_client`) garantit que le client ne peut créer qu'une
    // réservation pour SA demande, vers une option réellement sélectionnée.
    const { error: bookingError } = await supabase.from("bookings").insert({
      request_id: requestId,
      proposal_option_id: optionId!,
      client_id: profile.id,
      status: "pending",
    });
    if (bookingError) {
      return { error: "Proposition acceptée, mais la réservation n'a pas pu être créée." };
    }
  }

  if (proposalBeforeResponse) {
    await notify(supabase, {
      userId: proposalBeforeResponse.concierge_id,
      type: decision === "accepted" ? "PROPOSAL_ACCEPTED" : "PROPOSAL_REJECTED",
      payload: { requestId, proposalId },
      emailBody:
        decision === "accepted"
          ? "Le client a accepté votre proposition."
          : "Le client a refusé votre proposition.",
    });
  }

  revalidatePath(`/client/requests/${requestId}`);
  revalidatePath(`/concierge/requests/${requestId}`);
  return { error: null };
}
