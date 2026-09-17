import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { prochainsCreneauxDisponibles } from "./agenda";

function fakeSupabase(rendezVousExistants: { creneau: string }[]): SupabaseClient {
  const query = {
    select: () => query,
    gte: () => query,
    lte: () => query,
    neq: () => Promise.resolve({ data: rendezVousExistants, error: null }),
  };
  return { from: () => query } as unknown as SupabaseClient;
}

describe("prochainsCreneauxDisponibles", () => {
  it("ne propose que des créneaux en semaine, dans le futur", async () => {
    const creneaux = await prochainsCreneauxDisponibles(fakeSupabase([]), 5);

    expect(creneaux.length).toBeGreaterThan(0);
    for (const c of creneaux) {
      expect(c.debut.getTime()).toBeGreaterThan(Date.now());
      const jour = c.debut.getDay();
      expect(jour).toBeGreaterThanOrEqual(1);
      expect(jour).toBeLessThanOrEqual(5);
    }
  });

  it("exclut un créneau déjà pris (avec le tampon)", async () => {
    const libres = await prochainsCreneauxDisponibles(fakeSupabase([]), 1);
    const premierCreneauLibre = libres[0]!.debut;

    const avecConflit = await prochainsCreneauxDisponibles(
      fakeSupabase([{ creneau: premierCreneauLibre.toISOString() }]),
      1,
    );

    expect(avecConflit[0]!.debut.getTime()).not.toBe(premierCreneauLibre.getTime());
  });

  it("ne plante pas et renvoie un tableau vide si le rate limit interne n'a rien à offrir", async () => {
    const creneaux = await prochainsCreneauxDisponibles(fakeSupabase([]), 0);
    expect(creneaux).toEqual([]);
  });
});
