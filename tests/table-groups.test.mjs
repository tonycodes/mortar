import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DataTable, Table } from "../dist/index.js";
const h = React.createElement;
const html = (type, props) => renderToStaticMarkup(h(type, props));
const columns = [
  { key: "name", label: "Name" },
  { key: "role", label: "Role" },
];

test("Table without groups keeps its default markup", () => {
  assert.equal(
    html(Table, {
      caption: "People",
      columns,
      rows: [{ name: "Tom Cook", role: "Admin" }],
    }),
    '<div class="m-table" role="region" aria-label="People" tabindex="0"><table><caption class="m-sr-only">People</caption><thead><tr><th scope="col">Name</th><th scope="col">Role</th></tr></thead><tbody><tr><th scope="row">Tom Cook</th><td>Admin</td></tr></tbody></table></div>',
  );
  assert.match(
    html(Table, { caption: "People", columns }),
    /<\/thead><tbody><\/tbody><\/table>/,
  );
});

test("Table groups render one tbody per group with a full-width header row", () => {
  const markup = html(Table, {
    caption: "People",
    columns,
    groups: [
      {
        label: "Edinburgh",
        rows: [{ name: "Lindsay Walton", role: "Member" }],
      },
      { label: "London", rows: [{ name: "Tom Cook", role: "Admin" }] },
    ],
  });
  assert.match(
    markup,
    /<\/thead><tbody><tr class="m-table-group"><th colSpan="2" scope="rowgroup">Edinburgh<\/th><\/tr><tr><th scope="row">Lindsay Walton<\/th><td>Member<\/td><\/tr><\/tbody><tbody><tr class="m-table-group"><th colSpan="2" scope="rowgroup">London<\/th><\/tr>/i,
  );
  assert.equal((markup.match(/<tbody>/g) || []).length, 2);
  const mixed = html(Table, {
    caption: "People",
    columns,
    rows: [{ name: "Unassigned", role: "Guest" }],
    groups: [{ label: "London", rows: [] }],
  });
  assert.match(
    mixed,
    /<tbody><tr><th scope="row">Unassigned<\/th><td>Guest<\/td><\/tr><\/tbody><tbody><tr class="m-table-group">/,
  );
});

const people = [
  { id: "l", name: "Lindsay", office: "Edinburgh" },
  { id: "t", name: "Tom", office: "London" },
  { id: "c", name: "Courtney", office: "Edinburgh" },
  { id: "a", name: "Alex", office: "London" },
];
const dataColumns = [
  { key: "name", label: "Name", render: (r) => r.name, sortable: true },
  { key: "office", label: "Office", render: (r) => r.office },
];
const base = {
  caption: "People",
  columns: dataColumns,
  rows: people,
  rowLabel: (r) => r.name,
};
const names = (markup) =>
  [...markup.matchAll(/<th scope="row">([^<]+)<\/th>/g)].map((m) => m[1]);
const groupLabels = (markup) =>
  [...markup.matchAll(/scope="rowgroup">([^<]+)</g)].map((m) => m[1]);

test("DataTable groupBy keeps first-appearance group order and sorts within groups", () => {
  const props = { ...base, groupBy: (r) => r.office };
  const unsorted = html(DataTable, props);
  assert.deepEqual(groupLabels(unsorted), ["Edinburgh", "London"]);
  assert.deepEqual(names(unsorted), ["Lindsay", "Courtney", "Tom", "Alex"]);
  assert.equal((unsorted.match(/<tbody>/g) || []).length, 2);
  const ascending = html(DataTable, {
    ...props,
    defaultSort: { key: "name", direction: "ascending" },
  });
  assert.deepEqual(groupLabels(ascending), ["Edinburgh", "London"]);
  assert.deepEqual(names(ascending), ["Courtney", "Lindsay", "Alex", "Tom"]);
  const descending = html(DataTable, {
    ...props,
    defaultSort: { key: "name", direction: "descending" },
  });
  assert.deepEqual(groupLabels(descending), ["Edinburgh", "London"]);
  assert.deepEqual(names(descending), ["Lindsay", "Courtney", "Tom", "Alex"]);
});

test("DataTable group headers span the selection column too", () => {
  const markup = html(DataTable, {
    ...base,
    groupBy: (r) => r.office,
    selectedIds: ["t"],
    onSelectionChange: () => {},
  });
  assert.match(
    markup,
    /<tr class="m-table-group"><th colSpan="3" scope="rowgroup">Edinburgh<\/th><\/tr>/i,
  );
  assert.match(markup, /aria-label="Select all rows"/);
  assert.match(markup, /<strong>1 selected<\/strong>/);
});

test("DataTable without groupBy keeps a single tbody", () => {
  const markup = html(DataTable, base);
  assert.equal((markup.match(/<tbody>/g) || []).length, 1);
  assert.doesNotMatch(markup, /m-table-group/);
});
