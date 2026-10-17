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
    // Changing month by button keeps focus on the button.
    await next.focus();
    await page.keyboard.press("Enter");
    await expect(
      root.getByRole("grid", { name: "February 2026" }),
    ).toBeVisible();
    await expect(next).toBeFocused();
    await next.click();
    await expect(root.getByRole("grid", { name: "March 2026" })).toBeVisible();
    await expect(next).toBeDisabled();
    await previous.click();
    await expect(
      root.getByRole("grid", { name: "February 2026" }),
    ).toBeVisible();
    await expect(previous).toBeFocused();
    for (let i = 0; i < 2; i++) await previous.click();
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

// Scenario fixtures beyond the manifest states (see docs/plans/calendar.md):
// `unbounded` has no min/max, weekStartsOn 0 and starts on 2026-01-31;
// `controlled` owns `month` and applies requests only on demand.
const grid = (root, name) => root.getByRole("grid", { name });
const stop = (root) =>
  root.getByRole("grid").locator('button[tabindex="0"]').focus();
async function press(page, key, times = 1) {
  for (let i = 0; i < times; i++) await page.keyboard.press(key);
}
async function lands(root, name, month) {
  await expect(grid(root, month)).toBeVisible();
  await expect(date(root, name)).toBeFocused();
  await expect(date(root, name)).toHaveAttribute("tabindex", "0");
}

test.describe("Calendar in America/Los_Angeles", () => {
  test.use({ timezoneId: "America/Los_Angeles" });
  test("Calendar keyboard dates do not shift west of UTC", async ({ page }) => {
    const { root, errors } = await mount(page, calendar);
    expect(
      await page.evaluate(
        () => Intl.DateTimeFormat().resolvedOptions().timeZone,
      ),
    ).toBe("America/Los_Angeles");
    const today = date(root, "Monday, January 12, 2026");
    await expect(today).toHaveAttribute("aria-current", "date");
    await expect(today.locator("time")).toHaveAttribute(
      "datetime",
      "2026-01-12",
    );
    await today.focus();
    for (const [key, name, month] of [
      ["ArrowRight", "Tuesday, January 13, 2026", "January 2026"],
      ["PageDown", "Friday, February 13, 2026", "February 2026"],
      ["Home", "Monday, February 9, 2026", "February 2026"],
      ["End", "Sunday, February 15, 2026", "February 2026"],
      ["ArrowUp", "Sunday, February 8, 2026", "February 2026"],
    ]) {
      await page.keyboard.press(key);
      await lands(root, name, month);
    }
    await page.keyboard.press("Enter");
    await expect(root.getByLabel("Selected date")).toHaveText("2026-02-08");
    expect(errors).toEqual([]);
  });
});

for (const [zone, crossings] of [
  [
    "America/New_York",
    [
      [
        2,
        "March 2026",
        "Thursday, March 5, 2026",
        "Thursday, March 12, 2026",
        "March 2026",
      ],
      [
        9,
        "October 2026",
        "Thursday, October 29, 2026",
        "Thursday, November 5, 2026",
        "November 2026",
      ],
    ],
  ],
  [
    "Europe/London",
    [
      [
        2,
        "March 2026",
        "Thursday, March 26, 2026",
        "Thursday, April 2, 2026",
        "April 2026",
      ],
      [
        9,
        "October 2026",
        "Thursday, October 22, 2026",
        "Thursday, October 29, 2026",
        "October 2026",
      ],
    ],
  ],
]) {
  test.describe(`Calendar in ${zone}`, () => {
    test.use({ timezoneId: zone });
    for (const [pages, month, from, to, toMonth] of crossings) {
      test(`Calendar ArrowDown crosses the ${month} DST week: ${zone}`, async ({
        page,
      }) => {
        const { root, errors } = await mount(page, calendar, {
          state: "unbounded",
        });
        await stop(root);
        await press(page, "PageDown", pages);
        await expect(grid(root, month)).toBeVisible();
        await date(root, from).focus();
        await page.keyboard.press("ArrowDown");
        await lands(root, to, toMonth);
        await page.keyboard.press("ArrowUp");
        await lands(root, from, month);
        expect(errors).toEqual([]);
      });
    }
  });
}

test("Calendar PageUp and PageDown clamp to the month length", async ({
  page,
}) => {
  const { root, errors } = await mount(page, calendar, { state: "unbounded" });
  await stop(root);
  await lands(root, "Saturday, January 31, 2026", "January 2026");
  await page.keyboard.press("PageDown");
  await lands(root, "Saturday, February 28, 2026", "February 2026");
  await page.keyboard.press("PageDown");
  await lands(root, "Saturday, March 28, 2026", "March 2026");
  await date(root, "Tuesday, March 31, 2026").focus();
  await page.keyboard.press("PageUp");
  await lands(root, "Saturday, February 28, 2026", "February 2026");
  await press(page, "PageDown", 11);
  await expect(grid(root, "January 2027")).toBeVisible();
  await date(root, "Sunday, January 31, 2027").focus();
  await page.keyboard.press("PageDown");
  await lands(root, "Sunday, February 28, 2027", "February 2027");
  await press(page, "PageDown", 11);
  await expect(grid(root, "January 2028")).toBeVisible();
  await date(root, "Monday, January 31, 2028").focus();
  await page.keyboard.press("PageDown");
  await lands(root, "Tuesday, February 29, 2028", "February 2028");
  await page.keyboard.press("PageDown");
  await lands(root, "Wednesday, March 29, 2028", "March 2028");
  await date(root, "Friday, March 31, 2028").focus();
  await page.keyboard.press("PageUp");
  await lands(root, "Tuesday, February 29, 2028", "February 2028");
  expect(errors).toEqual([]);
});

test("Calendar Home and End follow a Sunday week start", async ({ page }) => {
  const { root, errors } = await mount(page, calendar, { state: "unbounded" });
  const headers = root.getByRole("columnheader");
  await expect(headers.first()).toHaveAttribute("aria-label", "Sunday");
  await expect(headers.last()).toHaveAttribute("aria-label", "Saturday");
  await stop(root);
  await page.keyboard.press("Home");
  await lands(root, "Sunday, January 25, 2026", "January 2026");
  await page.keyboard.press("End");
  await lands(root, "Saturday, January 31, 2026", "January 2026");
  await date(root, "Wednesday, January 7, 2026").focus();
  await page.keyboard.press("Home");
  await lands(root, "Sunday, January 4, 2026", "January 2026");
  expect(errors).toEqual([]);
});

test("Calendar arrows cross the year boundary", async ({ page }) => {
  const { root, errors } = await mount(page, calendar);
  const heading = (name) => root.getByRole("heading", { name, exact: true });
  await date(root, "Thursday, January 1, 2026").focus();
  await page.keyboard.press("ArrowLeft");
  await lands(root, "Wednesday, December 31, 2025", "December 2025");
  await expect(heading("December 2025")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await lands(root, "Thursday, January 1, 2026", "January 2026");
  await expect(heading("January 2026")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Calendar keyboard movement clamps to min and max", async ({ page }) => {
  // Default fixture: min 2025-12-01, max 2026-03-31.
  const { root, errors } = await mount(page, calendar);
  await date(root, "Monday, January 12, 2026").focus();
  await press(page, "PageDown", 2);
  await lands(root, "Thursday, March 12, 2026", "March 2026");
  await page.keyboard.press("PageDown");
  await lands(root, "Tuesday, March 31, 2026", "March 2026");
  for (const key of ["ArrowRight", "ArrowDown", "End", "PageDown"]) {
    await page.keyboard.press(key);
    await lands(root, "Tuesday, March 31, 2026", "March 2026");
  }
  await date(root, "Thursday, March 26, 2026").focus();
  await page.keyboard.press("ArrowDown");
  await lands(root, "Tuesday, March 31, 2026", "March 2026");
  await date(root, "Monday, March 30, 2026").focus();
  await page.keyboard.press("End");
  await lands(root, "Tuesday, March 31, 2026", "March 2026");
  await expect(grid(root, "April 2026")).toHaveCount(0);
  await press(page, "PageUp", 3);
  await lands(root, "Sunday, December 28, 2025", "December 2025");
  await page.keyboard.press("PageUp");
  await lands(root, "Monday, December 1, 2025", "December 2025");
  for (const key of ["ArrowLeft", "ArrowUp", "Home", "PageUp"]) {
    await page.keyboard.press(key);
    await lands(root, "Monday, December 1, 2025", "December 2025");
  }
  await expect(grid(root, "November 2025")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("Calendar outside days select when in range and move the month", async ({
  page,
}) => {
  const { root, errors } = await mount(page, calendar);
  const selected = root.getByLabel("Selected date");
  await date(root, "Wednesday, December 31, 2025").click();
  await expect(selected).toHaveText("2025-12-31");
  await expect(grid(root, "December 2025")).toBeVisible();
  await expect(
    root.getByRole("gridcell", { selected: true }).getByRole("button"),
  ).toHaveAccessibleName(/^Wednesday, December 31, 2025/);
  await date(root, "Sunday, January 4, 2026").click();
  await expect(selected).toHaveText("2026-01-04");
  await expect(grid(root, "January 2026")).toBeVisible();
  // Trailing April days in the March view fall past max: nothing changes.
  const next = root.getByRole("button", { name: "Next month" });
  await next.click();
  await next.click();
  const late = date(root, "Wednesday, April 1, 2026");
  await expect(late).toHaveAttribute("aria-disabled", "true");
  await late.click({ force: true });
  await expect(selected).toHaveText("2026-01-04");
  await expect(grid(root, "March 2026")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Calendar controlled month waits for the parent", async ({ page }) => {
  const { root, errors } = await mount(page, calendar, { state: "controlled" });
  const requested = root.getByLabel("Requested month");
  const requests = root.getByLabel("Month request count");
  const apply = root.getByRole("button", { name: "Show requested month" });
  await expect(requests).toHaveText("0");
  await root.getByRole("button", { name: "Next month" }).click();
  await expect(requested).toHaveText("2026-02");
  await expect(requests).toHaveText("1");
  await expect(grid(root, "January 2026")).toBeVisible();
  await expect(
    root.getByRole("heading", { name: "January 2026", exact: true }),
  ).toBeVisible();
  await stop(root);
  await page.keyboard.press("PageDown");
  await expect(requested).toHaveText("2026-02");
  await expect(requests).toHaveText("2");
  await expect(grid(root, "January 2026")).toBeVisible();
  await expect(
    root.getByRole("heading", { name: "January 2026", exact: true }),
  ).toBeVisible();
  await expect(root.getByLabel("Selected date")).toHaveText("2026-01-12");
  await apply.click();
  await expect(grid(root, "February 2026")).toBeVisible();
  await stop(root);
  await page.keyboard.press("PageDown");
  await expect(requested).toHaveText("2026-03");
  await expect(requests).toHaveText("3");
  await expect(grid(root, "February 2026")).toBeVisible();
  await root.getByRole("button", { name: "Previous month" }).click();
  await expect(requested).toHaveText("2026-01");
  await expect(requests).toHaveText("4");
  await expect(grid(root, "February 2026")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Calendar disabled never calls back", async ({ page }) => {
  const { root, errors } = await mount(page, calendar, { state: "disabled" });
  const fixture = root.locator('[data-state="disabled"]');
  const buttons = root.locator(".m-calendar button");
  expect(await buttons.count()).toBeGreaterThanOrEqual(37);
  for (const button of await buttons.all()) {
    await expect(button).toBeDisabled();
    await button.click({ force: true });
    await button.dispatchEvent("click");
    for (const key of ["Enter", " "])
      await button.dispatchEvent("keydown", { key, bubbles: true });
  }
  for (const key of ["Enter", " ", "ArrowRight", "PageDown"])
    await root
      .getByRole("grid")
      .dispatchEvent("keydown", { key, bubbles: true });
  await expect(fixture.getByLabel("Callback count")).toHaveText("0");
  await expect(grid(root, "January 2026")).toBeVisible();
  expect(errors).toEqual([]);
});
