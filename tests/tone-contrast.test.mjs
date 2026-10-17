import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/tokens.css", import.meta.url), "utf8");
const block = (selector) => {
  const start = css.indexOf(`${selector} {`);
  assert.ok(start >= 0, `missing ${selector}`);
  const body = css.slice(start, css.indexOf("\n}", start));
  return Object.fromEntries(
    [...body.matchAll(/--(m-[a-z-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [
      m[1],
      m[2],
    ]),
  );
};
const light = block(":root");
const dark = { ...light, ...block('[data-mortar-appearance="dark"]') };
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const tones = ["success", "warning", "danger", "info"];

for (const [mode, tokens] of [
  ["light", light],
  ["dark", dark],
])
  test(`status tones meet 4.5:1 on every ${mode} background, including inverse bands`, () => {
    const failures = [];
    for (const tone of tones) {
      for (const bg of ["paper", "surface", "sunken"]) {
        const fg = tokens[`m-${tone}`];
        assert.ok(fg, `--m-${tone} is defined in ${mode}`);
        const ratio = contrast(fg, tokens[`m-${bg}`]);
        if (ratio < 4.5) failures.push(`${tone} on ${bg}: ${ratio.toFixed(2)}`);
      }
      for (const bg of ["inv-paper", "inv-surface"]) {
        const fg = tokens[`m-inv-${tone}`];
        assert.ok(fg, `--m-inv-${tone} is defined in ${mode}`);
        const ratio = contrast(fg, tokens[`m-${bg}`]);
        if (ratio < 4.5)
          failures.push(`inverse ${tone} on ${bg}: ${ratio.toFixed(2)}`);
      }
    }
    assert.deepEqual(failures, []);
  });
