import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { brandToStyle } from "../dist/brand.js";
import { NATIVE_SCALES, nativeTheme } from "../dist/native-theme.js";
import {
  KOTLIN_FILE,
  SWIFT_FILE,
  nativeTokenFiles,
} from "../scripts/native-tokens.mjs";
import {
  customProperties,
  readSource,
  resolveTokens,
  selectorBody,
} from "./support/css.mjs";
import { contrast } from "./support/color.mjs";

const css = await readSource("src/tokens.css");
const layer = (selector) => {
  const body = selectorBody(css, selector);
  assert.notEqual(body, "", `missing ${selector}`);
  return customProperties(body);
};
const root = layer(":root");
const dark = layer('[data-mortar-appearance="dark"]');
const neutral = layer('[data-mortar-brand="neutral"]');

/* Each palette colour and the tokens.css property it mirrors. */
const TOKENS = {
  paper: "m-paper",
  surface: "m-surface",
  sunken: "m-sunken",
  line: "m-line",
  lineStrong: "m-line-strong",
  ink: "m-ink",
  secondary: "m-secondary",
  muted: "m-muted",
  success: "m-success",
  warning: "m-warning",
  danger: "m-danger",
  info: "m-info",
  onFeedback: "m-on-feedback",
  primary: "m-primary",
  primaryHover: "m-primary-hover",
  primaryActive: "m-primary-active",
  onPrimary: "m-on-primary",
  accent: "m-accent",
  onAccent: "m-on-accent",
  focus: "m-focus",
  link: "m-link",
  selected: "m-selected",
  codeBackground: "m-code-bg",
  codeInk: "m-code-ink",
  codeDim: "m-code-dim",
};

/* The palette tokens.css gives an appearance under a brand contract, with
   var() fallbacks and color-mix() evaluated as the browser does. */
function cssPalette(mode, contract) {
  const tokens = resolveTokens(
    mode === "light"
      ? { ...root, ...contract }
      : { ...root, ...dark, ...contract },
  );
  return Object.fromEntries(
    Object.entries(TOKENS).map(([key, name]) => [key, tokens[name]]),
  );
}
const contract = (brand) =>
  Object.fromEntries(
    Object.entries(brandToStyle(brand)).map(([name, v]) => [name.slice(2), v]),
  );

test("every palette colour mirrors a tokens.css property", () => {
  assert.deepEqual(
    Object.keys(nativeTheme().light).sort(),
    Object.keys(TOKENS).sort(),
  );
  for (const name of Object.values(TOKENS))
    assert.ok(name in root, `--${name} is in tokens.css`);
});

test("without a brand, the native theme is tokens.css's neutral light and dark", () => {
  const theme = nativeTheme();
  assert.deepEqual(theme.light, cssPalette("light", neutral));
  assert.deepEqual(theme.dark, cssPalette("dark", neutral));
});

test("a brand resolves in both appearances exactly as tokens.css resolves it", () => {
  for (const brand of [
    // Only primaries: every state, tint and link derives.
    {
      light: { primary: "#1d4ed8", onPrimary: "#ffffff" },
      dark: { primary: "#93c5fd", onPrimary: "#0b1f4d" },
    },
    // Only light: dark keeps the defaults but derives as a brand does.
    { light: { primary: "#047857" } },
    // Surfaces, accents and every override.
    {
      light: {
        primary: "#7c3aed",
        primaryHover: "#6d28d9",
        primaryActive: "#5b21b6",
        onPrimary: "#ffffff",
        accent: "#c2410c",
        onAccent: "#ffffff",
        focus: "#2563eb",
        link: "#4c1d95",
        selected: "#f3e8ff",
        paper: "#f8fafc",
        surface: "#ffffff",
        sunken: "#eef2f7",
      },
      dark: {
        primary: "#c4b5fd",
        accent: "#fdba74",
        onAccent: "#1c1917",
        paper: "#0b1f3a",
        surface: "#0d2341",
        sunken: "#0f2848",
      },
    },
  ]) {
    const theme = nativeTheme(brand);
    assert.deepEqual(theme.light, cssPalette("light", contract(brand)));
    assert.deepEqual(theme.dark, cssPalette("dark", contract(brand)));
  }
});

test("dark links default to ink, light links to primary", () => {
  const theme = nativeTheme({
    light: { primary: "#1d4ed8" },
    dark: { primary: "#93c5fd" },
  });
  assert.equal(theme.light.link, "#1d4ed8");
  assert.equal(theme.dark.link, theme.dark.ink);
});

test("modern colour syntax converts to hex, and browser-only syntax is rejected", () => {
  assert.equal(
    nativeTheme({ dark: { primary: "oklch(0.5 0.2 260)" } }).dark.primary,
    "#0559d2",
  );
  for (const value of [
    "var(--brand)",
    "color-mix(in oklab, red 50%, white)",
    "light-dark(#fff, #000)",
    "rgb(0 0 0 / 0.5)",
  ])
    assert.throws(
      () => nativeTheme({ dark: { surface: value } }),
      /Mortar native colours must be literal and opaque, for dark\.surface/,
    );
  // The gradient is not used; accents keep the flat accent.
  const theme = nativeTheme({
    light: {
      accent: "#c2410c",
      accentGradient: "linear-gradient(90deg, #c2410c, #9a3412)",
    },
  });
  assert.equal(theme.light.accent, "#c2410c");
});

test("brand fonts become family names and a generic family", () => {
  const theme = nativeTheme({
    fonts: {
      body: '"Inter", var(--font-inter), system-ui, sans-serif',
      heading: "'Fraunces', Georgia, serif",
    },
  });
  assert.deepEqual(theme.fonts.body, {
    families: ["Inter"],
    generic: "sans-serif",
  });
  assert.deepEqual(theme.fonts.heading, {
    families: ["Fraunces", "Georgia"],
    generic: "serif",
  });
  assert.deepEqual(nativeTheme().fonts.body, {
    families: [],
    generic: "sans-serif",
  });
  assert.deepEqual(
    nativeTheme({ fonts: { body: "Inter" } }).fonts.heading,
    nativeTheme({ fonts: { body: "Inter" } }).fonts.body,
  );
  assert.equal(nativeTheme().fonts.mono.generic, "monospace");
  assert.throws(
    () => nativeTheme({ fonts: { body: "url(x)" } }),
    /Invalid Mortar brand font for fonts\.body/,
  );
});

test("the default palettes keep text and controls readable", () => {
  for (const palette of Object.values(nativeTheme()).slice(0, 2)) {
    for (const text of ["ink", "secondary", "muted", "link"])
      assert.ok(contrast(palette[text], palette.paper) >= 4.5, text);
    assert.ok(contrast(palette.onPrimary, palette.primary) >= 4.5);
    assert.ok(contrast(palette.lineStrong, palette.surface) >= 3);
  }
});

test("native scales are the scales in tokens.css", () => {
  const px = (name, tokens = root) => {
    const m = /^(-?[\d.]+)(px|em)?$/.exec(tokens[name] ?? "");
    assert.ok(m, `--${name} is a plain number`);
    return Number(m[1]);
  };
  const s = NATIVE_SCALES;
  for (const [k, v] of Object.entries(s.space))
    assert.equal(v, px(`m-space-${k}`));
  for (const [k, v] of Object.entries(s.radius))
    assert.equal(v, px(k === "md" ? "m-radius" : `m-radius-${k}`));
  for (const [k, v] of Object.entries(s.weight))
    assert.equal(v, px(`m-weight-${k}`));
  for (const [k, v] of Object.entries(s.tracking))
    assert.equal(
      v,
      root[`m-tracking-${k}`] === "normal" ? 0 : px(`m-tracking-${k}`),
    );
  for (const [k, v] of Object.entries(s.leading))
    assert.equal(v, px(`m-leading-${k}`));
  for (const [density, sizes] of Object.entries(s.density)) {
    const tokens = layer(`[data-mortar-density="${density}"]`);
    for (const [k, v] of Object.entries(sizes))
      assert.equal(
        v,
        px(`m-${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`, tokens),
      );
  }
  assert.equal(s.icon, px("m-icon"));
  assert.equal(s.focusOffset, px("m-focus-offset"));
  const coarse = customProperties(
    css.slice(css.indexOf("@media (pointer: coarse)")),
  );
  assert.equal(s.touchTarget, px("m-touch-target", coarse));
  assert.match(root["m-scrim"], new RegExp(`/ ${s.scrimOpacity}\\)$`));
});

test("the Swift and Kotlin token files are generated from the native theme", async () => {
  for (const [path, text] of Object.entries(await nativeTokenFiles()))
    assert.equal(
      await readSource(path),
      text,
      `${path} is out of date: run npm run native:tokens`,
    );
  const swift = await readSource(SWIFT_FILE);
  assert.match(swift, /paper: 0xFFFFFF,/);
  assert.match(swift, /public static let space4: Double = 16/);
  const kotlin = await readSource(KOTLIN_FILE);
  assert.match(kotlin, /^package codes\.tony\.mortar$/m);
  assert.match(kotlin, /paper = 0xFF000000,/);
  assert.match(kotlin, /public const val weightSemibold: Int = 600/);
});

test("native buttons default to the web Button's variant", async () => {
  const web = /function Button\(\s*\{\s*variant = "(\w+)"/.exec(
    await readSource("src/primitives.tsx"),
  )?.[1];
  assert.equal(web, "primary");
  const swift = await readSource(
    "native/apple/Sources/Mortar/MortarButton.swift",
  );
  const swiftDefaults = [
    ...swift.matchAll(/variant: MortarButtonVariant = \.(\w+)/g),
  ];
  assert.equal(
    swiftDefaults.length,
    3,
    "MortarButtonStyle, .mortar() and MortarButton",
  );
  for (const [, variant] of swiftDefaults) assert.equal(variant, web);
  const kotlin = await readSource(
    "native/android/mortar/src/main/kotlin/codes/tony/mortar/MortarButton.kt",
  );
  assert.equal(
    /variant: MortarButtonVariant = MortarButtonVariant\.(\w+)/.exec(
      kotlin,
    )?.[1],
    "Primary",
  );
});

test("manifests name native components that exist, and every native component has one", async () => {
  const { readdir } = await import("node:fs/promises");
  const sources = async (dir, ext) => {
    const files = (await readdir(new URL(`../${dir}`, import.meta.url))).filter(
      (f) => f.endsWith(ext),
    );
    return (
      await Promise.all(files.map((f) => readSource(`${dir}/${f}`)))
    ).join("\n");
  };
  const swift = await sources("native/apple/Sources/Mortar", ".swift");
  const kotlin = await sources(
    "native/android/mortar/src/main/kotlin/codes/tony/mortar",
    ".kt",
  );
  // Public views and composables named Mortar…, except the theme itself.
  const swiftViews = new Set(
    [...swift.matchAll(/public struct (Mortar\w+)(?:<[^>]*>)?: View\b/g)].map(
      (m) => m[1],
    ),
  );
  const composables = new Set(
    [
      ...kotlin.matchAll(
        /@Composable\n(?:@\w+(?:\([^)]*\))?\n)*public fun (?:<[^>]+> )?(Mortar\w+)\(/g,
      ),
    ].map((m) => m[1]),
  );
  composables.delete("MortarTheme");
  const catalog = JSON.parse(await readSource("catalog.json"));
  const named = catalog.components.filter((c) => c.platforms);
  assert.equal(named.length, 15);
  for (const c of named) {
    assert.ok(
      swiftViews.has(c.platforms.swiftui),
      `${c.export}: ${c.platforms.swiftui} in SwiftUI`,
    );
    assert.ok(
      composables.has(c.platforms.compose),
      `${c.export}: ${c.platforms.compose} in Compose`,
    );
  }
  assert.deepEqual(
    [...swiftViews].sort(),
    [...new Set(named.map((c) => c.platforms.swiftui))].sort(),
    "every public SwiftUI component is named by a manifest",
  );
  assert.deepEqual(
    [...composables].sort(),
    [...new Set(named.map((c) => c.platforms.compose))].sort(),
    "every public composable is named by a manifest",
  );
});

/* The compilers run where they exist; CI sets MORTAR_NATIVE_COMPILE=1 so a
   missing compiler fails there instead of skipping. */
const REQUIRED = process.env.MORTAR_NATIVE_COMPILE === "1";
function compile(t, command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.error?.code === "ENOENT") {
    assert.ok(!REQUIRED, `${command} is not installed`);
    return t.skip(`${command} is not installed`);
  }
  // A Command Line Tools install whose default SDK is newer than its compiler.
  if (
    !REQUIRED &&
    /this SDK is not supported by the compiler/.test(result.stderr)
  )
    return t.skip(`${command} does not match its SDK`);
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

test("the Swift token file compiles in Swift 6 language mode", (t) =>
  compile(t, "swiftc", [
    "-typecheck",
    "-swift-version",
    "6",
    join(process.cwd(), SWIFT_FILE),
  ]));

test("the Kotlin token file compiles", async (t) => {
  const out = await mkdtemp(join(tmpdir(), "mortar-kotlin-"));
  compile(t, "kotlinc", [join(process.cwd(), KOTLIN_FILE), "-d", out]);
});
