import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { dernieresVersions } from "@/lib/agent/fiches-modele";
import type { ActiviteMetier } from "@/lib/agent/types";

export type LigneFiche = {
  logement_id: string | null;
  activite: string;
  section: string;
  version: number;
  contenu: string;
  created_at: string;
};

export type ResumeFiches = {
  /** Dernière version de chaque section globale, clé `${activite}::${section}`. */
  globales: Record<string, LigneFiche>;
  /** Dernières versions des sections de chaque logement, par identifiant de logement. */
  parLogement: Record<string, LigneFiche[]>;
};

/**
 * Regroupe des lignes de `fiche_connaissance` (toutes versions confondues) en
 * « dernière version de chaque section », séparément pour les fiches globales
 * de chaque activité et pour chaque logement.
 */
export function resumerFiches(lignes: LigneFiche[]): ResumeFiches {
  const globales: Record<string, LigneFiche> = {};
  const parLogementBrut = new Map<string, LigneFiche[]>();

  for (const ligne of lignes) {
    if (ligne.logement_id === null) {
      const cle = `${ligne.activite}::${ligne.section}`;
      const actuelle = globales[cle];
      if (!actuelle || ligne.version > actuelle.version) globales[cle] = ligne;
    } else {
      parLogementBrut.set(ligne.logement_id, [...(parLogementBrut.get(ligne.logement_id) ?? []), ligne]);
    }
  }

  const parLogement: Record<string, LigneFiche[]> = {};
  for (const [logementId, rows] of parLogementBrut) parLogement[logementId] = dernieresVersions(rows);

  return { globales, parLogement };
}

/** Une seule requête pour le hub : dernière version de chaque section, globale ou par logement. */
export async function lireResumeFiches(supabase: SupabaseClient): Promise<ResumeFiches> {
  const { data } = await supabase
    .from("fiche_connaissance")
    .select("logement_id, activite, section, version, contenu, created_at")
    .order("version", { ascending: false })
    .returns<LigneFiche[]>();

  return resumerFiches(data ?? []);
}

export type VersionFiche = {
  id: string;
  version: number;
  contenu: string;
  auteur: string | null;
  created_at: string;
};

/** Toutes les versions d'une section, de la plus récente à la plus ancienne. */
export async function lireVersions(
  supabase: SupabaseClient,
  portee: { activite: ActiviteMetier; logementId: string | null; section: string },
): Promise<VersionFiche[]> {
  let requete = supabase
    .from("fiche_connaissance")
    .select("id, version, contenu, auteur, created_at")
    .eq("activite", portee.activite)
    .eq("section", portee.section);
  requete = portee.logementId ? requete.eq("logement_id", portee.logementId) : requete.is("logement_id", null);

  const { data } = await requete.order("version", { ascending: false }).returns<VersionFiche[]>();
  return data ?? [];
}
