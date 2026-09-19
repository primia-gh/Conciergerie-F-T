import { beforeEach, describe, expect, it, vi } from "vitest";
import { fauxSupabase, type Operation } from "../../../test/fake-supabase";

const { assertRole, createClient, ecrireAuJournal, revalidatePath, redirect } = vi.hoisted(() => ({
  assertRole: vi.fn(),
  createClient: vi.fn(),
  ecrireAuJournal: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn((url: string) => {
    // Comme Next.js : redirect() interrompt l'exécution en levant une exception.
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("@/server/auth/guards", () => ({ assertRole }));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/lib/agent/journal", () => ({ ecrireAuJournal }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect }));

import {
  activerLogement,
  creerLogement,
  desactiverLogement,
  enregistrerFiche,
  restaurerVersion,
} from "./fiches-admin";

const LOGEMENT = "11111111-1111-4111-8111-111111111111";
const FICHE_ANCIENNE = "22222222-2222-4222-8222-222222222222";
const PROPRIETAIRE = "33333333-3333-4333-8333-333333333333";
const initial = { error: null };

function formulaire(champs: Record<string, string>) {
  const f = new FormData();
  for (const [cle, valeur] of Object.entries(champs)) f.set(cle, valeur);
  return f;
}

/** Branche le faux client sur `createClient` et renvoie les opérations enregistrées. */
function installer(repondre: (operation: Operation) => unknown) {
  const { client, operations } = fauxSupabase(repondre);
  createClient.mockResolvedValue(client);
  return operations;
}

const aFiltre = (op: Operation, cle: string) => op.filtres.some(([c]) => c === cle);

beforeEach(() => {
  vi.clearAllMocks();
  assertRole.mockResolvedValue({ id: "admin" });
});

describe("enregistrerFiche", () => {
  const champsOffre = { activite: "ft", section: "offre_ft", contenu: "Nouvelle offre" };

  it("refuse tout quand l'appelant n'est pas admin : aucune base, aucun journal", async () => {
    assertRole.mockRejectedValue(new Error("Action non autorisée pour ce rôle."));

    await expect(enregistrerFiche(initial, formulaire(champsOffre))).rejects.toThrow("non autorisée");

    expect(createClient).not.toHaveBeenCalled();
    expect(ecrireAuJournal).not.toHaveBeenCalled();
  });

  it("refuse une section qui n'existe pas pour cette fiche, sans toucher à la base", async () => {
    const etat = await enregistrerFiche(initial, formulaire({ ...champsOffre, section: "acces" }));

    expect(etat.error).toBe("Cette section n'existe pas pour cette fiche.");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("ajoute une NOUVELLE version (jamais une mise à jour en place) et la journalise", async () => {
    const operations = installer((op) => {
      if (op.op === "select") return { data: { id: "v1", version: 1, contenu: "Ancienne offre" } };
      return { data: { id: "v2", version: 2 }, error: null };
    });

    const etat = await enregistrerFiche(initial, formulaire(champsOffre));

    expect(etat).toEqual({ error: null, success: true, avertissements: [] });
    const insertion = operations.find((o) => o.op === "insert")!;
    expect(insertion.payload).toEqual({
      activite: "ft",
      logement_id: null,
      section: "offre_ft",
      contenu: "Nouvelle offre",
      version: 2,
      auteur: "gerant",
    });
    expect(operations.some((o) => o.op === "update")).toBe(false);
    expect(ecrireAuJournal).toHaveBeenCalledWith(
      expect.objectContaining({
        activite: "ft",
        type: "mise_a_jour_fiche",
        entiteType: "fiche_connaissance",
        entiteId: "v2",
        auteur: "gerant",
      }),
    );
  });

  it("commence à la version 1 quand la section n'existe pas encore", async () => {
    const operations = installer((op) =>
      op.op === "select" ? { data: null } : { data: { id: "n", version: 1 }, error: null },
    );

    await enregistrerFiche(initial, formulaire({ activite: "premium", section: "faq_premium", contenu: "Q : x" }));

    expect(operations.find((o) => o.op === "insert")!.payload).toMatchObject({
      activite: "premium",
      version: 1,
    });
  });

  it("écrit dans la fiche du bon logement, après avoir vérifié qu'il existe", async () => {
    const operations = installer((op) => {
      if (op.table === "logement") return { data: { id: LOGEMENT } };
      if (op.op === "select") return { data: null };
      return { data: { id: "n", version: 1 }, error: null };
    });

    const etat = await enregistrerFiche(
      initial,
      formulaire({ activite: "ft", logementId: LOGEMENT, section: "regles", contenu: "Pas de fêtes" }),
    );

    expect(etat.success).toBe(true);
    expect(operations.find((o) => o.op === "insert")!.payload).toMatchObject({
      logement_id: LOGEMENT,
      section: "regles",
    });
    const lecture = operations.find((o) => o.table === "fiche_connaissance" && o.op === "select")!;
    expect(lecture.filtres).toContainEqual(["eq:logement_id", LOGEMENT]);
  });

  it("refuse un logement introuvable, sans rien écrire", async () => {
    const operations = installer(() => ({ data: null }));

    const etat = await enregistrerFiche(
      initial,
      formulaire({ activite: "ft", logementId: LOGEMENT, section: "regles", contenu: "x" }),
    );

    expect(etat.error).toBe("Logement introuvable.");
    expect(operations.some((o) => o.op === "insert")).toBe(false);
  });

  it("refuse un contenu identique à la version actuelle (même avec des \\r\\n du navigateur)", async () => {
    const operations = installer(() => ({ data: { id: "v1", version: 1, contenu: "Ligne 1\nLigne 2" } }));

    const etat = await enregistrerFiche(
      initial,
      formulaire({ ...champsOffre, contenu: "Ligne 1\r\nLigne 2\r\n" }),
    );

    expect(etat.error).toBe("Le contenu est identique à la version actuelle.");
    expect(operations.some((o) => o.op === "insert")).toBe(false);
    expect(ecrireAuJournal).not.toHaveBeenCalled();
  });

  it("signale un conflit de version (deux enregistrements simultanés), sans journal", async () => {
    installer((op) =>
      op.op === "select"
        ? { data: { id: "v1", version: 1, contenu: "Ancienne" } }
        : { data: null, error: { code: "23505", message: "duplicate key" } },
    );

    const etat = await enregistrerFiche(initial, formulaire(champsOffre));

    expect(etat.error).toContain("vient d'être modifiée par ailleurs");
    expect(ecrireAuJournal).not.toHaveBeenCalled();
  });

  it("enregistre quand même une fiche qui ressemble à un code, mais avertit", async () => {
    installer((op) => {
      if (op.table === "logement") return { data: { id: LOGEMENT } };
      if (op.op === "select") return { data: null };
      return { data: { id: "n", version: 1 }, error: null };
    });

    const etat = await enregistrerFiche(
      initial,
      formulaire({ activite: "ft", logementId: LOGEMENT, section: "acces", contenu: "Étage 3\nDigicode : 4521" }),
    );

    expect(etat.error).toBeNull();
    expect(etat.success).toBe(true);
    expect(etat.avertissements).toEqual(["Digicode : 4521"]);
  });
});

describe("restaurerVersion", () => {
  const ancienne = {
    id: FICHE_ANCIENNE,
    activite: "ft",
    logement_id: null,
    section: "offre_ft",
    version: 1,
    contenu: "Ancien contenu",
  };

  /** Lecture par identifiant → l'ancienne version ; lecture de la portée → la version actuelle. */
  const repondreAvec = (actuelle: unknown) => (op: Operation) => {
    if (op.op === "insert") return { data: { id: "v3", version: 3 }, error: null };
    return { data: aFiltre(op, "eq:id") ? ancienne : actuelle };
  };

  it("refuse tout quand l'appelant n'est pas admin", async () => {
    assertRole.mockRejectedValue(new Error("Action non autorisée pour ce rôle."));

    await expect(restaurerVersion(FICHE_ANCIENNE)).rejects.toThrow("non autorisée");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("refuse un identifiant qui n'est pas un UUID", async () => {
    const etat = await restaurerVersion("abc");
    expect(etat.error).toBe("Version introuvable.");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("refuse une version introuvable", async () => {
    installer(() => ({ data: null }));
    const etat = await restaurerVersion(FICHE_ANCIENNE);
    expect(etat.error).toBe("Version introuvable.");
  });

  it("restaure en créant une nouvelle version : l'historique n'est pas réécrit", async () => {
    const operations = installer(repondreAvec({ id: "v2", version: 2, contenu: "Contenu récent" }));

    const etat = await restaurerVersion(FICHE_ANCIENNE);

    expect(etat.success).toBe(true);
    const insertion = operations.find((o) => o.op === "insert")!;
    expect(insertion.payload).toMatchObject({
      activite: "ft",
      section: "offre_ft",
      contenu: "Ancien contenu",
      version: 3,
    });
    expect(operations.some((o) => o.op === "update" || o.op === "delete")).toBe(false);
    expect(ecrireAuJournal).toHaveBeenCalledWith(
      expect.objectContaining({ type: "restauration_fiche", entiteId: "v3", activite: "ft" }),
    );
  });

  it("refuse de restaurer la version déjà en vigueur", async () => {
    const operations = installer(repondreAvec({ id: FICHE_ANCIENNE, version: 1, contenu: "Ancien contenu" }));

    const etat = await restaurerVersion(FICHE_ANCIENNE);

    expect(etat.error).toBe("C'est déjà le contenu de la version actuelle.");
    expect(operations.some((o) => o.op === "insert")).toBe(false);
  });

  it("refuse aussi quand le contenu est identique à celui de la version actuelle", async () => {
    installer(repondreAvec({ id: "v2", version: 2, contenu: "Ancien contenu\r\n" }));

    const etat = await restaurerVersion(FICHE_ANCIENNE);

    expect(etat.error).toBe("C'est déjà le contenu de la version actuelle.");
  });
});

describe("creerLogement", () => {
  const champs = { nom: "Studio d'exemple", adresse: "1 rue Fictive, 67000 Strasbourg", capacite: "4" };

  it("refuse tout quand l'appelant n'est pas admin", async () => {
    assertRole.mockRejectedValue(new Error("Action non autorisée pour ce rôle."));

    await expect(
      creerLogement(initial, formulaire({ ...champs, nouveauProprietaire: "Jean Exemple" })),
    ).rejects.toThrow("non autorisée");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("exige un propriétaire", async () => {
    const etat = await creerLogement(initial, formulaire(champs));
    expect(etat.error).toContain("propriétaire");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("crée un nouveau propriétaire « client » puis un logement INACTIF, et ouvre sa fiche", async () => {
    const operations = installer((op) =>
      op.table === "proprietaire" ? { data: { id: PROPRIETAIRE }, error: null } : { data: { id: LOGEMENT }, error: null },
    );

    await expect(
      creerLogement(initial, formulaire({ ...champs, nouveauProprietaire: "Jean Exemple" })),
    ).rejects.toThrow(`REDIRECT:/admin/fiches/ft/logements/${LOGEMENT}`);

    expect(operations.find((o) => o.table === "proprietaire" && o.op === "insert")!.payload).toEqual({
      nom: "Jean Exemple",
      statut: "client",
      source: "saisie_gerant",
    });
    expect(operations.find((o) => o.table === "logement" && o.op === "insert")!.payload).toEqual({
      proprietaire_id: PROPRIETAIRE,
      nom: "Studio d'exemple",
      adresse: "1 rue Fictive, 67000 Strasbourg",
      capacite: 4,
      statut: "inactif",
    });
    expect(ecrireAuJournal).toHaveBeenCalledWith(
      expect.objectContaining({ activite: "ft", type: "creation_logement", entiteId: LOGEMENT }),
    );
  });

  it("refuse un propriétaire existant introuvable, sans rien créer", async () => {
    const operations = installer(() => ({ data: null }));

    const etat = await creerLogement(initial, formulaire({ ...champs, proprietaireId: PROPRIETAIRE }));

    expect(etat.error).toBe("Propriétaire introuvable.");
    expect(operations.some((o) => o.op === "insert")).toBe(false);
  });

  it("si le logement échoue, le propriétaire créé pour lui est retiré (pas d'orphelin)", async () => {
    const operations = installer((op) => {
      if (op.table === "proprietaire" && op.op === "insert") return { data: { id: PROPRIETAIRE }, error: null };
      if (op.table === "logement") return { data: null, error: { message: "panne" } };
      return { data: null, error: null };
    });

    const etat = await creerLogement(initial, formulaire({ ...champs, nouveauProprietaire: "Jean Exemple" }));

    expect(etat.error).toContain("Impossible de créer le logement");
    const suppression = operations.find((o) => o.op === "delete")!;
    expect(suppression.table).toBe("proprietaire");
    expect(suppression.filtres).toContainEqual(["eq:id", PROPRIETAIRE]);
    expect(ecrireAuJournal).not.toHaveBeenCalled();
  });

  it("si le logement échoue, ne touche jamais à un propriétaire existant", async () => {
    const operations = installer((op) => {
      if (op.table === "proprietaire") return { data: { id: PROPRIETAIRE } };
      return { data: null, error: { message: "panne" } };
    });

    await creerLogement(initial, formulaire({ ...champs, proprietaireId: PROPRIETAIRE }));

    expect(operations.some((o) => o.op === "delete")).toBe(false);
  });
});

describe("activerLogement", () => {
  const sectionsPleines = ["acces", "equipements", "regles", "depannage"].map((section) => ({
    section,
    contenu: "Une information.",
    version: 1,
  }));

  const repondreAvec = (statut: string, fiches: unknown[]) => (op: Operation) => {
    if (op.table === "logement") return { data: { id: LOGEMENT, nom: "Studio d'exemple", statut }, error: null };
    return { data: fiches, error: null };
  };

  it("refuse tout quand l'appelant n'est pas admin", async () => {
    assertRole.mockRejectedValue(new Error("Action non autorisée pour ce rôle."));

    await expect(activerLogement(LOGEMENT)).rejects.toThrow("non autorisée");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("refuse un logement introuvable", async () => {
    installer(() => ({ data: null }));
    const etat = await activerLogement(LOGEMENT);
    expect(etat.error).toBe("Logement introuvable.");
  });

  it("refuse tant qu'une section obligatoire manque, et dit laquelle", async () => {
    const operations = installer(repondreAvec("inactif", sectionsPleines.slice(0, 2)));

    const etat = await activerLogement(LOGEMENT);

    expect(etat.error).toBe("Fiche incomplète : il manque Règles, Dépannage.");
    expect(operations.some((o) => o.op === "update")).toBe(false);
    expect(ecrireAuJournal).not.toHaveBeenCalled();
  });

  it("ne tient compte que de la DERNIÈRE version : une section vidée ensuite compte comme manquante", async () => {
    installer(
      repondreAvec("inactif", [
        ...sectionsPleines.filter((s) => s.section !== "depannage"),
        { section: "depannage", contenu: "Rempli", version: 1 },
        { section: "depannage", contenu: "   ", version: 2 },
      ]),
    );

    const etat = await activerLogement(LOGEMENT);

    expect(etat.error).toBe("Fiche incomplète : il manque Dépannage.");
  });

  it("active un logement dont la fiche est complète, et le journalise", async () => {
    const operations = installer(repondreAvec("inactif", sectionsPleines));

    const etat = await activerLogement(LOGEMENT);

    expect(etat).toEqual({ error: null, success: true });
    const miseAJour = operations.find((o) => o.op === "update")!;
    expect(miseAJour.payload).toEqual({ statut: "actif" });
    expect(miseAJour.filtres).toContainEqual(["eq:id", LOGEMENT]);
    expect(ecrireAuJournal).toHaveBeenCalledWith(
      expect.objectContaining({ activite: "ft", type: "activation_logement", entiteId: LOGEMENT }),
    );
  });

  it("refuse d'activer un logement déjà actif", async () => {
    installer(repondreAvec("actif", sectionsPleines));
    const etat = await activerLogement(LOGEMENT);
    expect(etat.error).toBe("Ce logement est déjà activé.");
  });

  it("refuse un identifiant qui n'est pas un UUID", async () => {
    const etat = await activerLogement("abc");
    expect(etat.error).toBe("Logement introuvable.");
    expect(createClient).not.toHaveBeenCalled();
  });
});

describe("desactiverLogement", () => {
  const logement = (statut: string) => () => ({ data: { id: LOGEMENT, nom: "Studio d'exemple", statut }, error: null });

  it("refuse tout quand l'appelant n'est pas admin", async () => {
    assertRole.mockRejectedValue(new Error("Action non autorisée pour ce rôle."));

    await expect(desactiverLogement(LOGEMENT)).rejects.toThrow("non autorisée");
  });

  it("retire un logement actif de l'assistant, sans rien supprimer", async () => {
    const operations = installer(logement("actif"));

    const etat = await desactiverLogement(LOGEMENT);

    expect(etat.success).toBe(true);
    expect(operations.find((o) => o.op === "update")!.payload).toEqual({ statut: "inactif" });
    expect(operations.some((o) => o.op === "delete")).toBe(false);
    expect(ecrireAuJournal).toHaveBeenCalledWith(expect.objectContaining({ type: "desactivation_logement" }));
  });

  it("refuse de désactiver un logement qui n'est pas actif", async () => {
    installer(logement("inactif"));
    const etat = await desactiverLogement(LOGEMENT);
    expect(etat.error).toBe("Ce logement n'est pas activé.");
  });
});
