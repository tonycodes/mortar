import { test, expect } from "@playwright/test";
import { contrast, tokenColor } from "../support/preview.mjs";

// The long-form PlanComparison (state=long): start-aligned sentences, marked
// text values, an unlabelled group and an accent featured column.
async function open(page, { theme, brand, width = 1280 }) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(
    "/?" +
      new URLSearchParams({
        component: "PlanComparison",
        theme,
        brand,
        state: "long",
      }),
  );
  const table = page.locator(
    '[data-mortar-preview="PlanComparison"] [data-state="long"] table',
  );
  await expect(table).toBeVisible();
  return table;
}

for (const theme of ["light", "dark"])
  for (const brand of ["neutral", "green"])
    test(`PlanComparison long form ${theme} ${brand}`, async ({ page }) => {
      const table = await open(page, { theme, brand });
      // The table is named by the section title.
      await expect(
        page.getByRole("table", { name: "What the example product replaces" }),
      ).toBeVisible();
      // No visible group header row without a label.
      await expect(table.locator(".m-comparison-group")).toHaveCount(0);
      // Marked text: hidden glyph, screen-reader status, then the text.
      const ours = table.locator("tbody td[data-featured]").first();
      await expect(ours.locator('[aria-hidden="true"]')).toHaveText("✓");
      await expect(ours.locator(".m-sr-only")).toHaveText("Included: ");
      const theirs = table.locator("tbody td:not([data-featured])").first();
      await expect(theirs.locator('[aria-hidden="true"]')).toHaveText("✗");
      await expect(theirs.locator(".m-sr-only")).toHaveText("Not included: ");
      // Sentences start-align and sit at the top of the row.
      const cell = await ours.evaluate((el) => {
        const s = getComputedStyle(el);
        return { align: s.textAlign, vertical: s.verticalAlign };
      });
      expect(cell).toEqual({ align: "start", vertical: "top" });
      // The featured column is the brand's selected tint, its header the
      // link colour, and its text keeps 4.5:1.
      const selected = await tokenColor(page, "--m-selected", table);
      const link = await tokenColor(page, "--m-link", table);
      const header = table.locator("thead th[data-featured]");
      const colours = await header.evaluate((el) => ({
        color: getComputedStyle(el).color,
        background: getComputedStyle(el).backgroundColor,
      }));
      expect(colours).toEqual({ color: link, background: selected });
      expect(contrast(colours.color, colours.background)).toBeGreaterThan(4.5);
      const body = await ours.evaluate((el) => ({
        color: getComputedStyle(el).color,
        background: getComputedStyle(el).backgroundColor,
      }));
      expect(body.background).toBe(selected);
      expect(contrast(body.color, body.background)).toBeGreaterThan(4.5);
    });

test("PlanComparison long form scrolls inside its region at 390px", async ({
  page,
}) => {
  await open(page, { theme: "light", brand: "neutral", width: 390 });
  const region = page.getByRole("region", {
    name: "What the example product replaces table",
  });
  await region.focus();
  await expect(region).toBeFocused();
  expect(await region.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
    true,
  );
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(1);
});
