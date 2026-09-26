import { beforeEach, describe, expect, it, vi } from "vitest";
import { fauxSupabase, type Operation } from "../../../test/fake-supabase";

const { assertRole, createClient, getClientQuota, notify, revalidatePath, redirect } = vi.hoisted(() => ({
  assertRole: vi.fn(),
  createClient: vi.fn(),
  getClientQuota: vi.fn(),
  notify: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn((url: string) => {
    // Comme Next.js : redirect() interrompt l'exécution en levant une exception.
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("@/server/auth/guards", () => ({ assertRole }));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/server/subscriptions/quota", () => ({ getClientQuota }));
vi.mock("@/server/notifications/dispatcher", () => ({ notify }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect }));

import { createRequest } from "./actions";

const CLIENT = "11111111-1111-4111-8111-111111111111";
const CATEGORIE = "22222222-2222-4222-8222-222222222222";

function formulaire(extra: Record<string, string> = {}) {
  const f = new FormData();
  const champs = { categoryId: CATEGORIE, title: "Table pour deux", description: "Un restaurant calme vendredi soir.", ...extra };
  for (const [cle, valeur] of Object.entries(champs)) f.set(cle, valeur);
  return f;
}

/** Faux client : la formule du client a la priorité `prioriteFormule` dans plans.features. */
function installer(prioriteFormule: unknown) {
  const { client, operations } = fauxSupabase((o: Operation) => {
    if (o.table === "plans") return { data: { features: prioriteFormule === undefined ? {} : { priority: prioriteFormule } }, error: null };
    if (o.table === "requests" && o.op === "insert") return { data: { id: "demande-1" }, error: null };
    return { data: null, error: null };
  });
  createClient.mockResolvedValue(client);
  return operations;
}

const insertion = (ops: Operation[]) => ops.find((o) => o.table === "requests" && o.op === "insert")?.payload as Record<string, unknown>;

beforeEach(() => {
  vi.clearAllMocks();
  assertRole.mockResolvedValue({ id: CLIENT });
});

describe("createRequest : réponse prioritaire selon la formule", () => {
  it.each([
    ["free", "normal", "normal"],
    ["premium", "high", "high"],
    ["vip", "urgent", "urgent"],
  ])("formule %s → priorité %s", async (planCode, prioriteFormule, attendue) => {
    getClientQuota.mockResolvedValue({ planCode, planName: planCode, canCreateRequest: true });
    const operations = installer(prioriteFormule);

    await expect(createRequest(formulaire())).rejects.toThrow("REDIRECT:/client/dashboard");

    const lecture = operations.find((o) => o.table === "plans");
    expect(lecture?.filtres).toEqual([["eq:code", planCode]]);
    expect(insertion(operations)).toMatchObject({ client_id: CLIENT, priority: attendue });
  });

  it("retombe sur « normal » si la formule n'a pas de priorité connue", async () => {
    getClientQuota.mockResolvedValue({ planCode: "free", planName: "Free", canCreateRequest: true });
    const operations = installer("critique");
    await expect(createRequest(formulaire())).rejects.toThrow("REDIRECT");
    expect(insertion(operations).priority).toBe("normal");
  });

  it("ignore une priorité glissée dans le formulaire par le client", async () => {
    getClientQuota.mockResolvedValue({ planCode: "free", planName: "Free", canCreateRequest: true });
    const operations = installer("normal");
    await expect(createRequest(formulaire({ priority: "urgent" }))).rejects.toThrow("REDIRECT");
    expect(insertion(operations).priority).toBe("normal");
  });

  it("ne crée rien quand la limite de la formule est atteinte", async () => {
    getClientQuota.mockResolvedValue({ planCode: "free", planName: "Free", requestLimit: 2, canCreateRequest: false });
    const operations = installer("normal");
    const r = await createRequest(formulaire());
    expect(r?.error).toMatch(/limite/);
    expect(insertion(operations)).toBeUndefined();
  });
});
