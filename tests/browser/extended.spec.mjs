import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const theme of ["light", "dark"]) {
  for (const width of [390, 1280]) {
    for (const component of [
      "DocsShell",
      "CommandPalette",
      "ConfirmDialog",
      "PlanComparison",
    ]) {
      test(`${component} ${theme} at ${width}px`, async ({
        page,
      }, testInfo) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/?component=${component}&theme=${theme}`);
        if (component === "CommandPalette") {
          await page.getByRole("button", { name: "Open command menu" }).click();
          await expect(page.getByRole("dialog")).toBeVisible();
          await expect(
            page.getByRole("combobox", { name: "Command menu" }),
          ).toBeFocused();
          await page.keyboard.press("ArrowDown");
          await expect(
            page.getByRole("combobox", { name: "Command menu" }),
          ).toHaveAttribute("aria-activedescendant", /.+/);
        }
        if (component === "ConfirmDialog") {
          await page
            .getByRole("button", { name: "Delete project", exact: true })
            .click();
          const confirm = page
            .getByRole("dialog")
            .getByRole("button", { name: "Delete project", exact: true });
          await expect(confirm).toBeDisabled();
          await page.getByLabel("Type Northwind to confirm").fill("Northwind");
          await expect(confirm).toBeEnabled();
        }
        if (component === "DocsShell" && width === 390) {
          await page.getByRole("button", { name: "Open navigation" }).click();
          await expect(page.getByRole("dialog")).toBeVisible();
        }
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
        await page.screenshot({
          path: testInfo.outputPath("preview.png"),
          fullPage: true,
        });
        if (
          component === "CommandPalette" ||
          component === "ConfirmDialog" ||
          (component === "DocsShell" && width === 390)
        ) {
          await page.keyboard.press("Escape");
          await expect(page.getByRole("dialog")).toHaveCount(0);
        }
      });
    }
  }
}

test("CodeTabs supports keyboard selection", async ({ page }) => {
  await page.goto("/?component=CodeTabs");
  await page.getByRole("tab", { name: "npm", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "pnpm", exact: true }),
  ).toBeFocused();
  await expect(page.getByRole("tabpanel")).toContainText("pnpm add");
});
