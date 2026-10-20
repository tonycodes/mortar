import test from "node:test";
import assert from "node:assert/strict";
import { contrast } from "./support/color.mjs";
import {
  selectorBody,
  customProperties,
  readSource,
  resolveTokens,
} from "./support/css.mjs";

const css = await readSource("src/tokens.css");
const layer = (selector) => {
  const body = selectorBody(css, selector);
  assert.notEqual(body, "", `missing ${selector}`);
  return customProperties(body);
};
// A brand declares only --m-brand-*; each appearance resolves them through
// var() fallbacks and color-mix, evaluated here as the browser does.
const root = layer(":root");
const dark = layer('[data-mortar-appearance="dark"]');
const neutral = layer('[data-mortar-brand="neutral"]');
const green = layer('[data-mortar-brand="green"]');
// A consumer brand that declares only its primary colours, so every
// interaction state below is derived.
const example = {
  "m-brand-l-primary": "#1d4ed8",
  "m-brand-l-on-primary": "#ffffff",
  "m-brand-d-primary": "#93c5fd",
  "m-brand-d-on-primary": "#0b1f4d",
};
const themes = {
  "neutral light": resolveTokens({ ...root, ...neutral }),
  "neutral dark": resolveTokens({ ...root, ...dark, ...neutral }),
  "green light": resolveTokens({ ...root, ...green }),
  "green dark": resolveTokens({ ...root, ...dark, ...green }),
  "derived brand light": resolveTokens({ ...root, ...example }),
  "derived brand dark": resolveTokens({ ...root, ...dark, ...example }),
};

const tones = ["success", "warning", "danger", "info"];
const pairs = [
  // [foreground, background, minimum]
  ...tones.flatMap((tone) => [
    ...["paper", "surface", "sunken"].map((bg) => [tone, bg, 4.5]),
    ...["inv-paper", "inv-surface"].map((bg) => [`inv-${tone}`, bg, 4.5]),
  ]),
  ["on-primary", "primary", 4.5],
  ["on-primary", "primary-hover", 4.5],
  ["on-primary", "primary-active", 4.5],
  ["on-accent", "accent", 4.5],
  ["link", "paper", 4.5],
  ["link", "surface", 4.5],
  ["focus", "paper", 3],
  ["inv-on-primary", "inv-primary", 4.5],
  ["inv-on-primary", "inv-primary-hover", 4.5],
  ["inv-on-primary", "inv-primary-active", 4.5],
  ["inv-on-accent", "inv-accent", 4.5],
  ["inv-link", "inv-paper", 4.5],
  ["inv-link", "inv-surface", 4.5],
  ["inv-focus", "inv-paper", 3],
];

for (const [theme, tokens] of Object.entries(themes))
  test(`status, brand and inverse tokens meet contrast minimums in ${theme}`, () => {
    const failures = [];
    for (const [fg, bg, minimum] of pairs) {
      assert.ok(tokens[`m-${fg}`], `--m-${fg} is defined in ${theme}`);
      assert.ok(tokens[`m-${bg}`], `--m-${bg} is defined in ${theme}`);
      const ratio = contrast(tokens[`m-${fg}`], tokens[`m-${bg}`]);
      if (ratio < minimum)
        failures.push(`${fg} on ${bg}: ${ratio.toFixed(2)} < ${minimum}`);
    }
    assert.deepEqual(failures, []);
  });
