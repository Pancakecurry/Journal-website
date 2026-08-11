import { expect, test } from "@playwright/test";

test("primary shell navigates without fake content", async ({ page }) => {
  await page.goto("/today");
  await expect(page.getByRole("heading", { name: "A place for this Day." })).toBeVisible();
  await page.getByRole("link", { name: "Calendar" }).click();
  await expect(page).toHaveURL(/\/calendar$/);
  await expect(page.getByRole("heading", { name: "Every Day has a place." })).toBeVisible();
  await page.getByRole("link", { name: "Journal", exact: true }).click();
  await expect(page.getByText("No long entries yet")).toBeVisible();
});

test("local text survives reload and offline writes do not need the network", async ({
  page,
  context,
}) => {
  const first = `Local persistence ${Date.now()}`;
  const offline = `Offline persistence ${Date.now()}`;
  await page.goto("/today");
  const input = page.getByLabel("A moment from today");
  await input.fill(first);
  await page.getByRole("button", { name: "Place" }).click();
  await expect(page.getByText(first)).toBeVisible();
  await page.reload();
  await expect(page.getByText(first)).toBeVisible();

  await context.setOffline(true);
  await input.fill(offline);
  await page.getByRole("button", { name: "Place" }).click();
  await expect(page.getByText(offline)).toBeVisible();
  await expect(page.getByText("Saved locally while offline.")).toBeVisible();
  await context.setOffline(false);
  await expect(page.getByText(offline)).toHaveCount(1);
});

test("mobile navigation and reduced-motion mode remain usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/today");
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await page.getByRole("link", { name: "My World" }).click();
  await expect(
    page.getByRole("heading", { name: "Beautifully prepared. Not yet inhabited." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "+ Add to Today" })).toBeVisible();
});
