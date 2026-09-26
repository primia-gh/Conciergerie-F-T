import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FORFAITS,
  forfaitSuperieur,
  pointsForts,
  prixAffiche,
  recommanderForfait,
  type Accompagnement,
  type Frequence,
} from "./forfaits";

/** Lignes de `insert into public.plans` dans seed.sql : code, limite, concierge dédié. */
function forfaitsDuSeed() {
  const seed = readFileSync(join(process.cwd(), "src/server/db/seed.sql"), "utf8");
  const bloc = seed.slice(seed.indexOf("insert into public.plans"));
  return [...bloc.matchAll(/\('(\w+)', '[^']+', \d+, (null|\d+), (true|false),/g)].map((m) => ({
    code: m[1],
    limite: m[2] === "null" ? null : Number(m[2]),
    dedie: m[3] === "true",
  }));
}

describe("FORFAITS", () => {
  it("reprend les forfaits, les limites et le concierge dédié de la table plans", () => {
    const seed = forfaitsDuSeed();
    expect(seed.map((s) => s.code)).toEqual(FORFAITS.map((f) => f.code));
    for (const s of seed) {
      const f = FORFAITS.find((x) => x.code === s.code)!;
      expect(f.demandesParMois, s.code).toBe(s.limite);
      expect(f.conciergeDedie, s.code).toBe(s.dedie);
    }
  });

  it("n'affiche aucun prix chiffré ni délai de réponse (décisions du 2026-09-26)", () => {
    for (const f of FORFAITS) {
      const textes = [prixAffiche(f), f.accroche, ...pointsForts(f)].join(" ");
      expect(textes).not.toMatch(/\d+\s*€|€\s*\d+/);
      expect(textes).not.toMatch(/\d+\s*h\b|heures?|jours?/i);
    }
  });

  it("propose le forfait supérieur, et rien au-dessus du dernier", () => {
    expect(forfaitSuperieur("free")?.code).toBe("premium");
    expect(forfaitSuperieur("vip")?.code).toBe("private");
    expect(forfaitSuperieur("private")).toBeUndefined();
    expect(forfaitSuperieur("inconnu")).toBeUndefined();
  });
});

describe("recommanderForfait", () => {
  it("suit la fréquence quand un service standard suffit", () => {
    expect(recommanderForfait({ frequence: "occasionnelle", accompagnement: "standard" })).toBe("free");
    expect(recommanderForfait({ frequence: "reguliere", accompagnement: "standard" })).toBe("premium");
    expect(recommanderForfait({ frequence: "frequente", accompagnement: "standard" })).toBe("vip");
  });

  it("fait passer l'accompagnement souhaité avant la fréquence", () => {
    expect(recommanderForfait({ frequence: "occasionnelle", accompagnement: "dedie" })).toBe("vip");
    expect(recommanderForfait({ frequence: "occasionnelle", accompagnement: "sur_mesure" })).toBe("private");
  });

  it("conseille toujours un forfait dont la limite couvre la fréquence annoncée", () => {
    const besoin: Record<Frequence, number> = { occasionnelle: 2, reguliere: 10, frequente: 11 };
    for (const frequence of Object.keys(besoin) as Frequence[]) {
      for (const accompagnement of ["standard", "dedie", "sur_mesure"] as Accompagnement[]) {
        const f = FORFAITS.find((x) => x.code === recommanderForfait({ frequence, accompagnement }))!;
        if (f.demandesParMois !== null) expect(f.demandesParMois).toBeGreaterThanOrEqual(besoin[frequence]);
      }
    }
  });
});
