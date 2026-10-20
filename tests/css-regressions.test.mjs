// Regression tests for the CSS-phase fixes: they read the shipped styles, so a
// later edit cannot quietly undo them.
import test from "node:test";
import assert from "node:assert/strict";
import {
  declaration,
  readSource,
  section,
  selectorBody,
  styleFiles,
} from "./support/css.mjs";

// Every stylesheet styles.css imports (tokens first, then the component families).
const files = await styleFiles();
const sources = Object.fromEntries(
  await Promise.all(files.map(async (f) => [f, await readSource(f)])),
);
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");
/** Every `selector { body }` rule, comments removed. */
const rules = (css) =>
  [...stripComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    selector: m[1].trim(),
    body: m[2],
  }));

test("no colour or layout declaration uses !important", () => {
  // Only the reduced-motion reset may force a value, and only for motion.
  for (const [file, css] of Object.entries(sources))
    for (const { selector, body } of rules(css))
      for (const line of body.split(";"))
        if (line.includes("!important"))
          assert.match(
            line.trim(),
            /^(animation|transition)\s*:\s*none\s*!important$/,
            `${file}: ${selector} forces ${line.trim()}`,
          );
});

test("tab panel padding applies only to panels after a Mortar tab list", () => {
  const css = section(sources["src/foundation.css"], "Tabs and TabNav");
  const body = selectorBody(
    css,
    ':where(.m-tabs) ~ [role="tabpanel"]:not([hidden])',
  );
  assert.ok(declaration(body, "padding-top"), "scoped tab panel padding");
  for (const file of files)
    for (const { selector } of rules(sources[file]))
      for (const part of selector.split(","))
        if (part.includes('[role="tabpanel"]'))
          assert.match(
            part,
            /\.m-tabs/,
            `${file}: unscoped tab panel rule ${part.trim()}`,
          );
});

test("table stripes have zero specificity so hover and selection win", () => {
  const css = stripComments(Object.values(sources).join("\n"));
  const stripes = rules(css).filter(({ selector }) =>
    selector.includes("[data-striped]"),
  );
  assert.ok(stripes.length, "a striped rule exists");
  for (const { selector } of stripes)
    assert.match(
      selector,
      /^:where\(/,
      `stripe rule must be wrapped in :where(): ${selector}`,
    );
});

test("forced-colors mode keeps selected and current states visible", () => {
  const css = section(
    sources["src/foundation.css"],
    "Forced colours: selected and current states",
  );
  const start = css.indexOf("@media (forced-colors: active) {\n    :where(");
  assert.ok(start >= 0, "a shared forced-colors block exists");
  const block = css.slice(start, css.indexOf("\n  }\n", start));
  for (const state of [
    'button[aria-pressed="true"]',
    '[role="tab"][aria-selected="true"]',
    '[role="option"][aria-selected="true"]',
  ])
    assert.ok(block.includes(state), `forced colours cover ${state}`);
  assert.match(block, /background:\s*Highlight/);
  assert.match(block, /color:\s*HighlightText/);
});

test("a light container inside a dark document gets the light tokens", () => {
  const css = sources["src/tokens.css"];
  const body = selectorBody(css, '[data-mortar-appearance="light"]');
  assert.equal(declaration(body, "--m-paper"), "#ffffff");
});

test("busy (aria-disabled) buttons look like disabled ones", () => {
  const rule = rules(
    section(sources["src/foundation.css"], "Button and ActionLink"),
  ).find(
    ({ selector }) =>
      selector === '.m-button:is(:disabled, [aria-disabled="true"])',
  );
  assert.ok(rule, "busy buttons share the disabled rule");
  assert.equal(declaration(rule.body, "cursor"), "not-allowed");
});

test("Prose styles stop at nested component roots, not at m- class names", () => {
  // Every component root carries data-m-component, so a utility class such as
  // m-4 inside prose keeps its prose styles.
  const prose = rules(Object.values(sources).join("\n")).filter(
    ({ selector }) => /\.m-prose\s+\S/.test(selector),
  );
  const bounded = prose.filter(({ selector }) => selector.includes(":not("));
  assert.ok(bounded.length >= 10, "expected the prose element rules");
  for (const { selector } of bounded)
    assert.match(
      selector,
      /:not\(\s*\[data-m-component\],\s*\.m-prose \[data-m-component\] \*\s*\)/,
      selector,
    );
  for (const { selector } of prose)
    assert.doesNotMatch(selector, /\[class[\^*]=/, selector);
});

test("component styles read the weight and radius scales, not literals", () => {
  // A retheme of --m-weight-* or --m-radius-* reaches every component only if
  // no component hard-codes a value the scale already names.
  const components = files.filter((f) => f !== "src/tokens.css");
  assert.ok(components.length >= 8, "expected the component family files");
  const found = [];
  for (const file of components) {
    const css = stripComments(sources[file]);
    for (const m of css.matchAll(
      /font-weight\s*:\s*(400|500|600|700)\b|\bfont\s*:\s*(400|500|600|700)\s/g,
    ))
      found.push(`${file}: ${m[0]}`);
    for (const m of css.matchAll(/border-radius\s*:\s*([^;]+);/g))
      for (const part of m[1].trim().split(/\s+/))
        if (/^(2|4|8|12|16|999)px$/.test(part))
          found.push(`${file}: border-radius ${m[1].trim()}`);
  }
  assert.deepEqual(found, []);
});
