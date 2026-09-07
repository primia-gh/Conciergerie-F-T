import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Reflète les colonnes telles que renvoyées par le client Supabase (snake_case,
 * comme en base) — volontairement distinct du type Drizzle (camelCase) pour ne
 * pas laisser croire que `.firstName` existerait ici alors que ce chemin de
 * lecture passe par PostgREST, pas par Drizzle.
 */
export type Profile = {
  id: string;
  role: "client" | "concierge" | "admin" | "partner";
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  locale: string;
};

/**
 * Utilisateur + profil applicatif courant, ou `null` si non connecté.
 * Ne lève jamais — les pages/layouts décident eux-mêmes de rediriger.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, first_name, last_name, avatar_url, locale")
    .eq("id", user.id)
    .single<Profile>();

  return profile ?? null;
}
