import type { OutboxStore } from "@/sync/engine";
import type { OutboxOperation } from "@/domain/sync";
import type { JournalDatabase } from "@/infrastructure/local/database";

export class DexieOutboxStore implements OutboxStore {
  constructor(private readonly database: JournalDatabase) {}

  async ready(at: string): Promise<OutboxOperation[]> {
    return this.database.outbox
      .where("nextAttemptAt")
      .belowOrEqual(at)
      .filter((item) => item.status === "pending" || item.status === "failed")
      .sortBy("createdAt");
  }

  async markSyncing(operationId: string): Promise<void> {
    await this.database.outbox.update(operationId, { status: "syncing" });
  }

  async acknowledge(operationId: string): Promise<void> {
    await this.database.outbox.delete(operationId);
  }

  async fail(operationId: string, error: string, nextAttemptAt: string): Promise<void> {
    const operation = await this.database.outbox.get(operationId);
    if (!operation) return;
    await this.database.outbox.update(operationId, {
      status: "failed",
      attempts: operation.attempts + 1,
      lastError: error,
      nextAttemptAt,
    });
  }

  async conflict(operationId: string, remoteRecord: unknown): Promise<void> {
    await this.database.outbox.update(operationId, {
      status: "conflict",
      lastError: JSON.stringify({ reason: "version_conflict", remoteRecord }),
    });
  }
}
