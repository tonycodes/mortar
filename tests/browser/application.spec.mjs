import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { useFixtureServer } from "../support/fixture-server.mjs";

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
