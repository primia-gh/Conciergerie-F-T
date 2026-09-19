import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import type { Mission } from "./types";

const { create } = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create };
  },
}));

import { jouerTourAgent } from "./core";

function outil(name: string): Anthropic.Tool {
  return { name, description: name, input_schema: { type: "object", properties: {} } };
}

const missionA: Mission = {
  nom: "mission_a",
  activite: "ft",
  outils: [outil("outil_a")],
  reponseSansCle: "SANS_CLE_A",
  reponseSiTropDeTours: "TROP_DE_TOURS_A",
};

const missionB: Mission = {
  nom: "mission_b",
  activite: "premium",
  outils: [outil("outil_b1"), outil("outil_b2")],
  reponseSansCle: "SANS_CLE_B",
  reponseSiTropDeTours: "TROP_DE_TOURS_B",
};

const historique = [{ role: "user" as const, content: "Bonjour" }];
const executeurInutile = vi.fn(async () => "ok");

function reponseTexte(texte: string) {
  return { content: [{ type: "text", text: texte }] };
}

function reponseOutil(id: string, name: string, input: Record<string, unknown> = {}) {
  return { content: [{ type: "tool_use", id, name, input }] };
}

describe("jouerTourAgent", () => {
  beforeEach(() => {
    create.mockReset();
    executeurInutile.mockClear();
    vi.stubEnv("ANTHROPIC_API_KEY", "cle-de-test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sans clé, renvoie la réponse de repli de la mission sans appeler le modèle", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");

    const a = await jouerTourAgent({
      mission: missionA,
      systemPrompt: "p",
      historique,
      executeurOutil: executeurInutile,
    });
    const b = await jouerTourAgent({
      mission: missionB,
      systemPrompt: "p",
      historique,
      executeurOutil: executeurInutile,
    });

    expect(a).toEqual({ texte: "SANS_CLE_A", appelsOutils: [] });
    expect(b).toEqual({ texte: "SANS_CLE_B", appelsOutils: [] });
    expect(create).not.toHaveBeenCalled();
  });

  it("n'expose au modèle que les outils de la mission", async () => {
    create.mockResolvedValue(reponseTexte("Réponse"));

    await jouerTourAgent({
      mission: missionB,
      systemPrompt: "prompt système",
      historique,
      executeurOutil: executeurInutile,
    });

    const appel = create.mock.calls[0]![0];
    expect(appel.tools.map((t: Anthropic.Tool) => t.name)).toEqual(["outil_b1", "outil_b2"]);
    expect(appel.system).toBe("prompt système");
  });

  it("renvoie le texte final quand le modèle n'appelle aucun outil", async () => {
    create.mockResolvedValue(reponseTexte("  Bonjour à vous  "));

    const resultat = await jouerTourAgent({
      mission: missionA,
      systemPrompt: "p",
      historique,
      executeurOutil: executeurInutile,
    });

    expect(resultat).toEqual({ texte: "Bonjour à vous", appelsOutils: [] });
    expect(executeurInutile).not.toHaveBeenCalled();
  });

  it("exécute les outils demandés puis renvoie la réponse finale", async () => {
    create
      .mockResolvedValueOnce(reponseOutil("t1", "outil_a", { champ: "valeur" }))
      .mockResolvedValueOnce(reponseTexte("Terminé"));
    const executeur = vi.fn(async () => "résultat de l'outil");

    const resultat = await jouerTourAgent({
      mission: missionA,
      systemPrompt: "p",
      historique,
      executeurOutil: executeur,
    });

    expect(executeur).toHaveBeenCalledWith({ nom: "outil_a", input: { champ: "valeur" } });
    expect(resultat.texte).toBe("Terminé");
    expect(resultat.appelsOutils).toEqual([{ nom: "outil_a", input: { champ: "valeur" } }]);
    // Le résultat de l'outil est bien renvoyé au modèle au tour suivant.
    const secondAppel = create.mock.calls[1]![0];
    const dernier = secondAppel.messages.at(-1);
    expect(dernier.content[0]).toMatchObject({
      type: "tool_result",
      tool_use_id: "t1",
      content: "résultat de l'outil",
    });
  });

  it("s'arrête après 4 tours d'outils et renvoie le repli de la mission", async () => {
    create.mockResolvedValue(reponseOutil("t", "outil_a"));

    const resultat = await jouerTourAgent({
      mission: missionA,
      systemPrompt: "p",
      historique,
      executeurOutil: executeurInutile,
    });

    expect(create).toHaveBeenCalledTimes(4);
    expect(resultat.texte).toBe("TROP_DE_TOURS_A");
    expect(resultat.appelsOutils).toHaveLength(4);
  });
});
