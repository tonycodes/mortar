import test from "node:test";
import assert from "node:assert/strict";
import { html, Listbox, Combobox } from "./support/render.mjs";
const options = [
  { value: "wade", label: "Wade Cooper", description: "Engineering" },
  { value: "arlene", label: "Arlene Mccoy" },
];

test("Listbox labels its button and shows the selected option", () => {
  const markup = html(Listbox, {
    label: "Assignee",
    options,
    value: "arlene",
    onChange() {},
  });
  const controlId = markup.match(/<label[^>]*for="([^"]+)"/)?.[1];
  assert.ok(controlId, markup);
  assert.match(
    markup,
    new RegExp(`<button[^>]*id="${controlId}"[^>]*aria-haspopup="listbox"`),
  );
  assert.match(markup, /Arlene Mccoy/);
  assert.doesNotMatch(markup, /aria-invalid/);
});

test("Listbox shows a placeholder and exposes errors on its button", () => {
  const markup = html(Listbox, {
    label: "Assignee",
    options,
    value: null,
    placeholder: "Choose someone",
    error: "Check this value",
    onChange() {},
  });
  assert.match(markup, /m-placeholder">Choose someone</);
  assert.match(markup, /<button[^>]*aria-invalid="true"/);
  assert.match(markup, /<p[^>]*class="m-error"[^>]*>Check this value<\/p>/);
});

test("Combobox renders a labelled combobox input that exposes errors", () => {
  const markup = html(Combobox, {
    label: "Assigned to",
    options,
    value: "wade",
    onChange() {},
    error: "Check this value",
  });
  const controlId = markup.match(/<label[^>]*for="([^"]+)"/)?.[1];
  assert.match(
    markup,
    new RegExp(
      `<input[^>]*aria-invalid="true"[^>]*id="${controlId}"[^>]*role="combobox"`,
    ),
  );
  assert.match(markup, /<p[^>]*class="m-error"[^>]*>Check this value<\/p>/);
});
