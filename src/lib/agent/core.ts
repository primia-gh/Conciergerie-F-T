import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { OUTILS_PROSPECTION } from "./tools";

const MODELE = "claude-sonnet-5";
const MAX_TOKENS = 1024;
const MAX_TOURS_OUTILS = 4;

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export type MessageConversation = { role: "user" | "assistant"; content: string };

export type AppelOutil = { nom: string; input: Record<string, unknown> };

export type ExecuteurOutil = (appel: AppelOutil) => Promise<string>;

export type TourAgentResult = {
  texte: string;
  appelsOutils: AppelOutil[];
};

/**
 * Fait tourner l'agent sur un message, en exécutant les outils demandés via
 * `executeurOutil` (injecté par l'appelant — voir server/agent/chat.ts) tant
 * que le modèle en réclame, jusqu'à une réponse texte finale ou la limite de
 * tours de sécurité MAX_TOURS_OUTILS.
 */
export async function jouerTourAgent(params: {
  systemPrompt: string;
  historique: MessageConversation[];
  executeurOutil: ExecuteurOutil;
}): Promise<TourAgentResult> {
  const { systemPrompt, executeurOutil } = params;
  const messages: Anthropic.MessageParam[] = params.historique.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const appelsOutils: AppelOutil[] = [];

  for (let tour = 0; tour < MAX_TOURS_OUTILS; tour++) {
    const reponse = await getClient().messages.create({
      model: MODELE,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      tools: OUTILS_PROSPECTION,
      messages,
    });

    const blocsOutils = reponse.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );

    if (blocsOutils.length === 0) {
      const texte = reponse.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return { texte, appelsOutils };
    }

    messages.push({ role: "assistant", content: reponse.content });

    const resultats: Anthropic.ToolResultBlockParam[] = [];
    for (const bloc of blocsOutils) {
      const input = (bloc.input ?? {}) as Record<string, unknown>;
      appelsOutils.push({ nom: bloc.name, input });
      const resultat = await executeurOutil({ nom: bloc.name, input });
      resultats.push({ type: "tool_result", tool_use_id: bloc.id, content: resultat });
    }
    messages.push({ role: "user", content: resultats });
  }

  return {
    texte:
      "Je transmets votre demande à un membre de l'équipe F&T, qui revient vers vous rapidement.",
    appelsOutils,
  };
}
