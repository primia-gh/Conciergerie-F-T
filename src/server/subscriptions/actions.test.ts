import { beforeEach, describe, expect, it, vi } from "vitest";
import { fauxSupabase, type Operation } from "../../../test/fake-supabase";

const { assertRole, createClient, getClientQuota, ecrireAuJournal, alerterGerant, revalidatePath } = vi.hoisted(() => ({
  assertRole: vi.fn(),
  createClient: vi.fn(),
  getClientQuota: vi.fn(),
  ecrireAuJournal: vi.fn(),
  alerterGerant: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/server/auth/guards", () => ({ assertRole }));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/server/subscriptions/quota", () => ({ getClientQuota }));
vi.mock("@/lib/agent/journal", () => ({ ecrireAuJournal }));
vi.mock("@/lib/agent/alert", () => ({ alerterGerant }));
vi.mock("next/cache", () => ({ revalidatePath }));

import { activerForfait, annulerDemandeForfait, demanderForfait, ignorerDemandeForfait } from "./actions";

const CLIENT = "11111111-1111-4111-8111-111111111111";
const ANCIEN_ABONNEMENT = "22222222-2222-4222-8222-222222222222";

function installer(repondre: (operation: Operation) => unknown) {
  const { client, operations } = fauxSupabase(repondre);
  createClient.mockResolvedValue(client);
  return operations;
}

const miseAJour = (ops: Operation[], table: string) => ops.filter((o) => o.table === table && o.op === "update");

beforeEach(() => {
  vi.clearAllMocks();
  assertRole.mockResolvedValue({ id: CLIENT, first_name: "Julie", last_name: "Moreau" });
  getClientQuota.mockResolvedValue({ planCode: "free", planName: "Free" });
});

describe("demanderForfait (client)", () => {
  it("refuse tout appelant qui n'est pas client : aucune base, aucun journal", async () => {
    assertRole.mockRejectedValue(new Error("Action non autorisée pour ce rôle."));
    await expect(demanderForfait("vip")).rejects.toThrow("non autorisée");
    expect(assertRole).toHaveBeenCalledWith("client");
    expect(createClient).not.toHaveBeenCalled();
    expect(ecrireAuJournal).not.toHaveBeenCalled();
  });

  it("refuse un forfait inconnu ou déjà actif", async () => {
    installer(() => ({ data: null, error: null }));
    expect((await demanderForfait("platine")).error).toMatch(/n'existe pas/);
    expect((await demanderForfait("free")).error).toMatch(/déjà votre forfait/);
    expect(ecrireAuJournal).not.toHaveBeenCalled();
  });

  it("range la demande dans les préférences du client sans effacer le reste, et l'écrit au journal", async () => {
    const operations = installer((o) =>
      o.op === "select" ? { data: { preferences: { langue: "fr" } }, error: null } : { error: null },
    );
    const r = await demanderForfait("vip");
    expect(r).toEqual({ error: null, success: true });

    const [maj] = miseAJour(operations, "client_profiles");
    expect(maj.filtres).toEqual([["eq:profile_id", CLIENT]]);
    expect(maj.payload).toMatchObject({ preferences: { langue: "fr", demande_forfait: { code: "vip" } } });
    expect(ecrireAuJournal).toHaveBeenCalledWith(
      expect.objectContaining({ activite: "premium", type: "demande_changement_forfait", entiteId: CLIENT, auteur: "client" }),
    );
  });

  it("confirme la demande même si l'e-mail au Gérant échoue", async () => {
    installer((o) => (o.op === "select" ? { data: { preferences: {} }, error: null } : { error: null }));
    alerterGerant.mockRejectedValueOnce(new Error("Resend indisponible"));
    expect((await demanderForfait("premium")).success).toBe(true);
  });
});

describe("annulerDemandeForfait (client)", () => {
  it("retire la demande en cours et l'écrit au journal", async () => {
    const operations = installer((o) =>
      o.op === "select"
        ? { data: { preferences: { langue: "fr", demande_forfait: { code: "vip", le: "2026-09-26" } } }, error: null }
        : { error: null },
    );
    await annulerDemandeForfait();
    expect(miseAJour(operations, "client_profiles")[0].payload).toEqual({ preferences: { langue: "fr" } });
    expect(ecrireAuJournal).toHaveBeenCalledWith(expect.objectContaining({ type: "annulation_demande_forfait" }));
  });

  it("ne fait rien quand il n'y a pas de demande", async () => {
    const operations = installer(() => ({ data: { preferences: {} }, error: null }));
    await annulerDemandeForfait();
    expect(miseAJour(operations, "client_profiles")).toEqual([]);
    expect(ecrireAuJournal).not.toHaveBeenCalled();
  });
});

describe("activerForfait (Gérant)", () => {
  beforeEach(() => {
    // Bloc sans valeur de retour : une fonction renvoyée serait prise pour un nettoyage.
    assertRole.mockResolvedValue({ id: "gerant" });
  });

  it("exige le rôle admin", async () => {
    assertRole.mockRejectedValue(new Error("Action non autorisée pour ce rôle."));
    await expect(activerForfait(CLIENT, "vip")).rejects.toThrow("non autorisée");
    expect(assertRole).toHaveBeenCalledWith("admin");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("refuse un identifiant de client douteux ou un forfait inconnu", async () => {
    installer(() => ({ data: null, error: null }));
    expect((await activerForfait("../x", "vip")).error).toMatch(/introuvable/);
    expect((await activerForfait(CLIENT, "platine")).error).toMatch(/n'existe pas/);
  });

  it("crée l'abonnement, le rattache, clôt la demande puis l'ancien abonnement, et l'écrit au journal", async () => {
    const operations = installer((o) => {
      if (o.table === "client_profiles" && o.op === "select")
        return { data: { preferences: { demande_forfait: { code: "vip", le: "x" } }, subscription_id: ANCIEN_ABONNEMENT }, error: null };
      if (o.table === "plans") return { data: { id: "plan-vip" }, error: null };
      if (o.table === "subscriptions" && o.op === "insert") return { data: { id: "abo-neuf" }, error: null };
      return { error: null };
    });
    expect((await activerForfait(CLIENT, "vip")).success).toBe(true);

    const insertion = operations.find((o) => o.table === "subscriptions" && o.op === "insert");
    expect(insertion?.payload).toEqual({ client_id: CLIENT, plan_id: "plan-vip", status: "active" });
    expect(miseAJour(operations, "client_profiles")[0].payload).toEqual({ subscription_id: "abo-neuf", preferences: {} });
    const cloture = miseAJour(operations, "subscriptions")[0];
    expect(cloture.payload).toEqual({ status: "cancelled" });
    expect(cloture.filtres).toEqual([["eq:id", ANCIEN_ABONNEMENT]]);
    expect(ecrireAuJournal).toHaveBeenCalledWith(
      expect.objectContaining({ activite: "premium", type: "activation_forfait", entiteId: CLIENT, auteur: "gerant" }),
    );
  });

  it("repasse en Free sans créer d'abonnement", async () => {
    const operations = installer((o) =>
      o.table === "client_profiles" && o.op === "select"
        ? { data: { preferences: {}, subscription_id: ANCIEN_ABONNEMENT }, error: null }
        : { error: null },
    );
    await activerForfait(CLIENT, "free");
    expect(operations.some((o) => o.table === "subscriptions" && o.op === "insert")).toBe(false);
    expect(miseAJour(operations, "client_profiles")[0].payload).toMatchObject({ subscription_id: null });
  });

  it("n'écrit rien au journal si l'abonnement n'a pas pu être créé", async () => {
    installer((o) => {
      if (o.table === "client_profiles") return { data: { preferences: {}, subscription_id: null }, error: null };
      if (o.table === "plans") return { data: { id: "plan-vip" }, error: null };
      return { data: null, error: { message: "refus" } };
    });
    expect((await activerForfait(CLIENT, "vip")).error).toMatch(/pas pu être créé/);
    expect(ecrireAuJournal).not.toHaveBeenCalled();
  });
});

describe("ignorerDemandeForfait (Gérant)", () => {
  it("clôt la demande sans toucher à l'abonnement", async () => {
    assertRole.mockResolvedValue({ id: "gerant" });
    const operations = installer((o) =>
      o.op === "select" ? { data: { preferences: { demande_forfait: { code: "vip", le: "x" } } }, error: null } : { error: null },
    );
    await ignorerDemandeForfait(CLIENT);
    expect(assertRole).toHaveBeenCalledWith("admin");
    expect(miseAJour(operations, "client_profiles")[0].payload).toEqual({ preferences: {} });
    expect(operations.some((o) => o.table === "subscriptions")).toBe(false);
    expect(ecrireAuJournal).toHaveBeenCalledWith(expect.objectContaining({ type: "refus_demande_forfait" }));
  });
});
