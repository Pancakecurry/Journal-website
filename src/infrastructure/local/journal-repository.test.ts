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
    expect(migrated.verno).toBe(2);
    expect(moment?.content).toEqual({ kind: "text", text: "Legacy note" });
    expect(moment?.syncState).toBe("pending");
    expect(moment?.occurredAt).toBe("2026-08-12T08:05:00.000Z");
    migrated.close();
  });
});
