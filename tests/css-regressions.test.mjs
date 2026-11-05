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
  assert.equal(
    declaration(body, "--m-paper"),
    "var(--m-brand-l-paper, #ffffff)",
  );
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

/** [ids, classes/attributes/pseudos, types] for one complex selector. */
function specificity(selector) {
  let ids = 0;
  let classes = 0;
  let types = 0;
  let i = 0;
  const skipString = () => {
    const quote = selector[i++];
    while (i < selector.length && selector[i] !== quote) {
      if (selector[i] === "\\") i++;
      i++;
    }
    i++;
  };
  const readArgs = () => {
    i++;
    const start = i;
    let depth = 1;
    while (i < selector.length && depth) {
      if (selector[i] === '"' || selector[i] === "'") skipString();
      else if (selector[i] === "(") {
        depth++;
        i++;
      } else if (selector[i] === ")") {
        depth--;
        if (depth) i++;
      } else i++;
    }
    return selector.slice(start, i);
  };
  while (i < selector.length) {
    const ch = selector[i];
    if (" \n\t\r>+~".includes(ch)) {
      i++;
      continue;
    }
    if (ch === "*") {
      i++;
      continue;
    }
    if (ch === "#") {
      ids++;
      i++;
      while (i < selector.length && /[-\w]/.test(selector[i])) i++;
      continue;
    }
    if (ch === ".") {
      classes++;
      i++;
      while (i < selector.length && /[-\w]/.test(selector[i])) i++;
      continue;
    }
    if (ch === "[") {
      classes++;
      i++;
      while (i < selector.length && selector[i] !== "]") {
        if (selector[i] === '"' || selector[i] === "'") skipString();
        else i++;
      }
      i++;
      continue;
    }
    if (ch === ":") {
      const element = selector[i + 1] === ":";
      i += element ? 2 : 1;
      const start = i;
      while (i < selector.length && /[-\w]/.test(selector[i])) i++;
      const name = selector.slice(start, i);
      const inner = selector[i] === "(" ? readArgs() : "";
      if (selector[i] === ")") i++;
      if (element) {
        types++;
        continue;
      }
      if (name === "where") continue;
      if (name === "is" || name === "not" || name === "has") {
        const max = mostSpecific(inner);
        ids += max[0];
        classes += max[1];
        types += max[2];
        continue;
      }
      classes++;
      const of = inner.match(/\bof\s+([\s\S]*)$/i);
      if (of) {
        const max = mostSpecific(of[1]);
        ids += max[0];
        classes += max[1];
        types += max[2];
      }
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      types++;
      while (i < selector.length && /[-\w]/.test(selector[i])) i++;
      continue;
    }
    i++;
  }
  return [ids, classes, types];
}
/** Top-level selectors in a comma-separated list, ignoring commas in groups. */
function selectorList(list) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let j = 0; j < list.length; j++) {
    const ch = list[j];
    if (ch === '"' || ch === "'") {
      j++;
      while (j < list.length && list[j] !== ch) {
        if (list[j] === "\\") j++;
        j++;
      }
    } else if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === "," && depth === 0) {
      parts.push(list.slice(start, j));
      start = j + 1;
    }
  }
  parts.push(list.slice(start));
  return parts;
}
/** Highest specificity among the top-level selectors in a list. */
function mostSpecific(list) {
  return selectorList(list).reduce(
    (best, part) => {
      const spec = specificity(part);
      const delta = spec[0] - best[0] || spec[1] - best[1] || spec[2] - best[2];
      return delta > 0 ? spec : best;
    },
    [0, 0, 0],
  );
}
const outranks = (left, right) =>
  left[0] - right[0] || left[1] - right[1] || left[2] - right[2];

test("pinned selection and hover backgrounds lose to forced-colors highlight", () => {
  // Anchor the calculator: the unwrapped pin rule is what used to beat highlight.
  assert.deepEqual(
    specificity(".m-data-table tr[data-selected] > [data-pin]"),
    [0, 3, 1],
  );
  assert.deepEqual(
    specificity(
      '.m-progress-steps [data-status="current"] .m-progress-step-marker',
    ),
    [0, 3, 0],
  );
  const data = stripComments(sources["src/data.css"]);
  const foundation = stripComments(sources["src/foundation.css"]);
  const pinStates = rules(data).filter(
    ({ selector, body }) =>
      />\s*\[data-pin\]/.test(selector) &&
      /\[data-selected\]|:hover/.test(selector) &&
      /background/.test(body),
  );
  assert.deepEqual(
    pinStates.map(({ selector }) => selector.replace(/\s+/g, " ")),
    [
      ":where(.m-data-table) tr:where([data-linked]):hover > [data-pin]",
      ":where(.m-data-table) tr[data-selected] > [data-pin]",
    ],
  );
  const forced = rules(foundation).find(
    ({ selector, body }) =>
      selector.includes(".m-data-table tr[data-selected] > *") &&
      /background:\s*Highlight/.test(body),
  );
  assert.ok(forced, "forced-colors selection rule");
  const forcedSpec = specificity(
    selectorList(forced.selector).find((part) =>
      part.includes(".m-data-table tr[data-selected]"),
    ),
  );
  // :is() takes its most specific argument, so this list is (0,3,0), not the
  // (0,2,1) of the table selector written inside it.
  assert.deepEqual(forcedSpec, [0, 3, 0]);
  const stripe = rules(data).find(
    ({ selector, body }) =>
      selector.includes("[data-striped]") &&
      />\s*\[data-pin\]/.test(selector) &&
      /background/.test(body),
  );
  const stripeSpec = specificity(stripe.selector);
  assert.deepEqual(stripeSpec, [0, 1, 0]);
  for (const { selector } of pinStates) {
    const spec = specificity(selector);
    // (0,2,1) paints over the stripe and yields to Highlight / HighlightText.
    assert.deepEqual(spec, [0, 2, 1], selector);
    assert.ok(
      outranks(forcedSpec, spec) > 0,
      `${selector} must lose to forced-colors highlight`,
    );
    assert.ok(
      outranks(spec, stripeSpec) > 0,
      `${selector} must beat the pinned stripe`,
    );
  }
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
