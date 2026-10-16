import { test, expect } from "@playwright/test";

for (const theme of ["light", "dark"]) {
  for (const width of [390, 1280]) {
    test(`section tone cannot paint over its surroundings ${theme} ${width}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/?component=FeatureGrid&theme=${theme}&brand=green`);
      const section = page.locator(
        '[data-mortar-preview="FeatureGrid"] #booking-details',
      );
      await section.scrollIntoViewIfNeeded();
      await page.evaluate(() => document.fonts.ready);
      const box = await section.boundingBox();
      expect(box.x).toBeGreaterThan(4);
      const clip = {
        x: 0,
        y: Math.ceil(Math.max(box.y + 20, 0)),
        width: Math.floor(box.x - 2),
        height: 100,
      };
      const surroundings = await page.screenshot({
        clip,
        animations: "disabled",
      });
      // Changing only the section tone must leave the sidebar/gutter pixels intact.
      await section.evaluate((el) => el.setAttribute("data-tone", "default"));
      expect(await page.screenshot({ clip, animations: "disabled" })).toEqual(
        surroundings,
      );
      await page
        .locator('[data-mortar-preview="FeatureGrid"] #booking-details')
        .evaluate((el) => el.setAttribute("data-tone", "muted"));
      await page.screenshot({
        path: `test-results/section-containment-${theme}-${width}.png`,
      });
    });
  }
}
