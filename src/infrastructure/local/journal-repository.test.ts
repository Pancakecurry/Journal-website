import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";
import { JournalDatabase } from "@/infrastructure/local/database";
import { LocalJournalRepository } from "@/infrastructure/local/journal-repository";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const DAY_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const names: string[] = [];

afterEach(async () => {
  await Promise.all(names.splice(0).map((name) => Dexie.delete(name)));
});

describe("LocalJournalRepository", () => {
  it("atomically creates a Day, text Moment, and sync operations", async () => {
    const name = `journal-${crypto.randomUUID()}`;
    names.push(name);
    const database = new JournalDatabase(name);
    const repository = new LocalJournalRepository(database);

    const created = await repository.addTextMoment({
      userId: USER_ID,
      localDate: "2026-08-12",
      timeZone: "Asia/Kolkata",
      text: "Had ramen after class.",
    });

    expect(created.day.localDate).toBe("2026-08-12");
    expect(created.moment.dayId).toBe(created.day.id);
    expect(await database.outbox.count()).toBe(2);
    database.close();
  });

  it("retains and queries the Moment after repository reinitialization", async () => {
    const name = `journal-${crypto.randomUUID()}`;
    names.push(name);
    const firstDatabase = new JournalDatabase(name);
    await new LocalJournalRepository(firstDatabase).addTextMoment({
      userId: USER_ID,
      localDate: "2026-08-12",
      timeZone: "Asia/Kolkata",
      text: "Still here after reload.",
    });
    firstDatabase.close();

    const reopenedDatabase = new JournalDatabase(name);
    const loaded = await new LocalJournalRepository(reopenedDatabase).getDay(USER_ID, "2026-08-12");
    expect(loaded.moments).toHaveLength(1);
    expect(loaded.moments[0]?.content).toEqual({ kind: "text", text: "Still here after reload." });
    reopenedDatabase.close();
  });

  it("migrates a version 1 Moment without clearing it", async () => {
    const name = `journal-${crypto.randomUUID()}`;
    names.push(name);
    const legacy = new Dexie(name);
    legacy.version(1).stores({
      days: "id,userId,localDate",
      moments: "id,dayId,userId,createdAt",
      outbox: "operationId,status,createdAt",
    });
    await legacy.table("days").add({
      id: DAY_ID,
      userId: USER_ID,
      localDate: "2026-08-12",
      timeZone: "Asia/Kolkata",
      createdAt: "2026-08-12T08:00:00.000Z",
      updatedAt: "2026-08-12T08:00:00.000Z",
      version: 0,
      syncState: "pending",
      deletedAt: null,
    });
    await legacy.table("moments").add({
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      userId: USER_ID,
      dayId: DAY_ID,
      createdAt: "2026-08-12T08:05:00.000Z",
      content: { kind: "text", text: "Legacy note" },
    });
    legacy.close();

    const migrated = new JournalDatabase(name);
    await migrated.open();
    const moment = await migrated.moments.get("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    expect(migrated.verno).toBe(4);
    expect(moment?.content).toEqual({ kind: "text", text: "Legacy note" });
    expect(moment?.syncState).toBe("pending");
    expect(moment?.occurredAt).toBe("2026-08-12T08:05:00.000Z");
    migrated.close();
  });

  it("builds a mixed Day without duplicating its Day record", async () => {
    const name = `journal-${crypto.randomUUID()}`;
    names.push(name);
    const database = new JournalDatabase(name);
    const repository = new LocalJournalRepository(database);
    const base = { userId: USER_ID, localDate: "2026-08-12" as const, timeZone: "UTC" };

    await repository.addTextMoment({ ...base, text: "Regular Tuesday energy." });
    await repository.setMood({ ...base, mood: "okay" });
    const journal = await repository.createJournal(base);
    await repository.saveJournal(journal.id, "Tuesday", "It rained right after lunch.");
    await repository.addPhoto({
      ...base,
      blob: new Blob(["private-photo"], { type: "image/jpeg" }),
      mimeType: "image/jpeg",
      width: 1200,
      height: 800,
      caption: "Rain on the window",
    });
    await repository.saveReflection({
      ...base,
      period: "evening",
      answers: [{ questionId: "nicest", answer: "The rain, honestly.", skipped: false }],
      currentQuestion: 1,
      complete: false,
    });

    const bundle = await repository.getDay(USER_ID, base.localDate);
    expect(await database.days.count()).toBe(1);
    expect(bundle.moments.map((moment) => moment.content.kind).sort()).toEqual([
      "journal",
      "mood",
      "photo",
      "text",
    ]);
    expect(bundle.journals[0]?.body).toBe("It rained right after lunch.");
    // fake-indexeddb does not structured-clone Node's Blob implementation; browser coverage
    // below verifies the actual blob round trip.
    expect(bundle.media[0]?.byteSize).toBeGreaterThan(0);
    expect(bundle.reflections[0]?.completedAt).toBeNull();
    database.close();
  });

  it("tombstones deleted writing and queues a retryable delete", async () => {
    const name = `journal-${crypto.randomUUID()}`;
    names.push(name);
    const database = new JournalDatabase(name);
    const repository = new LocalJournalRepository(database);
    const created = await repository.addTextMoment({
      userId: USER_ID,
      localDate: "2026-08-12",
      timeZone: "UTC",
      text: "Delete me later.",
    });

    await repository.deleteEntity("moment", created.moment.id);
    expect((await repository.getDay(USER_ID, "2026-08-12")).moments).toHaveLength(0);
    const tombstone = await database.moments.get(created.moment.id);
    expect(tombstone?.deletedAt).not.toBeNull();
    expect(
      await database.outbox
        .filter(
          (operation) => operation.entityId === created.moment.id && operation.action === "delete",
        )
        .count(),
    ).toBe(1);
    database.close();
  });

  it("migrates version 2 media metadata without clearing the blob", async () => {
    const name = `journal-${crypto.randomUUID()}`;
    names.push(name);
    const legacy = new Dexie(name);
    legacy.version(2).stores({
      days: "id,[userId+localDate],userId,updatedAt,syncState",
      moments: "id,[userId+dayId],dayId,userId,occurredAt,syncState",
      journalEntries: "id,[userId+dayId],dayId,userId,updatedAt,syncState",
      media: "id,[userId+dayId],dayId,userId,status,updatedAt,syncState",
      preferences: "userId,updatedAt,syncState",
      outbox: "operationId,status,entityType,createdAt,nextAttemptAt",
      syncMeta: "userId",
    });
    const blob = new Blob(["old-photo"], { type: "image/jpeg" });
    await legacy.table("media").add({
      id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      userId: USER_ID,
      dayId: DAY_ID,
      momentId: null,
      mimeType: "image/jpeg",
      byteSize: blob.size,
      objectKey: null,
      status: "local",
      createdAt: "2026-08-12T08:00:00.000Z",
      updatedAt: "2026-08-12T08:00:00.000Z",
      version: 0,
      syncState: "pending",
      deletedAt: null,
      blob,
    });
    legacy.close();
    const migrated = new JournalDatabase(name);
    const media = await migrated.media.get("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee");
    expect(media).toMatchObject({ width: 1, height: 1, caption: "", uploadAttempts: 0 });
    expect(media?.byteSize).toBe(blob.size);
    migrated.close();
  });
});
