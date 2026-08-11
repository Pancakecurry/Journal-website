import { expect, test } from "@playwright/test";

const today = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
};

test("a sparse Today accepts one candid note and keeps it after reload", async ({ page }) => {
  const note = `Ramen was the correct decision ${Date.now()}`;
  await page.goto("/today");
  await expect(
    page.getByRole("heading", { name: /Morning|day going|how was today/i }),
  ).toBeVisible();
  await expect(page.getByText("Nothing here yet. Totally legal.")).toBeVisible();
  await page.getByRole("button", { name: "+ Add something" }).click();
  await expect(page.getByLabel("A moment from today")).toBeFocused();
  await page.getByLabel("A moment from today").fill(note);
  await page.getByRole("button", { name: "Put it on Today" }).click();
  await expect(page.getByText(note)).toBeVisible();
  await expect(page.getByText(/Saved here/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(note)).toHaveCount(1);
});

test("Quick Capture closes with Escape and works through the global action", async ({ page }) => {
  await page.goto("/journal");
  await page.getByRole("link", { name: "+ Add to Today" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("mood is accessible, singular, and persistent", async ({ page }) => {
  await page.goto("/today");
  await page.getByRole("button", { name: "Pretty good" }).click();
  await expect(page.getByRole("button", { name: "Pretty good" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "A bit off" }).click();
  await expect(page.getByRole("button", { name: "A bit off" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.reload();
  await expect(page.getByRole("button", { name: "A bit off" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("journal writing autosaves and becomes a calm reading page", async ({ page }) => {
  await page.goto("/today");
  await page.getByRole("button", { name: "+ Add something" }).click();
  await page.getByRole("button", { name: "A proper journal" }).click();
  await expect(page.getByLabel("Journal entry")).toBeVisible();
  await page.getByLabel("Journal title").fill("A very normal Tuesday");
  await page.getByLabel("Journal entry").fill("Missed the bus. Got a good sandwich. Fair trade.");
  await expect(page.getByText(/Saved here/)).toBeVisible();
  await page.getByRole("button", { name: "Done writing" }).click();
  await expect(page.getByRole("heading", { name: "A very normal Tuesday" })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Missed the bus. Got a good sandwich. Fair trade.")).toBeVisible();
});

test("a photo is prepared, saved locally, and shown on Today", async ({ page }) => {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
  await page.goto("/today");
  await page.getByRole("button", { name: "+ Add something" }).click();
  await page.getByRole("button", { name: "A photo" }).click();
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: "tiny.png", mimeType: "image/png", buffer: png });
  await page.getByLabel(/Caption/).fill("Tiny but mighty.");
  await page.getByRole("button", { name: "Put it on Today" }).click();
  await expect(page.getByRole("img", { name: "Tiny but mighty." })).toBeVisible();
  await expect(page.getByText("Saved privately here")).toBeVisible();
});

test("reflection is gradual, skippable, and retains partial answers", async ({ page }) => {
  await page.goto(`/reflection/evening?date=${today()}`);
  await expect(page.getByText("1 of 5")).toBeVisible();
  await page.getByLabel("Your answer").fill("The walk home.");
  await page.getByRole("button", { name: "Save & next" }).click();
  await page.getByRole("button", { name: "Skip this one" }).click();
  await expect(page.getByText("3 of 5")).toBeVisible();
  await page.getByRole("link", { name: "← Leave for now" }).click();
  await page.goto(`/reflection/evening?date=${today()}`);
  await expect(page.getByText("3 of 5")).toBeVisible();
});

test("a historical Day is read-first but accepts and edits backfilled memories", async ({
  page,
}) => {
  const previous = new Date();
  previous.setDate(previous.getDate() - 1);
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(previous);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;
  const date = `${value("year")}-${value("month")}-${value("day")}`;
  await page.goto(`/day/${date}`);
  await page.getByRole("button", { name: "+ Add a memory" }).click();
  await page.getByLabel("A moment from today").fill("Forgot: called Mum after dinner.");
  await page.getByRole("button", { name: "Put it on Today" }).click();
  await expect(page.getByText("Forgot: called Mum after dinner.")).toBeVisible();
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Edit this memory").fill("Called Mum after dinner.");
  await page.getByRole("button", { name: "Save change" }).click();
  await expect(page.getByText("Called Mum after dinner.", { exact: true })).toBeVisible();
});

test("offline capture and the mobile bottom sheet keep working", async ({
  page,
  context,
}, testInfo) => {
  await page.goto("/today");
  await context.setOffline(true);
  await page.getByRole("button", { name: "+ Add something" }).click();
  if (testInfo.project.name.includes("mobile"))
    await expect(page.getByRole("dialog")).toHaveCSS("margin-bottom", "0px");
  await page.getByLabel("A moment from today").fill("No signal. Still had a day.");
  await page.getByRole("button", { name: "Put it on Today" }).click();
  await expect(page.getByText("No signal. Still had a day.")).toBeVisible();
  await expect(page.getByText("Saved here. No internet needed.")).toBeVisible();
  await context.setOffline(false);
});

test("large text, keyboard focus, and reduced motion keep capture usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/today");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  await page.getByRole("button", { name: "+ Add something" }).click();
  await expect(page.getByLabel("A moment from today")).toBeFocused();
  await expect(page.getByRole("heading", { name: "What happened?" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
});
