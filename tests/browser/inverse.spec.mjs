import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
function contrast(a, b) {
  const luminance = (rgb) =>
    rgb
      .match(/[\d.]+/g)
      .slice(0, 3)
      .map(Number)
      .map((n) => {
        const v = n / 255;
        return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      })
      .reduce((sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i], 0);
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
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
      const results = await new AxeBuilder({ page })
        .include('[data-mortar-preview="Section"]')
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
