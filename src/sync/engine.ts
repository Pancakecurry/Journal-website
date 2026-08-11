import type { OutboxOperation } from "@/domain/sync";

export type PushResult =
  | { status: "applied" | "duplicate"; serverVersion: number }
  | { status: "conflict"; serverVersion: number; remoteRecord: unknown };

export interface SyncRemote {
  push(operation: OutboxOperation): Promise<PushResult>;
}

export interface OutboxStore {
  ready(at: string): Promise<OutboxOperation[]>;
  markSyncing(operationId: string): Promise<void>;
  acknowledge(operationId: string): Promise<void>;
  fail(operationId: string, error: string, nextAttemptAt: string): Promise<void>;
  conflict(operationId: string, remoteRecord: unknown): Promise<void>;
}

export interface SyncRunResult {
  applied: number;
  duplicates: number;
  failed: number;
  conflicts: number;
}

export class SyncEngine {
  constructor(
    private readonly outbox: OutboxStore,
    private readonly remote: SyncRemote,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async flush(): Promise<SyncRunResult> {
    const result: SyncRunResult = { applied: 0, duplicates: 0, failed: 0, conflicts: 0 };
    const operations = await this.outbox.ready(this.clock().toISOString());

    for (const operation of operations) {
      await this.outbox.markSyncing(operation.operationId);
      try {
        const pushed = await this.remote.push(operation);
        if (pushed.status === "conflict") {
          await this.outbox.conflict(operation.operationId, pushed.remoteRecord);
          result.conflicts += 1;
          continue;
        }
        await this.outbox.acknowledge(operation.operationId);
        result[pushed.status === "duplicate" ? "duplicates" : "applied"] += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Sync failed";
        const delay = Math.min(60_000, 1_000 * 2 ** operation.attempts);
        const nextAttemptAt = new Date(this.clock().getTime() + delay).toISOString();
        await this.outbox.fail(operation.operationId, message, nextAttemptAt);
        result.failed += 1;
      }
    }

    return result;
  }
}
