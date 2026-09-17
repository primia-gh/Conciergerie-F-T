import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase avec la service role key : bypass la RLS.
 * Réservé au code serveur qui agit sans session utilisateur (agent IA,
 * tâches planifiées, webhooks) — jamais utilisé depuis le navigateur ni
 * exposé à une Server Action déclenchée directement par une requête cliente
 * sans contrôle d'accès applicatif équivalent.
 */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
