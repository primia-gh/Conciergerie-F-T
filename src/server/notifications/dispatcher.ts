import "server-only";

import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";

export type NotificationType =
  | "REQUEST_CREATED"
  | "REQUEST_ASSIGNED"
  | "MESSAGE_RECEIVED"
  | "PROPOSAL_CREATED"
  | "PROPOSAL_ACCEPTED"
  | "PROPOSAL_REJECTED"
  | "PAYMENT_SUCCESS"
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "REQUEST_COMPLETED";

const EMAIL_SUBJECTS: Record<NotificationType, string> = {
  REQUEST_CREATED: "Votre demande a bien été reçue",
  REQUEST_ASSIGNED: "Un concierge s'occupe de votre demande",
  MESSAGE_RECEIVED: "Nouveau message",
  PROPOSAL_CREATED: "Vous avez reçu une proposition",
  PROPOSAL_ACCEPTED: "Votre proposition a été acceptée",
  PROPOSAL_REJECTED: "Votre proposition a été refusée",
  PAYMENT_SUCCESS: "Paiement confirmé",
  BOOKING_CONFIRMED: "Votre réservation est confirmée",
  BOOKING_CANCELLED: "Réservation annulée",
  REQUEST_COMPLETED: "Votre demande est terminée",
};

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

/**
 * Dispatcher central d'événements (ARCHITECTURE.md §6). Le canal in-app est
 * toujours écrit — c'est la source de vérité de la cloche de notifications.
 * Le canal email est best-effort : sans `RESEND_API_KEY` (non configurée
 * dans cet environnement, voir ROADMAP.md M11), il est explicitement
 * NOT IMPLEMENTED plutôt que simulé — jamais de ligne "email" en base sans
 * envoi réel correspondant.
 */
export async function notify(
  supabase: SupabaseClient,
  params: {
    userId: string;
    type: NotificationType;
    payload?: Record<string, unknown>;
    emailBody?: string;
  },
): Promise<void> {
  const { userId, type, payload = {}, emailBody } = params;

  const { error: inAppError } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    channel: "in_app",
    payload,
  });

  if (inAppError) {
    console.error(`[notifications] échec insertion in-app "${type}"`, inAppError);
  }

  const resend = getResend();
  if (!resend || !emailBody) {
    if (!resend) {
      console.warn(
        `[notifications] RESEND_API_KEY absente — email "${type}" non envoyé (NOT IMPLEMENTED).`,
      );
    }
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle<{ email: string | null }>();

  if (!profile?.email) return;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM_ADDRESS || "onboarding@resend.dev",
      to: profile.email,
      subject: EMAIL_SUBJECTS[type],
      text: emailBody,
    });

    await supabase.from("notifications").insert({
      user_id: userId,
      type,
      channel: "email",
      payload,
      sent_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[notifications] échec envoi email "${type}"`, error);
  }
}
