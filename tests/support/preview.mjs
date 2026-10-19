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
const violations = (results) =>
  results.violations.map((v) => ({
    id: v.id,
    nodes: v.nodes.map((n) => n.target),
  }));
/**
 * WCAG 2.1 A/AA axe checks of the whole page. With a scope, the scoped region
 * is checked first; the whole-page pass then catches landmark and naming
 * problems outside the component.
 */
export async function accessibility(page, scope) {
  const build = () =>
    new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]);
  if (scope)
    expect(violations(await build().include(scope).analyze())).toEqual([]);
  expect(violations(await build().analyze())).toEqual([]);
}
/**
 * WCAG contrast ratio of two computed `rgb()`/`rgba()` colours (alpha
 * ignored). An unparseable colour, such as an empty string, scores 0.
 */
export function contrast(a, b) {
  const channels = (value) =>
    String(value)
      .match(/[\d.]+/g)
      ?.slice(0, 3);
  if (channels(a)?.length !== 3 || channels(b)?.length !== 3) return 0;
  const luminance = (value) =>
    channels(value)
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
/** A colour token as its computed `rgb()` value inside `within` (default: body). */
export function tokenColor(page, token, within = page.locator("body")) {
  return within.evaluate((el, token) => {
    const probe = el.ownerDocument.createElement("span");
    probe.style.backgroundColor = `var(${token})`;
    el.appendChild(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  }, token);
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
  ProductQuickView: "Quick view",
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
