import { test, expect } from "@playwright/test";
// Rendering and axe coverage for every export lives in mortar-fixtures.spec.mjs.
for (const theme of ["light", "dark"]) {
  test(`Mortar menu keyboard and escape: ${theme}`, async ({ page }) => {
    await page.goto(`/?component=Dropdown&theme=${theme}`);
    const button = page.getByRole("button", { name: "Actions", exact: true });
    await button.focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(button).toBeFocused();
  });
  test(`Mortar modal traps focus and restores it: ${theme}`, async ({
    page,
  }) => {
    await page.goto(`/?component=Modal&theme=${theme}`);
    const button = page.getByRole("button", { name: "Open dialog" });
    await button.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
      expect(
        await dialog.evaluate((e) => e.contains(document.activeElement)),
      ).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(button).toBeFocused();
  });
  test(`Mortar controlled choice fields: ${theme}`, async ({ page }) => {
    await page.goto(`/?component=Checkbox&theme=${theme}`);
    const checkbox = page.getByRole("checkbox", {
      name: "Email notifications",
    });
    await expect(checkbox).not.toBeChecked();
    await checkbox.click();
    await expect(checkbox).toBeChecked();
    await page.goto(`/?component=Switch&theme=${theme}`);
    const toggle = page.getByRole("switch", { name: "Automatic updates" });
    await expect(toggle).not.toBeChecked();
    await toggle.click();
    await expect(toggle).toBeChecked();
    await page.goto(`/?component=RadioGroup&theme=${theme}`);
    const radio = page.getByRole("radio", { name: /Advanced/ });
    await radio.click();
    await expect(radio).toBeChecked();
    await page.goto(`/?component=Select&theme=${theme}`);
    const select = page.getByLabel("Environment", { exact: true });
    await select.selectOption("second");
    await expect(select).toHaveValue("second");
  });
}
