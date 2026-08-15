import { mkdir } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const output = path.resolve("artifacts/phase-4-visual");

test("Phase 4 and inherited surfaces remain composed", async ({ page }, testInfo) => {
  const size = testInfo.project.name.startsWith("mobile") ? "mobile" : "desktop";
  await mkdir(output, { recursive: true });
  await page.goto("/me/personalization");
  await snap(page, `${size}-personalization-default`);
  await page.getByRole("button", { name: "Coral" }).click();
  await page.getByRole("button", { name: "Dot grid" }).click();
  await snap(page, `${size}-personalization-coral-dot`);

  await page.goto("/my-world");
  await snap(page, `${size}-my-world-new`);
  await seedLongTermWorld(page);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Looks like you live here." })).toBeVisible();
  await snap(page, `${size}-my-world-long-term`);
  await page.goto("/my-world/keepsakes");
  await snap(page, `${size}-keepsakes-mixed-dense`);

  await page.goto("/my-world/doodles/new");
  await snap(page, `${size}-doodle-blank`);
  const canvas = page.getByLabel("Doodle canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Doodle canvas not visible");
  await page.mouse.move(box.x + 30, box.y + 35);
  await page.mouse.down();
  await page.mouse.move(box.x + Math.min(170, box.width - 30), box.y + 110, { steps: 8 });
  await page.mouse.up();
  await snap(page, `${size}-doodle-in-progress`);
  await page.getByRole("textbox", { name: "Title", exact: true }).fill("Window cloud");
  await page.getByRole("button", { name: "Save to Today" }).click();
  await expect(page).toHaveURL(/\/my-world\/doodles\//);
  await snap(page, `${size}-doodle-saved`);

  await page.goto("/my-world/games");
  await page.getByRole("button", { name: /Memory Flip/ }).click();
  await page.getByRole("button", { name: /^Turn over card 1$/ }).click();
  await snap(page, `${size}-game-memory-flip`);
  await page.getByRole("button", { name: "Put it away" }).click();
  await page.getByRole("button", { name: /Tiny Fishing/ }).click();
  await expect(page.getByRole("heading", { name: "Tiny Fishing" })).toBeVisible();
  await snap(page, `${size}-game-tiny-fishing`);

  await page.goto("/my-world");
  await snap(page, `${size}-memory-text`);
  await page.getByRole("button", { name: "Don't show this one again" }).click();
  await expect(page.getByText("Blue windows after class.")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "A photo from this Day" })).toBeVisible();
  await snap(page, `${size}-memory-photo`);
  await page.getByRole("button", { name: "Don't show this one again" }).click();
  await snap(page, `${size}-memory-hidden`);

  for (const [name, route] of [
    ["today", "/today"],
    ["calendar", "/calendar"],
    ["journal", "/journal"],
    ["search", "/search"],
    ["trackers", "/me/trackers"],
    ["monthly-recap", monthRecapRoute()],
  ] as const) {
    await page.goto(route);
    await snap(page, `${size}-phase3-${name}`);
  }

  if (size === "desktop") {
    await page.setViewportSize({ width: 820, height: 1000 });
    await page.goto("/my-world");
    await snap(page, "tablet-my-world-long-term");
  }
});

async function snap(page: Page, name: string) {
  await expect(page.locator("body")).toBeVisible();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
}

function monthRecapRoute() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `/calendar/${date.getFullYear()}-${month}/recap`;
}

async function seedLongTermWorld(page: Page) {
  await page.evaluate(async () => {
    const userId = "00000000-0000-4000-8000-000000000001";
    const timestamp = new Date().toISOString();
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    const localDate = date.toISOString().slice(0, 10);
    const dbRequest = indexedDB.open("campus-atelier-journal");
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      dbRequest.onsuccess = () => resolve(dbRequest.result);
      dbRequest.onerror = () => reject(dbRequest.error);
    });
    const dayId = crypto.randomUUID();
    const textId = crypto.randomUUID();
    const journalId = crypto.randomUUID();
    const mediaId = crypto.randomUUID();
    const photoMomentId = crypto.randomUUID();
    const common = {
      userId,
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 0,
      syncState: "local",
      deletedAt: null,
    };
    const tx = db.transaction(
      ["days", "moments", "journalEntries", "media", "keepsakes"],
      "readwrite",
    );
    const put = (store: string, value: unknown) => tx.objectStore(store).put(value);
    put("days", { ...common, id: dayId, localDate, timeZone: "UTC" });
    put("moments", {
      ...common,
      id: textId,
      dayId,
      occurredAt: timestamp,
      content: { kind: "text", text: "Blue windows after class." },
    });
    put("journalEntries", {
      ...common,
      id: journalId,
      dayId,
      title: "The ordinary excellent bit",
      body: "A longish page about the bus, the rain, and a very good bun.",
    });
    put("moments", {
      ...common,
      id: crypto.randomUUID(),
      dayId,
      occurredAt: timestamp,
      content: { kind: "journal", journalEntryId: journalId },
    });
    const png = Uint8Array.from(
      atob(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      ),
      (character) => character.charCodeAt(0),
    );
    put("media", {
      ...common,
      id: mediaId,
      dayId,
      momentId: photoMomentId,
      mimeType: "image/png",
      byteSize: png.byteLength,
      width: 1,
      height: 1,
      caption: "One small blue photo",
      objectKey: null,
      status: "local",
      uploadAttempts: 0,
      lastError: null,
      blob: new Blob([png], { type: "image/png" }),
    });
    put("moments", {
      ...common,
      id: photoMomentId,
      dayId,
      occurredAt: timestamp,
      content: { kind: "photo", mediaId },
    });
    const sources = [
      ["moment", textId, "Blue windows", "A small moment worth keeping."],
      ["journal", journalId, "The ordinary excellent bit", "A journal page."],
      ["photo", mediaId, "One small blue photo", "Photo kept with its Day."],
    ];
    for (let index = 0; index < 12; index += 1) {
      const source = sources[index % sources.length]!;
      put("keepsakes", {
        ...common,
        id: crypto.randomUUID(),
        sourceType: source[0],
        sourceId: source[1],
        dayId,
        localDate,
        month: null,
        title: `${source[2]} ${index + 1}`,
        preview: source[3],
      });
    }
    for (let index = 0; index < 220; index += 1) {
      const old = new Date(Date.UTC(2024, 0, index + 1));
      put("days", {
        ...common,
        id: crypto.randomUUID(),
        localDate: old.toISOString().slice(0, 10),
        timeZone: "UTC",
      });
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  });
}
