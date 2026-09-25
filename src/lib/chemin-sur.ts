/**
 * Adresse de retour acceptée après une connexion ou un lien reçu par e-mail
 * (paramètre `next`) : uniquement un chemin interne du site. Refuse tout ce
 * qui pourrait envoyer vers un autre domaine (`https://…`, `//exemple.com`,
 * `/\exemple.com`) — sans quoi un lien piégé pourrait rediriger un client
 * fraîchement connecté vers un faux site.
 */
export function cheminInterneSur(next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/")) return null;
  if (next.startsWith("//") || next.startsWith("/\\")) return null;
  // Caractères de contrôle (retour à la ligne, tabulation…) : jamais dans un chemin légitime.
  if ([...next].some((c) => c.charCodeAt(0) < 0x20)) return null;
  return next;
}
