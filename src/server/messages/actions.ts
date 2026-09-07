"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertRole } from "@/server/auth/guards";
import { notify } from "@/server/notifications/dispatcher";

const noteSchema = z.object({
  requestId: z.string().uuid(),
  body: z.string().trim().min(1, "La note ne peut pas être vide.").max(2000),
});

export type AddNoteState = { error: string | null };

/**
 * Note interne (concierge/admin uniquement) — RLS (`messages_insert`) garantit
 * que `is_internal_note: true` n'est acceptée que si l'auteur est le concierge
 * assigné à la demande ou un admin.
 */
export async function addInternalNote(
  _prevState: AddNoteState,
  formData: FormData,
): Promise<AddNoteState> {
  const profile = await assertRole("concierge", "admin");

  const parsed = noteSchema.safeParse({
    requestId: formData.get("requestId"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Note invalide." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("messages").insert({
    request_id: parsed.data.requestId,
    sender_id: profile.id,
    body: parsed.data.body,
    is_internal_note: true,
  });

  if (error) {
    return { error: "Impossible d'ajouter la note." };
  }

  revalidatePath(`/concierge/requests/${parsed.data.requestId}`);
  return { error: null };
}

const messageSchema = z.object({
  requestId: z.string().uuid(),
  body: z.string().trim().min(1, "Le message ne peut pas être vide.").max(2000),
});

export type SendMessageState = { error: string | null };

/**
 * Message visible côté client ET concierge sur une demande. La mise à jour de
 * la liste chez les autres participants passe par Supabase Realtime, pas par
 * un `revalidatePath` — voir `MessageThread` (Phase M7).
 */
export async function sendMessage(
  _prevState: SendMessageState,
  formData: FormData,
): Promise<SendMessageState> {
  const profile = await assertRole("client", "concierge", "admin");

  const parsed = messageSchema.safeParse({
    requestId: formData.get("requestId"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Message invalide." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("messages").insert({
    request_id: parsed.data.requestId,
    sender_id: profile.id,
    body: parsed.data.body,
    is_internal_note: false,
  });

  if (error) {
    return { error: "Impossible d'envoyer le message." };
  }

  const { data: request } = await supabase
    .from("requests")
    .select("client_id, concierge_id")
    .eq("id", parsed.data.requestId)
    .maybeSingle<{ client_id: string; concierge_id: string | null }>();

  const recipientId =
    request && request.client_id !== profile.id
      ? request.client_id
      : request?.concierge_id && request.concierge_id !== profile.id
        ? request.concierge_id
        : null;

  if (recipientId) {
    await notify(supabase, {
      userId: recipientId,
      type: "MESSAGE_RECEIVED",
      payload: { requestId: parsed.data.requestId },
      emailBody: "Vous avez reçu un nouveau message concernant votre demande.",
    });
  }

  return { error: null };
}

/**
 * Marque comme lus les messages visibles reçus (pas envoyés par soi-même)
 * dans une demande, quand on ouvre le fil de discussion.
 */
export async function markThreadRead(requestId: string): Promise<void> {
  const profile = await assertRole("client", "concierge", "admin");
  const supabase = await createClient();

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("request_id", requestId)
    .eq("is_internal_note", false)
    .neq("sender_id", profile.id)
    .is("read_at", null);
}
