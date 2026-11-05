import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { useFixtureServer } from "../support/fixture-server.mjs";
import { accessibility } from "../support/preview.mjs";

// Regression tests for application-family behaviour that the preview probes
// do not reach: selection across pages, focus after removal, stretched links
// and status regions. The fixture app is tests/browser/fixtures/application.
const base = useFixtureServer(test, "application");

test("DataTable select all keeps selections made on other pages", async ({
  page,
}) => {
  await page.goto(`${base()}/`);
  const table = page.getByRole("region", { name: "People", exact: true });
  const selected = page.getByLabel("Selected ids");
  await table.getByRole("checkbox", { name: "Select Ana" }).check();
  await table.getByRole("button", { name: "Next" }).click();
  await table.getByRole("checkbox", { name: "Select all rows" }).check();
  await expect(selected).toHaveText("ana,cy,di");
  await expect(table.getByText("3 selected")).toBeVisible();
  // Clearing this page's rows leaves the first page's selection alone.
  await table.getByRole("checkbox", { name: "Select all rows" }).uncheck();
  await expect(selected).toHaveText("ana");
  await table.getByRole("button", { name: "Previous" }).click();
  await expect(
    table.getByRole("checkbox", { name: "Select Ana" }),
  ).toBeChecked();
});

test("Pagination keeps focus on Next when the last page disables it", async ({
  page,
}) => {
  await page.goto(`${base()}/`);
  const pager = page.getByRole("navigation", { name: "Pagination" });
  const next = pager.getByRole("button", { name: "Next" });
  await next.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await expect(pager).toContainText("Page 3 of 3");
  await expect(next).toBeFocused();
  await expect(next).toBeDisabled();
});

test("FilterChip removal moves focus to the next chip, then the previous one", async ({
  page,
}) => {
  await page.goto(`${base()}/`);
  const chips = page.getByRole("group", { name: "Active filters" });
  await chips.getByRole("button", { name: "Remove Green" }).focus();
  await page.keyboard.press("Enter");
  await expect(chips.getByRole("button", { name: "Remove Green" })).toHaveCount(
    0,
  );
  await expect(
    chips.getByRole("button", { name: "Remove Blue" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(chips.getByRole("button", { name: "Remove Red" })).toBeFocused();
});

test("GridList links in meta stay clickable above the stretched title link", async ({
  page,
}) => {
  await page.goto(`${base()}/`);
  const meta = page.getByRole("link", { name: "Platform team" });
  const box = await meta.boundingBox();
  const hit = await page.evaluate(
    ([x, y]) => document.elementFromPoint(x, y)?.textContent,
    [box.x + box.width / 2, box.y + box.height / 2],
  );
  expect(hit).toBe("Platform team");
  await meta.click();
  await expect(page).toHaveURL(/#platform$/);
});

test("CommandPalette announces no results through a status region mounted beforehand", async ({
  page,
}) => {
  await page.goto(`${base()}/`);
  await page.getByRole("button", { name: "Open palette" }).click();
  const dialog = page.getByRole("dialog");
  const status = dialog.getByRole("status");
  await expect(status).toHaveCount(1);
  await expect(status).toHaveText("");
  await page.keyboard.type("zzz");
  await expect(status).toHaveText("Nothing matches Try another word.");
});

test("category template headings keep their order", async ({ page }) => {
  await page.goto("/?recipe=category-page");
  await expect(page.getByRole("heading", { name: "Bags" })).toHaveAttribute(
    "class",
    "m-grid-list-title",
  );
  const results = await new AxeBuilder({ page })
    .include(".m-grid-list")
    .withRules(["heading-order"])
    .analyze();
  expect(results.violations).toEqual([]);
  expect(
    await page
      .getByRole("heading", { name: "Bags" })
      .evaluate((h) => h.tagName),
  ).toBe("H2");
});

// #77: column priority and a pinned action column on narrow screens, in both
// appearances. The keys fixture reads ?theme=; it does not change the golden
// DataTable preview.
const keysHeaders = (page, caption) =>
  page
    .getByRole("region", { name: caption, exact: true })
    .locator("thead th")
    .evaluateAll((all) =>
      all.filter((th) => th.offsetParent !== null).map((th) => th.innerText),
    );

for (const theme of ["light", "dark"]) {
  for (const [width, expected] of [
    [1280, ["Name", "Status", "Prefix", "Created", "Last used", "Action"]],
    [700, ["Name", "Status", "Last used", "Action"]],
    [375, ["Name", "Status", "Action"]],
  ])
    test(`DataTable shows columns by priority at ${width}px (${theme})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(`${base()}/?case=keys&theme=${theme}`);
      await expect(page.locator("html")).toHaveAttribute(
        "data-mortar-appearance",
        theme,
      );
      // The selection column has no text; compare the named columns.
      expect((await keysHeaders(page, "API keys")).filter(Boolean)).toEqual(
        expected,
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      // Every visible column fits: no sideways scroll inside the table either.
      const area = page.getByRole("region", { name: "API keys scroll area" });
      expect(
        await area.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      ).toBe(true);
      const box = await area.boundingBox();
      const revoke = await area
        .getByRole("button", { name: "Revoke k1" })
        .boundingBox();
      expect(revoke.x + revoke.width).toBeLessThanOrEqual(
        box.x + box.width + 1,
      );
      await expect(
        area.getByRole("columnheader", { name: "Action" }),
      ).toHaveAttribute("data-pin", "end");
      await accessibility(page);
    });

  test(`a pinned column stays in view while the table scrolls (${theme})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(`${base()}/?case=keys&theme=${theme}`);
    await expect(page.locator("html")).toHaveAttribute(
      "data-mortar-appearance",
      theme,
    );
    const area = page.getByRole("region", { name: "Wide keys scroll area" });
    expect(await area.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
      true,
    );
    const box = await area.boundingBox();
    const revoke = area.getByRole("button", { name: "Revoke k1" });
    for (const scroll of [0, 10_000]) {
      await area.evaluate((el, x) => (el.scrollLeft = x), scroll);
      const b = await revoke.boundingBox();
      expect(b.x).toBeGreaterThanOrEqual(box.x - 1);
      expect(b.x + b.width).toBeLessThanOrEqual(box.x + box.width + 1);
    }
    await area.evaluate((el) => (el.scrollLeft = 0));
    await revoke.click();
    // The pinned cell is opaque and follows the row: surface, stripe, selected.
    const cellBg = (name) =>
      area
        .getByRole("button", { name })
        .evaluate((b) => getComputedStyle(b.closest("td")).backgroundColor);
    const rowBg = (name) =>
      area
        .getByRole("button", { name })
        .evaluate((b) => getComputedStyle(b.closest("tr")).backgroundColor);
    expect(await cellBg("Revoke k2")).toBe(await rowBg("Revoke k2"));
    expect(await cellBg("Revoke k1")).not.toBe("rgba(0, 0, 0, 0)");
    await expect(
      area.getByRole("columnheader", { name: "Action" }),
    ).toHaveAttribute("data-pin", "end");
    await accessibility(page);
  });
}
