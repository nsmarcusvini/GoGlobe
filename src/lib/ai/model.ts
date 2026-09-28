// No "server-only" here so scripts/ai-report.ts can run the same model code;
// the app reaches it only through lib/ai/server.ts, which is server-only. The
// API key is always passed in, never read from the environment here.
import Anthropic from "@anthropic-ai/sdk";
import { isAdviceRequest, PROFESSIONALS } from "./guard.ts";
import { SYSTEM_PROMPT, type ChatTurn, type SourceChunk } from "./prompt.ts";

export const DEFAULT_MODEL = "claude-opus-5-5";

export type AnswerEvent =
  { type: "text"; text: string } | { type: "end"; stopReason: string; model: string };

export interface AnswerModel {
  readonly name: string;
  answer(input: {
    messages: ChatTurn[];
    sources: SourceChunk[];
    question: string;
    signal?: AbortSignal;
  }): AsyncIterable<AnswerEvent>;
}

export function anthropicModel(apiKey: string, model = DEFAULT_MODEL): AnswerModel {
  const client = new Anthropic({ apiKey });
  // Server-side refusal fallbacks exist for the Opus 5 family; other configured
  // models run without them (a refusal then just ends the answer).
  const fallbacks = model.startsWith("claude-opus-5");
  return {
    name: model,
    async *answer({ messages, signal }) {
      const stream = client.beta.messages.stream(
        {
          model,
          max_tokens: 4096,
          system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
          messages,
          // Grounded Q&A over short excerpts: low effort keeps chat latency down.
          output_config: { effort: "low" },
          ...(fallbacks
            ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
            : {}),
        },
        { signal },
      );
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          yield { type: "text", text: event.delta.text };
        }
      }
      const final = await stream.finalMessage();
      yield { type: "end", stopReason: final.stop_reason ?? "end_turn", model: final.model };
    },
  };
}

function firstSentence(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  const sentence = flat.match(/^.{20,280}?[.!?](\s|$)/)?.[0] ?? flat.slice(0, 220);
  return sentence.trim().replace(/[.!?]?$/, "");
}

/**
 * Offline stand-in used in development and e2e when there is no API key. It
 * follows the same contract (cites excerpts, admits gaps, declines advice) with
 * canned text, so the interface and the quota can be tested for free.
 */
export const mockModel: AnswerModel = {
  name: "mock",
  async *answer({ sources, question }) {
    let text: string;
    if (isAdviceRequest(question)) {
      text = `Não posso indicar qual caminho escolher nem avaliar suas chances: isso é aconselhamento migratório individual. Para isso, procure ${PROFESSIONALS}. Posso explicar o que as fontes oficiais dizem sobre um requisito específico.`;
    } else if (sources.length === 0) {
      text =
        "Não encontrei essa informação nas fontes oficiais que tenho sobre os seus caminhos. Confira a página oficial do caminho.";
    } else {
      const cited = sources.slice(0, 2).map((s, i) => `${firstSentence(s.content)} [${i + 1}].`);
      text = `Segundo as fontes oficiais: ${cited.join(" ")}`;
    }
    for (const word of text.split(/(?<= )/)) {
      yield { type: "text", text: word };
      await new Promise((resolve) => setTimeout(resolve, 8));
    }
    yield { type: "end", stopReason: "end_turn", model: "mock" };
  },
};
