import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { mount, openers } from "../support/preview.mjs";
const { components } = JSON.parse(
  await readFile(new URL("../../catalog.json", import.meta.url), "utf8"),
);
// Intentionally small, maintainer-reviewed lists. CI never updates these
// baselines. Components here change often or carry many states; previews with
// dates pin `today`, so the images are stable from day to day.
const golden = [
  "AppShell",
  "DocsShell",
  "PlanComparison",
  "ConfirmDialog",
  "Button",
  "Tabs",
  "TabNav",
  "DataTable",
  "Calendar",
  "Pricing",
  "Hero",
  "ProductOverview",
  "ShoppingCart",
];
const templates = ["saas-landing", "cart-page", "split-landing"];

for (const name of golden)
  for (const theme of ["light", "dark"])
    for (const width of [390, 1280])
      test(`${name} ${theme} ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        const component = components.find((c) => c.export === name);
        const { root, errors } = await mount(page, component, { theme });
        let target = root;
        if (name === "ConfirmDialog") {
          await root
            .getByRole("button", { name: openers[name], exact: true })
            .click();
          target = page.getByRole("dialog").locator(".m-dialog-panel");
        }
        await page.evaluate(() => document.fonts.ready);
        await expect(target).toHaveScreenshot(`${name}-${theme}-${width}.png`);
        expect(errors).toEqual([]);
      });

for (const id of templates)
  for (const width of [390, 1280])
    test(`template ${id} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/?recipe=${id}&theme=light`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.getByRole("main")).toHaveScreenshot(
        `template-${id}-${width}.png`,
      );
    });
