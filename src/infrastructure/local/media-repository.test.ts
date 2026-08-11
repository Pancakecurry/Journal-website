import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";
import { createLocalMedia } from "@/domain/media";
import { JournalDatabase } from "@/infrastructure/local/database";
import { LocalMediaRepository } from "@/infrastructure/local/media-repository";

const names: string[] = [];
const USER_ID = "11111111-1111-4111-8111-111111111111";
afterEach(async () => Promise.all(names.splice(0).map((name) => Dexie.delete(name))));

describe("LocalMediaRepository", () => {
  it("keeps retry state and accepts only an owner-prefixed remote key", async () => {
    const name = `media-${crypto.randomUUID()}`;
    names.push(name);
    const database = new JournalDatabase(name);
    const repository = new LocalMediaRepository(database);
    const record = createLocalMedia({
      userId: USER_ID,
      dayId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      mimeType: "image/jpeg",
      width: 10,
      height: 10,
      blob: new Blob(["photo"]),
    });
    await repository.put(record);
    await repository.queue(record.id);
    await repository.markUploading(record.id);
    await repository.markFailed(record.id, "Upload is waiting.");
    expect(await repository.get(record.id)).toMatchObject({
      status: "failed",
      uploadAttempts: 1,
      lastError: "Upload is waiting.",
    });
    await expect(
      repository.markUploaded(record.id, `someone-else/${record.id}.jpg`),
    ).rejects.toThrow("owner mismatch");
    await repository.markUploaded(record.id, `${USER_ID}/${record.id}/original.jpg`);
    expect(await repository.get(record.id)).toMatchObject({
      status: "uploaded",
      objectKey: `${USER_ID}/${record.id}/original.jpg`,
      lastError: null,
    });
    database.close();
  });
});
