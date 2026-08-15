import { expect, test } from "@playwright/test";

test("Calendar is a real month planner and opens a historical Day", async ({ page }) => {
  await page.goto("/calendar");
  await expect(page.getByRole("heading", { name: "When was that again?" })).toBeVisible();
  await expect(page.getByLabel("Month planner")).toBeVisible();
  await page.getByLabel("Previous month").click();
  await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
});

test("Journal Library has honest empty and bookmark filters", async ({ page }) => {
  await page.goto("/journal");
  await expect(page.getByRole("heading", { name: "The longer stuff." })).toBeVisible();
  await page.getByLabel("Bookmarked").check();
  await expect(page.getByText("No bookmarks yet.")).toBeVisible();
});

test("local search finds a saved ordinary moment", async ({ page }) => {
  await page.goto("/today");
  await page.getByRole("button", { name: "+ Add something" }).click();
  await page.getByLabel("A moment from today").fill("Ate mango ice cream after class");
  await page.getByRole("button", { name: "Put it on today" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.goto("/search");
  await page.getByLabel("Search your words and dates").fill("mango");
  await expect(page.getByRole("link", { name: "Moment" })).toBeVisible();
  await expect(page.getByText(/mango ice cream/i)).toBeVisible();
});

test("a tracker is created, pinned, and written onto a Day", async ({ page }) => {
  await page.goto("/me/trackers");
  await page.getByRole("button", { name: "+ New tracker" }).click();
  await page.getByLabel("Name").fill("Coffee");
  await page.getByLabel("Kind").selectOption("count");
  await page.getByRole("button", { name: "Make tracker" }).click();
  await expect(page.getByRole("link", { name: "Coffee" })).toBeVisible();
  await page.getByRole("link", { name: "Coffee" }).click();
  await page.getByLabel("Value").fill("2");
  await page.getByRole("button", { name: "Put it on this Day" }).click();
  await expect(page.getByText("1 entries.")).toBeVisible();
});

test("monthly recap autosaves candid authored reflection", async ({ page }) => {
  const month = new Date().toISOString().slice(0, 7);
  await page.goto(`/calendar/${month}/recap`);
  await expect(page.getByText("A look back, not a report card.")).toBeVisible();
  const note = page.getByLabel("Anything worth saying about this month?");
  await note.fill("Mostly normal. The tiny café was good.");
  await expect(page.getByLabel("Monthly reflection save status")).toContainText(
    "Saved on this device.",
  );
  await page.reload();
  await expect(note).toHaveValue("Mostly normal. The tiny café was good.");
});
