import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/signup/check-email",
  "/confidentialite",
  "/compte-supprime",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/proprietaires", // chat de prospection F&T (lot L1), public par nature
  "/location", // accueil du site public F&T (étape 3a)
  "/premium", // accueil du site public Premium, anciennement "/" (étape 3a)
  "/mot-de-passe-oublie", // demande d'un lien de réinitialisation (lot A)
  "/nouveau-mot-de-passe", // la page vérifie elle-même la session ouverte par le lien
  "/auth/callback", // arrivée des liens reçus par e-mail (confirmation, réinitialisation)
];

// Next.js suffixe les fichiers de convention (opengraph-image, icon...) d'un
// hash en production : on autorise le préfixe plutôt qu'une correspondance exacte.
// `/guide/` et `/proprietaire/` : liens envoyés au voyageur et au propriétaire,
// ouverts sans compte (identifiant UUID non devinable, contrôle dans la page).
// La barre finale évite d'ouvrir par erreur `/guides…` ou `/proprietaire-…`.
const PUBLIC_PATH_PREFIXES = [
  "/opengraph-image",
  "/premium/opengraph-image", // images d'aperçu des accueils, lues par les réseaux sociaux sans compte
  "/location/opengraph-image",
  "/icon",
  "/apple-icon",
  "/guide/",
  "/proprietaire/",
];

export function isPublicPath(pathname: string) {
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

  // Les routes /api/* gèrent elles-mêmes leur autorisation (ex. le jeton
  // Bearer de /api/cron/relances) : les rediriger vers /login n'aurait pas
  // de sens pour un appelant qui n'est pas un navigateur.
  const estApi = request.nextUrl.pathname.startsWith("/api/");

  if (!user && !estApi && !isPublicPath(request.nextUrl.pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
