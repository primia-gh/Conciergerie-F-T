"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertRole } from "@/server/auth/guards";
import { assertValidTransition } from "@/server/requests/state-machine";

export type BookingActionState = { error: string | null };

export async function confirmBooking(bookingId: string, requestId: string): Promise<BookingActionState> {
  const profile = await assertRole("concierge", "admin");
  assertValidTransition("BOOKING", "CONFIRMED");
  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", bookingId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) return { error: "Impossible de confirmer la réservation." };
  if (!updated) return { error: "Cette réservation a déjà été mise à jour." };

  await supabase.from("request_status_history").insert({
    request_id: requestId,
    from_status: "BOOKING",
    to_status: "CONFIRMED",
    changed_by: profile.id,
    note: "Réservation confirmée.",
  });
  await supabase.from("requests").update({ status: "CONFIRMED" }).eq("id", requestId);

  revalidatePath(`/concierge/requests/${requestId}`);
  revalidatePath(`/client/requests/${requestId}`);
  return { error: null };
}

export async function completeBooking(bookingId: string, requestId: string): Promise<BookingActionState> {
  const profile = await assertRole("concierge", "admin");
  assertValidTransition("CONFIRMED", "COMPLETED");
  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from("bookings")
    .update({ status: "completed" })
    .eq("id", bookingId)
    .eq("status", "confirmed")
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) return { error: "Impossible de finaliser la réservation." };
  if (!updated) return { error: "Cette réservation a déjà été mise à jour." };

  await supabase.from("request_status_history").insert({
    request_id: requestId,
    from_status: "CONFIRMED",
    to_status: "COMPLETED",
    changed_by: profile.id,
    note: "Prestation terminée.",
  });
  await supabase.from("requests").update({ status: "COMPLETED" }).eq("id", requestId);

  revalidatePath(`/concierge/requests/${requestId}`);
  revalidatePath(`/client/requests/${requestId}`);
  return { error: null };
}
