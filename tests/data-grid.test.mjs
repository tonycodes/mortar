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
