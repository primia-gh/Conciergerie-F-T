/**
 * Dates affichées dans les espaces connectés, toujours à l'heure de Paris :
 * le serveur (Vercel) tourne en UTC, sans quoi « aujourd'hui » changerait de
 * jour à 22 h ou 23 h.
 */
const FUSEAU = "Europe/Paris";

export function dateCourte(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: FUSEAU });
}

export function dateLongue(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: FUSEAU,
  });
}

export function heure(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: FUSEAU });
}

export function moisAnnee(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: FUSEAU });
}

/** « à l'instant », « il y a 5 min », « il y a 3 h », « hier », « il y a 4 jours », puis la date. */
export function ilYa(iso: string, maintenant: number = Date.now()): string {
  const minutes = Math.floor((maintenant - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  const jours = Math.floor(heures / 24);
  if (jours === 1) return "hier";
  if (jours < 7) return `il y a ${jours} jours`;
  return dateCourte(iso);
}

/** Montant en euros, sans centimes quand ils sont nuls (« 1 250 € », « 89,50 € »). */
export function euros(montant: string | number): string {
  const n = typeof montant === "number" ? montant : Number(montant);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
}
