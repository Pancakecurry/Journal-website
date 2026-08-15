import { expect, test } from "@playwright/test";

test("installed shell cold-starts Today and keeps local capture available offline", async ({
  page,
  context,
}) => {
  await page.goto("/today");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), {
          once: true,
        }),
      );
  });
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: /Morning|day going|how was today/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: "+ Add something" }).click();
  await page.getByLabel("A moment from today").fill("Offline, still mine.");
  await page.getByRole("button", { name: "Put it on Today" }).click();
  await expect(page.getByText("Offline, still mine.")).toBeVisible();
  await context.setOffline(false);
});

test("ownership archive can be inspected and restored without silent overwrite", async ({
  page,
}) => {
  await page.goto("/today");
  await page.getByRole("button", { name: "+ Add something" }).click();
  await page.getByLabel("A moment from today").fill("A restore test, glamorous stuff.");
  await page.getByRole("button", { name: "Put it on Today" }).click();
  await page.goto("/me/export");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Pack everything/ }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  await page.goto("/me/import");
  await page.locator("input[type=file]").setInputFiles(path!);
  await expect(
    page.getByText("Archive checked. Review the summary before restoring."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirm and restore" }).click();
  await expect(page.getByText(/Restore complete:/)).toBeVisible();
});

test("install and storage surfaces explain browser capability without pressure", async ({
  page,
}) => {
  await page.goto("/me/install");
  await expect(page.getByRole("heading", { name: "Your notebook, one tap away." })).toBeVisible();
  await page.goto("/me/storage");
  await expect(page.getByRole("heading", { name: "What’s tucked away here." })).toBeVisible();
  await expect(page.getByText(/browser|storage/i).first()).toBeVisible();
});
