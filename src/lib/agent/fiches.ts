import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { ActiviteMetier } from "./types";

export type FicheLue = {
  id: string;
  /** null = fiche globale de l'activité ; sinon fiche d'un logement F&T. */
  logementId: string | null;
  section: string;
  version: number;
  contenu: string;
};

const uuidSchema = z.string().uuid();

/**
 * Lit les fiches de connaissance que l'assistant a le droit d'utiliser, dans
 * leur dernière version. C'est le CODE qui décide quoi lire, jamais le modèle :
 *
 * - seules les fiches de l'activité choisie (et les fiches "commun") sont lues,
 *   donc un message F&T ne peut pas faire remonter une fiche Premium, ni
 *   l'inverse ;
 * - avec un logement, on lit ses fiches + les fiches globales, jamais celles
 *   d'un autre logement ;
 * - un logement n'existe que pour F&T : le demander pour Premium est refusé ;
 * - la table `secret_logement` (codes d'accès) n'est jamais lue ici.
 */
export async function lireFichesPourAssistant(
  supabase: SupabaseClient,
  params: { activite: ActiviteMetier; logementId?: string | null },
): Promise<FicheLue[]> {
  const { activite } = params;
  const logementId = params.logementId ?? null;

  if (logementId !== null) {
    if (activite !== "ft") {
      throw new Error("Un logement ne peut être indiqué que pour l'activité F&T.");
    }
    // Validé avant d'être placé dans un filtre : jamais de texte libre dans .or().
    if (!uuidSchema.safeParse(logementId).success) {
      throw new Error("Identifiant de logement invalide.");
    }
  }

  let requete = supabase
    .from("fiche_connaissance")
    .select("id, logement_id, section, version, contenu")
    .in("activite", [activite, "commun"]);

  requete =
    logementId === null
      ? requete.is("logement_id", null)
      : requete.or(`logement_id.is.null,logement_id.eq.${logementId}`);

  const { data, error } = await requete
    .order("version", { ascending: false })
    .returns<
      { id: string; logement_id: string | null; section: string; version: number; contenu: string }[]
    >();

  if (error) throw new Error(`Lecture des fiches impossible : ${error.message}`);

  // Triées par version décroissante : la première rencontrée pour une même
  // (portée, section) est la dernière version.
  const vues = new Set<string>();
  const fiches: FicheLue[] = [];
  for (const ligne of data ?? []) {
    const cle = `${ligne.logement_id ?? "global"}::${ligne.section}`;
    if (vues.has(cle)) continue;
    vues.add(cle);
    fiches.push({
      id: ligne.id,
      logementId: ligne.logement_id,
      section: ligne.section,
      version: ligne.version,
      contenu: ligne.contenu,
    });
  }

  return fiches.sort(
    (a, b) =>
      (a.logementId ?? "").localeCompare(b.logementId ?? "") || a.section.localeCompare(b.section),
  );
}
