import { expect, test } from "@playwright/test";

test("AI begins off, scopes are explicit, and ordinary journaling stays available", async ({
  page,
}) => {
  await page.goto("/me/privacy");
  await expect(page.getByText("AI off", { exact: true })).toBeVisible();
  await expect(page.getByText("Photographs themselves are never processed.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Enable selected AI access" })).toBeDisabled();
  await page.goto("/search");
  await expect(page.getByRole("heading", { name: "Find that thing." })).toBeVisible();
  await expect(page.getByRole("link", { name: /journal research/i })).toHaveCount(0);
});

test("direct journal research is honest when AI is off", async ({ page }) => {
  await page.goto("/journal/research");
  await page.getByLabel("What should these pages be about?").fill("coffee after class");
  await page.getByRole("button", { name: "Find related pages" }).click();
  await expect(page.getByText("AI is off. Turn it on from the privacy desk first.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Use ordinary on-device Search" })).toBeVisible();
});

test("export desk downloads structured and readable ownership copies", async ({ page }) => {
  await page.goto("/me/export");
  const jsonDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: /Download JSON/ }).click();
  expect((await jsonDownload).suggestedFilename()).toMatch(
    /campus-atelier-export-\d{4}-\d{2}-\d{2}\.json/,
  );
  const markdownDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: /Download Markdown/ }).click();
  expect((await markdownDownload).suggestedFilename()).toMatch(/\.md$/);
  await expect(page.getByText("Copy ready. Keep it somewhere private.")).toBeVisible();
});

test("personalization behaves like a live material atelier", async ({ page }) => {
  await page.goto("/me/personalization");
  await expect(page.getByRole("heading", { name: "Make the desk feel like yours." })).toBeVisible();
  await page.getByRole("button", { name: "Coral" }).click();
  await page.getByRole("button", { name: "Dot grid" }).click();
  await page.getByRole("button", { name: "Soft lavender" }).click();
  await expect(page.getByLabel("Live notebook preview")).toContainText("Dot grid paper");
  await page.getByRole("button", { name: "Save these choices" }).click();
  await expect(page.getByText(/looks like yours/i)).toBeVisible();
});

test("upgraded desk games remain keyboard-operable and session-only", async ({ page }) => {
  await page.goto("/my-world/games");
  await page.getByRole("button", { name: /Memory Flip/ }).click();
  await page.getByRole("button", { name: "Medium" }).click();
  await expect(page.getByRole("button", { name: /^Turn over card 16$/ })).toBeVisible();
  await page.getByRole("button", { name: /^Turn over card 1$/ }).press("Enter");
  await expect(page.getByRole("button", { name: /^Card 1:/ })).toBeVisible();
  await page.getByRole("button", { name: "Put it away" }).click();
  await page.getByRole("button", { name: /Tiny Fishing/ }).click();
  await page.getByRole("button", { name: "Cast" }).click();
  await expect(page.getByRole("button", { name: "Drop the line here" })).toBeVisible();
  await page.getByRole("button", { name: "Put it away" }).click();
  await expect(page.getByRole("heading", { name: "Nothing useful in here." })).toBeVisible();
});
