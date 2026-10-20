import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { html, h } from "./support/render.mjs";
import { ThemeProvider } from "../dist/index.js";
import { brandToCss, brandToStyle, registerBrand } from "../dist/brand.js";
import { customProperties, readSource, selectorBody } from "./support/css.mjs";

const acme = {
  light: { primary: "#1d4ed8", onPrimary: "#ffffff" },
  dark: { primary: "#93c5fd", primaryHover: "rgb(180 210 255)" },
};

test("a brand definition becomes the --m-brand-* contract", () => {
  assert.deepEqual(brandToStyle(acme), {
    "--m-brand-l-primary": "#1d4ed8",
    "--m-brand-l-on-primary": "#ffffff",
    "--m-brand-d-primary": "#93c5fd",
    "--m-brand-d-primary-hover": "rgb(180 210 255)",
  });
  assert.equal(
    brandToCss("acme", acme),
    '[data-mortar-brand="acme"] {\n  --m-brand-l-primary: #1d4ed8;\n  --m-brand-l-on-primary: #ffffff;\n  --m-brand-d-primary: #93c5fd;\n  --m-brand-d-primary-hover: rgb(180 210 255);\n}',
  );
});

test("brand names and colours from data cannot inject CSS", () => {
  for (const name of ['acme"] body', "a b", "", "-x"])
    assert.throws(() => brandToCss(name, acme), /brand names/);
  for (const value of [
    "red; } body { display: none",
    "red /* x */",
    'url(x)"',
    "<style>",
  ])
    assert.throws(
      () => brandToStyle({ light: { primary: value } }),
      /Invalid Mortar brand colour/,
    );
  // Ordinary colour syntax is accepted.
  for (const value of [
    "#fff",
    "rebeccapurple",
    "oklch(60% 0.15 250)",
    "color-mix(in oklab, #1d4ed8 80%, white)",
    "var(--tenant-primary)",
  ])
    assert.doesNotThrow(() => brandToStyle({ light: { primary: value } }));
});

test("registerBrand is a no-op without a document", () => {
  const dispose = registerBrand("acme", acme);
  assert.equal(typeof dispose, "function");
  dispose();
});

test("ThemeProvider renders a runtime brand as a stylesheet beside its content", () => {
  const markup = html(
    ThemeProvider,
    { brand: "acme", brandTokens: acme, scope: "container" },
    h("p", null, "Hi"),
  );
  // An ordinary, server-rendered element that React updates and removes.
  assert.match(markup, /<style data-mortar-brand-style="acme">/);
  assert.match(markup, /--m-brand-l-primary: #1d4ed8;/);
  assert.match(markup, /data-mortar-brand="acme"/);
  // Without brandTokens nothing extra renders.
  assert.doesNotMatch(
    html(ThemeProvider, { scope: "container" }, h("p", null, "Hi")),
    /<style/,
  );
});

test("the no-JavaScript dark fallback matches the dark appearance exactly", async () => {
  const css = await readSource("src/tokens.css");
  // Compare values, not indentation: the fallback sits inside @media.
  const values = (body) =>
    Object.fromEntries(
      Object.entries(customProperties(body)).map(([name, value]) => [
        name,
        value.replace(/\s+/g, " "),
      ]),
    );
  const dark = values(selectorBody(css, '[data-mortar-appearance="dark"]'));
  const media = css.slice(css.indexOf("@media (prefers-color-scheme: dark)"));
  const fallback = values(media.slice(0, media.indexOf("\n}\n")));
  assert.equal(Object.keys(dark).length, 49);
  assert.deepEqual(fallback, dark);
});

test("the brand helpers ship as their own package entry point", () => {
  const pkg = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );
  assert.deepEqual(pkg.exports["./brand"], {
    types: "./dist/brand.d.ts",
    import: "./dist/brand.js",
  });
});
