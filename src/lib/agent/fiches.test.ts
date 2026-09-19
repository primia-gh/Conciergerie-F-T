import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { lireFichesPourAssistant } from "./fiches";

type Ligne = {
  id: string;
  logement_id: string | null;
  activite: string;
  section: string;
  version: number;
  contenu: string;
};

/** Faux client Supabase qui enregistre chaque appel pour vérifier les filtres posés. */
function fakeSupabase(lignes: Ligne[]) {
  const appels: { tables: string[]; filtres: Record<string, unknown> } = { tables: [], filtres: {} };
  const requete = {
    select: () => requete,
    in: (colonne: string, valeurs: unknown) => {
      appels.filtres[`in:${colonne}`] = valeurs;
      return requete;
    },
    is: (colonne: string, valeur: unknown) => {
      appels.filtres[`is:${colonne}`] = valeur;
      return requete;
    },
    or: (expression: string) => {
      appels.filtres.or = expression;
      return requete;
    },
    order: () => requete,
    returns: () => Promise.resolve({ data: lignes, error: null }),
  };
  const supabase = {
    from: (table: string) => {
      appels.tables.push(table);
      return requete;
    },
  } as unknown as SupabaseClient;
  return { supabase, appels };
}

const LOGEMENT_A = "11111111-1111-4111-8111-111111111111";

describe("lireFichesPourAssistant", () => {
  it("ne lit que les fiches de l'activité choisie et les fiches communes", async () => {
    const { supabase, appels } = fakeSupabase([]);

    await lireFichesPourAssistant(supabase, { activite: "premium" });

    expect(appels.filtres["in:activite"]).toEqual(["premium", "commun"]);
  });

  it("sans logement, ne lit que les fiches globales", async () => {
    const { supabase, appels } = fakeSupabase([]);

    await lireFichesPourAssistant(supabase, { activite: "ft" });

    expect(appels.filtres["is:logement_id"]).toBeNull();
    expect(appels.filtres.or).toBeUndefined();
  });

  it("avec un logement, lit ses fiches et les fiches globales, jamais celles d'un autre", async () => {
    const { supabase, appels } = fakeSupabase([]);

    await lireFichesPourAssistant(supabase, { activite: "ft", logementId: LOGEMENT_A });

    expect(appels.filtres.or).toBe(`logement_id.is.null,logement_id.eq.${LOGEMENT_A}`);
  });

  it("ne touche jamais à la table des secrets", async () => {
    const { supabase, appels } = fakeSupabase([]);

    await lireFichesPourAssistant(supabase, { activite: "ft", logementId: LOGEMENT_A });

    expect(appels.tables).toEqual(["fiche_connaissance"]);
  });

  it("refuse un logement pour l'activité Premium", async () => {
    const { supabase } = fakeSupabase([]);

    await expect(
      lireFichesPourAssistant(supabase, { activite: "premium", logementId: LOGEMENT_A }),
    ).rejects.toThrow(/F&T/);
  });

  it("refuse un identifiant de logement qui n'est pas un UUID (pas d'injection dans le filtre)", async () => {
    const { supabase, appels } = fakeSupabase([]);

    await expect(
      lireFichesPourAssistant(supabase, {
        activite: "ft",
        logementId: "x),activite.eq.premium,(logement_id.is.null",
      }),
    ).rejects.toThrow(/invalide/);
    expect(appels.tables).toEqual([]);
  });

  it("ne garde que la dernière version de chaque section", async () => {
    const { supabase } = fakeSupabase([
      { id: "v3", activite: "ft", logement_id: null, section: "offre_ft", version: 3, contenu: "récente" },
      { id: "v2", activite: "ft", logement_id: null, section: "offre_ft", version: 2, contenu: "ancienne" },
      { id: "r1", activite: "ft", logement_id: null, section: "regles", version: 1, contenu: "règles" },
    ]);

    const fiches = await lireFichesPourAssistant(supabase, { activite: "ft" });

    expect(fiches.map((f) => [f.section, f.version, f.contenu])).toEqual([
      ["offre_ft", 3, "récente"],
      ["regles", 1, "règles"],
    ]);
  });

  it("distingue une même section globale et celle d'un logement", async () => {
    const { supabase } = fakeSupabase([
      { id: "g", activite: "ft", logement_id: null, section: "regles", version: 1, contenu: "globales" },
      { id: "l", activite: "ft", logement_id: LOGEMENT_A, section: "regles", version: 1, contenu: "du logement" },
    ]);

    const fiches = await lireFichesPourAssistant(supabase, { activite: "ft", logementId: LOGEMENT_A });

    expect(fiches).toHaveLength(2);
  });

  it("écarte de toute façon une fiche de l'autre activité ou d'un autre logement, même si la base la renvoie", async () => {
    const AUTRE = "99999999-9999-4999-8999-999999999999";
    const { supabase } = fakeSupabase([
      { id: "ok-globale", activite: "ft", logement_id: null, section: "regles", version: 1, contenu: "globale F&T" },
      { id: "ok-commune", activite: "commun", logement_id: null, section: "faq", version: 1, contenu: "commune" },
      { id: "ok-logement", activite: "ft", logement_id: LOGEMENT_A, section: "acces", version: 1, contenu: "logement A" },
      { id: "fuite-premium", activite: "premium", logement_id: null, section: "offre_premium", version: 1, contenu: "Premium" },
      { id: "fuite-autre-logement", activite: "ft", logement_id: AUTRE, section: "acces", version: 9, contenu: "logement B" },
    ]);

    const fiches = await lireFichesPourAssistant(supabase, { activite: "ft", logementId: LOGEMENT_A });

    expect(fiches.map((f) => f.id).sort()).toEqual(["ok-commune", "ok-globale", "ok-logement"]);
  });

  it("sans logement, écarte aussi toute fiche de logement renvoyée par erreur", async () => {
    const { supabase } = fakeSupabase([
      { id: "globale", activite: "ft", logement_id: null, section: "regles", version: 1, contenu: "g" },
      { id: "fuite", activite: "ft", logement_id: LOGEMENT_A, section: "acces", version: 1, contenu: "l" },
    ]);

    const fiches = await lireFichesPourAssistant(supabase, { activite: "ft" });

    expect(fiches.map((f) => f.id)).toEqual(["globale"]);
  });

  it("remonte une erreur de lecture au lieu de continuer sans fiche", async () => {
    const requete = {
      select: () => requete,
      in: () => requete,
      is: () => requete,
      order: () => requete,
      returns: () => Promise.resolve({ data: null, error: { message: "panne" } }),
    };
    const supabase = { from: () => requete } as unknown as SupabaseClient;

    await expect(lireFichesPourAssistant(supabase, { activite: "ft" })).rejects.toThrow(/panne/);
  });
});
