import type { AiProviderPort, GroundingSource } from "@/application/ai-provider";
import type {
  AiContentScopes,
  AiSourceKind,
  SemanticChunk,
  SemanticIndexState,
  SemanticResult,
} from "@/domain/intelligence";
import { normalizeSearchText, searchTokens } from "@/domain/history";
import { nowIso } from "@/domain/shared";
import type { JournalDatabase } from "@/infrastructure/local/database";
import { refreshDayDerived } from "@/infrastructure/local/derived-indexes";

export const SEMANTIC_SCHEMA_VERSION = 1;
const MAX_CHUNK_CHARACTERS = 1_800;
const EMBEDDING_BATCH_SIZE = 16;
export const MAX_RETRIEVAL_CANDIDATES = 5_000;

interface SourceText {
  kind: AiSourceKind;
  sourceId: string;
  dayId: string | null;
  localDate: SemanticChunk["localDate"];
  title: string;
  text: string;
  updatedAt: string;
}

export class SemanticMemoryRepository {
  constructor(
    private readonly database: JournalDatabase,
    private readonly provider: AiProviderPort,
  ) {}

  async state(userId: string): Promise<SemanticIndexState | undefined> {
    return this.database.semanticIndexState.get(userId);
  }

  async rebuild(
    userId: string,
    scopes: AiContentScopes,
    options: { signal?: AbortSignal; onProgress?: (done: number, total: number) => void } = {},
  ): Promise<SemanticIndexState> {
    const status = await this.provider.status(options.signal);
    if (!status.available) throw new Error("AI is not configured on this journal yet.");
    const sources = await collectSources(this.database, userId, scopes);
    const desired = sources.flatMap((source) => chunksForSource(userId, source));
    const desiredIds = new Set(desired.map((item) => item.id));
    const existing = await this.database.semanticChunks.where("userId").equals(userId).toArray();
    const existingById = new Map(existing.map((item) => [item.id, item]));
    const pending = desired.filter((item) => {
      const previous = existingById.get(item.id);
      return (
        !previous ||
        previous.contentFingerprint !== item.contentFingerprint ||
        previous.provider !== status.provider ||
        previous.model !== status.embeddingModel
      );
    });
    const baseState: SemanticIndexState = {
      userId,
      schemaVersion: SEMANTIC_SCHEMA_VERSION,
      provider: status.provider,
      model: status.embeddingModel,
      status: "indexing",
      completedSources: 0,
      totalSources: pending.length,
      lastIndexedAt: null,
      lastError: null,
    };
    await this.database.semanticIndexState.put(baseState);
    try {
      for (let offset = 0; offset < pending.length; offset += EMBEDDING_BATCH_SIZE) {
        if (options.signal?.aborted) throw new DOMException("Indexing cancelled", "AbortError");
        const batch = pending.slice(offset, offset + EMBEDDING_BATCH_SIZE);
        const embedded = await this.provider.embed(
          batch.map((item) => ({ kind: item.sourceKind, text: item.text })),
          options.signal,
        );
        if (embedded.vectors.length !== batch.length)
          throw new Error("Embedding provider returned an incomplete batch.");
        await this.database.semanticChunks.bulkPut(
          batch.map((item, index) => ({
            ...item,
            provider: embedded.provider,
            model: embedded.model,
            dimensions: embedded.dimensions,
            vector: embedded.vectors[index]!,
            indexedAt: nowIso(),
          })),
        );
        const completedSources = Math.min(offset + batch.length, pending.length);
        await this.database.semanticIndexState.update(userId, { completedSources });
        options.onProgress?.(completedSources, pending.length);
      }
      const staleIds = existing.filter((item) => !desiredIds.has(item.id)).map((item) => item.id);
      if (staleIds.length) await this.database.semanticChunks.bulkDelete(staleIds);
      const ready: SemanticIndexState = {
        ...baseState,
        status: "ready",
        completedSources: pending.length,
        lastIndexedAt: nowIso(),
      };
      await this.database.semanticIndexState.put(ready);
      return ready;
    } catch (error) {
      const failed: SemanticIndexState = {
        ...baseState,
        status: options.signal?.aborted ? "paused" : "failed",
        lastError: error instanceof Error ? error.message : "Indexing stopped unexpectedly.",
      };
      await this.database.semanticIndexState.put(failed);
      throw error;
    }
  }

  async search(userId: string, query: string, limit = 12, signal?: AbortSignal) {
    const normalized = normalizeSearchText(query);
    if (!normalized) return [];
    const chunks = await this.database.semanticChunks
      .where("userId")
      .equals(userId)
      .limit(MAX_RETRIEVAL_CANDIDATES)
      .toArray();
    if (!chunks.length) return [];
    const queryEmbedding = await this.provider.embed([{ kind: "query", text: query }], signal);
    const vector = queryEmbedding.vectors[0];
    if (!vector) return [];
    const terms = searchTokens(query);
    return chunks
      .map((chunk): SemanticResult => {
        const semanticScore = cosine(vector, chunk.vector);
        const lexicalScore = terms.length
          ? terms.filter((term) =>
              normalizeSearchText(`${chunk.title} ${chunk.text}`).includes(term),
            ).length / terms.length
          : 0;
        return {
          chunk,
          semanticScore,
          lexicalScore,
          score: semanticScore * 0.78 + lexicalScore * 0.22,
        };
      })
      .sort((left, right) => right.score - left.score)
      .slice(0, Math.max(1, Math.min(limit, 20)));
  }

  async removeDerivedData(userId: string): Promise<void> {
    await this.database.transaction(
      "rw",
      [this.database.semanticChunks, this.database.semanticIndexState],
      async () => {
        await this.database.semanticChunks.where("userId").equals(userId).delete();
        await this.database.semanticIndexState.delete(userId);
      },
    );
  }

  groundingSources(results: SemanticResult[], maxCharacters = 12_000): GroundingSource[] {
    const sources: GroundingSource[] = [];
    let used = 0;
    for (const result of results) {
      if (used + result.chunk.text.length > maxCharacters && sources.length) break;
      sources.push({
        id: result.chunk.id,
        title: result.chunk.title,
        date: result.chunk.localDate,
        kind: result.chunk.sourceKind,
        text: result.chunk.text,
      });
      used += result.chunk.text.length;
      if (sources.length >= 8) break;
    }
    return sources;
  }
}

export function chunksForSource(
  userId: string,
  source: SourceText,
): Omit<SemanticChunk, "provider" | "model" | "dimensions" | "vector" | "indexedAt">[] {
  const paragraphs = source.text
    .split(/\n\s*\n/u)
    .map((item) => item.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  for (const paragraph of paragraphs.length ? paragraphs : [source.text.trim()]) {
    const pieces = paragraph.length > MAX_CHUNK_CHARACTERS ? splitLongText(paragraph) : [paragraph];
    for (const piece of pieces) {
      if (current && current.length + piece.length + 2 > MAX_CHUNK_CHARACTERS) {
        chunks.push(current);
        current = piece;
      } else current = current ? `${current}\n\n${piece}` : piece;
    }
  }
  if (current) chunks.push(current);
  return chunks.map((text, chunkIndex) => ({
    id: `${source.kind}:${source.sourceId}:v${SEMANTIC_SCHEMA_VERSION}:${chunkIndex}`,
    userId,
    sourceKind: source.kind,
    sourceId: source.sourceId,
    dayId: source.dayId,
    localDate: source.localDate,
    title: source.title,
    text,
    chunkIndex,
    chunkCount: chunks.length,
    contentFingerprint: fingerprint(`${source.updatedAt}\n${text}`),
    sourceUpdatedAt: source.updatedAt,
  }));
}

async function collectSources(
  database: JournalDatabase,
  userId: string,
  scopes: AiContentScopes,
): Promise<SourceText[]> {
  const days = await database.days
    .where("userId")
    .equals(userId)
    .filter((item) => !item.deletedAt)
    .toArray();
  if ((await database.searchDocuments.where("userId").equals(userId).limit(1).count()) === 0)
    for (const day of days) await refreshDayDerived(database, userId, day.id);
  const dayById = new Map(days.map((day) => [day.id, day]));
  const documents = await database.searchDocuments.where("userId").equals(userId).toArray();
  const mapped = documents.flatMap((document): SourceText[] => {
    const kind = document.kind === "photo" ? "photo_caption" : document.kind;
    if (!scopes[kind]) return [];
    return [
      {
        kind,
        sourceId: document.entityId,
        dayId: document.dayId,
        localDate: document.localDate,
        title: document.title,
        text: document.normalizedText,
        updatedAt: document.updatedAt,
      },
    ];
  });
  if (scopes.monthly_reflection) {
    const monthly = await database.monthlyReflections
      .where("userId")
      .equals(userId)
      .filter((item) => !item.deletedAt && Boolean(item.body.trim()))
      .toArray();
    mapped.push(
      ...monthly.map((item) => ({
        kind: "monthly_reflection" as const,
        sourceId: item.id,
        dayId: null,
        localDate: null,
        title: `Reflection for ${item.month}`,
        text: item.body,
        updatedAt: item.updatedAt,
      })),
    );
  }
  if (scopes.doodle) {
    const doodles = await database.doodles
      .where("userId")
      .equals(userId)
      .filter((item) => !item.deletedAt && Boolean(`${item.title} ${item.description}`.trim()))
      .toArray();
    mapped.push(
      ...doodles.map((item) => ({
        kind: "doodle" as const,
        sourceId: item.id,
        dayId: item.dayId,
        localDate: dayById.get(item.dayId)?.localDate ?? item.localDate,
        title: item.title || "Doodle",
        text: `${item.title} ${item.description}`.trim(),
        updatedAt: item.updatedAt,
      })),
    );
  }
  return mapped;
}

function splitLongText(text: string): string[] {
  const parts: string[] = [];
  for (let offset = 0; offset < text.length; offset += MAX_CHUNK_CHARACTERS - 180)
    parts.push(text.slice(offset, offset + MAX_CHUNK_CHARACTERS));
  return parts;
}

function fingerprint(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function cosine(left: number[], right: number[]): number {
  const size = Math.min(left.length, right.length);
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < size; index += 1) {
    dot += left[index]! * right[index]!;
    leftMagnitude += left[index]! ** 2;
    rightMagnitude += right[index]! ** 2;
  }
  if (!leftMagnitude || !rightMagnitude) return 0;
  return dot / Math.sqrt(leftMagnitude * rightMagnitude);
}
