/* Email theme. Email clients cannot read Mortar's stylesheet: Gmail drops CSS
   variables and Outlook for Windows renders with Word. So an email takes its
   colours and fonts as literal values, resolved here from a brand the way
   tokens.css resolves it for the light appearance: omitted values keep
   Mortar's defaults or derive from primary, and derived colours
   (color-mix(in oklab, …)) are computed in JS. tests/email.test.mjs checks
   the defaults against tokens.css. */

import { isBrandFont, type BrandDefinition } from "./brand.js";

/** Literal colours (#rrggbb) and font stacks for an email. */
export interface EmailTheme {
  /** The page behind the message. */
  paper: string;
  /** The message card. */
  surface: string;
  /** Recessed areas such as a one-time code. */
  sunken: string;
  line: string;
  ink: string;
  secondary: string;
  muted: string;
  primary: string;
  onPrimary: string;
  accent: string;
  onAccent: string;
  link: string;
  /** A tint of primary on the paper, for highlighted rows and callouts. */
  selected: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  /** Body font stack, ending in fonts every email client has. */
  font: string;
  /** Heading font stack; the body stack unless the brand sets one. */
  fontHeading: string;
  mono: string;
}

/* The light defaults in tokens.css. */
const DEFAULTS = {
  paper: "#ffffff",
  surface: "#ffffff",
  sunken: "#f5f5f7",
  line: "#e5e5ea",
  ink: "#000000",
  secondary: "#3a3a3c",
  muted: "#6e6e73",
  primary: "#000000",
  onPrimary: "#ffffff",
  success: "#1f7a36",
  warning: "#945700",
  danger: "#c70014",
  info: "#0060c7",
};
/* The neutral brand's tuned selected tint (no brand at all). */
const NEUTRAL_SELECTED = "#f2f2f4";

/* Mortar's system stack, plus the fonts Windows and Android mail apps have. */
const SANS =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", Times, serif';
const MONO = '"SF Mono", Menlo, Consolas, "Courier New", monospace';
const GENERIC: Record<string, string> = {
  "sans-serif": SANS,
  "system-ui": SANS,
  "ui-sans-serif": SANS,
  serif: SERIF,
  "ui-serif": SERIF,
  monospace: MONO,
  "ui-monospace": MONO,
};

/**
 * A brand font list for email: `var()` entries (which email cannot resolve)
 * and generic families are dropped, and a stack every client has is
 * appended, serif or monospace when the brand's generic family is one.
 */
function fontStack(value: string | undefined, key: string): string | undefined {
  const text = value?.trim();
  if (!text) return undefined;
  if (!isBrandFont(text))
    throw new Error(
      `Invalid Mortar brand font for fonts.${key}: "${text}". Use family names, quoted names and generic families separated by commas, e.g. "Inter", sans-serif.`,
    );
  let fallback = SANS;
  const names = text
    .split(",")
    .map((name) => name.trim())
    .filter((name) => {
      if (/^var\(/i.test(name)) return false;
      const generic = GENERIC[name.toLowerCase()];
      if (generic) fallback = generic;
      return !generic;
    });
  return [...names, fallback].join(", ");
}

/* Colour parsing: the opaque colour syntax a brand can resolve without a
   browser. Everything is converted to sRGB and written as #rrggbb. */
type Rgb = [number, number, number];

const linear = (v: number) =>
  v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
const gamma = (v: number) =>
  v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;

function toOklab([r, g, b]: Rgb): Rgb {
  const [lr, lg, lb] = [r, g, b].map(linear);
  const l = Math.cbrt(
    0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb,
  );
  const m = Math.cbrt(
    0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb,
  );
  const s = Math.cbrt(
    0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb,
  );
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
function fromOklab([L, a, b]: Rgb): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map(gamma) as Rgb;
}

/** sRGB channels in 0–1 as #rrggbb, clipped to the sRGB gamut. */
function hex(rgb: Rgb): string {
  return `#${rgb
    .map((v) =>
      Math.round(Math.min(1, Math.max(0, v)) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

/** A number, or a percentage of `whole`. */
function amount(value: string, whole: number): number {
  const n = parseFloat(value);
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)%?$/.test(value) || Number.isNaN(n))
    throw new Error();
  return value.endsWith("%") ? (n / 100) * whole : n;
}
function hue(value: string): number {
  const m = /^([+-]?(?:\d+\.?\d*|\.\d+))(deg|turn|rad)?$/.exec(value);
  if (!m) throw new Error();
  const n = parseFloat(m[1]);
  return m[2] === "turn" ? n * 360 : m[2] === "rad" ? (n * 180) / Math.PI : n;
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  return [0, 8, 4].map(
    (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)),
  ) as Rgb;
}

function parseColour(value: string): Rgb {
  const text = value.trim().toLowerCase();
  if (text === "white") return [1, 1, 1];
  if (text === "black") return [0, 0, 0];
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(text);
  if (short) return short.slice(1).map((d) => parseInt(d + d, 16) / 255) as Rgb;
  const long = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/.exec(text);
  if (long) return long.slice(1).map((d) => parseInt(d, 16) / 255) as Rgb;
  const fn = /^(rgba?|hsla?|oklab|oklch)\(([^()]*)\)$/.exec(text);
  if (!fn) throw new Error();
  const [channels, alpha] = fn[2].split("/");
  const parts = channels.trim().split(/[\s,]+/);
  const extraAlpha = parts.length === 4 ? parts.pop() : undefined;
  const opacity = alpha ?? extraAlpha;
  if (opacity !== undefined && amount(opacity.trim(), 1) !== 1)
    throw new Error();
  if (parts.length !== 3) throw new Error();
  const [x, y, z] = parts;
  switch (fn[1]) {
    case "rgb":
    case "rgba":
      return [x, y, z].map((v) => amount(v, 255) / 255) as Rgb;
    case "hsl":
    case "hsla":
      return hslToRgb(hue(x), amount(y, 100) / 100, amount(z, 100) / 100);
    case "oklab":
      return fromOklab([amount(x, 1), amount(y, 0.4), amount(z, 0.4)]);
    default: {
      const c = amount(y, 0.4),
        h = (hue(z) * Math.PI) / 180;
      return fromOklab([amount(x, 1), c * Math.cos(h), c * Math.sin(h)]);
    }
  }
}

function colour(value: string | undefined, key: string): string | undefined {
  const text = value?.trim();
  if (!text) return undefined;
  try {
    return hex(parseColour(text));
  } catch {
    throw new Error(
      `Mortar email colours must be literal and opaque, for light.${key}: "${text}". Use a hex value, white, black, or rgb(), hsl(), oklab() or oklch().`,
    );
  }
}

/** color-mix(in oklab, a p%, b) as #rrggbb. */
function mix(a: string, b: string, percentA: number): string {
  const t = percentA / 100;
  const [x, y] = [toOklab(parseColour(a)), toOklab(parseColour(b))];
  return hex(fromOklab(x.map((v, i) => v * t + y[i] * (1 - t)) as Rgb));
}

/**
 * The email theme for a brand, in its light appearance: emails render light,
 * since most clients ignore or override a dark one. Without a brand, Mortar's
 * neutral defaults. Brand colours must be literal (`var()`, `color-mix()`
 * and `light-dark()` need a browser) and opaque; the accent gradient is not
 * used, as most clients cannot paint one, so accents use the flat `accent`.
 */
export function emailTheme(brand?: BrandDefinition): EmailTheme {
  const light = brand?.light ?? {};
  const paper = colour(light.paper, "paper") ?? DEFAULTS.paper;
  const primary = colour(light.primary, "primary") ?? DEFAULTS.primary;
  const onPrimary = colour(light.onPrimary, "onPrimary") ?? DEFAULTS.onPrimary;
  const font = fontStack(brand?.fonts?.body, "body") ?? SANS;
  return {
    ...DEFAULTS,
    paper,
    surface: colour(light.surface, "surface") ?? DEFAULTS.surface,
    sunken: colour(light.sunken, "sunken") ?? DEFAULTS.sunken,
    primary,
    onPrimary,
    accent: colour(light.accent, "accent") ?? primary,
    onAccent: colour(light.onAccent, "onAccent") ?? onPrimary,
    link: colour(light.link, "link") ?? primary,
    selected:
      colour(light.selected, "selected") ??
      (brand ? mix(primary, paper, 8) : NEUTRAL_SELECTED),
    font,
    fontHeading: fontStack(brand?.fonts?.heading, "heading") ?? font,
    mono: MONO,
  };
}
