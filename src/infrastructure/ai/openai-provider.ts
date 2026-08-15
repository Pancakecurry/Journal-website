import type { GroundingSource } from "@/application/ai-provider";
import type { AiConfiguration } from "@/config/env";
import { AiAnswerSchema, type AiAnswer } from "@/domain/intelligence";

type ConfiguredAi = Extract<AiConfiguration, { configured: true }>;

export class OpenAiServerProvider {
  constructor(private readonly configuration: ConfiguredAi) {}

  async embed(texts: string[], signal?: AbortSignal) {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        model: this.configuration.embeddingModel,
        input: texts,
        dimensions: this.configuration.embeddingDimensions,
        encoding_format: "float",
      }),
      signal,
    });
    const body = await checkedJson<{
      data: { index: number; embedding: number[] }[];
      model: string;
    }>(response);
    const vectors = body.data
      .sort((left, right) => left.index - right.index)
      .map((item) => item.embedding);
    return {
      provider: "OpenAI",
      model: body.model || this.configuration.embeddingModel,
      dimensions: vectors[0]?.length ?? this.configuration.embeddingDimensions,
      vectors,
    };
  }

  async answer(
    question: string,
    sources: GroundingSource[],
    signal?: AbortSignal,
  ): Promise<AiAnswer> {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        model: this.configuration.generationModel,
        store: false,
        max_output_tokens: 900,
        input: [
          {
            role: "developer",
            content: [
              {
                type: "input_text",
                text: "Answer only from the supplied journal excerpts. Be brief, candid, and ordinary, not therapeutic. Never infer diagnoses, motives, personality, or feelings beyond the written evidence. If the excerpts do not answer the question, say so. Return only exact supplied source IDs.",
              },
            ],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: JSON.stringify({ question, sources }) }],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "grounded_journal_answer",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                answer: { type: "string" },
                sourceIds: { type: "array", items: { type: "string" } },
                uncertainty: { anyOf: [{ type: "string" }, { type: "null" }] },
              },
              required: ["answer", "sourceIds", "uncertainty"],
            },
          },
        },
      }),
      signal,
    });
    const body = await checkedJson<{ output?: { content?: { type: string; text?: string }[] }[] }>(
      response,
    );
    const outputText = body.output
      ?.flatMap((item) => item.content ?? [])
      .find((item) => item.type === "output_text")?.text;
    if (!outputText) throw new Error("The AI provider returned no answer.");
    const parsed = AiAnswerSchema.parse(JSON.parse(outputText));
    const allowed = new Set(sources.map((source) => source.id));
    return { ...parsed, sourceIds: parsed.sourceIds.filter((id) => allowed.has(id)) };
  }

  private headers() {
    return {
      authorization: `Bearer ${this.configuration.apiKey}`,
      "content-type": "application/json",
    };
  }
}

async function checkedJson<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as
    (T & { error?: { message?: string } }) | null;
  if (!response.ok)
    throw new Error(body?.error?.message ?? `AI provider failed (${response.status}).`);
  if (!body) throw new Error("AI provider returned an unreadable response.");
  return body;
}
