import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = [
  "/today",
  "/calendar",
  "/journal",
  "/search",
  "/my-world",
  "/me",
  "/me/personalization",
  "/me/privacy",
  "/me/export",
  "/my-world/games",
  "/my-world/doodles/new",
];

for (const route of routes) {
  test(`${route} has no detectable WCAG A/AA violations`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator("body")).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      results.violations,
      results.violations.map((item) => `${item.id}: ${item.help}`).join("\n"),
    ).toEqual([]);
  });
}

test("primary surfaces remain usable at a 200-percent equivalent viewport", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 450 });
  for (const route of ["/today", "/me/personalization", "/me/privacy", "/my-world", "/me/export"]) {
    await page.goto(route);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${route} overflowed horizontally`).toBeLessThanOrEqual(1);
  }
});

test("reduced motion keeps navigation and games usable", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/my-world/games");
  await page.getByRole("button", { name: /Memory Flip/ }).click();
  await page.getByRole("button", { name: /^Turn over card 1$/ }).click();
  await expect(page.getByRole("button", { name: /^Card 1:/ })).toBeVisible();
  await context.close();
});
