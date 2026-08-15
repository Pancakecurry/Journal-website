import Dexie from "dexie";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AiProviderPort } from "@/application/ai-provider";
import { SemanticMemoryRepository } from "@/application/semantic-memory";
import { DEFAULT_AI_SCOPES } from "@/domain/intelligence";
import { JournalDatabase } from "@/infrastructure/local/database";
import { seedHistoryFixture } from "@/test/history-fixtures";

const USER = "11111111-1111-4111-8111-111111111111";
const names: string[] = [];
afterEach(async () => {
  await Promise.all(names.splice(0).map((name) => Dexie.delete(name)));
});

describe("semantic personal memory", () => {
  it("indexes incrementally, keeps Day traceability, and removes deleted sources", async () => {
    const database = make();
    await seedHistoryFixture(database, USER, "several");
    const provider = fakeProvider();
    const repository = new SemanticMemoryRepository(database, provider);
    const scopes = { ...DEFAULT_AI_SCOPES, moment: true, journal: true };
    const first = await repository.rebuild(USER, scopes);
    expect(first.status).toBe("ready");
    expect(
      await database.semanticChunks.where("userId").equals(USER).count(),
    ).toBeGreaterThanOrEqual(8);
    const callsAfterFirst = provider.embed.mock.calls.length;
    await repository.rebuild(USER, scopes);
    expect(provider.embed).toHaveBeenCalledTimes(callsAfterFirst);
    const results = await repository.search(USER, "coffee ramen");
    expect(results[0]?.chunk.dayId).toBeTruthy();
    expect(results[0]?.chunk.localDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const sourceId = results[0]!.chunk.sourceId;
    await database.moments.update(sourceId, { deletedAt: new Date().toISOString() });
    await database.searchDocuments.where("entityId").equals(sourceId).delete();
    await repository.rebuild(USER, scopes);
    expect(await database.semanticChunks.where("sourceId").equals(sourceId).count()).toBe(0);
    database.close();
  });

  it("batches a 1,000-Day journal and never exceeds the provider limit", async () => {
    const database = make();
    const seeded = await seedHistoryFixture(database, USER, "large");
    const provider = fakeProvider();
    const repository = new SemanticMemoryRepository(database, provider);
    await repository.rebuild(USER, { ...DEFAULT_AI_SCOPES, moment: true });
    expect(seeded.days).toBeGreaterThan(1_000);
    expect(await database.semanticChunks.where("userId").equals(USER).count()).toBe(seeded.moments);
    expect(
      Math.max(...provider.embed.mock.calls.map(([items]) => items.length)),
    ).toBeLessThanOrEqual(16);
    database.close();
  }, 30_000);

  it("deletes only derived AI data", async () => {
    const database = make();
    await seedHistoryFixture(database, USER, "several");
    const repository = new SemanticMemoryRepository(database, fakeProvider());
    await repository.rebuild(USER, { ...DEFAULT_AI_SCOPES, moment: true });
    const moments = await database.moments.count();
    await repository.removeDerivedData(USER);
    expect(await database.semanticChunks.count()).toBe(0);
    expect(await database.moments.count()).toBe(moments);
    database.close();
  });
});

function fakeProvider() {
  return {
    status: vi.fn(async () => ({
      available: true,
      provider: "Test provider",
      generationModel: "test-generation",
      embeddingModel: "test-embedding",
      externalProcessing: true,
    })),
    embed: vi.fn(async (items: { text: string }[]) => ({
      provider: "Test provider",
      model: "test-embedding",
      dimensions: 4,
      vectors: items.map(({ text }) => vector(text)),
    })),
    answer: vi.fn(async () => ({ answer: "Grounded answer", sourceIds: [], uncertainty: null })),
  } satisfies AiProviderPort;
}
function vector(text: string) {
  const value = text.toLowerCase();
  return [
    value.includes("ramen") ? 1 : 0.1,
    value.includes("coffee") ? 1 : 0.1,
    value.includes("university") ? 1 : 0.1,
    1,
  ];
}
function make() {
  const name = `semantic-${crypto.randomUUID()}`;
  names.push(name);
  return new JournalDatabase(name);
}
