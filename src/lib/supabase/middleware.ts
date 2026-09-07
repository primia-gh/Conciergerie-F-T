import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/signup", "/signup/check-email", "/robots.txt", "/sitemap.xml"];

// Next.js suffixe les fichiers de convention (opengraph-image, icon...) d'un
// hash en production : on autorise le préfixe plutôt qu'une correspondance exacte.
const PUBLIC_PATH_PREFIXES = ["/opengraph-image", "/icon", "/apple-icon"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.includes(pathname) || PUBLIC_PATH_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // IMPORTANT : ne jamais retirer cet appel — il rafraîchit le token de
  // session côté serveur à chaque requête (voir doc Supabase SSR).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
