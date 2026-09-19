import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fauxSupabase } from "../../../test/fake-supabase";
import { lireVersions, resumerFiches, type LigneFiche } from "./fiches-lecture";

const L1 = "11111111-1111-4111-8111-111111111111";
const L2 = "22222222-2222-4222-8222-222222222222";

const ligne = (partiel: Partial<LigneFiche>): LigneFiche => ({
  logement_id: null,
  activite: "ft",
  section: "offre_ft",
  version: 1,
  contenu: "x",
  created_at: "2026-09-19T10:00:00Z",
  ...partiel,
});

describe("resumerFiches", () => {
  it("garde la dernière version de chaque section globale, séparément par activité", () => {
    const r = resumerFiches([
      ligne({ activite: "ft", section: "offre_ft", version: 1 }),
      ligne({ activite: "ft", section: "offre_ft", version: 3 }),
      ligne({ activite: "premium", section: "faq_premium", version: 2 }),
    ]);

    expect(r.globales["ft::offre_ft"]!.version).toBe(3);
    expect(r.globales["premium::faq_premium"]!.version).toBe(2);
    expect(Object.keys(r.globales)).toHaveLength(2);
  });

  it("sépare les fiches de chaque logement et garde leur dernière version", () => {
    const r = resumerFiches([
      ligne({ logement_id: L1, section: "acces", version: 1, contenu: "ancien" }),
      ligne({ logement_id: L1, section: "acces", version: 2, contenu: "récent" }),
      ligne({ logement_id: L1, section: "regles", version: 1 }),
      ligne({ logement_id: L2, section: "acces", version: 1 }),
    ]);

    expect(r.parLogement[L1]!.map((f) => `${f.section}:${f.version}`).sort()).toEqual(["acces:2", "regles:1"]);
    expect(r.parLogement[L2]).toHaveLength(1);
  });

  it("ne mélange pas les fiches globales et celles d'un logement de même section", () => {
    const r = resumerFiches([
      ligne({ section: "regles", version: 1 }),
      ligne({ logement_id: L1, section: "regles", version: 5 }),
    ]);

    expect(r.globales["ft::regles"]!.version).toBe(1);
    expect(r.parLogement[L1]![0]!.version).toBe(5);
  });

  it("renvoie des résumés vides pour aucune ligne", () => {
    expect(resumerFiches([])).toEqual({ globales: {}, parLogement: {} });
  });
});

describe("lireVersions", () => {
  it("filtre par activité, section et logement, ou fiches globales sans logement", async () => {
    const { client, operations } = fauxSupabase(() => ({ data: [] }));

    await lireVersions(client as unknown as SupabaseClient, { activite: "ft", logementId: L1, section: "acces" });
    await lireVersions(client as unknown as SupabaseClient, { activite: "premium", logementId: null, section: "faq_premium" });

    expect(operations[0]!.filtres).toEqual([
      ["eq:activite", "ft"],
      ["eq:section", "acces"],
      ["eq:logement_id", L1],
    ]);
    expect(operations[1]!.filtres).toEqual([
      ["eq:activite", "premium"],
      ["eq:section", "faq_premium"],
      ["is:logement_id", null],
    ]);
  });

  it("renvoie un tableau vide quand rien n'est trouvé", async () => {
    const { client } = fauxSupabase(() => ({ data: null }));

    const r = await lireVersions(client as unknown as SupabaseClient, {
      activite: "ft",
      logementId: null,
      section: "offre_ft",
    });

    expect(r).toEqual([]);
  });
});
