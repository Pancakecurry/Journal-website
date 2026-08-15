import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";
import { createDay } from "@/domain/day";
import { JournalDatabase } from "./database";
import { LocalJournalRepository } from "./journal-repository";
import { LocalPersonalWorldRepository } from "./personal-world-repository";

const USER = "11111111-1111-4111-8111-111111111111";
const names: string[] = [];
afterEach(async () => Promise.all(names.splice(0).map((name) => Dexie.delete(name))));

describe("Phase 4 personal world", () => {
  it("validates, persists, and queues reversible personalization", async () => {
    const db = make();
    const repo = new LocalPersonalWorldRepository(db);
    const saved = await repo.savePreferences(USER, {
      accent: "coral",
      paper: "dot",
      notebookCover: "navy",
      environmentDensity: "expressive",
    });
    expect(saved).toMatchObject({ accent: "coral", paper: "dot", notebookCover: "navy" });
    expect((await repo.preferences(USER)).environmentDensity).toBe("expressive");
    expect(await db.outbox.where("entityType").equals("preferences").count()).toBe(1);
    db.close();
  });

  it("creates and removes keepsake references without duplicating originals", async () => {
    const db = make();
    const journal = new LocalJournalRepository(db);
    const world = new LocalPersonalWorldRepository(db);
    const created = await journal.addTextMoment({
      userId: USER,
      localDate: "2026-08-12",
      timeZone: "UTC",
      text: "A very keepable sandwich.",
    });
    const kept = await world.addKeepsake({
      userId: USER,
      sourceType: "moment",
      sourceId: created.moment.id,
      dayId: created.day.id,
      localDate: created.day.localDate,
      title: "Sandwich",
      preview: "A very keepable sandwich.",
    });
    expect(await world.keepsakes(USER)).toHaveLength(1);
    expect(await db.moments.get(created.moment.id)).toBeDefined();
    await world.removeKeepsake(kept.id);
    expect(await world.keepsakes(USER)).toHaveLength(0);
    expect(
      await db.outbox
        .filter((item) => item.entityType === "keepsake" && item.action === "delete")
        .count(),
    ).toBe(1);
    db.close();
  });

  it("cleans a keepsake when its canonical source is deleted", async () => {
    const db = make();
    const journal = new LocalJournalRepository(db);
    const world = new LocalPersonalWorldRepository(db);
    const created = await journal.addTextMoment({
      userId: USER,
      localDate: "2026-08-12",
      timeZone: "UTC",
      text: "Temporary memory.",
    });
    await world.addKeepsake({
      userId: USER,
      sourceType: "moment",
      sourceId: created.moment.id,
      dayId: created.day.id,
      localDate: created.day.localDate,
      title: "Temporary",
    });
    await journal.deleteEntity("moment", created.moment.id);
    expect(await world.keepsakes(USER)).toHaveLength(0);
    db.close();
  });

  it("stores editable strokes, a bounded preview, and one Day-linked moment", async () => {
    const db = make();
    const world = new LocalPersonalWorldRepository(db);
    const doodle = await world.saveDoodle({
      userId: USER,
      localDate: "2026-08-12",
      timeZone: "UTC",
      title: "Cloud",
      description: "A lumpy cloud",
      width: 600,
      height: 400,
      previewDataUrl: "data:image/jpeg;base64,AA==",
      strokes: [
        {
          id: crypto.randomUUID(),
          tool: "pen",
          color: "ink",
          size: 4,
          points: [{ x: 0.2, y: 0.3, pressure: 0.5 }],
        },
      ],
    });
    expect((await world.doodle(doodle.id))?.strokes).toHaveLength(1);
    expect((await new LocalJournalRepository(db).getDay(USER, "2026-08-12")).doodles).toHaveLength(
      1,
    );
    expect(await db.moments.filter((item) => item.content.kind === "doodle").count()).toBe(1);
    await world.saveDoodle({
      ...doodle,
      timeZone: "UTC",
      strokes: [
        ...doodle.strokes,
        {
          id: crypto.randomUUID(),
          tool: "pen",
          color: "coral",
          size: 2,
          points: [{ x: 0.4, y: 0.4, pressure: 0.5 }],
        },
      ],
    });
    expect(await db.moments.filter((item) => item.content.kind === "doodle").count()).toBe(1);
    db.close();
  });

  it("derives restrained world objects from actual records", async () => {
    const db = make();
    const journal = new LocalJournalRepository(db);
    const world = new LocalPersonalWorldRepository(db);
    expect(await world.summary(USER)).toEqual({
      dayCount: 0,
      photoCount: 0,
      keepsakeCount: 0,
      doodleCount: 0,
      trackerCount: 0,
      completedMonthCount: 0,
    });
    await journal.addTextMoment({
      userId: USER,
      localDate: "2026-08-12",
      timeZone: "UTC",
      text: "One real Day.",
    });
    expect((await world.summary(USER)).dayCount).toBe(1);
    db.close();
  });

  it("resurfaces the same date locally and honors item and Day suppression", async () => {
    const db = make();
    const journal = new LocalJournalRepository(db);
    const world = new LocalPersonalWorldRepository(db);
    await journal.addTextMoment({
      userId: USER,
      localDate: "2025-08-15",
      timeZone: "UTC",
      text: "The old library had excellent windows.",
    });
    const memory = await world.memoryForDay(USER, "2026-08-15");
    expect(memory?.preview).toContain("excellent windows");
    await world.hideMemory(USER, memory!, "item");
    expect(await world.memoryForDay(USER, "2026-08-15")).toBeNull();
    expect(await db.outbox.where("entityType").equals("hidden_memory").count()).toBe(1);
    db.close();
  });

  it("turns resurfacing off without deleting history", async () => {
    const db = make();
    const journal = new LocalJournalRepository(db);
    const world = new LocalPersonalWorldRepository(db);
    await journal.addTextMoment({
      userId: USER,
      localDate: "2025-08-15",
      timeZone: "UTC",
      text: "Still safely here.",
    });
    await world.savePreferences(USER, { memoryResurfacingEnabled: false });
    expect(await world.memoryForDay(USER, "2026-08-15")).toBeNull();
    expect(await db.moments.count()).toBe(1);
    db.close();
  });

  it("hides a whole Day, prefers the nearest year, and returns an honest empty state", async () => {
    const db = make();
    const journal = new LocalJournalRepository(db);
    const world = new LocalPersonalWorldRepository(db);
    await journal.addTextMoment({
      userId: USER,
      localDate: "2024-08-15",
      timeZone: "UTC",
      text: "The older candidate.",
    });
    await journal.addTextMoment({
      userId: USER,
      localDate: "2025-08-15",
      timeZone: "UTC",
      text: "The nearest candidate.",
    });
    const nearest = await world.memoryForDay(USER, "2026-08-15");
    expect(nearest?.preview).toBe("The nearest candidate.");
    await world.hideMemory(USER, nearest!, "day");
    expect((await world.memoryForDay(USER, "2026-08-15"))?.preview).toBe("The older candidate.");
    expect(await world.memoryForDay(USER, "2026-02-02")).toBeNull();
    db.close();
  });

  it("keeps long-term world summaries bounded to indexed counts", async () => {
    const db = make();
    const world = new LocalPersonalWorldRepository(db);
    const days = Array.from({ length: 720 }, (_, index) => {
      const date = new Date(Date.UTC(2024, 0, 1 + index));
      return createDay({
        userId: USER,
        localDate: date.toISOString().slice(0, 10),
        timeZone: "UTC",
      });
    });
    await db.days.bulkAdd(days);
    const started = performance.now();
    expect((await world.summary(USER)).dayCount).toBe(720);
    expect(performance.now() - started).toBeLessThan(1_000);
    expect(await world.memoryForDay(USER, "2031-08-15")).toBeNull();
    db.close();
  });

  it("migrates version 4 preferences without clearing earlier choices", async () => {
    const name = `world-${crypto.randomUUID()}`;
    names.push(name);
    const legacy = new Dexie(name);
    legacy.version(4).stores({ preferences: "userId,updatedAt,syncState" });
    await legacy.table("preferences").add({
      userId: USER,
      accent: "sage",
      reflectionEnabled: true,
      reducedMotionOverride: "system",
      createdAt: "2026-08-12T08:00:00.000Z",
      updatedAt: "2026-08-12T08:00:00.000Z",
      syncState: "synced",
    });
    legacy.close();
    const db = new JournalDatabase(name);
    expect(await new LocalPersonalWorldRepository(db).preferences(USER)).toMatchObject({
      accent: "sage",
      paper: "clean",
      notebookCover: "canvas",
      memoryResurfacingEnabled: true,
    });
    db.close();
  });
});

function make() {
  const name = `world-${crypto.randomUUID()}`;
  names.push(name);
  return new JournalDatabase(name);
}
