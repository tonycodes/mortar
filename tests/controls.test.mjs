import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppShell, Input, DataTable, CodeBlock } from "../dist/index.js";
test("Mortar shell supplies page landmarks and labelled navigation", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      AppShell,
      {
        brand: "Example",
        navigation: [{ label: "Overview", href: "#overview", current: true }],
      },
      "Content",
    ),
  );
  assert.match(html, /aria-current="page"/);
  assert.match(html, /<main id="m-content"/);
  assert.match(html, /Skip to content/);
});
test("Mortar fields keep unique labels and external error descriptions", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      React.Fragment,
      {},
      React.createElement(Input, {
        label: "Email",
        error: "Invalid email",
        "aria-describedby": "external",
      }),
      React.createElement(Input, { label: "Name" }),
    ),
  );
  const ids = [...html.matchAll(/<input[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, 2);
  assert.notEqual(ids[0], ids[1]);
  assert.ok(html.includes("external " + ids[0] + "-message"));
  assert.ok(html.includes('for="' + ids[1] + '"'));
});
test("Mortar table separates loading, error and empty states and keeps row headers", () => {
  const props = {
    caption: "Records",
    columns: [{ key: "name", label: "Name", render: (row) => row.name }],
    rowLabel: (row) => row.name,
    rows: [{ id: "1", name: "Example" }],
  };
  const render = (extra) =>
    renderToStaticMarkup(
      React.createElement(DataTable, { ...props, ...extra }),
    );
  assert.match(render({}), /scope="row"/);
  assert.match(render({}), /tabindex="0"/);
  assert.match(render({ rows: [] }), /No records/);
  assert.match(render({ loading: true }), /role="status"/);
  assert.match(render({ error: "Unavailable" }), /role="alert"/);
});
test("Mortar source inspection never executes submitted markup", () => {
  const html = renderToStaticMarkup(
    React.createElement(CodeBlock, { code: "<script>alert(1)</script>" }),
  );
  assert.ok(!html.includes("<script>"));
  assert.match(html, /&lt;script&gt;/);
});
