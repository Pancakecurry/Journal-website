import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";
import { JournalDatabase } from "./database";
import { LocalHistoryRepository } from "./history-repository";
import { seedHistoryFixture } from "@/test/history-fixtures";
const USER = "11111111-1111-4111-8111-111111111111";
const names: string[] = [];
afterEach(async () => {
  await Promise.all(names.splice(0).map((name) => Dexie.delete(name)));
});
describe("Phase 3 local history", () => {
  it("queries one planner month without returning lifetime history", async () => {
    const db = make();
    await seedHistoryFixture(db, USER, "year");
    const rows = await new LocalHistoryRepository(db).month(USER, "2026-08");
    expect(rows.length).toBeLessThanOrEqual(31);
    expect(rows.every((row) => row.localDate.startsWith("2026-08"))).toBe(true);
    db.close();
  });
  it("pages body-free journal summaries", async () => {
    const db = make();
    await seedHistoryFixture(db, USER, "year");
    const rows = await new LocalHistoryRepository(db).journals(USER, { limit: 20 });
    expect(rows).toHaveLength(20);
    expect(rows[0]).not.toHaveProperty("body");
    expect(rows[0]?.preview.length).toBeLessThanOrEqual(241);
    db.close();
  });
  it("searches candid text locally and keeps user isolation", async () => {
    const db = make();
    await seedHistoryFixture(db, USER, "several");
    await seedHistoryFixture(db, "22222222-2222-4222-8222-222222222222", "several");
    const rows = await new LocalHistoryRepository(db).search(USER, "ramen");
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.userId === USER)).toBe(true);
    db.close();
  });
  it("handles a thousand-Day fixture with bounded visible results", async () => {
    const db = make();
    const seeded = await seedHistoryFixture(db, USER, "large");
    const repo = new LocalHistoryRepository(db);
    expect(seeded.days).toBeGreaterThan(1000);
    expect(seeded.moments).toBeGreaterThan(3000);
    expect(await repo.journals(USER, { limit: 20 })).toHaveLength(20);
    expect((await repo.search(USER, "ordinary", 40)).length).toBeLessThanOrEqual(40);
    db.close();
  }, 30000);
  it("creates flexible tracker values on their actual Day and queues sync", async () => {
    const db = make();
    const repo = new LocalHistoryRepository(db);
    const tracker = await repo.createTracker({
      userId: USER,
      name: "Coffee",
      type: "count",
      unit: "cups",
    });
    const entry = await repo.saveTrackerEntry({
      userId: USER,
      trackerId: tracker.id,
      localDate: "2026-08-01",
      timeZone: "UTC",
      value: 2,
    });
    expect(entry.localDate).toBe("2026-08-01");
    expect(await repo.trackerEntries(USER, tracker.id, "2026-08-01", "2026-08-31")).toHaveLength(1);
    expect(await db.outbox.where("entityType").equals("tracker_entry").count()).toBe(1);
    db.close();
  });
  it("autosaves one authored reflection per month", async () => {
    const db = make();
    const repo = new LocalHistoryRepository(db);
    await repo.saveMonthReflection(USER, "2026-08", "Pretty normal, honestly.");
    await repo.saveMonthReflection(USER, "2026-08", "Pretty normal. Lots of rain.");
    expect(await db.monthlyReflections.count()).toBe(1);
    expect((await repo.monthReflection(USER, "2026-08"))?.body).toContain("rain");
    db.close();
  });
});
function make() {
  const name = `history-${crypto.randomUUID()}`;
  names.push(name);
  return new JournalDatabase(name);
}
