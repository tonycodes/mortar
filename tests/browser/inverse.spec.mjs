import { test, expect } from "@playwright/test";
import { accessibility, contrast } from "../support/preview.mjs";
for (const theme of ["light", "dark"])
  for (const brand of ["neutral", "green"]) {
    test(`inverse section contrast ${theme} ${brand}`, async ({ page }) => {
      await page.goto(`/?component=Section&theme=${theme}&brand=${brand}`);
      const section = page.locator(
        '[data-mortar-preview="Section"] [data-tone="inverse"]',
      );
      const link = section.getByRole("link", { name: "Explore", exact: true });
      await expect(link).toBeVisible();
      const icon = section.locator(".m-check-list svg");
      const colors = await icon.evaluate((el) => {
        const s = getComputedStyle(el);
        return [s.color, s.backgroundColor];
      });
      expect(contrast(...colors)).toBeGreaterThanOrEqual(3);
      const box = await link.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      try {
        const pressed = await link.evaluate((el) => {
          const s = getComputedStyle(el);
          return [s.color, s.backgroundColor];
        });
        expect(contrast(...pressed)).toBeGreaterThanOrEqual(4.5);
      } finally {
        await page.mouse.up();
      }
      await accessibility(page, '[data-mortar-preview="Section"]');
    });
  }
