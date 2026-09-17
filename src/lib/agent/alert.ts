import "server-only";
import { Resend } from "resend";

let resendClient: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

/**
 * Alerte e-mail au gérant. Best-effort, comme le canal email de
 * notifications/dispatcher.ts : sans RESEND_API_KEY ou GERANT_ALERT_EMAIL,
 * explicitement NOT IMPLEMENTED plutôt que simulé. Le journal (`action`)
 * reste la trace de référence, cette alerte n'est qu'un signal en temps réel.
 */
export async function alerterGerant(params: { sujet: string; corps: string }): Promise<void> {
  const resend = getResend();
  const to = process.env.GERANT_ALERT_EMAIL;
  if (!resend || !to) return;

  await resend.emails.send({
    from: process.env.EMAIL_FROM_ADDRESS ?? "onboarding@resend.dev",
    to,
    subject: params.sujet,
    text: params.corps,
  });
}
