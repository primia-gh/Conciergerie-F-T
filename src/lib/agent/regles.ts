import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Activite, NiveauAutonomie } from "./types";

/**
 * Niveau d'autonomie réglé pour une tâche d'une activité, ou `null` si aucune
 * règle active n'existe. Le défaut à appliquer dans ce cas est propre à
 * l'appelant (le chat de prospection ne se comporte pas comme la relance),
 * d'où le `null` plutôt qu'une valeur imposée ici.
 *
 * Le filtre par activité est obligatoire : F&T et Premium peuvent avoir une
 * tâche du même nom, et l'une ne doit jamais masquer l'autre.
 */
export async function lireNiveauAutonomie(
  supabase: SupabaseClient,
  params: { activite: Activite; domaine: string; tache: string },
): Promise<NiveauAutonomie | null> {
  const { data } = await supabase
    .from("regle")
    .select("niveau_autonomie")
    .eq("activite", params.activite)
    .eq("domaine", params.domaine)
    .eq("tache", params.tache)
    .eq("actif", true)
    .maybeSingle();

  return (data?.niveau_autonomie as NiveauAutonomie | undefined) ?? null;
}
