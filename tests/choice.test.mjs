import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Listbox, Combobox } from "../dist/index.js";
const h = React.createElement;
const options = [
  { value: "wade", label: "Wade Cooper", description: "Engineering" },
  { value: "arlene", label: "Arlene Mccoy" },
];

test("Listbox labels its button and shows the selected option", () => {
  const html = renderToStaticMarkup(
    h(Listbox, {
      label: "Assignee",
      options,
      value: "arlene",
      onChange() {},
    }),
  );
  const controlId = html.match(/<label[^>]*for="([^"]+)"/)?.[1];
  assert.ok(controlId, html);
  assert.match(
    html,
    new RegExp(`<button[^>]*id="${controlId}"[^>]*aria-haspopup="listbox"`),
  );
  assert.match(html, /Arlene Mccoy/);
  assert.doesNotMatch(html, /aria-invalid/);
});

test("Listbox shows a placeholder and exposes errors on its button", () => {
  const html = renderToStaticMarkup(
    h(Listbox, {
      label: "Assignee",
      options,
      value: null,
      placeholder: "Choose someone",
      error: "Check this value",
      onChange() {},
    }),
  );
  assert.match(html, /m-placeholder">Choose someone</);
  assert.match(html, /<button[^>]*aria-invalid="true"/);
  assert.match(html, /<p[^>]*class="m-error"[^>]*>Check this value<\/p>/);
});

test("Combobox renders a labelled combobox input that exposes errors", () => {
  const html = renderToStaticMarkup(
    h(Combobox, {
      label: "Assigned to",
      options,
      value: "wade",
      onChange() {},
      error: "Check this value",
    }),
  );
  const controlId = html.match(/<label[^>]*for="([^"]+)"/)?.[1];
  assert.match(
    html,
    new RegExp(
      `<input[^>]*aria-invalid="true"[^>]*id="${controlId}"[^>]*role="combobox"`,
    ),
  );
  assert.match(html, /<p[^>]*class="m-error"[^>]*>Check this value<\/p>/);
});
