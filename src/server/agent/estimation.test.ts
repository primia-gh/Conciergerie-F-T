import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServiceClient, ecrireAuJournal, alerterGerant, insertions } = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  ecrireAuJournal: vi.fn(),
  alerterGerant: vi.fn(),
  insertions: [] as { table: string; ligne: Record<string, unknown> }[],
}));

vi.mock("@/lib/supabase/service", () => ({ createServiceClient }));
vi.mock("@/lib/agent/journal", () => ({ ecrireAuJournal }));
vi.mock("@/lib/agent/alert", () => ({ alerterGerant }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "203.0.113.7" }) }));

import { demanderEstimation } from "./estimation";

function fausseBase() {
  let compteur = 0;
  return {
    from: (table: string) => ({
      insert: (ligne: Record<string, unknown>) => {
        insertions.push({ table, ligne });
        return { select: () => ({ single: async () => ({ data: { id: `id-${table}-${++compteur}` }, error: null }) }) };
      },
      delete: () => ({ eq: async () => ({ error: null }) }),
    }),
  };
}

function formulaire(valeurs: Record<string, string>) {
  const f = new FormData();
  const base = {
    nom: "Camille Martin",
    telephone: "06 12 34 56 78",
    email: "camille@example.invalid",
    ville: "Mulhouse",
    type: "Appartement",
    couchages: "4",
    residence: "secondaire",
    message: "Disponible en semaine.",
    consentement: "oui",
    site_web: "",
    debut: String(Date.now() - 60_000),
  };
  for (const [cle, valeur] of Object.entries({ ...base, ...valeurs })) f.set(cle, valeur);
  return f;
}

const initial = { statut: "initial" as const };

beforeEach(() => {
  vi.clearAllMocks();
  insertions.length = 0;
  createServiceClient.mockImplementation(fausseBase);
});

describe("demanderEstimation", () => {
  it("ignore sans rien écrire un envoi de robot (champ piège rempli)", async () => {
    const r = await demanderEstimation(initial, formulaire({ site_web: "http://spam.example" }));
    expect(r.statut).toBe("envoye");
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it("ignore sans rien écrire un envoi trop rapide pour un humain", async () => {
    const r = await demanderEstimation(initial, formulaire({ debut: String(Date.now()) }));
    expect(r.statut).toBe("envoye");
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it("refuse un formulaire sans téléphone, et garde la saisie", async () => {
    const r = await demanderEstimation(initial, formulaire({ telephone: "" }));
    expect(r.statut).toBe("erreur");
    expect(r.erreur).toMatch(/téléphone/);
    expect(r.champs?.nom).toBe("Camille Martin");
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it("refuse un formulaire sans consentement", async () => {
    const r = await demanderEstimation(initial, formulaire({ consentement: "" }));
    expect(r.statut).toBe("erreur");
    expect(r.erreur).toMatch(/Cochez/);
  });

  it("enregistre le propriétaire, son bien et une ligne de journal", async () => {
    const r = await demanderEstimation(initial, formulaire({ telephone: "06 00 00 00 01" }));
    expect(r.statut).toBe("envoye");

    const proprietaire = insertions.find((i) => i.table === "proprietaire")?.ligne;
    expect(proprietaire).toMatchObject({ nom: "Camille Martin", statut: "prospect", source: "formulaire_estimation", ville: "Mulhouse" });
    const bien = insertions.find((i) => i.table === "bien_prospect")?.ligne;
    expect(bien).toMatchObject({ type: "Appartement", capacite: 4, residence_principale: false });

    expect(ecrireAuJournal).toHaveBeenCalledWith(
      expect.objectContaining({ activite: "ft", type: "demande_estimation", entiteType: "bien_prospect" }),
    );
  });

  it("confirme la demande même si l'e-mail d'alerte au Gérant échoue", async () => {
    alerterGerant.mockRejectedValueOnce(new Error("Resend indisponible"));
    const r = await demanderEstimation(initial, formulaire({ telephone: "06 00 00 00 02" }));
    expect(r.statut).toBe("envoye");
  });
});
