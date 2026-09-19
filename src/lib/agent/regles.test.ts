import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { lireNiveauAutonomie } from "./regles";

function fakeSupabase(ligne: { niveau_autonomie: string } | null) {
  const filtres: Record<string, unknown> = {};
  const requete = {
    select: () => requete,
    eq: (colonne: string, valeur: unknown) => {
      filtres[colonne] = valeur;
      return requete;
    },
    maybeSingle: () => Promise.resolve({ data: ligne, error: null }),
  };
  return { supabase: { from: () => requete } as unknown as SupabaseClient, filtres };
}

describe("lireNiveauAutonomie", () => {
  it("filtre toujours par activité, domaine, tâche et règle active", async () => {
    const { supabase, filtres } = fakeSupabase({ niveau_autonomie: "agit_seul" });

    const niveau = await lireNiveauAutonomie(supabase, {
      activite: "premium",
      domaine: "communication",
      tache: "reponse_factuelle",
    });

    expect(niveau).toBe("agit_seul");
    expect(filtres).toEqual({
      activite: "premium",
      domaine: "communication",
      tache: "reponse_factuelle",
      actif: true,
    });
  });

  it("renvoie null quand aucune règle active n'existe", async () => {
    const { supabase } = fakeSupabase(null);

    const niveau = await lireNiveauAutonomie(supabase, {
      activite: "ft",
      domaine: "communication",
      tache: "inconnue",
    });

    expect(niveau).toBeNull();
  });
});
