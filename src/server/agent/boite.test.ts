import { beforeEach, describe, expect, it, vi } from "vitest";

const { assertRole, createServiceClient, ecrireAuJournal, preparerReponseAssistant, revalidatePath, redirect } =
  vi.hoisted(() => ({
    assertRole: vi.fn(),
    createServiceClient: vi.fn(),
    ecrireAuJournal: vi.fn(),
    preparerReponseAssistant: vi.fn(),
    revalidatePath: vi.fn(),
    redirect: vi.fn((url: string) => {
      // Comme Next.js : redirect() interrompt l'exécution en levant une exception.
      throw new Error(`REDIRECT:${url}`);
    }),
  }));

vi.mock("@/server/auth/guards", () => ({ assertRole }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient }));
vi.mock("@/lib/agent/journal", () => ({ ecrireAuJournal }));
vi.mock("@/lib/agent/missions/assistant-gerant/preparer", () => ({ preparerReponseAssistant }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect }));

import { cloturerDemande, creerDemande } from "./boite";

const ID = "22222222-2222-4222-8222-222222222222";

type Operation = { table: string; op: string; payload?: unknown; filtres: [string, unknown][] };
type Constructeur = Record<string, (...args: never[]) => unknown>;

/** Faux client Supabase : enregistre chaque opération et renvoie des résultats programmés. */
function fakeDb(resultats: { insert?: unknown; select?: unknown; update?: unknown }) {
  const operations: Operation[] = [];
  const from = (table: string) => {
    const operation: Operation = { table, op: "select", filtres: [] };
    operations.push(operation);
    const b: Constructeur = {
      insert: (payload: unknown) => {
        operation.op = "insert";
        operation.payload = payload;
        return b;
      },
      update: (payload: unknown) => {
        operation.op = "update";
        operation.payload = payload;
        return b;
      },
      select: () => b,
      eq: (colonne: string, valeur: unknown) => {
        operation.filtres.push([`eq:${colonne}`, valeur]);
        return b;
      },
      is: (colonne: string, valeur: unknown) => {
        operation.filtres.push([`is:${colonne}`, valeur]);
        return b;
      },
      single: () => Promise.resolve(resultats.insert),
      maybeSingle: () => Promise.resolve(resultats.select),
      then: (resolve: (v: unknown) => unknown) => resolve(resultats.update),
    };
    return b;
  };
  createServiceClient.mockReturnValue({ from });
  return operations;
}

function formulaire(champs: Record<string, string>) {
  const f = new FormData();
  for (const [cle, valeur] of Object.entries(champs)) f.set(cle, valeur);
  return f;
}

const etatInitial = { error: null };

beforeEach(() => {
  vi.clearAllMocks();
  assertRole.mockResolvedValue({ id: "admin" });
});

describe("creerDemande", () => {
  it("refuse tout quand l'appelant n'est pas admin : aucune base, aucun modèle, aucun journal", async () => {
    assertRole.mockRejectedValue(new Error("Action non autorisée pour ce rôle."));

    await expect(
      creerDemande(etatInitial, formulaire({ activite: "ft", contenu: "Bonjour" })),
    ).rejects.toThrow("non autorisée");

    expect(createServiceClient).not.toHaveBeenCalled();
    expect(preparerReponseAssistant).not.toHaveBeenCalled();
    expect(ecrireAuJournal).not.toHaveBeenCalled();
  });

  it("refuse une saisie invalide sans rien enregistrer", async () => {
    const etat = await creerDemande(etatInitial, formulaire({ activite: "commun", contenu: "Bonjour" }));

    expect(etat.error).toBeTruthy();
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it("enregistre le message AVANT de le confier à l'assistant, puis ouvre la demande", async () => {
    const operations = fakeDb({ insert: { data: { id: ID }, error: null }, update: { error: null } });
    preparerReponseAssistant.mockImplementation(async () => {
      // À ce stade, la demande doit déjà exister en base.
      expect(operations.some((o) => o.op === "insert" && o.table === "demande")).toBe(true);
      return {
        mode: "modele",
        brouillon: { texte: "Bonjour.", langue: "fr", sectionsUtilisees: ["equipements"] },
        escalade: null,
        fichesUtilisees: [{ id: "f1", section: "equipements", version: 1 }],
      };
    });

    await expect(
      creerDemande(
        etatInitial,
        formulaire({ activite: "ft", expediteur: "Marie", contenu: "Quel est le wifi ?" }),
      ),
    ).rejects.toThrow(`REDIRECT:/admin/boite/${ID}`);

    const insertion = operations.find((o) => o.op === "insert")!;
    expect(insertion.payload).toEqual({
      activite: "ft",
      logement_id: null,
      expediteur: "Marie",
      contenu_recu: "Quel est le wifi ?",
      statut: "nouveau",
    });
    const miseAJour = operations.find((o) => o.op === "update")!;
    expect(miseAJour.payload).toMatchObject({ statut: "brouillon_pret", brouillon: "Bonjour.", langue: "fr" });
    expect(miseAJour.filtres).toContainEqual(["eq:id", ID]);
    expect(ecrireAuJournal).toHaveBeenCalledWith(
      expect.objectContaining({
        activite: "ft",
        type: "preparation_brouillon",
        entiteType: "demande",
        entiteId: ID,
        regleAppliquee: "assistant_gerant_ft",
        autonomieAuMoment: "propose",
        auteur: "agent",
        resultat: "brouillon_pret",
      }),
    );
  });

  it("transmet l'activité choisie à l'assistant (Premium n'est jamais traité comme F&T)", async () => {
    fakeDb({ insert: { data: { id: ID }, error: null }, update: { error: null } });
    preparerReponseAssistant.mockResolvedValue({ mode: "demo", information: "démo" });

    await expect(
      creerDemande(etatInitial, formulaire({ activite: "premium", contenu: "Bonjour" })),
    ).rejects.toThrow("REDIRECT");

    expect(preparerReponseAssistant).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ activite: "premium", contenuRecu: "Bonjour" }),
    );
    expect(ecrireAuJournal).toHaveBeenCalledWith(
      expect.objectContaining({ activite: "premium", regleAppliquee: "assistant_gerant_premium" }),
    );
  });

  it("si l'assistant plante, la demande passe en escalade « doute » et le détail va au journal", async () => {
    const operations = fakeDb({ insert: { data: { id: ID }, error: null }, update: { error: null } });
    preparerReponseAssistant.mockRejectedValue(new Error("API indisponible"));

    await expect(
      creerDemande(etatInitial, formulaire({ activite: "ft", contenu: "Bonjour" })),
    ).rejects.toThrow(`REDIRECT:/admin/boite/${ID}`);

    expect(operations.find((o) => o.op === "update")!.payload).toMatchObject({
      statut: "escalade",
      categorie_escalade: "doute",
      brouillon: null,
    });
    expect(ecrireAuJournal).toHaveBeenCalledWith(
      expect.objectContaining({ resultat: "erreur", justification: "API indisponible" }),
    );
  });

  describe("avec un logement", () => {
    const LOGEMENT = "44444444-4444-4444-8444-444444444444";
    const champs = { activite: "ft", logementId: LOGEMENT, contenu: "Le wifi ne marche pas" };

    it("refuse un logement introuvable, sans rien enregistrer ni appeler l'assistant", async () => {
      const operations = fakeDb({ select: { data: null } });

      const etat = await creerDemande(etatInitial, formulaire(champs));

      expect(etat.error).toBe("Logement introuvable.");
      expect(operations.some((o) => o.op === "insert")).toBe(false);
      expect(preparerReponseAssistant).not.toHaveBeenCalled();
    });

    it("refuse un logement non activé, côté serveur (pas seulement dans la liste proposée)", async () => {
      const operations = fakeDb({ select: { data: { id: LOGEMENT, statut: "inactif" } } });

      const etat = await creerDemande(etatInitial, formulaire(champs));

      expect(etat.error).toContain("n'est pas activé");
      expect(operations.some((o) => o.op === "insert")).toBe(false);
      expect(preparerReponseAssistant).not.toHaveBeenCalled();
    });

    it("refuse un logement pour Premium avant même de lire la base", async () => {
      const etat = await creerDemande(etatInitial, formulaire({ ...champs, activite: "premium" }));

      expect(etat.error).toBe("Un logement n'existe que pour F&T.");
      expect(createServiceClient).not.toHaveBeenCalled();
    });

    it("avec un logement activé : l'enregistre sur la demande et le confie à l'assistant", async () => {
      const operations = fakeDb({
        select: { data: { id: LOGEMENT, statut: "actif" } },
        insert: { data: { id: ID }, error: null },
        update: { error: null },
      });
      preparerReponseAssistant.mockResolvedValue({ mode: "demo", information: "démo" });

      await expect(creerDemande(etatInitial, formulaire(champs))).rejects.toThrow(`REDIRECT:/admin/boite/${ID}`);

      expect(operations.find((o) => o.op === "insert")!.payload).toMatchObject({
        activite: "ft",
        logement_id: LOGEMENT,
      });
      expect(preparerReponseAssistant).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ activite: "ft", logementId: LOGEMENT }),
      );
    });
  });

  it("renvoie une erreur si la demande ne peut pas être enregistrée, sans appeler l'assistant", async () => {
    fakeDb({ insert: { data: null, error: { message: "panne" } } });

    const etat = await creerDemande(etatInitial, formulaire({ activite: "ft", contenu: "Bonjour" }));

    expect(etat.error).toBeTruthy();
    expect(preparerReponseAssistant).not.toHaveBeenCalled();
  });
});

describe("cloturerDemande", () => {
  const demandePrete = {
    data: { id: ID, activite: "ft", statut: "brouillon_pret", brouillon: "Bonjour.", traite_le: null },
  };

  it("refuse tout quand l'appelant n'est pas admin", async () => {
    assertRole.mockRejectedValue(new Error("Action non autorisée pour ce rôle."));

    await expect(cloturerDemande(ID, etatInitial, formulaire({ reponse: "x" }))).rejects.toThrow("non autorisée");

    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it("refuse un identifiant qui n'est pas un UUID", async () => {
    const etat = await cloturerDemande("pas-un-uuid", etatInitial, formulaire({ reponse: "x" }));

    expect(etat.error).toBe("Demande introuvable.");
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it("valide un brouillon repris tel quel", async () => {
    const operations = fakeDb({ select: demandePrete, update: { data: [{ id: ID }], error: null } });

    const etat = await cloturerDemande(ID, etatInitial, formulaire({ reponse: "Bonjour." }));

    expect(etat).toEqual({ error: null, success: true });
    const miseAJour = operations.find((o) => o.op === "update")!;
    expect(miseAJour.payload).toMatchObject({ statut: "valide", reponse_finale: "Bonjour." });
    // Verrou contre la double clôture.
    expect(miseAJour.filtres).toContainEqual(["is:traite_le", null]);
    expect(ecrireAuJournal).toHaveBeenCalledWith(
      expect.objectContaining({
        activite: "ft",
        type: "validation_brouillon",
        auteur: "gerant",
        resultat: "valide",
        entiteId: ID,
      }),
    );
  });

  it("enregistre « corrigé » quand le Gérant modifie le brouillon", async () => {
    const operations = fakeDb({ select: demandePrete, update: { data: [{ id: ID }], error: null } });

    await cloturerDemande(ID, etatInitial, formulaire({ reponse: "Bonjour, version corrigée." }));

    expect(operations.find((o) => o.op === "update")!.payload).toMatchObject({ statut: "corrige" });
    expect(ecrireAuJournal).toHaveBeenCalledWith(expect.objectContaining({ resultat: "corrige" }));
  });

  it("refuse une demande déjà traitée, sans rien modifier", async () => {
    const operations = fakeDb({
      select: { data: { ...demandePrete.data, traite_le: "2026-09-19T10:00:00Z" } },
    });

    const etat = await cloturerDemande(ID, etatInitial, formulaire({ reponse: "Bonjour." }));

    expect(etat.error).toContain("déjà été traitée");
    expect(operations.some((o) => o.op === "update")).toBe(false);
    expect(ecrireAuJournal).not.toHaveBeenCalled();
  });

  it("refuse si une autre clôture est passée entre-temps : aucune ligne mise à jour, pas de journal", async () => {
    fakeDb({ select: demandePrete, update: { data: [], error: null } });

    const etat = await cloturerDemande(ID, etatInitial, formulaire({ reponse: "Bonjour." }));

    expect(etat.error).toContain("déjà été traitée");
    expect(ecrireAuJournal).not.toHaveBeenCalled();
  });

  it("refuse une réponse vide sur un brouillon prêt", async () => {
    const operations = fakeDb({ select: demandePrete });

    const etat = await cloturerDemande(ID, etatInitial, formulaire({ reponse: "   " }));

    expect(etat.error).toBe("La réponse ne peut pas être vide.");
    expect(operations.some((o) => o.op === "update")).toBe(false);
  });

  it("refuse une réponse démesurée avant même de lire la base", async () => {
    const etat = await cloturerDemande(ID, etatInitial, formulaire({ reponse: "a".repeat(6001) }));

    expect(etat.error).toContain("trop longue");
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it("clôture une escalade sans réponse : le statut reste « escalade »", async () => {
    const operations = fakeDb({
      select: { data: { ...demandePrete.data, statut: "escalade", brouillon: null } },
      update: { data: [{ id: ID }], error: null },
    });

    const etat = await cloturerDemande(ID, etatInitial, formulaire({ reponse: "" }));

    expect(etat.success).toBe(true);
    expect(operations.find((o) => o.op === "update")!.payload).toMatchObject({
      statut: "escalade",
      reponse_finale: null,
    });
    expect(ecrireAuJournal).toHaveBeenCalledWith(
      expect.objectContaining({ type: "traitement_escalade", resultat: "escalade" }),
    );
  });

  it("refuse de clôturer une demande introuvable", async () => {
    fakeDb({ select: { data: null } });

    const etat = await cloturerDemande(ID, etatInitial, formulaire({ reponse: "x" }));

    expect(etat.error).toBe("Demande introuvable.");
  });
});
