import { test, expect } from "@playwright/test";
import { assertPreview } from "../support/preview.mjs";
test("empty and fallback previews cannot satisfy readiness", async ({
  page,
}) => {
  for (const markup of [
    '<div data-mortar-preview="Button"></div>',
    '<div data-mortar-preview="Button"><p>Unknown fixture</p></div>',
    '<main><button class="m-button">Wrong scope</button></main>',
  ]) {
    await page.setContent(markup);
    await expect(
      assertPreview(
        page.locator('[data-mortar-preview="Button"]'),
        ".m-button",
        100,
      ),
    ).rejects.toThrow();
  }
});
test("unknown catalogue entry never produces a ready component root", async ({
  page,
}) => {
  await page.goto("/?component=DoesNotExist");
  await expect(page.getByText("Unknown component")).toBeVisible();
  await expect(page.locator("[data-mortar-preview]")).toHaveCount(0);
});
