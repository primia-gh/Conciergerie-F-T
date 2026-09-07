import "server-only";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Rate limiter fenêtre glissante, en mémoire du processus Node.
 *
 * LIMITE CONNUE (voir SECURITY.md) : suffisant pour un serveur mono-instance
 * (dev local, `next start` sur une seule machine), mais INSUFFISANT sur une
 * plateforme serverless multi-instance (Vercel) où chaque invocation peut
 * s'exécuter sur un process différent sans état partagé — un attaquant
 * distribué contournerait ce compteur. Avant un vrai lancement production,
 * remplacer par un store partagé (Upstash Redis + `@upstash/ratelimit`, ou
 * le Firewall natif de Vercel). Documenté ici plutôt que présenté comme une
 * protection production-ready qu'il n'est pas encore.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count += 1;
  return true;
}
