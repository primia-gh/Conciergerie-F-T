import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase pour Server Components / Server Actions / Route Handlers.
 * `setAll` échoue silencieusement quand appelé depuis un Server Component
 * (les cookies n'y sont pas modifiables) — le rafraîchissement de session
 * est alors géré par `src/proxy.ts`.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Appelé depuis un Server Component : ignoré, voir proxy.ts.
          }
        },
      },
    },
  );
}
