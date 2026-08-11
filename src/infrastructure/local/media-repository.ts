import type { LocalMedia } from "@/domain/media";
import type { JournalDatabase } from "@/infrastructure/local/database";

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
}
