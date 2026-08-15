import { AiAnswerSchema, AiProviderStatusSchema, type AiAnswer } from "@/domain/intelligence";
import type { AiSourceKind } from "@/domain/intelligence";

export interface EmbeddingBatch {
  provider: string;
  model: string;
  dimensions: number;
  vectors: number[][];
}

export interface GroundingSource {
  id: string;
  title: string;
  date: string | null;
  kind: string;
  text: string;
}

export interface AiProviderPort {
  status(signal?: AbortSignal): Promise<{
    available: boolean;
    provider: string;
    generationModel: string;
    embeddingModel: string;
    externalProcessing: boolean;
  }>;
  embed(
    items: { kind: AiSourceKind | "query"; text: string }[],
    signal?: AbortSignal,
  ): Promise<EmbeddingBatch>;
  answer(question: string, sources: GroundingSource[], signal?: AbortSignal): Promise<AiAnswer>;
}

export class RemoteAiProvider implements AiProviderPort {
  async status(signal?: AbortSignal) {
    const response = await fetch("/api/ai/status", { signal, cache: "no-store" });
    if (!response.ok) return unavailableStatus();
    return AiProviderStatusSchema.parse(await response.json());
  }

  async embed(
    items: { kind: AiSourceKind | "query"; text: string }[],
    signal?: AbortSignal,
  ): Promise<EmbeddingBatch> {
    const response = await fetch("/api/ai/embed", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items }),
      signal,
    });
    if (!response.ok) throw new Error(await readableFailure(response));
    return (await response.json()) as EmbeddingBatch;
  }

  async answer(
    question: string,
    sources: GroundingSource[],
    signal?: AbortSignal,
  ): Promise<AiAnswer> {
    const response = await fetch("/api/ai/answer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question, sources }),
      signal,
    });
    if (!response.ok) throw new Error(await readableFailure(response));
    return AiAnswerSchema.parse(await response.json());
  }
}

function unavailableStatus() {
  return {
    available: false,
    provider: "Not configured",
    generationModel: "Not configured",
    embeddingModel: "Not configured",
    externalProcessing: false,
  };
}

async function readableFailure(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? `AI request failed (${response.status})`;
}
