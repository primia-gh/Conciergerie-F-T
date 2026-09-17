import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Agenda maison (L1) : pas d'outil externe (Google Calendar, Calendly...),
 * juste des créneaux fixes en semaine avec un tampon entre deux rendez-vous.
 * Source unique de vérité : la table `rendez_vous` elle-même — un créneau
 * est "pris" dès qu'une ligne existe à moins de BUFFER_MINUTES de lui.
 */
const JOURS_OUVRES = [1, 2, 3, 4, 5]; // lundi-vendredi (0 = dimanche)
const HEURES_CRENEAUX = [9, 10, 11, 14, 15, 16, 17];
const BUFFER_MINUTES = 30;
const NB_CRENEAUX_PROPOSES = 5;
const HORIZON_JOURS = 21;

export type CreneauDisponible = { debut: Date; label: string };

function formatCreneau(date: Date): string {
  return date.toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

export async function prochainsCreneauxDisponibles(
  supabase: SupabaseClient,
  count = NB_CRENEAUX_PROPOSES,
): Promise<CreneauDisponible[]> {
  const now = new Date();
  const horizon = new Date(now.getTime() + HORIZON_JOURS * 24 * 60 * 60 * 1000);

  const { data: existants, error } = await supabase
    .from("rendez_vous")
    .select("creneau")
    .gte("creneau", now.toISOString())
    .lte("creneau", horizon.toISOString())
    .neq("statut", "annule");

  if (error) throw new Error(`Impossible de lire l'agenda : ${error.message}`);

  const prisMs = (existants ?? []).map((r) => new Date(r.creneau as string).getTime());
  const disponibles: CreneauDisponible[] = [];

  for (let jour = 0; jour < HORIZON_JOURS && disponibles.length < count; jour++) {
    const date = new Date(now.getTime() + jour * 24 * 60 * 60 * 1000);
    if (!JOURS_OUVRES.includes(date.getDay())) continue;

    for (const heure of HEURES_CRENEAUX) {
      const debut = new Date(date);
      debut.setHours(heure, 0, 0, 0);
      if (debut.getTime() <= now.getTime() + 60 * 60 * 1000) continue; // au moins 1h de délai

      const enConflit = prisMs.some(
        (t) => Math.abs(t - debut.getTime()) < BUFFER_MINUTES * 60 * 1000,
      );
      if (!enConflit) {
        disponibles.push({ debut, label: formatCreneau(debut) });
        if (disponibles.length >= count) break;
      }
    }
  }

  return disponibles;
}

export function formatCreneauxPourPrompt(creneaux: CreneauDisponible[]): string {
  if (creneaux.length === 0) return "Aucun créneau disponible actuellement — proposer une transmission au gérant.";
  return creneaux.map((c) => `- ${c.label} (ISO: ${c.debut.toISOString()})`).join("\n");
}
