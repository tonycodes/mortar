import { test, expect } from "@playwright/test";

// Performance budget for DataGrid with 100,000 client-side rows (the playground
// preview's virtualized grid). Budgets leave headroom for slower CI machines;
// they exist to catch regressions such as rebuilding the row models on every
// render, which once made each scroll frame take about 600ms.
const BUDGET = {
  firstRows: 5_000, // navigation to the first visible row, ms
  sort: 1_500, // sorting all rows by one column, ms
  search: 1_500, // searching all rows, ms
  frameP50: 34, // median scroll frame, ms (two frames at 60fps)
  frameP95: 100, // 95th percentile scroll frame, ms
  domRows: 100, // rows in the DOM at any time
};

test("DataGrid stays fast with 100,000 rows", async ({ page }) => {
  const start = Date.now();
  await page.goto("/?component=DataGrid&theme=light");
  const grid = page
    .locator('[data-mortar-preview="DataGrid"] .m-data-grid')
    .first();
  const rows = grid.locator("tbody tr:not(.m-data-grid-spacer)");
  await expect(rows.first()).toBeVisible();
  const firstRows = Date.now() - start;

  const timed = async (action, done) => {
    const begin = Date.now();
    await action();
    await done();
    return Date.now() - begin;
  };
  const amount = grid.getByRole("columnheader", { name: /^Amount/ });
  const sort = await timed(
    () => grid.getByRole("button", { name: /^Amount/ }).click(),
    () => expect(amount).toHaveAttribute("aria-sort", "ascending"),
  );
  const search = await timed(
    () => grid.getByLabel("Search").fill("Hooli"),
    () =>
      expect(grid.getByRole("status")).toHaveText("12500 matching invoices"),
  );
  await grid.getByLabel("Search").fill("");

  // Scroll in steps, one per animation frame, and time each frame.
  const scroll = await grid.locator(".m-table-scroll").evaluate(async (el) => {
    const gaps = [];
    let maxRows = 0;
    let last = performance.now();
    for (let i = 0; i < 120; i++) {
      el.scrollTop += 400;
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const now = performance.now();
      gaps.push(now - last);
      last = now;
      maxRows = Math.max(maxRows, el.querySelectorAll("tbody tr").length);
    }
    gaps.sort((a, b) => a - b);
    return { p50: gaps[60], p95: gaps[114], maxRows };
  });

  const measured = { firstRows, sort, search, ...scroll };
  test.info().annotations.push({
    type: "performance",
    description: JSON.stringify(measured),
  });
  expect(firstRows, "first rows").toBeLessThan(BUDGET.firstRows);
  expect(sort, "sort").toBeLessThan(BUDGET.sort);
  expect(search, "search").toBeLessThan(BUDGET.search);
  expect(scroll.p50, "median scroll frame").toBeLessThan(BUDGET.frameP50);
  expect(scroll.p95, "95th percentile scroll frame").toBeLessThan(
    BUDGET.frameP95,
  );
  expect(scroll.maxRows, "rows in the DOM").toBeLessThan(BUDGET.domRows);
});
