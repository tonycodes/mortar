import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button, Notice, EmptyState, Tabs, Pagination } from "../dist/index.js";
const h = React.createElement;
const html = (type, props, ...children) =>
  renderToStaticMarkup(h(type, props, ...children));
const icon = h("svg", { viewBox: "0 0 20 20" });

test("Button keeps its default markup and adds sizes and icons", () => {
  assert.equal(
    html(Button, {}, "Save"),
    '<button type="button" class="m-button m-button-primary ">Save</button>',
  );
  assert.match(html(Button, { size: "sm" }, "Save"), /data-size="sm"/);
  assert.match(
    html(Button, { icon }, "Download"),
    /<span class="m-button-icon" aria-hidden="true"><svg[^>]*><\/svg><\/span>Download/,
  );
  assert.match(
    html(Button, { icon, iconPosition: "end" }, "Next"),
    /Next<span class="m-button-icon" aria-hidden="true">/,
  );
  const only = html(
    Button,
    { icon, iconOnly: true, variant: "ghost" },
    "Settings",
  );
  assert.match(only, /data-icon-only="true"/);
  assert.match(only, /<span class="m-sr-only">Settings<\/span>/);
});

test("Notice keeps its default markup and adds actions and dismiss", () => {
  assert.equal(
    html(Notice, { title: "Saved" }),
    '<div class="m-notice m-tone-neutral"><strong>Saved</strong></div>',
  );
  const full = html(
    Notice,
    {
      title: "Update available",
      tone: "warning",
      actions: h("a", { href: "#notes" }, "Release notes"),
      onDismiss() {},
    },
    "Version 2 is ready.",
  );
  assert.match(
    full,
    /<div class="m-notice-actions"><a href="#notes">Release notes<\/a><\/div>/,
  );
  assert.match(
    full,
    /<button type="button" class="m-notice-dismiss" aria-label="Dismiss Update available">/,
  );
});

test("EmptyState shows a decorative icon only when given one", () => {
  assert.doesNotMatch(
    html(EmptyState, { title: "None", description: "Nothing yet." }),
    /m-empty-icon/,
  );
  assert.match(
    html(EmptyState, { title: "None", description: "Nothing yet.", icon }),
    /^<div class="m-empty"><span class="m-empty-icon" aria-hidden="true"><svg/,
  );
});

test("Tabs show counts and icons inside the tab's accessible name", () => {
  const markup = html(Tabs, {
    label: "Candidates",
    value: "applied",
    onChange() {},
    items: [
      { id: "applied", label: "Applied", count: 6, icon, content: "A" },
      { id: "hired", label: "Hired", content: "B" },
    ],
  });
  assert.match(
    markup,
    /role="tab"[^>]*><span class="m-tab-icon" aria-hidden="true"><svg[^>]*><\/svg><\/span>Applied<span class="m-tab-count">6<\/span><\/button>/,
  );
  assert.match(markup, /role="tab"[^>]*>Hired<\/button>/);
});

test("Pagination keeps Previous/Next and adds numbered pages and a summary", () => {
  const plain = html(Pagination, { page: 2, pageCount: 5, onChange() {} });
  assert.match(plain, /<nav class="m-pagination" aria-label="Pagination">/);
  assert.match(plain, /Page 2 of 5/);
  const numbered = html(Pagination, {
    page: 6,
    pageCount: 12,
    onChange() {},
    numbered: true,
    label: "Results pages",
    summary: { from: 51, to: 60, total: 114, noun: "results" },
  });
  assert.match(numbered, /aria-label="Results pages"/);
  assert.match(
    numbered,
    /Showing <strong>51<\/strong> to <strong>60<\/strong> of <strong>114<\/strong> results/,
  );
  assert.match(
    numbered,
    /<button[^>]*aria-current="page"[^>]*aria-label="Page 6"[^>]*>6<\/button>/,
  );
  for (const n of [1, 5, 7, 12])
    assert.match(numbered, new RegExp(`aria-label="Page ${n}"`));
  assert.doesNotMatch(numbered, /aria-label="Page 3"/);
  assert.equal(numbered.match(/m-pagination-gap/g)?.length, 2);
});
