import { expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
export async function mount(page, component, params = {}) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(
    "/?" +
      new URLSearchParams({
        component: component.export,
        theme: "light",
        ...params,
      }),
  );
  const root = page.locator(`[data-mortar-preview="${component.export}"]`);
  await assertPreview(root, component.testing.target);
  return { root, errors };
}
export async function assertPreview(root, target, timeout = 5000) {
  await expect(root).toBeVisible({ timeout });
  await expect(root.getByText(/Unknown (fixture|component)/)).toHaveCount(0, {
    timeout,
  });
  await expect(root.locator(target).first()).toBeVisible({ timeout });
}
export async function accessibility(page, scope) {
  const build = () =>
    new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]);
  const scoped = await build().include(scope).analyze();
  expect(
    scoped.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  // Integration checks catch landmark and naming problems outside the component.
  const whole = await build().analyze();
  expect(
    whole.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
}
export async function overflow(page) {
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(1);
}
export const openers = {
  Modal: "Open dialog",
  ConfirmDialog: "Delete project",
  SlideOver: "Add variable",
  CommandPalette: "Open command menu",
  SearchDialog: "Search docs",
  SearchTrigger: "Search docs",
};
export async function openOverlay(page, component, root) {
  const opener = root.getByRole("button", {
    name: openers[component.export],
    exact: !component.export.startsWith("Search"),
  });
  await opener.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    expect(
      await dialog.evaluate((el) => el.contains(document.activeElement)),
    ).toBe(true);
  }
  await accessibility(page, '[role="dialog"]');
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  // A separate pointer path also exercises the controlled open/close callbacks.
  await opener.click();
  await expect(dialog).toBeVisible();
  if (component.export === "ConfirmDialog") {
    const confirm = dialog.getByRole("button", {
      name: "Delete project",
      exact: true,
    });
    await expect(confirm).toBeDisabled();
    await dialog.getByLabel("Type Northwind to confirm").fill("Northwind");
    await expect(confirm).toBeEnabled();
    await confirm.click();
  } else await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
}
