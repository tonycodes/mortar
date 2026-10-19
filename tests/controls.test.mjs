import test from "node:test";
import assert from "node:assert/strict";
import {
  h,
  html,
  Fragment,
  AppShell,
  Input,
  DataTable,
  CodeBlock,
} from "./support/render.mjs";
test("Mortar shell supplies page landmarks and labelled navigation", () => {
  const markup = html(
    AppShell,
    {
      brand: "Example",
      navigation: [{ label: "Overview", href: "#overview", current: true }],
    },
    "Content",
  );
  assert.match(markup, /aria-current="page"/);
  assert.match(markup, /<main id="m-content"/);
  assert.match(markup, /Skip to content/);
});
test("Mortar fields keep unique labels and external error descriptions", () => {
  const markup = html(
    Fragment,
    {},
    h(Input, {
      label: "Email",
      error: "Invalid email",
      "aria-describedby": "external",
    }),
    h(Input, { label: "Name" }),
  );
  const ids = [...markup.matchAll(/<input[^>]*\sid="([^"]+)"/g)].map(
    (m) => m[1],
  );
  assert.equal(ids.length, 2);
  assert.notEqual(ids[0], ids[1]);
  assert.ok(markup.includes("external " + ids[0] + "-message"));
  assert.ok(markup.includes('for="' + ids[1] + '"'));
});
test("Mortar table separates loading, error and empty states and keeps row headers", () => {
  const props = {
    caption: "Records",
    columns: [{ key: "name", label: "Name", render: (row) => row.name }],
    rowLabel: (row) => row.name,
    rows: [{ id: "1", name: "Example" }],
  };
  const render = (extra) => html(DataTable, { ...props, ...extra });
  assert.match(render({}), /scope="row"/);
  assert.match(render({}), /tabindex="0"/);
  assert.match(render({ rows: [] }), /No records/);
  assert.match(render({ loading: true }), /role="status"/);
  assert.match(render({ error: "Unavailable" }), /role="alert"/);
});
test("Mortar table sorts locally, keeps ties stable and puts empty values last", () => {
  const rows = [
    { id: "a", name: "item 10", score: 2 },
    { id: "b", name: "item 2", score: null },
    { id: "c", name: "Item 1", score: 2 },
    { id: "d", name: "item 3", score: 1 },
  ];
  const columns = [
    { key: "name", label: "Name", render: (r) => r.name, sortable: true },
    { key: "score", label: "Score", render: (r) => r.score, sortable: true },
  ];
  const order = (sort, extra = {}) =>
    [
      ...html(DataTable, {
        caption: "Records",
        rowLabel: (r) => r.name,
        columns,
        rows,
        defaultSort: sort,
        ...extra,
      }).matchAll(/scope="row"[^>]*>([^<]+)</g),
    ].map((m) => m[1]);
  assert.deepEqual(order({ key: "name", direction: "ascending" }), [
    "Item 1",
    "item 2",
    "item 3",
    "item 10",
  ]);
  assert.deepEqual(order({ key: "score", direction: "descending" }), [
    "item 10",
    "Item 1",
    "item 3",
    "item 2",
  ]);
  assert.deepEqual(order({ key: "score", direction: "ascending" }), [
    "item 3",
    "item 10",
    "Item 1",
    "item 2",
  ]);
  // Server-side sorting: the consumer orders rows; the table only reflects state.
  assert.deepEqual(
    order(undefined, {
      sort: { key: "name", direction: "descending" },
      onSortChange: () => {},
    }),
    ["item 10", "item 2", "Item 1", "item 3"],
  );
  assert.match(
    html(DataTable, {
      caption: "Records",
      rowLabel: (r) => r.name,
      columns,
      rows,
      defaultSort: { key: "name", direction: "ascending" },
    }),
    /aria-sort="ascending"[\s\S]*aria-sort="none"/,
  );
});
test("Mortar source inspection never executes submitted markup", () => {
  const markup = html(CodeBlock, { code: "<script>alert(1)</script>" });
  assert.ok(!markup.includes("<script>"));
  assert.match(markup, /&lt;script&gt;/);
});
