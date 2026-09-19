import { beforeEach, describe, expect, it, vi } from "vitest";
import { fauxSupabase, type Operation } from "../../../test/fake-supabase";

const { assertRole, createClient, ecrireAuJournal, revalidatePath, redirect } = vi.hoisted(() => ({
  assertRole: vi.fn(),
  createClient: vi.fn(),
  ecrireAuJournal: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/server/auth/guards", () => ({ assertRole }));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/lib/agent/journal", () => ({ ecrireAuJournal }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect }));

import { ajouterALaFiche } from "./fiches-admin";

const DEMANDE = "55555555-5555-4555-8555-555555555555";
const LOGEMENT = "11111111-1111-4111-8111-111111111111";
const initial = { error: null };

function formulaire(champs: Record<string, string>) {
  const f = new FormData();
  for (const [cle, valeur] of Object.entries(champs)) f.set(cle, valeur);
  return f;
}

type Demande = { id: string; activite: string; logement_id: string | null; statut: string; traite_le: string | null };

const demandeCorrigee: Demande = {
  id: DEMANDE,
  activite: "ft",
  logement_id: LOGEMENT,
  statut: "corrige",
  traite_le: "2026-09-19T10:00:00Z",
};

/**
 * Faux client : la demande d'un côté, la dernière version de la fiche de l'autre,
 * et le résultat de l'insertion d'une nouvelle version.
 */
function installer(options: {
  demande: Demande | null;
  fiche?: { id: string; version: number; contenu: string } | null;
  insertion?: unknown;
}) {
  const { client, operations } = fauxSupabase((op: Operation) => {
    if (op.table === "demande") return { data: options.demande };
    if (op.op === "insert") {
      return options.insertion ?? { data: { id: "nouvelle", version: (options.fiche?.version ?? 0) + 1 }, error: null };
    }
    return { data: options.fiche ?? null };
  });
  createClient.mockResolvedValue(client);
  return operations;
}

beforeEach(() => {
  vi.clearAllMocks();
  assertRole.mockResolvedValue({ id: "admin" });
});

describe("ajouterALaFiche", () => {
  it("refuse tout quand l'appelant n'est pas admin", async () => {
    assertRole.mockRejectedValue(new Error("Action non autorisée pour ce rôle."));

    await expect(
      ajouterALaFiche(DEMANDE, initial, formulaire({ cible: "logement:acces", ligne: "x" })),
    ).rejects.toThrow("non autorisée");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("refuse un identifiant de demande qui n'est pas un UUID, ou une cible invalide, sans lire la base", async () => {
    const a = await ajouterALaFiche("abc", initial, formulaire({ cible: "logement:acces", ligne: "x" }));
    const b = await ajouterALaFiche(DEMANDE, initial, formulaire({ cible: "n'importe quoi", ligne: "x" }));

    expect(a.error).toBe("Demande introuvable.");
    expect(b.error).toBe("Choisissez la fiche à enrichir.");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("refuse une demande introuvable", async () => {
    installer({ demande: null });

    const etat = await ajouterALaFiche(DEMANDE, initial, formulaire({ cible: "logement:acces", ligne: "x" }));

    expect(etat.error).toBe("Demande introuvable.");
  });

  it.each([
    ["validée telle quelle (rien de nouveau)", { statut: "valide" }],
    ["pas encore traitée", { statut: "brouillon_pret", traite_le: null }],
  ])("refuse une demande %s", async (_libelle, ecart) => {
    const operations = installer({ demande: { ...demandeCorrigee, ...ecart } });

    const etat = await ajouterALaFiche(DEMANDE, initial, formulaire({ cible: "logement:acces", ligne: "x" }));

    expect(etat.error).toBe("Cette demande n'appelle pas d'ajout à une fiche.");
    expect(operations.some((o) => o.op === "insert")).toBe(false);
  });

  it("ajoute l'information à la fin de la dernière version du logement de la demande", async () => {
    const operations = installer({
      demande: demandeCorrigee,
      fiche: { id: "v2", version: 2, contenu: "Étage 3\nAscenseur" },
    });

    const etat = await ajouterALaFiche(
      DEMANDE,
      initial,
      formulaire({ cible: "logement:acces", ligne: "Ascenseur en panne jusqu'au 30 septembre" }),
    );

    expect(etat).toEqual({ error: null, success: true, avertissements: [] });
    const insertion = operations.find((o) => o.op === "insert")!;
    expect(insertion.payload).toEqual({
      activite: "ft",
      logement_id: LOGEMENT,
      section: "acces",
      contenu: "Étage 3\nAscenseur\nAscenseur en panne jusqu'au 30 septembre",
      version: 3,
      auteur: "gerant",
    });
    expect(operations.some((o) => o.op === "update")).toBe(false);
    expect(ecrireAuJournal).toHaveBeenCalledWith(
      expect.objectContaining({
        activite: "ft",
        type: "ajout_a_la_fiche",
        entiteId: "nouvelle",
        auteur: "gerant",
        decision: expect.stringContaining(DEMANDE),
      }),
    );
  });

  it("le logement vient de la demande, pas du formulaire : un logement injecté est ignoré", async () => {
    const operations = installer({ demande: demandeCorrigee, fiche: null });

    await ajouterALaFiche(
      DEMANDE,
      initial,
      formulaire({ cible: "logement:regles", ligne: "Pas de fêtes", logementId: "99999999-9999-4999-8999-999999999999" }),
    );

    expect(operations.find((o) => o.op === "insert")!.payload).toMatchObject({ logement_id: LOGEMENT });
  });

  it("une fiche générale s'enrichit sans logement, avec l'activité de la demande", async () => {
    const operations = installer({
      demande: { ...demandeCorrigee, activite: "premium", logement_id: null },
      fiche: null,
    });

    const etat = await ajouterALaFiche(
      DEMANDE,
      initial,
      formulaire({ cible: "globale:faq_premium", ligne: "Résiliation possible à tout moment" }),
    );

    expect(etat.success).toBe(true);
    expect(operations.find((o) => o.op === "insert")!.payload).toMatchObject({
      activite: "premium",
      logement_id: null,
      section: "faq_premium",
      version: 1,
    });
  });

  it("refuse une fiche de logement quand la demande n'a pas de logement", async () => {
    const operations = installer({ demande: { ...demandeCorrigee, logement_id: null } });

    const etat = await ajouterALaFiche(DEMANDE, initial, formulaire({ cible: "logement:acces", ligne: "x" }));

    expect(etat.error).toBe("Cette demande n'a pas de logement.");
    expect(operations.some((o) => o.op === "insert")).toBe(false);
  });

  it("refuse une section d'une autre activité (section Premium pour une demande F&T)", async () => {
    const operations = installer({ demande: { ...demandeCorrigee, logement_id: null } });

    const etat = await ajouterALaFiche(DEMANDE, initial, formulaire({ cible: "globale:faq_premium", ligne: "x" }));

    expect(etat.error).toBe("Cette section n'existe pas pour cette fiche.");
    expect(operations.some((o) => o.op === "insert")).toBe(false);
  });

  it("refuse une information déjà présente dans la fiche", async () => {
    const operations = installer({
      demande: demandeCorrigee,
      fiche: { id: "v1", version: 1, contenu: "Pas de fêtes" },
    });

    const etat = await ajouterALaFiche(DEMANDE, initial, formulaire({ cible: "logement:regles", ligne: "pas de fêtes" }));

    expect(etat.error).toBe("Cette information figure déjà dans la fiche.");
    expect(operations.some((o) => o.op === "insert")).toBe(false);
    expect(ecrireAuJournal).not.toHaveBeenCalled();
  });

  it("signale un conflit de version, sans journal", async () => {
    installer({
      demande: demandeCorrigee,
      fiche: { id: "v1", version: 1, contenu: "Pas de fêtes" },
      insertion: { data: null, error: { code: "23505", message: "duplicate key" } },
    });

    const etat = await ajouterALaFiche(DEMANDE, initial, formulaire({ cible: "logement:regles", ligne: "Silence après 22 h" }));

    expect(etat.error).toContain("vient d'être modifiée par ailleurs");
    expect(ecrireAuJournal).not.toHaveBeenCalled();
  });

  it("enregistre mais avertit quand la ligne ajoutée ressemble à un code", async () => {
    installer({ demande: demandeCorrigee, fiche: null });

    const etat = await ajouterALaFiche(DEMANDE, initial, formulaire({ cible: "logement:acces", ligne: "Digicode : 4521" }));

    expect(etat.success).toBe(true);
    expect(etat.avertissements).toEqual(["Digicode : 4521"]);
  });

  it("accepte aussi une escalade reprise à la main", async () => {
    installer({ demande: { ...demandeCorrigee, statut: "escalade" }, fiche: null });

    const etat = await ajouterALaFiche(DEMANDE, initial, formulaire({ cible: "logement:depannage", ligne: "Disjoncteur dans l'entrée" }));

    expect(etat.success).toBe(true);
  });
});
