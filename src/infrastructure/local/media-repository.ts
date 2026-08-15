import type { LocalMedia } from "@/domain/media";
import type { JournalDatabase } from "@/infrastructure/local/database";
import { nowIso } from "@/domain/shared";
import { newEntityId } from "@/domain/shared";
import { OutboxOperationSchema } from "@/domain/sync";

export class LocalMediaRepository {
  constructor(private readonly database: JournalDatabase) {}

  async put(record: LocalMedia): Promise<void> {
    await this.database.media.put(record);
  }

  async get(id: string): Promise<LocalMedia | undefined> {
    return this.database.media.get(id);
  }

  async listPending(userId: string): Promise<LocalMedia[]> {
    return this.database.media
      .where("userId")
      .equals(userId)
      .filter(
        (item) =>
          item.status === "local" || item.status === "pending_upload" || item.status === "failed",
      )
      .toArray();
  }

  async queue(id: string): Promise<void> {
    await this.database.media.update(id, {
      status: "pending_upload",
      lastError: null,
      updatedAt: nowIso(),
      syncState: "pending",
    });
  }

  async markUploading(id: string): Promise<void> {
    const record = await this.database.media.get(id);
    if (!record) return;
    await this.database.media.update(id, {
      status: "uploading",
      uploadAttempts: record.uploadAttempts + 1,
      updatedAt: nowIso(),
    });
  }

  async markFailed(id: string, userSafeError: string): Promise<void> {
    await this.database.media.update(id, {
      status: "failed",
      lastError: userSafeError,
      updatedAt: nowIso(),
      syncState: "failed",
    });
  }

  async markUploaded(id: string, objectKey: string): Promise<void> {
    const record = await this.database.media.get(id);
    if (!record) return;
    if (!objectKey.startsWith(`${record.userId}/`))
      throw new Error("Private media key owner mismatch");
    const updated: LocalMedia = {
      ...record,
      status: "uploaded",
      objectKey,
      lastError: null,
      updatedAt: nowIso(),
      version: record.version + 1,
      syncState: "pending",
    };
    const timestamp = nowIso();
    await this.database.transaction("rw", [this.database.media, this.database.outbox], async () => {
      await this.database.media.put(updated);
      await this.database.outbox.add(
        OutboxOperationSchema.parse({
          operationId: newEntityId(),
          userId: record.userId,
          entityType: "media",
          entityId: id,
          action: "upsert",
          expectedVersion: updated.version,
          payload: updated,
          status: "pending",
          attempts: 0,
          createdAt: timestamp,
          nextAttemptAt: timestamp,
          lastError: null,
        }),
      );
    });
  }
}
