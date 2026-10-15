import { test, expect } from "@playwright/test";
import { overflow } from "../support/preview.mjs";

for (const theme of ["light", "dark"]) {
  test(`FeatureGrid evidence and actions ${theme}`, async ({ page }) => {
    await page.goto(`/?component=FeatureGrid&theme=${theme}`);
    const root = page.locator('[data-mortar-preview="FeatureGrid"]');
    const features = root.locator(".m-feature-grid").first();
    await expect(features.locator(".m-feature-icon")).toHaveCount(0);
    await expect(features.getByRole("figure")).toHaveCount(2);
    await expect(features.locator(".m-feature-details li")).toHaveCount(4);
    await page.setViewportSize({ width: 1280, height: 900 });
    await root
      .locator(".m-marketing-section")
      .first()
      .screenshot({ path: `test-results/feature-grid-${theme}-desktop.png` });
    await page.setViewportSize({ width: 390, height: 844 });
    await root
      .locator(".m-marketing-section")
      .first()
      .screenshot({ path: `test-results/feature-grid-${theme}-mobile.png` });
    const action = features.getByRole("link", {
      name: "Explore appointment booking",
    });
    await action.focus();
    await expect(action).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#booking-details$/);
    for (const width of [320, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await overflow(page);
      await expect(
        features.getByText("Google and Apple calendar connections"),
      ).toBeVisible();
    }
    // Optional evidence leaves the compact and explicit numbered variants intact.
    await expect(
      root.locator(".m-feature-grid").nth(1).locator(".m-feature-visual"),
    ).toHaveCount(0);
    await expect(root.locator('[data-marker="number"]')).toHaveText([
      "01",
      "02",
    ]);
  });
}
