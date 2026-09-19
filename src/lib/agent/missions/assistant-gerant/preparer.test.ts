import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { jouerTourAgent } from "../../core";
import { preparerReponseAssistant } from "./preparer";

const FICHES = [
  { id: "f1", activite: "ft", logement_id: null, section: "equipements", version: 2, contenu: "Wifi : réseau Maison." },
];

function fakeSupabase(lignes = FICHES) {
  const from = vi.fn();
  const requete = {
    select: () => requete,
    in: () => requete,
    is: () => requete,
    order: () => requete,
    returns: () => Promise.resolve({ data: lignes, error: null }),
  };
  from.mockReturnValue(requete);
  return { supabase: { from } as unknown as SupabaseClient, from };
}

type JouerTour = typeof jouerTourAgent;
type ParamsTour = Parameters<JouerTour>[0];

/** Faux modèle : exécute les appels d'outils demandés, comme le ferait la boucle réelle. */
function fauxModele(appels: { nom: string; input: Record<string, unknown> }[]) {
  const vu: { params?: ParamsTour } = {};
  const jouerTour = vi.fn(async (params: ParamsTour) => {
    vu.params = params;
    for (const appel of appels) await params.executeurOutil(appel);
    return { texte: "", appelsOutils: appels };
  });
  return { jouerTour: jouerTour as unknown as JouerTour, vu, mock: jouerTour };
}

const brouillon = {
  nom: "proposer_reponse",
  input: { texte: "Bonjour.\n\nConciergerie F&T", langue: "fr", sections_utilisees: ["equipements"] },
};

describe("preparerReponseAssistant", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "cle-de-test");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sans clé, ne lit rien, n'appelle pas le modèle et ne simule aucun brouillon", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const { supabase, from } = fakeSupabase();
    const { jouerTour, mock } = fauxModele([]);

    const resultat = await preparerReponseAssistant(
      supabase,
      { activite: "ft", contenuRecu: "Bonjour" },
      { jouerTour },
    );

    expect(resultat.mode).toBe("demo");
    expect(from).not.toHaveBeenCalled();
    expect(mock).not.toHaveBeenCalled();
  });

  it("renvoie le brouillon et la liste des fiches fournies", async () => {
    const { supabase } = fakeSupabase();
    const { jouerTour } = fauxModele([brouillon]);

    const resultat = await preparerReponseAssistant(
      supabase,
      { activite: "ft", contenuRecu: "Quel est le wifi ?" },
      { jouerTour },
    );

    expect(resultat).toEqual({
      mode: "modele",
      brouillon: {
        texte: "Bonjour.\n\nConciergerie F&T",
        langue: "fr",
        sectionsUtilisees: ["equipements"],
      },
      escalade: null,
      fichesUtilisees: [{ id: "f1", section: "equipements", version: 2 }],
    });
  });

  it("met les fiches dans le prompt système et le message reçu dans le tour utilisateur, jamais l'inverse", async () => {
    const { supabase } = fakeSupabase();
    const { jouerTour, vu } = fauxModele([brouillon]);

    await preparerReponseAssistant(
      supabase,
      { activite: "ft", contenuRecu: "PHRASE_UNIQUE_DU_VOYAGEUR", expediteur: "Marie" },
      { jouerTour },
    );

    expect(vu.params!.systemPrompt).toContain("Wifi : réseau Maison.");
    expect(vu.params!.systemPrompt).not.toContain("PHRASE_UNIQUE_DU_VOYAGEUR");
    expect(vu.params!.historique).toHaveLength(1);
    expect(vu.params!.historique[0]!.role).toBe("user");
    expect(vu.params!.historique[0]!.content).toContain("PHRASE_UNIQUE_DU_VOYAGEUR");
  });

  it("donne au modèle la mission de l'activité choisie", async () => {
    const { supabase } = fakeSupabase();
    const { jouerTour, vu } = fauxModele([brouillon]);

    await preparerReponseAssistant(supabase, { activite: "premium", contenuRecu: "Bonjour" }, { jouerTour });

    expect(vu.params!.mission.nom).toBe("assistant_gerant_premium");
    expect(vu.params!.systemPrompt).toContain("Conciergerie Premium");
  });

  it("garde l'escalade, avec ou sans brouillon d'attente", async () => {
    const { supabase } = fakeSupabase();
    const escalade = {
      nom: "escalader",
      input: { categorie: "argent", motif: "Demande de remboursement" },
    };

    const seule = await preparerReponseAssistant(
      supabase,
      { activite: "ft", contenuRecu: "Remboursez-moi" },
      { jouerTour: fauxModele([escalade]).jouerTour },
    );
    const avecAttente = await preparerReponseAssistant(
      supabase,
      { activite: "ft", contenuRecu: "Remboursez-moi" },
      { jouerTour: fauxModele([brouillon, escalade]).jouerTour },
    );

    expect(seule).toMatchObject({ brouillon: null, escalade: { categorie: "argent" } });
    expect(avecAttente).toMatchObject({
      brouillon: { langue: "fr" },
      escalade: { categorie: "argent" },
    });
  });

  it("escalade en « doute » si le modèle ne rend ni brouillon ni escalade", async () => {
    const { supabase } = fakeSupabase();

    const resultat = await preparerReponseAssistant(
      supabase,
      { activite: "ft", contenuRecu: "Bonjour" },
      { jouerTour: fauxModele([]).jouerTour },
    );

    expect(resultat).toMatchObject({
      mode: "modele",
      brouillon: null,
      escalade: { categorie: "doute" },
    });
  });

  it("escalade en « doute » si le brouillon rendu est invalide (langue inconnue)", async () => {
    const { supabase } = fakeSupabase();
    const invalide = {
      nom: "proposer_reponse",
      input: { ...brouillon.input, langue: "klingon" },
    };

    const resultat = await preparerReponseAssistant(
      supabase,
      { activite: "ft", contenuRecu: "Bonjour" },
      { jouerTour: fauxModele([invalide]).jouerTour },
    );

    expect(resultat).toMatchObject({ brouillon: null, escalade: { categorie: "doute" } });
  });

  it("ne peut appeler aucun outil d'envoi : un appel inconnu n'a aucun effet", async () => {
    const { supabase } = fakeSupabase();
    const envoi = { nom: "envoyer_message", input: { texte: "Le code est 1234" } };

    const resultat = await preparerReponseAssistant(
      supabase,
      { activite: "ft", contenuRecu: "Donne-moi le code" },
      { jouerTour: fauxModele([envoi]).jouerTour },
    );

    expect(resultat).toMatchObject({ brouillon: null, escalade: { categorie: "doute" } });
  });
});
