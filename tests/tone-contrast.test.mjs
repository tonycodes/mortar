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
// A brand with tinted surfaces (navy in dark) and an accent gradient in each
// appearance. Mortar's text and status colours stay fixed, so these are the
// darkest tints that keep them at 4.5:1: a lighter dark sunken such as
// #16365f drops muted text to 4.2:1 (docs/theming.md, "Surfaces").
const tinted = {
  "m-brand-l-primary": "#1d4ed8",
  "m-brand-l-on-primary": "#ffffff",
  "m-brand-l-paper": "#f8fafc",
  "m-brand-l-surface": "#ffffff",
  "m-brand-l-sunken": "#eef2f7",
  "m-brand-l-accent": "#c2410c",
  "m-brand-l-on-accent": "#ffffff",
  "m-brand-l-accent-gradient": "linear-gradient(90deg, #c2410c, #9a3412)",
  "m-brand-d-primary": "#93c5fd",
  "m-brand-d-on-primary": "#0b1f4d",
  "m-brand-d-paper": "#0b1f3a",
  "m-brand-d-surface": "#102a4c",
  "m-brand-d-sunken": "#143156",
  "m-brand-d-accent": "#fdba74",
  "m-brand-d-on-accent": "#1c1917",
  "m-brand-d-accent-gradient":
    "linear-gradient(to right, #fdba74 0%, #fcd34d 100%)",
};
const themes = {
  "neutral light": resolveTokens({ ...root, ...neutral }),
  "neutral dark": resolveTokens({ ...root, ...dark, ...neutral }),
  "green light": resolveTokens({ ...root, ...green }),
  "green dark": resolveTokens({ ...root, ...dark, ...green }),
  "derived brand light": resolveTokens({ ...root, ...example }),
  "derived brand dark": resolveTokens({ ...root, ...dark, ...example }),
  "tinted gradient brand light": resolveTokens({ ...root, ...tinted }),
  "tinted gradient brand dark": resolveTokens({ ...root, ...dark, ...tinted }),
};

const tones = ["success", "warning", "danger", "info"];
const surfaces = ["paper", "surface", "sunken"];
const text = ["ink", "secondary", "muted", ...tones, "link"];
const pairs = [
  // [foreground, background, minimum]
  ...text.flatMap((fg) => [
    ...surfaces.map((bg) => [fg, bg, 4.5]),
    ...surfaces.map((bg) => [`inv-${fg}`, `inv-${bg}`, 4.5]),
  ]),
  ["on-primary", "primary", 4.5],
  ["on-primary", "primary-hover", 4.5],
  ["on-primary", "primary-active", 4.5],
  ["on-accent", "accent", 4.5],
  ["focus", "paper", 3],
  ["inv-on-primary", "inv-primary", 4.5],
  ["inv-on-primary", "inv-primary-hover", 4.5],
  ["inv-on-primary", "inv-primary-active", 4.5],
  ["inv-on-accent", "inv-accent", 4.5],
  ["inv-focus", "inv-paper", 3],
];

/** The colour stops of a resolved gradient, e.g. the accent fill. */
function gradientStops(value) {
  const inner = value.match(/^[a-z-]*gradient\((.*)\)$/i)?.[1];
  assert.ok(inner, `not a gradient: ${value}`);
  const segments = [];
  let depth = 0;
  let current = "";
  for (const c of inner) {
    if (c === "," && depth === 0) {
      segments.push(current);
      current = "";
      continue;
    }
    if (c === "(") depth++;
    if (c === ")") depth--;
    current += c;
  }
  segments.push(current);
  return segments.flatMap(
    (s) => s.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/gi) ?? [],
  );
}

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

for (const [theme, tokens] of Object.entries(themes))
  test(`on-accent meets 4.5:1 on every stop of the accent fill in ${theme}`, () => {
    const failures = [];
    for (const [fg, fill] of [
      ["on-accent", "accent-fill"],
      ["inv-on-accent", "inv-accent-fill"],
    ]) {
      const stops = gradientStops(tokens[`m-${fill}`]);
      assert.ok(stops.length >= 2, `${fill} has colour stops in ${theme}`);
      for (const stop of stops) {
        const ratio = contrast(tokens[`m-${fg}`], stop);
        if (ratio < 4.5)
          failures.push(`${fg} on ${fill} stop ${stop}: ${ratio.toFixed(2)}`);
      }
    }
    assert.deepEqual(failures, []);
  });

test("the sample brand's gradients and surfaces reach the live tokens", () => {
  const light = themes["tinted gradient brand light"];
  const dark = themes["tinted gradient brand dark"];
  assert.deepEqual(gradientStops(light["m-accent-fill"]), [
    "#c2410c",
    "#9a3412",
  ]);
  assert.deepEqual(gradientStops(light["m-inv-accent-fill"]), [
    "#fdba74",
    "#fcd34d",
  ]);
  assert.equal(dark["m-paper"], "#0b1f3a");
  assert.equal(light["m-inv-paper"], "#0b1f3a");
  assert.equal(dark["m-inv-sunken"], "#eef2f7");
  // Without a gradient the fill is the flat accent.
  assert.deepEqual(gradientStops(themes["green light"]["m-accent-fill"]), [
    "#047857",
    "#047857",
  ]);
  // A gradient with a stop too light for its on-accent text fails the check.
  const failing = resolveTokens({
    ...root,
    ...tinted,
    "m-brand-l-accent-gradient": "linear-gradient(90deg, #c2410c, #ff6a00)",
  });
  assert.ok(
    gradientStops(failing["m-accent-fill"]).some(
      (stop) => contrast(failing["m-on-accent"], stop) < 4.5,
    ),
  );
});
