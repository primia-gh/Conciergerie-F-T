import { beforeEach, describe, expect, it, vi } from "vitest";
import { fauxSupabase, type Operation } from "../../../test/fake-supabase";

const { assertRole, createClient, ecrireAuJournal, revalidatePath } = vi.hoisted(() => ({
  assertRole: vi.fn(),
  createClient: vi.fn(),
  ecrireAuJournal: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/server/auth/guards", () => ({ assertRole }));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/lib/agent/journal", () => ({ ecrireAuJournal }));
vi.mock("next/cache", () => ({ revalidatePath }));

import { toutRemettreEnPropose } from "./ft-admin";

const REGLES = [
  { id: "r1", tache: "relance_prospect_48h", niveau_autonomie: "agit_seul", version: 3 },
  { id: "r2", tache: "envoi_infos_arrivee", niveau_autonomie: "agit_apres_validation", version: 1 },
];

function installer(repondre: (operation: Operation) => unknown) {
  const { client, operations } = fauxSupabase(repondre);
  createClient.mockResolvedValue(client);
  return operations;
}

beforeEach(() => {
  vi.clearAllMocks();
  assertRole.mockResolvedValue({ id: "admin" });
});

describe("toutRemettreEnPropose", () => {
  it("ne lit que les tâches F&T actives qui ne sont pas déjà à « Propose »", async () => {
    const operations = installer(() => ({ data: [], error: null }));
    await toutRemettreEnPropose();

    const lecture = operations.find((o) => o.op === "select" && o.table === "regle");
    expect(lecture?.filtres).toEqual(
      expect.arrayContaining([
        ["eq:activite", "ft"],
        ["eq:actif", true],
        ["in:niveau_autonomie", ["agit_apres_validation", "agit_seul"]],
      ]),
    );
    expect(operations.some((o) => o.op === "update")).toBe(false);
    expect(ecrireAuJournal).not.toHaveBeenCalled();
  });

  it("remet chaque tâche à « Propose », en nouvelle version, et l'écrit au journal", async () => {
    const operations = installer((o) => (o.op === "select" ? { data: REGLES, error: null } : { error: null }));
    await toutRemettreEnPropose();

    const misesAJour = operations.filter((o) => o.op === "update");
    expect(misesAJour.map((o) => [o.filtres, o.payload])).toEqual([
      [[["eq:id", "r1"]], { niveau_autonomie: "propose", version: 4 }],
      [[["eq:id", "r2"]], { niveau_autonomie: "propose", version: 2 }],
    ]);
    expect(ecrireAuJournal).toHaveBeenCalledTimes(2);
    expect(ecrireAuJournal).toHaveBeenCalledWith(
      expect.objectContaining({
        activite: "ft",
        type: "changement_autonomie",
        entiteId: "r1",
        auteur: "gerant",
        decision: expect.stringContaining("agit_seul → propose"),
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/admin/ft/regles");
  });

  it("n'écrit rien au journal pour une tâche dont la mise à jour a échoué", async () => {
    installer((o) =>
      o.op === "select"
        ? { data: REGLES, error: null }
        : { error: o.filtres[0]?.[1] === "r1" ? { message: "refus" } : null },
    );
    await toutRemettreEnPropose();

    expect(ecrireAuJournal).toHaveBeenCalledTimes(1);
    expect(ecrireAuJournal).toHaveBeenCalledWith(expect.objectContaining({ entiteId: "r2" }));
  });
});
