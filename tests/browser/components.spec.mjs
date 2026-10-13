import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
const { components } = JSON.parse(
  await readFile(new URL("../../catalog.json", import.meta.url), "utf8"),
);
for (const component of components)
  for (const theme of ["light", "dark"])
    test(`${component.export} ${theme}`, async ({ page }) => {
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(`/?component=${component.export}&theme=${theme}`);
      await expect(
        page.getByRole("heading", { name: "Mortar playground" }),
      ).toBeVisible();
      await expect(
        page.getByRole("status", { name: "Loading preview…" }),
      ).toHaveCount(0);
      await expect(page.locator("[data-mortar-appearance]")).toHaveAttribute(
        "data-mortar-appearance",
        theme,
      );
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        results.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      ).toEqual([]);
      expect(errors).toEqual([]);
    });
