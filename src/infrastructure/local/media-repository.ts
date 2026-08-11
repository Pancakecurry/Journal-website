import type { LocalMedia } from "@/domain/media";
import type { JournalDatabase } from "@/infrastructure/local/database";
import { nowIso } from "@/domain/shared";

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
      .filter((item) => item.status === "pending_upload" || item.status === "failed")
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
    await this.database.media.update(id, {
      status: "uploaded",
      objectKey,
      lastError: null,
      updatedAt: nowIso(),
      syncState: "synced",
    });
  }
}
