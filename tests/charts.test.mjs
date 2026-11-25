// Charts: the shared scale and path helpers, the series palette tokens,
// Sparkline and MetricGroup's sparkline. Rendering uses the built package.
import test from "node:test";
import assert from "node:assert/strict";
import { html, UI } from "./support/render.mjs";
import { readSource, selectorBody, customProperties } from "./support/css.mjs";
import {
  areaPath,
  extent,
  linearScale,
  linePath,
  niceTicks,
} from "../dist/chart-core.js";
import { sparklineSummary } from "../dist/sparkline.js";
import * as Charts from "../dist/charts.js";

// The palette validated with the data-viz checks against Mortar's surfaces
// (#ffffff light, #0e0e10 dark): colour-blind separation, lightness band,
// chroma floor and normal-vision floor. Changing a value means re-validating.
const LIGHT = [
  "#2a78d6",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#008300",
  "#6250d6",
  "#e34948",
];
const DARK = [
  "#3987e5",
  "#d95926",
  "#199e70",
  "#c98500",
  "#d55181",
  "#0ca30c",
  "#9085e9",
  "#e66767",
];

const series = (props) =>
  Object.entries(props)
    .filter(([name]) => name.startsWith("m-chart-"))
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([, value]) => value);

test("extent and linear scales", () => {
  assert.deepEqual(extent([3, Number.NaN, -2, 8]), [-2, 8]);
  assert.deepEqual(extent([]), [0, 0]);
  const y = linearScale([0, 10], [100, 0]);
  assert.equal(y(0), 100);
  assert.equal(y(5), 50);
  // A flat domain sits in the middle instead of dividing by zero.
  assert.equal(linearScale([4, 4], [0, 100])(4), 50);
});

test("nice ticks step by 1, 2 or 5 and cover the extent", () => {
  assert.deepEqual(niceTicks([0, 100]), [0, 20, 40, 60, 80, 100]);
  assert.deepEqual(niceTicks([0.1, 0.9], 4), [0, 0.2, 0.4, 0.6, 0.8, 1]);
  assert.deepEqual(niceTicks([7, 7]), [7]);
});

test("paths break at missing values and areas close to the baseline", () => {
  const points = [
    { x: 0, y: 10 },
    { x: 10, y: 20 },
    { x: 20, y: Number.NaN },
    { x: 30, y: 5 },
  ];
  assert.equal(linePath(points), "M0 10L10 20M30 5");
  assert.equal(areaPath(points.slice(0, 2), 100), "M0 10L10 20L10 100L0 100Z");
  assert.equal(areaPath([{ x: 0, y: 1 }], 100), "");
});

test("the series tokens are the validated palette in light, dark and system dark", async () => {
  const css = await readSource("src/tokens.css");
  const light = customProperties(
    selectorBody(css, '[data-mortar-appearance="light"]'),
  );
  const dark = customProperties(
    selectorBody(css, '[data-mortar-appearance="dark"]'),
  );
  const media = css.slice(css.indexOf("@media (prefers-color-scheme: dark)"));
  const system = customProperties(media.slice(0, media.indexOf("\n}\n")));
  assert.deepEqual(series(light), LIGHT);
  assert.deepEqual(series(dark), DARK);
  assert.deepEqual(series(system), DARK);
  // Status colours stay reserved: no series slot reuses one.
  for (const [props, palette] of [
    [light, LIGHT],
    [dark, DARK],
  ])
    for (const status of ["m-success", "m-warning", "m-danger", "m-info"]) {
      assert.ok(props[status], `${status} is defined`);
      assert.ok(
        !palette.includes(props[status]),
        `${status} is a series colour`,
      );
    }
});

test("chart styles colour series from the chart tokens, never status tokens", async () => {
  const css = await readSource("src/charts.css");
  assert.doesNotMatch(css, /--m-(success|warning|danger|info)\b/);
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i);
});

test("the sparkline summary names the count, range and latest value", () => {
  const money = (n) => `$${n}k`;
  assert.equal(
    sparklineSummary([42, Number.NaN, 61, 58], "Revenue", money),
    "Revenue: 3 values from $42k to $61k, latest $58k",
  );
  assert.equal(sparklineSummary([7], "Users"), "Users: 7");
  assert.equal(sparklineSummary([], "Users"), "Users: no data");
});

test("Sparkline renders a named image with a broken line at missing values", () => {
  const markup = html(Charts.Sparkline, {
    label: "Sign-ups",
    values: [1, 2, Number.NaN, 4],
    slot: 3,
  });
  assert.match(
    markup,
    /^<span[^>]* role="img" aria-label="Sign-ups: 3 values from 1 to 4, latest 4"/,
  );
  assert.match(markup, /--m-sparkline-colour:var\(--m-chart-3\)/);
  const d = markup.match(/class="m-sparkline-line" d="([^"]+)"/)[1];
  assert.equal((d.match(/M/g) ?? []).length, 2, "the gap starts a new segment");
  assert.match(markup, /class="m-sparkline-last"/);
  assert.doesNotMatch(
    html(Charts.Sparkline, { label: "x", values: [1, 2], showLast: false }),
    /m-sparkline-last/,
  );
});

test("MetricGroup draws a sparkline only for items that have values", () => {
  const markup = html(UI.MetricGroup, {
    label: "Summary",
    items: [
      { label: "Requests", value: "1.4M", sparkline: [1, 2, 3] },
      { label: "Latency", value: "184ms" },
    ],
  });
  assert.equal(markup.match(/data-m-component="Sparkline"/g)?.length, 1);
  assert.match(
    markup,
    /aria-label="Requests, recent values: 3 values from 1 to 3, latest 3"/,
  );
});
