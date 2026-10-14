import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { mount, openers } from "../support/preview.mjs";
const { components } = JSON.parse(
  await readFile(new URL("../../catalog.json", import.meta.url), "utf8"),
);
// Intentionally small, maintainer-reviewed list. CI never updates these baselines.
for (const name of ["AppShell", "DocsShell", "PlanComparison", "ConfirmDialog"])
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
