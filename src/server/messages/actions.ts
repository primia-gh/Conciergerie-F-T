"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertRole } from "@/server/auth/guards";

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
