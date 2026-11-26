// DataGrid behaviour that server rendering can show: sort order with empty
// values and paging past the end of the rows. Renders the built package.
import test from "node:test";
import assert from "node:assert/strict";
import { html } from "./support/render.mjs";
import { DataGrid } from "../dist/data-grid.js";

const values = [3, null, 1, "", 2, 5, undefined, 4];
const rows = values.map((v, i) => ({ id: `r${i}`, v }));
const columns = [
  { key: "id", label: "Id", render: (r) => r.id },
  {
    key: "v",
    label: "V",
    sortable: true,
    render: (r) => (r.v == null || r.v === "" ? "-" : String(r.v)),
  },
];
const cells = (markup) =>
  [...markup.matchAll(/<td[^>]*>([^<]*)<\/td>/g)].map((m) => m[1]);

test("sorting puts empty values last in both directions, as DataTable does", () => {
  const order = (direction) =>
    cells(
      html(DataGrid, {
        caption: "Values",
        rowLabel: (r) => r.id,
        rows,
        columns,
        defaultSort: [{ key: "v", direction }],
      }),
    ).join(",");
  assert.equal(order("ascending"), "1,2,3,4,5,-,-,-");
  assert.equal(order("descending"), "5,4,3,2,1,-,-,-");
});

test("a page past the end shows the last page, not an empty result", () => {
  const markup = html(DataGrid, {
    caption: "Values",
    rowLabel: (r) => r.id,
    rows: rows.slice(0, 5),
    columns,
    pagination: { page: 8, pageSize: 2 },
    onPaginationChange: () => {},
  });
  assert.doesNotMatch(markup, /No matching records/);
  assert.deepEqual(cells(markup), ["2"]);
  assert.match(
    markup,
    /Showing <strong>5<\/strong> to <strong>5<\/strong> of <strong>5<\/strong>/,
  );
});

// Phase 2: resizable columns and expandable detail rows.
const base = {
  caption: "Values",
  rowLabel: (r) => r.id,
  rows: rows.slice(0, 3),
  columns,
};

test("resizable columns get a focusable separator named after the column", () => {
  const markup = html(DataGrid, { ...base, resizable: true });
  const separators = [...markup.matchAll(/<div role="separator"[^>]*>/g)].map(
    (m) => m[0],
  );
  assert.equal(separators.length, 2);
  assert.match(separators[0], /aria-orientation="vertical"/);
  assert.match(separators[0], /aria-label="Resize Id"/);
  assert.match(separators[0], /aria-valuemin="64"/);
  // A separator always has a range: 2000 unless the column sets maxWidth.
  assert.match(separators[0], /aria-valuemax="2000"/);
  // The header's name is its label, not "Id Resize Id".
  const head = markup.match(/<th[^>]*data-key="id"[^>]*>/)[0];
  const labelledBy = head.match(/aria-labelledby="([^"]+)"/)[1];
  assert.match(markup, new RegExp(`<span id="${labelledBy}">Id</span>`));
  assert.match(separators[0], /tabindex="0"/);
  // A column can opt out, and a grid without resizable has none.
  const fixed = html(DataGrid, {
    ...base,
    resizable: true,
    columns: [{ ...columns[0], resizable: false }, columns[1]],
  });
  assert.equal(fixed.match(/role="separator"/g)?.length, 1);
  assert.doesNotMatch(html(DataGrid, base), /role="separator"/);
});

test("widths for every column lay the table out at exactly those widths", () => {
  const markup = html(DataGrid, {
    ...base,
    resizable: true,
    columnWidths: { id: 120, v: 200 },
  });
  assert.match(markup, /<table data-resized="true" style="width:320px"/);
  assert.match(
    markup,
    /<col style="width:120px"\/><col style="width:200px"\/>/,
  );
  assert.match(markup, /aria-valuenow="120"[^>]*aria-valuetext="120 pixels"/);
  // A width for only some columns keeps the automatic layout.
  assert.doesNotMatch(
    html(DataGrid, { ...base, resizable: true, columnWidths: { id: 120 } }),
    /data-resized/,
  );
  // The selection column counts toward the table's width.
  assert.match(
    html(DataGrid, {
      ...base,
      resizable: true,
      columnWidths: { id: 120, v: 200 },
      selectedIds: [],
      onSelectionChange: () => {},
    }),
    /style="width:364px"/,
  );
});

test("expandable rows have a named toggle and a full-width detail row", () => {
  const markup = html(DataGrid, {
    ...base,
    renderDetail: (r) => `Detail of ${r.id}`,
    rowCanExpand: (r) => r.id !== "r1",
    defaultExpandedIds: ["r0"],
  });
  const toggles = [...markup.matchAll(/<button[^>]*m-data-grid-expand[^>]*>/g)];
  assert.equal(toggles.length, 2, "r1 cannot expand");
  assert.match(toggles[0][0], /aria-expanded="true"/);
  assert.match(toggles[0][0], /aria-label="Details for r0"/);
  const controls = toggles[0][0].match(/aria-controls="([^"]+)"/)[1];
  assert.match(
    markup,
    new RegExp(
      `<tr id="${controls}" class="m-data-grid-detail"><td colSpan="3">Detail of r0</td></tr>`,
      "i",
    ),
  );
  assert.match(toggles[1][0], /aria-expanded="false"/);
  assert.doesNotMatch(toggles[1][0], /aria-controls/);
  assert.equal(markup.match(/m-data-grid-detail/g)?.length, 1);
  assert.match(
    markup,
    /<th scope="col" data-expand="" data-key="__expand"><span class="m-sr-only">Details<\/span><\/th>/,
  );
});

test("virtualized grids do not expand rows yet", () => {
  // The console warning comes from an effect, which server rendering skips.
  const markup = html(DataGrid, {
    ...base,
    virtualize: true,
    renderDetail: (r) => r.id,
    defaultExpandedIds: ["r0"],
  });
  assert.doesNotMatch(markup, /m-data-grid-expand|m-data-grid-detail/);
});

test("resized tables keep focus rings and detail rows unclipped", async () => {
  const { readSource } = await import("./support/css.mjs");
  const css = await readSource("src/data.css");
  // Cells clip in fixed layout, so controls draw their ring inside.
  assert.match(
    css,
    /table\[data-resized\]\s*:is\(\.m-sort-button, \.m-data-grid-expand\):focus-visible\s*\{\s*outline-offset: -2px;/,
  );
  // The detail row is not clipped.
  assert.match(
    css,
    /table\[data-resized\]\s*:is\(\s*thead th,\s*tbody tr:not\(\.m-data-grid-detail\) > :is\(th, td\)\s*\)\s*\{\s*overflow: hidden;/,
  );
});
