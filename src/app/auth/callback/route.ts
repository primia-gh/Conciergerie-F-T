import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { cheminInterneSur } from "@/lib/chemin-sur";

const TYPES_ACCEPTES: EmailOtpType[] = ["signup", "recovery", "invite", "magiclink", "email", "email_change"];

/**
 * Point d'arrivée des liens envoyés par e-mail (confirmation d'inscription,
 * mot de passe oublié, invitation). Deux formats possibles selon le modèle
 * d'e-mail Supabase : `?code=` (flux PKCE, le cas par défaut avec
 * @supabase/ssr) ou `?token_hash=&type=`. La session est ouverte ici, côté
 * serveur, puis la personne est envoyée vers `next` (chemin interne
 * uniquement) — sinon vers la connexion avec un message.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const suite = cheminInterneSur(searchParams.get("next")) ?? "/";
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let ok = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type && TYPES_ACCEPTES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    ok = !error;
  }

  if (!ok) {
    return NextResponse.redirect(new URL("/login?lien=expire", origin));
  }
  // Un lien de réinitialisation mène toujours au choix du nouveau mot de passe.
  const destination = type === "recovery" ? "/nouveau-mot-de-passe" : suite;
  return NextResponse.redirect(new URL(destination, origin));
}
