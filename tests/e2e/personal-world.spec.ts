import { expect, test } from "@playwright/test";

test("personalization previews, saves, applies, and survives reload", async ({ page }) => {
  await page.goto("/me/personalization");
  await page.getByRole("button", { name: "Coral" }).click();
  await page.getByRole("button", { name: "Dot grid" }).click();
  await page.getByRole("button", { name: "Library navy" }).click();
  await page.getByRole("button", { name: "Keep things still" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-accent", "coral");
  await page.getByRole("button", { name: "Save these choices" }).click();
  await expect(page.getByText(/Saved here/)).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Coral" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveAttribute("data-paper", "dot");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");
});

test("new My World is prepared without fake accumulated objects", async ({ page }) => {
  await page.goto("/my-world");
  await expect(
    page.getByRole("heading", { name: "All set. No fake memories included." }),
  ).toBeVisible();
  await expect(page.getByText("Fresh notebook")).toBeVisible();
  await expect(page.getByRole("link", { name: /Photo box/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Things worth keeping/ })).toHaveCount(0);
});

test("real history inhabits My World and opens its source", async ({ page }) => {
  await page.goto("/today");
  await page.getByRole("button", { name: "+ Add something" }).click();
  await page.getByLabel("A moment from today").fill("A real page for the desk.");
  await page.getByRole("button", { name: "Put it on Today" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.goto("/my-world");
  await expect(page.getByRole("heading", { name: "Looks like you live here." })).toBeVisible();
  const notebook = page.getByRole("link", { name: /Daily pages/ });
  await expect(notebook).toContainText("1 Day");
  await notebook.click();
  await expect(page).toHaveURL(/\/calendar$/);
});

test("a historical moment can be tucked away, reopened, and removed", async ({ page }) => {
  const date = previousDate();
  await page.goto(`/day/${date}`);
  await page.getByRole("button", { name: "+ Add a memory" }).click();
  await page.getByLabel("A moment from today").fill("The tiny café had one excellent chair.");
  await page.getByRole("button", { name: "Put it on Today" }).click();
  await page.getByRole("button", { name: "Keep A small moment" }).click();
  await expect(page.getByRole("button", { name: "Keep A small moment" })).toHaveText("Tucked away");
  await page.goto("/my-world/keepsakes");
  await expect(page.getByText("one excellent chair")).toBeVisible();
  await page.getByRole("link", { name: "A small moment" }).click();
  await expect(page).toHaveURL(new RegExp(`/day/${date}$`));
  await page.goto("/my-world/keepsakes");
  await page.getByRole("button", { name: "Take it out" }).click();
  await expect(page.getByText("Nothing tucked away yet.")).toBeVisible();
});

test("a doodle supports undo, persistence, Day association, and reopen", async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));
  await page.goto("/my-world/doodles/new");
  const canvas = page.getByLabel("Doodle canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Doodle canvas not visible");
  await page.mouse.move(box.x + 30, box.y + 40);
  await page.mouse.down();
  await page.mouse.move(box.x + 140, box.y + 120, { steps: 6 });
  await page.mouse.up();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByRole("button", { name: "Redo" })).toBeEnabled();
  await page.getByRole("button", { name: "Redo" }).click();
  await page.getByRole("textbox", { name: "Title", exact: true }).fill("A bent line");
  await page.getByLabel("What is it?").fill("Probably a hill.");
  await page.getByRole("button", { name: "Save to Today" }).click();
  await expect(page).toHaveURL(/\/my-world\/doodles\/[0-9a-f-]+$/);
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Title", exact: true })).toHaveValue(
    "A bent line",
  );
  await page.goto("/today");
  await expect(page.getByRole("link", { name: "Open sketchbook" })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("both desk games mount lazily and leave navigation clean", async ({ page }) => {
  await page.goto("/my-world/games");
  await page.getByRole("button", { name: /Memory Flip/ }).click();
  await expect(page.getByRole("heading", { name: "Memory Flip" })).toBeVisible();
  await page.getByRole("button", { name: "Turn over card 1", exact: true }).click();
  await page.getByRole("button", { name: "Turn over card 8" }).click();
  await page.getByRole("button", { name: "Put it away" }).click();
  await page.getByRole("button", { name: /Tiny Fishing/ }).click();
  await expect(page.getByRole("heading", { name: "Tiny Fishing" })).toBeVisible();
  await page.getByRole("button", { name: "Cast" }).click();
  await expect(page.getByText("Tiny tug!")).toBeVisible();
  await page.getByRole("button", { name: "Reel it in" }).click();
  await expect(page.getByText("A perfectly ordinary fish.")).toBeVisible();
  await page.getByRole("button", { name: "Put it away" }).click();
  await page.getByRole("link", { name: "Back to your desk" }).click();
  await expect(page).toHaveURL(/\/my-world$/);
});

test("same-date memory can be suppressed and Phase 4 writes work offline", async ({
  page,
  context,
}) => {
  const date = sameDateLastYear();
  await page.goto(`/day/${date}`);
  await page.getByRole("button", { name: "+ Add a memory" }).click();
  await page.getByLabel("A moment from today").fill("The library windows looked blue.");
  await page.getByRole("button", { name: "Put it on Today" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.goto("/my-world");
  await expect(page.getByText("The library windows looked blue.")).toBeVisible();
  await page.getByRole("button", { name: "Don't show this one again" }).click();
  await expect(page.getByText("The library windows looked blue.")).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("The library windows looked blue.")).toHaveCount(0);
  await page.goto("/me/personalization");
  await context.setOffline(true);
  await page.getByRole("button", { name: "Mint" }).click();
  await page.getByRole("button", { name: "Save these choices" }).click();
  await expect(page.getByText(/Saved here/)).toBeVisible();
  await context.setOffline(false);
  await page.reload();
  await expect(page.getByRole("button", { name: "Mint" })).toHaveAttribute("aria-pressed", "true");
});

test("keepsakes, doodles, and a loaded desk game remain usable offline", async ({
  page,
  context,
}) => {
  const date = previousDate();
  await page.goto(`/day/${date}`);
  await page.getByRole("button", { name: "+ Add a memory" }).click();
  await page.getByLabel("A moment from today").fill("Saved while the Wi-Fi took a nap.");
  await page.getByRole("button", { name: "Put it on Today" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await context.setOffline(true);
  await page.getByRole("button", { name: "Keep A small moment" }).click();
  await expect(page.getByRole("button", { name: "Keep A small moment" })).toHaveText("Tucked away");
  await context.setOffline(false);

  await page.goto("/my-world/doodles/new");
  const canvas = page.getByLabel("Doodle canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Doodle canvas not visible");
  await context.setOffline(true);
  await page.mouse.move(box.x + 24, box.y + 24);
  await page.mouse.down();
  await page.mouse.move(box.x + 120, box.y + 80, { steps: 5 });
  await page.mouse.up();
  await expect(page.getByRole("button", { name: "Undo" })).toBeEnabled();
  await page.getByRole("button", { name: "Save to Today" }).click();
  await expect
    .poll(() => savedDoodleCount(page), { message: "offline doodle reached IndexedDB" })
    .toBe(1);
  await context.setOffline(false);
  await page.goto("/today");
  await expect(page.getByRole("link", { name: "Open sketchbook" })).toBeVisible();

  await page.goto("/my-world/games");
  await page.getByRole("button", { name: /Tiny Fishing/ }).click();
  await expect(page.getByRole("heading", { name: "Tiny Fishing" })).toBeVisible();
  await page.getByRole("button", { name: "Put it away" }).click();
  await context.setOffline(true);
  await page.getByRole("button", { name: /Tiny Fishing/ }).click();
  await expect(page.getByRole("heading", { name: "Tiny Fishing" })).toBeVisible();
  await page.getByRole("button", { name: "Cast" }).click();
  await expect(page.getByText("Tiny tug!")).toBeVisible();
  await page.getByRole("button", { name: "Put it away" }).click();
  await context.setOffline(false);
});

async function savedDoodleCount(page: import("@playwright/test").Page) {
  return page.evaluate(async () => {
    const request = indexedDB.open("campus-atelier-journal");
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const count = database.transaction("doodles").objectStore("doodles").count();
    return new Promise<number>((resolve, reject) => {
      count.onsuccess = () => resolve(count.result);
      count.onerror = () => reject(count.error);
    });
  });
}

function previousDate() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return local(date);
}
function sameDateLastYear() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return local(date);
}
function local(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
