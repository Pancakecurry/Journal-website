import { describe, expect, it } from "vitest";
import type { OutboxOperation } from "@/domain/sync";
import { SyncEngine, type OutboxStore, type PushResult, type SyncRemote } from "@/sync/engine";

const operation = (overrides: Partial<OutboxOperation> = {}): OutboxOperation => ({
  operationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  userId: "11111111-1111-4111-8111-111111111111",
  entityType: "moment",
  entityId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  action: "upsert",
  expectedVersion: 0,
  payload: { content: { kind: "text", text: "A local thought" } },
  status: "pending",
  attempts: 0,
  createdAt: "2026-08-12T10:00:00.000Z",
  nextAttemptAt: "2026-08-12T10:00:00.000Z",
  lastError: null,
  ...overrides,
});

class MemoryOutbox implements OutboxStore {
  acknowledged: string[] = [];
  failures: Array<{ id: string; error: string; next: string }> = [];
  conflicts: string[] = [];
  syncing: string[] = [];
  constructor(readonly operations: OutboxOperation[]) {}
  ready = async () => this.operations;
  markSyncing = async (id: string) => void this.syncing.push(id);
  acknowledge = async (id: string) => void this.acknowledged.push(id);
  fail = async (id: string, error: string, next: string) =>
    void this.failures.push({ id, error, next });
  conflict = async (id: string) => void this.conflicts.push(id);
}

class Remote implements SyncRemote {
  constructor(private readonly response: PushResult | Error) {}
  async push() {
    if (this.response instanceof Error) throw this.response;
    return this.response;
  }
}

describe("SyncEngine", () => {
  const clock = () => new Date("2026-08-12T10:00:00.000Z");

  it.each(["applied", "duplicate"] as const)(
    "acknowledges %s operations without duplication",
    async (status) => {
      const store = new MemoryOutbox([operation()]);
      const result = await new SyncEngine(
        store,
        new Remote({ status, serverVersion: 1 }),
        clock,
      ).flush();
      expect(store.acknowledged).toEqual([operation().operationId]);
      expect(result[status === "applied" ? "applied" : "duplicates"]).toBe(1);
    },
  );

  it("retains failed work and schedules a retry", async () => {
    const store = new MemoryOutbox([operation({ attempts: 2 })]);
    const result = await new SyncEngine(
      store,
      new Remote(new Error("network unavailable")),
      clock,
    ).flush();
    expect(result.failed).toBe(1);
    expect(store.failures[0]).toEqual({
      id: operation().operationId,
      error: "network unavailable",
      next: "2026-08-12T10:00:04.000Z",
    });
    expect(store.acknowledged).toEqual([]);
  });

  it("preserves ambiguous conflicts instead of acknowledging them", async () => {
    const store = new MemoryOutbox([operation()]);
    const result = await new SyncEngine(
      store,
      new Remote({
        status: "conflict",
        serverVersion: 3,
        remoteRecord: { text: "remote version" },
      }),
      clock,
    ).flush();
    expect(result.conflicts).toBe(1);
    expect(store.conflicts).toEqual([operation().operationId]);
    expect(store.acknowledged).toEqual([]);
  });

  it("carries deletion as an explicit retryable operation", async () => {
    const deletion = operation({ action: "delete", expectedVersion: 4 });
    const store = new MemoryOutbox([deletion]);
    await new SyncEngine(store, new Remote({ status: "applied", serverVersion: 5 }), clock).flush();
    expect(store.acknowledged).toEqual([deletion.operationId]);
  });
});
