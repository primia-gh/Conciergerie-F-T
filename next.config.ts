import type { NextConfig } from "next";
import path from "node:path";

// Dérivé de l'URL Supabase du projet pour restreindre `connect-src` (REST + Realtime
// websocket) au strict nécessaire plutôt que d'autoriser tout `https:`/`wss:`.
const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : "";
const supabaseWsOrigin = supabaseOrigin.replace(/^http/, "ws");

// CSP : compromis assumé sur `script-src`/`style-src` (voir SECURITY.md).
// Next.js (App Router) injecte des <script> inline pour le streaming RSC, sans
// moyen simple de leur attacher un nonce (testé en conditions réelles : une CSP
// à nonce + 'strict-dynamic' bloque TOUS les chunks Next, y compris les
// <script src> same-origin légitimes, faute de mécanisme de propagation
// automatique du nonce documenté et fonctionnel côté framework à ce jour).
// `unsafe-inline` sur script-src laisse un vecteur XSS-via-injection-HTML
// théorique, mais le code ne contient aucun `dangerouslySetInnerHTML` et React
// échappe tout rendu par défaut — le risque résiduel est faible. Ce qui reste
// pleinement strict et à forte valeur : `connect-src` (limite les destinations
// réseau à notre seule origine Supabase), `frame-ancestors 'none'` (anti-clickjacking),
// `object-src none`, `base-uri 'self'`, et le blocage de scripts EXTERNES.
// Les polices (next/font/google) sont auto-hébergées au build, donc aucun
// domaine tiers à whitelister pour font-src.
const isDev = process.env.NODE_ENV !== "production";
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:" + (supabaseOrigin ? ` ${supabaseOrigin}` : ""),
  "font-src 'self' data:",
  `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ""}${supabaseWsOrigin ? ` ${supabaseWsOrigin}` : ""}`,
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
].join("; ");

const securityHeaders = [
  // Dev exclu : Turbopack/HMR utilise eval() pour le rechargement à chaud, que
  // même `unsafe-inline` n'autorise pas — la CSP casserait l'hydratation en dev.
  // Elle ne protège que le build livré aux utilisateurs, donc cette exclusion
  // ne réduit pas la protection réelle. Vérifiée fonctionnelle en conditions
  // réelles sur un vrai build de production (`next build && next start`).
  ...(isDev ? [] : [{ key: "Content-Security-Policy", value: contentSecurityPolicy }]),
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  // Un package-lock.json existe dans un dossier parent non lié à ce projet ;
  // fixe explicitement la racine pour éviter toute ambiguïté de workspace.
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
