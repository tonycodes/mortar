import { test, expect } from "@playwright/test";
import { accessibility, overflow } from "../support/preview.mjs";

// components.spec covers every component at the default viewport, including
// overlay probes and composite overflow. These checks add what it does not:
// overlays and drawers opened and audited at a 390px phone width, plus
// keyboard details that the shared probes do not assert.
const phone = {
  async CommandPalette(page) {
    await page.getByRole("button", { name: "Open command menu" }).click();
    const input = page.getByRole("combobox", { name: "Command menu" });
    await expect(input).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(input).toHaveAttribute("aria-activedescendant", /.+/);
    return true;
  },
  async ConfirmDialog(page) {
    await page
      .getByRole("button", { name: "Delete project", exact: true })
      .click();
    return true;
  },
  async DocsShell(page) {
    await page
      .locator('[data-mortar-preview="DocsShell"]')
      .getByRole("button", { name: "Open navigation" })
      .click();
    return true;
  },
  async PlanComparison(page) {
    // The wide table scrolls inside a focusable region instead of the page.
    const table = page.getByRole("region", { name: "Compare plans table" });
    await table.focus();
    await expect(table).toBeFocused();
    expect(await table.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
      true,
    );
    return false;
  },
};

for (const theme of ["light", "dark"])
  for (const [component, open] of Object.entries(phone))
    test(`${component} ${theme} at 390px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: 390, height: 900 });
      await page.goto(`/?component=${component}&theme=${theme}`);
      await expect(page.locator("html")).toHaveAttribute(
        "data-mortar-appearance",
        theme,
      );
      const overlay = await open(page);
      if (overlay) await expect(page.getByRole("dialog")).toBeVisible();
      await accessibility(page, overlay ? '[role="dialog"]' : undefined);
      await overflow(page);
      await page.screenshot({
        path: testInfo.outputPath("preview.png"),
        fullPage: true,
      });
      if (overlay) {
        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog")).toHaveCount(0);
      }
    });
