/* Native theme. SwiftUI and Jetpack Compose cannot read Mortar's stylesheet,
   so a native app takes its colours as literal values, resolved here from a
   brand for both appearances the way tokens.css resolves them: omitted values
   keep Mortar's defaults or derive from primary, and derived colours
   (color-mix(in oklab, …)) are computed in JS. scripts/native-tokens.mjs
   writes the defaults and scales into the Swift and Kotlin token files, and
   tests/native.test.mjs checks them against tokens.css. */

import {
  isBrandFont,
  type BrandAppearanceTokens,
  type BrandDefinition,
} from "./brand.js";
import { hex, mix, parseColour } from "./colour.js";

/** One appearance's colours, as #rrggbb. */
export interface NativePalette {
  /** The page background. */
  paper: string;
  /** Cards, panels and raised controls. */
  surface: string;
  /** Recessed areas: wells, muted bands and hover fills. */
  sunken: string;
  line: string;
  /** Control borders and other lines that must reach 3:1. */
  lineStrong: string;
  ink: string;
  secondary: string;
  muted: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  /** Text on a filled status colour. */
  onFeedback: string;
  primary: string;
  /** Pressed-and-held and pointer hover. */
  primaryHover: string;
  /** Pressed. */
  primaryActive: string;
  onPrimary: string;
  accent: string;
  onAccent: string;
  focus: string;
  link: string;
  /** A tint of primary on the paper, for selected rows and items. */
  selected: string;
  codeBackground: string;
  codeInk: string;
  codeDim: string;
}

/** A brand font: its family names, then the generic family to fall back to. */
export interface NativeFont {
  /** Family names in order of preference; empty for the system font. */
  families: string[];
  generic: "sans-serif" | "serif" | "monospace";
}

/** Literal colours for both appearances, and fonts, for a native app. */
export interface NativeTheme {
  light: NativePalette;
  dark: NativePalette;
  fonts: { body: NativeFont; heading: NativeFont; mono: NativeFont };
}

/* The appearance defaults in tokens.css. */
const LIGHT = {
  paper: "#ffffff",
  surface: "#ffffff",
  sunken: "#f5f5f7",
  line: "#e5e5ea",
  lineStrong: "#8b8b90",
  ink: "#000000",
  secondary: "#3a3a3c",
  muted: "#6e6e73",
  success: "#1f7a36",
  warning: "#945700",
  danger: "#c70014",
  info: "#0060c7",
  onFeedback: "#ffffff",
  primary: "#000000",
  onPrimary: "#ffffff",
  codeBackground: "#000000",
  codeInk: "#f5f5f7",
  codeDim: "#8b8b90",
};
const DARK: typeof LIGHT = {
  paper: "#000000",
  surface: "#0e0e10",
  sunken: "#1c1c1e",
  line: "#29292c",
  lineStrong: "#727278",
  ink: "#f5f5f7",
  secondary: "#c7c7cc",
  muted: "#98989d",
  success: "#30d158",
  warning: "#ffd60a",
  danger: "#ff6961",
  info: "#5aa9ff",
  onFeedback: "#000000",
  primary: "#ffffff",
  onPrimary: "#000000",
  codeBackground: "#0e0e10",
  codeInk: "#f5f5f7",
  codeDim: "#8b8b90",
};
/* The neutral brand's tuned interaction states (no brand at all). */
const NEUTRAL = {
  light: {
    primaryHover: "#29292c",
    primaryActive: "#3a3a3c",
    selected: "#f2f2f4",
  },
  dark: {
    primaryHover: "#e5e5ea",
    primaryActive: "#c7c7cc",
    selected: "#1c1c1e",
  },
};

type Mode = "light" | "dark";

function colour(
  value: string | undefined,
  mode: Mode,
  key: string,
): string | undefined {
  const text = value?.trim();
  if (!text) return undefined;
  try {
    return hex(parseColour(text));
  } catch {
    throw new Error(
      `Mortar native colours must be literal and opaque, for ${mode}.${key}: "${text}". Use a hex value, white, black, or rgb(), hsl(), oklab() or oklch().`,
    );
  }
}

function palette(
  tokens: BrandAppearanceTokens | undefined,
  mode: Mode,
  branded: boolean,
): NativePalette {
  const base = mode === "light" ? LIGHT : DARK;
  const own = (key: keyof BrandAppearanceTokens) =>
    colour(tokens?.[key], mode, key);
  const paper = own("paper") ?? base.paper;
  const primary = own("primary") ?? base.primary;
  const onPrimary = own("onPrimary") ?? base.onPrimary;
  const ink = own("ink") ?? base.ink;
  const neutral = NEUTRAL[mode];
  return {
    ...base,
    paper,
    surface: own("surface") ?? base.surface,
    sunken: own("sunken") ?? base.sunken,
    ink,
    secondary: own("secondary") ?? base.secondary,
    muted: own("muted") ?? base.muted,
    line: own("line") ?? base.line,
    lineStrong: own("lineStrong") ?? base.lineStrong,
    primary,
    primaryHover:
      own("primaryHover") ??
      (branded ? mix(primary, ink, 85) : neutral.primaryHover),
    primaryActive:
      own("primaryActive") ??
      (branded ? mix(primary, ink, 72) : neutral.primaryActive),
    onPrimary,
    accent: own("accent") ?? primary,
    onAccent: own("onAccent") ?? onPrimary,
    focus: own("focus") ?? primary,
    // Dark links default to ink: a dark primary is often too pale for text.
    link: own("link") ?? (mode === "light" ? primary : ink),
    selected:
      own("selected") ??
      (branded
        ? mix(primary, paper, mode === "light" ? 8 : 10)
        : neutral.selected),
  };
}

const GENERIC: Record<string, NativeFont["generic"]> = {
  "sans-serif": "sans-serif",
  "system-ui": "sans-serif",
  "ui-sans-serif": "sans-serif",
  serif: "serif",
  "ui-serif": "serif",
  monospace: "monospace",
  "ui-monospace": "monospace",
};

/**
 * A brand font list as family names and a generic family. `var()` entries
 * (which only a browser resolves) and the web's system aliases are dropped;
 * the app bundles or registers the named families itself.
 */
function font(value: string | undefined, key: string): NativeFont | undefined {
  const text = value?.trim();
  if (!text) return undefined;
  if (!isBrandFont(text))
    throw new Error(
      `Invalid Mortar brand font for fonts.${key}: "${text}". Use family names, quoted names and generic families separated by commas, e.g. "Inter", sans-serif.`,
    );
  let generic: NativeFont["generic"] = "sans-serif";
  const families: string[] = [];
  for (const entry of text.split(",")) {
    const name = entry.trim().replace(/^(["'])(.*)\1$/, "$2");
    const kind = GENERIC[name.toLowerCase()];
    if (kind) generic = kind;
    else if (!/^var\(/i.test(name) && !/^-apple-system$/i.test(name))
      families.push(name);
  }
  return { families, generic };
}

const SYSTEM: NativeFont = { families: [], generic: "sans-serif" };
const SYSTEM_MONO: NativeFont = { families: [], generic: "monospace" };

/**
 * The native theme for a brand: literal light and dark colours and its fonts.
 * Without a brand, Mortar's neutral defaults, the values in the generated
 * Swift and Kotlin token files. Brand colours must be literal (`var()`,
 * `color-mix()` and `light-dark()` need a browser) and opaque; the accent
 * gradient is not used, so accents use the flat `accent`.
 */
export function nativeTheme(brand?: BrandDefinition): NativeTheme {
  const body = font(brand?.fonts?.body, "body") ?? SYSTEM;
  return {
    light: palette(brand?.light, "light", Boolean(brand)),
    dark: palette(brand?.dark, "dark", Boolean(brand)),
    fonts: {
      body,
      heading: font(brand?.fonts?.heading, "heading") ?? body,
      mono: SYSTEM_MONO,
    },
  };
}

/** Appearance-independent scales from tokens.css, in points (dp on Android). */
export const NATIVE_SCALES = {
  space: { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32, 10: 40, 12: 48 },
  radius: { xs: 2, sm: 4, md: 8, lg: 12, xl: 16, full: 999 },
  weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
  /** Letter spacing, in em. */
  tracking: { display: -0.04, heading: -0.02, body: 0, caps: 0.04 },
  /** Line height, as a multiple of the font size. */
  leading: { display: 1.1, heading: 1.3, body: 1.6 },
  /** Control height, padding, font size and row padding per density. */
  density: {
    compact: { control: 30, pad: 10, fontSize: 13, rowPad: 10 },
    comfortable: { control: 36, pad: 14, fontSize: 14, rowPad: 14 },
    spacious: { control: 44, pad: 18, fontSize: 15, rowPad: 18 },
  },
  icon: 16,
  focusOffset: 3,
  /** The minimum hit size on touch screens. */
  touchTarget: 44,
  /** The opacity of the black scrim behind sheets and dialogs. */
  scrimOpacity: 0.5,
} as const;
