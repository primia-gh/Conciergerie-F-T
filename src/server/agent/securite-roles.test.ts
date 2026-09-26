import { beforeEach, describe, expect, it, vi } from "vitest";

const { assertRole, createClient, createServiceClient, ecrireAuJournal, revalidatePath, redirect } = vi.hoisted(() => ({
  assertRole: vi.fn(),
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
  ecrireAuJournal: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/server/auth/guards", () => ({ assertRole }));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient }));
vi.mock("@/lib/agent/journal", () => ({ ecrireAuJournal }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect }));

import * as boite from "./boite";
import * as fichesAdmin from "./fiches-admin";
import * as ftAdmin from "./ft-admin";
import * as chat from "./chat";
import * as estimation from "./estimation";

const UUID = "11111111-1111-4111-8111-111111111111";
const formulaire = () => new FormData();
const etat = { error: null };

/** Chaque action serveur du Gérant, appelée avec des arguments plausibles. */
const ACTIONS_GERANT: Record<string, () => Promise<unknown>> = {
  creerDemande: () => boite.creerDemande(etat, formulaire()),
  cloturerDemande: () => boite.cloturerDemande(UUID, etat, formulaire()),
  enregistrerFiche: () => fichesAdmin.enregistrerFiche(etat, formulaire()),
  restaurerVersion: () => fichesAdmin.restaurerVersion(UUID),
  ajouterALaFiche: () => fichesAdmin.ajouterALaFiche(UUID, etat, formulaire()),
  creerLogement: () => fichesAdmin.creerLogement(etat, formulaire()),
  activerLogement: () => fichesAdmin.activerLogement(UUID),
  desactiverLogement: () => fichesAdmin.desactiverLogement(UUID),
  changerNiveauAutonomie: () => ftAdmin.changerNiveauAutonomie(UUID, formulaire()),
  toutRemettreEnPropose: () => ftAdmin.toutRemettreEnPropose(),
  changerStatutProprietaire: () => ftAdmin.changerStatutProprietaire(UUID, UUID, formulaire()),
};

/** Actions volontairement publiques, avec la raison. */
const ACTIONS_PUBLIQUES: Record<string, string> = {
  envoyerMessageProprietaire:
    "chat de prospection ouvert aux visiteurs ; désactivé par défaut (CHAT_PROSPECTION_ACTIF), limité en débit",
  demanderEstimation:
    "formulaire public « Estimer mes revenus » : champ piège, délai minimum, limite de débit ; testé dans estimation.test.ts",
};

beforeEach(() => {
  vi.clearAllMocks();
  assertRole.mockRejectedValue(new Error("Action non autorisée pour ce rôle."));
});

describe("toutes les actions serveur exigent le rôle admin", () => {
  it("aucune action n'a été oubliée : chaque fonction exportée est soit testée ici, soit déclarée publique avec sa raison", () => {
    const exportees = [boite, fichesAdmin, ftAdmin, chat, estimation].flatMap((module) =>
      Object.entries(module)
        .filter(([, valeur]) => typeof valeur === "function")
        .map(([nom]) => nom),
    );

    const connues = new Set([...Object.keys(ACTIONS_GERANT), ...Object.keys(ACTIONS_PUBLIQUES)]);
    expect(exportees.filter((nom) => !connues.has(nom))).toEqual([]);
  });

  describe.each(Object.entries(ACTIONS_GERANT))("%s", (_nom, appeler) => {
    it("refuse un appelant qui n'est pas admin : ni base, ni journal, ni rafraîchissement", async () => {
      await expect(appeler()).rejects.toThrow("non autorisée");

      expect(assertRole).toHaveBeenCalledWith("admin");
      expect(createClient).not.toHaveBeenCalled();
      expect(createServiceClient).not.toHaveBeenCalled();
      expect(ecrireAuJournal).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });
});

describe("les actions publiques", () => {
  it("le chat de prospection est désactivé par défaut : refus sans toucher à la base", async () => {
    vi.stubEnv("CHAT_PROSPECTION_ACTIF", "");

    const r = await chat.envoyerMessageProprietaire({ message: "Bonjour" });

    expect(r).toMatchObject({ ok: false });
    expect(createServiceClient).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("chaque action publique est justifiée par écrit", () => {
    for (const raison of Object.values(ACTIONS_PUBLIQUES)) expect(raison.length).toBeGreaterThan(20);
  });
});
