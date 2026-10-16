import { test, expect } from "@playwright/test";
import { mount, accessibility, overflow } from "../support/preview.mjs";
// Calendar-specific keyboard, token and reflow checks. The shared contract
// sweep in components.spec.mjs runs the registered `calendar` probe as well.
const calendar = { export: "Calendar", testing: { target: ".m-calendar" } };
const scope = '[data-mortar-preview="Calendar"]';
const date = (root, name) =>
  root.getByRole("grid").getByRole("button", { name: new RegExp(`^${name}`) });

for (const theme of ["light", "dark"]) {
  test(`Calendar grid keyboard navigation: ${theme}`, async ({ page }) => {
    const { root, errors } = await mount(page, calendar, { theme });
    const selected = root.getByLabel("Selected date");
    await date(root, "Monday, January 12, 2026").focus();
    for (const [key, name] of [
      ["ArrowRight", "Tuesday, January 13, 2026"],
      ["ArrowDown", "Tuesday, January 20, 2026"],
      ["ArrowLeft", "Monday, January 19, 2026"],
      ["ArrowUp", "Monday, January 12, 2026"],
      ["End", "Sunday, January 18, 2026"],
      ["Home", "Monday, January 12, 2026"],
    ]) {
      await page.keyboard.press(key);
      await expect(date(root, name), key).toBeFocused();
    }
    await page.keyboard.press("PageDown");
    await expect(
      root.getByRole("grid", { name: "February 2026" }),
    ).toBeVisible();
    await expect(date(root, "Thursday, February 12, 2026")).toBeFocused();
    await page.keyboard.press("PageUp");
    await expect(
      root.getByRole("grid", { name: "January 2026" }),
    ).toBeVisible();
    await expect(date(root, "Monday, January 12, 2026")).toBeFocused();
    // Leaving the visible weeks moves the month and keeps focus on the day.
    await date(root, "Monday, January 26, 2026").focus();
    await page.keyboard.press("ArrowDown");
    await expect(
      root.getByRole("grid", { name: "February 2026" }),
    ).toBeVisible();
    await expect(date(root, "Monday, February 2, 2026")).toBeFocused();
    await expect(date(root, "Monday, February 2, 2026")).toHaveAttribute(
      "tabindex",
      "0",
    );
    await page.keyboard.press("Space");
    await expect(selected).toHaveText("2026-02-02");
    await page.keyboard.press("PageUp");
    // Unavailable days stay focusable but cannot be chosen.
    await date(root, "Wednesday, January 14, 2026").focus();
    await page.keyboard.press("ArrowRight");
    const blocked = date(root, "Thursday, January 15, 2026");
    await expect(blocked).toBeFocused();
    await expect(blocked).toHaveAttribute("aria-disabled", "true");
    await page.keyboard.press("Enter");
    await expect(selected).toHaveText("2026-02-02");
    await accessibility(page, scope);
    expect(errors).toEqual([]);
  });

  test(`Calendar month navigation respects min and max: ${theme}`, async ({
    page,
  }) => {
    const { root, errors } = await mount(page, calendar, { theme });
    const previous = root.getByRole("button", { name: "Previous month" });
    const next = root.getByRole("button", { name: "Next month" });
    await next.click();
    await next.click();
    await expect(root.getByRole("grid", { name: "March 2026" })).toBeVisible();
    await expect(next).toBeDisabled();
    for (let i = 0; i < 3; i++) await previous.click();
    await expect(
      root.getByRole("grid", { name: "December 2025" }),
    ).toBeVisible();
    await expect(previous).toBeDisabled();
    await expect(next).toBeEnabled();
    expect(errors).toEqual([]);
  });

  test(`Calendar selection and events use theme tokens: ${theme}`, async ({
    page,
  }) => {
    const { root, errors } = await mount(page, calendar, { theme });
    const events = root.locator(".m-calendar-events");
    await expect(events).toContainText("Design review");
    await expect(events).toContainText("Team sync");
    const paint = (name) =>
      date(root, name).evaluate((el) => {
        const probe = document.createElement("span");
        probe.style.background = "var(--m-primary)";
        probe.style.color = "var(--m-on-primary)";
        el.after(probe);
        const got = getComputedStyle(el);
        const want = getComputedStyle(probe);
        const result = {
          background: got.backgroundColor,
          color: got.color,
          primary: want.backgroundColor,
          onPrimary: want.color,
        };
        probe.remove();
        return result;
      });
    const chosen = await paint("Monday, January 12, 2026");
    expect(chosen.background).toBe(chosen.primary);
    expect(chosen.color).toBe(chosen.onPrimary);
    const other = await paint("Tuesday, January 13, 2026");
    expect(other.background).not.toBe(other.primary);
    await date(root, "Tuesday, January 13, 2026").click();
    await expect(events).toContainText("No events");
    await accessibility(page, scope);
    expect(errors).toEqual([]);
  });

  for (const width of [320, 768, 1280]) {
    test(`Calendar reflows at ${width}px: ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const { root, errors } = await mount(page, calendar, { theme });
      await overflow(page);
      const grid = await root.getByRole("grid").boundingBox();
      expect(grid.x).toBeGreaterThanOrEqual(0);
      expect(grid.x + grid.width).toBeLessThanOrEqual(width);
      for (const button of await root
        .getByRole("grid")
        .getByRole("button")
        .all()) {
        const box = await button.boundingBox();
        expect(box.width).toBeGreaterThanOrEqual(24);
        expect(box.height).toBeGreaterThanOrEqual(24);
      }
      if (width === 320) {
        const events = await root.locator(".m-calendar-events").boundingBox();
        expect(events.y).toBeGreaterThanOrEqual(grid.y + grid.height);
      }
      await accessibility(page, scope);
      expect(errors).toEqual([]);
    });
  }
}
