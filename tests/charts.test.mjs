// Charts: the shared scale and path helpers, the series palette tokens,
// Sparkline and MetricGroup's sparkline. Rendering uses the built package.
import test from "node:test";
import assert from "node:assert/strict";
import { html, UI } from "./support/render.mjs";
import { readSource, selectorBody, customProperties } from "./support/css.mjs";
import {
  areaPath,
  bandPath,
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

const months = [
  { m: "Jan", a: 10, b: 5 },
  { m: "Feb", a: 20, b: 10 },
  { m: "Mar", a: 30, b: 15 },
];
const two = [
  { key: "a", label: "Alpha" },
  { key: "b", label: "Beta" },
];

test("a chart is a named figure with a legend for two or more series", () => {
  const markup = html(Charts.LineChart, {
    title: "Revenue",
    description: "By plan",
    rows: months,
    x: { key: "m" },
    series: two,
  });
  assert.match(
    markup,
    /^<figure data-m-component="LineChart"[^>]* aria-labelledby="([^"]+)"/,
  );
  assert.match(markup, /<ul class="m-chart-legend" aria-label="Legend">/);
  assert.match(markup, /aria-roledescription="chart"/);
  assert.match(markup, />Show data</);
  // One series: the title names it, so no legend.
  assert.doesNotMatch(
    html(Charts.LineChart, {
      title: "R",
      rows: months,
      x: { key: "m" },
      series: two.slice(0, 1),
    }),
    /m-chart-legend/,
  );
});

test("charts draw at most eight series and never reuse a colour", () => {
  const nine = Array.from({ length: 9 }, (_, i) => ({
    key: `s${i}`,
    label: `S${i}`,
  }));
  const rows = [
    Object.fromEntries([["m", "Jan"], ...nine.map((s) => [s.key, 1])]),
  ];
  const markup = html(Charts.LineChart, {
    title: "R",
    rows,
    x: { key: "m" },
    series: nine,
  });
  const slots = [...markup.matchAll(/--m-series:var\(--m-chart-(\d)\)/g)].map(
    (m) => m[1],
  );
  assert.ok(slots.length > 0);
  assert.ok(slots.every((slot) => Number(slot) <= 8));
  assert.doesNotMatch(
    markup,
    />S8</,
    "the ninth series is not drawn or listed",
  );
});

test("stacked areas top out at the running total", () => {
  const markup = html(Charts.AreaChart, {
    title: "R",
    rows: months,
    x: { key: "m" },
    series: two,
    y: { min: 0, max: 45 },
  });
  // Two layers, each with an area and a line.
  assert.equal(markup.match(/class="m-chart-area"/g)?.length, 2);
  assert.equal(markup.match(/class="m-chart-line"/g)?.length, 2);
});

test("bars round only their data end, and only the top of a stack", () => {
  const grouped = html(Charts.BarChart, {
    title: "R",
    rows: months,
    x: { key: "m" },
    series: two,
  });
  const stacked = html(Charts.BarChart, {
    title: "R",
    rows: months,
    x: { key: "m" },
    series: two,
    layout: "stacked",
  });
  const curved = (markup) =>
    [...markup.matchAll(/class="m-chart-bar"[^>]* d="([^"]+)"/g)].map((m) =>
      m[1].includes("Q"),
    );
  assert.ok(
    curved(grouped).every(Boolean),
    "every grouped bar has a rounded end",
  );
  const s = curved(stacked);
  assert.equal(s.length, 6);
  assert.equal(s.filter(Boolean).length, 3, "one rounded top per stack");
});

test("ticks always reach past the largest value", () => {
  const ticks = niceTicks([0, 111], 5);
  assert.ok(ticks.at(-1) >= 111, `top tick ${ticks.at(-1)} is below the data`);
  assert.deepEqual(niceTicks([0, 100]).at(-1), 100);
});

test("a stacked band runs along its top edge and back along the layer below", () => {
  const upper = [
    { x: 0, y: 10 },
    { x: 10, y: 5 },
  ];
  const lower = [
    { x: 0, y: 20 },
    { x: 10, y: 15 },
  ];
  assert.equal(bandPath(upper, lower), "M0 10L10 5L10 15L0 20Z");
});

test("ticks terminate for inverted, non-finite and extreme domains", () => {
  // y.min above every value inverted the domain and looped forever.
  for (const domain of [
    [0, -3],
    [100, 40],
    [Number.NaN, 5],
    [1e17, 1e17 + 16],
  ]) {
    const ticks = niceTicks(domain);
    assert.ok(
      ticks.length >= 1 && ticks.length <= 50,
      `${domain}: ${ticks.length} ticks`,
    );
    assert.ok(ticks.every(Number.isFinite), `${domain}: finite ticks`);
  }
});

test("a flat domain keeps missing values missing", () => {
  const scale = linearScale([5, 5], [0, 100]);
  assert.equal(scale(5), 50);
  assert.ok(Number.isNaN(scale(Number.NaN)));
  assert.equal(
    linePath(
      [0, 1, 2].map((i) => ({ x: i * 50, y: scale([5, Number.NaN, 5][i]) })),
    ),
    "M0 50M100 50",
  );
});

test("an area breaks at a missing value instead of bridging it", () => {
  const points = [
    { x: 0, y: 10 },
    { x: 10, y: 20 },
    { x: 20, y: Number.NaN },
    { x: 30, y: 5 },
    { x: 40, y: 8 },
  ];
  const d = areaPath(points, 100);
  assert.equal(d.match(/Z/g)?.length, 2, d);
  assert.ok(!d.includes("L10 20L30 5"), `bridged the gap: ${d}`);
});

test("MetricGroup's span rule skips sparklines without raising its specificity", async () => {
  // :not() added a class to the specificity, so the rule beat
  // .m-metrics .m-metric-previous and changed the "from …" font.
  const css = await readSource("src/application.css");
  const selectors = [...css.matchAll(/^\s*(\.m-metrics span[^{]*)\{/gm)].map(
    (m) => m[1].trim(),
  );
  assert.ok(selectors.length, "the rule exists");
  for (const s of selectors)
    assert.doesNotMatch(s, /^\.m-metrics span:not\(/, s);
});
