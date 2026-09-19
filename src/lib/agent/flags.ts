import "server-only";

/**
 * Interrupteur du chat public de prospection : désactivé par défaut. La limite
 * de débit (server/security/rate-limit.ts) est en mémoire et donc inefficace
 * sur Vercel, alors que chaque message appelle un modèle payant. À réactiver
 * (CHAT_PROSPECTION_ACTIF=true) seulement une fois un store partagé en place.
 */
export function chatProspectionActif(): boolean {
  return process.env.CHAT_PROSPECTION_ACTIF === "true";
}
