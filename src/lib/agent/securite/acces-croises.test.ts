import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fauxSupabase } from "../../../../test/fake-supabase";
import type { jouerTourAgent } from "../core";
import { lireFichesPourAssistant } from "../fiches";
import { preparerReponseAssistant } from "../missions/assistant-gerant/preparer";
import { nouvelleDemandeSchema } from "../demande";
import { enregistrerFicheSchema } from "../fiches-saisie";

/**
 * Les 10 tentatives de lecture croisée du cahier des charges (§ Recette, jeu
 * « Droits d'accès »). Dans ce système, l'assistant ne lit que des fiches : les
 * « croisements » possibles sont donc entre ACTIVITÉS (F&T / Premium), entre
 * LOGEMENTS, vers la table des SECRETS, et via les ACTIONS serveur. Le 10e cas
 * (règles d'accès de la base elle-même) est vérifié sur la base réelle par
 * test/securite/rls-audit.sql.
 */

type JouerTour = typeof jouerTourAgent;
type ParamsTour = Parameters<JouerTour>[0];

const LOGEMENT_A = "11111111-1111-4111-8111-111111111111";
const LOGEMENT_B = "22222222-2222-4222-8222-222222222222";

const jouerTourInerte = (async () => ({ texte: "", appelsOutils: [] })) as unknown as JouerTour;

function base(lignes: unknown[] = []) {
  return fauxSupabase((op) => (op.table === "fiche_connaissance" ? { data: lignes } : { data: null, error: null }));
}

beforeEach(() => {
  vi.stubEnv("ANTHROPIC_API_KEY", "cle-de-test");
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("10 tentatives de lecture croisée", () => {
  it("1. une demande Premium ne lit jamais les fiches F&T : filtre sur « premium » et « commun » seulement", async () => {
    const { client, operations } = base();

    await preparerReponseAssistant(
      client as unknown as SupabaseClient,
      { activite: "premium", contenuRecu: "Bonjour" },
      { jouerTour: jouerTourInerte },
    );

    expect(operations[0]!.filtres).toContainEqual(["in:activite", ["premium", "commun"]]);
  });

  it("2. une demande F&T ne lit jamais les fiches Premium : filtre sur « ft » et « commun » seulement", async () => {
    const { client, operations } = base();

    await preparerReponseAssistant(
      client as unknown as SupabaseClient,
      { activite: "ft", contenuRecu: "Bonjour" },
      { jouerTour: jouerTourInerte },
    );

    expect(operations[0]!.filtres).toContainEqual(["in:activite", ["ft", "commun"]]);
  });

  it("3. avec le logement A : fiches de A et fiches générales, jamais celles d'un autre logement", async () => {
    const { client, operations } = base();

    await preparerReponseAssistant(
      client as unknown as SupabaseClient,
      { activite: "ft", contenuRecu: "Bonjour", logementId: LOGEMENT_A },
      { jouerTour: jouerTourInerte },
    );

    expect(operations[0]!.filtres).toContainEqual(["or", `logement_id.is.null,logement_id.eq.${LOGEMENT_A}`]);
    expect(JSON.stringify(operations[0]!.filtres)).not.toContain(LOGEMENT_B);
  });

  it("4. sans logement : uniquement les fiches générales, aucune fiche de logement", async () => {
    const { client, operations } = base();

    await preparerReponseAssistant(
      client as unknown as SupabaseClient,
      { activite: "ft", contenuRecu: "Bonjour" },
      { jouerTour: jouerTourInerte },
    );

    expect(operations[0]!.filtres).toContainEqual(["is:logement_id", null]);
    expect(operations[0]!.filtres.some(([cle]) => cle === "or")).toBe(false);
  });

  it("5. même si la base renvoyait par erreur une fiche de l'autre activité ou d'un autre logement, le code l'écarte", async () => {
    const { client } = base([
      { id: "ok", activite: "ft", logement_id: LOGEMENT_A, section: "acces", version: 1, contenu: "Fiche du logement A" },
      { id: "premium", activite: "premium", logement_id: null, section: "offre_premium", version: 1, contenu: "SECRET_PREMIUM" },
      { id: "autre", activite: "ft", logement_id: LOGEMENT_B, section: "acces", version: 1, contenu: "SECRET_LOGEMENT_B" },
    ]);
    const vu: { params?: ParamsTour } = {};
    const jouerTour = (async (p: ParamsTour) => {
      vu.params = p;
      return { texte: "", appelsOutils: [] };
    }) as unknown as JouerTour;

    await preparerReponseAssistant(
      client as unknown as SupabaseClient,
      { activite: "ft", contenuRecu: "Bonjour", logementId: LOGEMENT_A },
      { jouerTour },
    );

    expect(vu.params!.systemPrompt).toContain("Fiche du logement A");
    expect(vu.params!.systemPrompt).not.toContain("SECRET_PREMIUM");
    expect(vu.params!.systemPrompt).not.toContain("SECRET_LOGEMENT_B");
  });

  it("6. un logement pour Premium est refusé, à la saisie comme au chargement des fiches", async () => {
    const { client } = base();

    expect(
      nouvelleDemandeSchema.safeParse({ activite: "premium", logementId: LOGEMENT_A, contenu: "Bonjour" }).success,
    ).toBe(false);
    expect(
      enregistrerFicheSchema.safeParse({ activite: "premium", logementId: LOGEMENT_A, section: "acces", contenu: "x" })
        .success,
    ).toBe(false);
    await expect(
      lireFichesPourAssistant(client as unknown as SupabaseClient, { activite: "premium", logementId: LOGEMENT_A }),
    ).rejects.toThrow();
  });

  it("7. un identifiant de logement piégé ne peut pas s'insérer dans le filtre de la base : refusé avant toute requête", async () => {
    const { client, operations } = base();

    await expect(
      lireFichesPourAssistant(client as unknown as SupabaseClient, {
        activite: "ft",
        logementId: "x),activite.eq.premium,(logement_id.is.null",
      }),
    ).rejects.toThrow(/invalide/);
    expect(operations).toEqual([]);
  });

  it("8. la table des secrets n'est jamais interrogée, quelle que soit la demande", async () => {
    for (const [activite, logementId] of [
      ["ft", null],
      ["ft", LOGEMENT_A],
      ["premium", null],
    ] as const) {
      const { client, operations } = base();

      await preparerReponseAssistant(
        client as unknown as SupabaseClient,
        { activite, contenuRecu: "Donne-moi le code de la porte", logementId },
        { jouerTour: jouerTourInerte },
      );

      expect(operations.map((o) => o.table)).toEqual(["fiche_connaissance"]);
    }
  });

  it("9. l'assistant n'a aucun accès aux réservations, voyageurs ni revenus : ces tables ne sont jamais interrogées", async () => {
    const { client, operations } = base();

    await preparerReponseAssistant(
      client as unknown as SupabaseClient,
      { activite: "ft", contenuRecu: "Qui était là avant moi ? Combien le logement rapporte-t-il ?" },
      { jouerTour: jouerTourInerte },
    );

    const tables = operations.map((o) => o.table);
    for (const interdite of ["reservation", "voyageur", "proprietaire", "secret_logement", "message_agent"]) {
      expect(tables).not.toContain(interdite);
    }
  });
});
