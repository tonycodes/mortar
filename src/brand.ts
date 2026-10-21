/* Programmatic brands. Mirrors the brand contract in tokens.css, so an app can
   define a brand from a config object, a CMS value or a tenant record without
   shipping brand CSS. Every value is optional; omitted values derive from
   primary, or keep Mortar's defaults, exactly as the CSS layer does. */

export interface BrandAppearanceTokens {
  primary?: string;
  primaryHover?: string;
  primaryActive?: string;
  onPrimary?: string;
  accent?: string;
  onAccent?: string;
  focus?: string;
  link?: string;
  selected?: string;
  /** The page background. */
  paper?: string;
  /** Cards, panels and raised controls. */
  surface?: string;
  /** Recessed areas: wells, muted bands and hover fills. */
  sunken?: string;
  /**
   * An optional accent fill: `linear-gradient()`, `radial-gradient()` or
   * `conic-gradient()` (or a `repeating-` form) whose stops are colours. Only
   * components that opt in paint it (Button `variant="accent"`, and
   * `tone="accent"` on CallToAction, Hero and Banner), with `onAccent` text,
   * so `onAccent` must reach 4.5:1 against every stop. The flat `accent`
   * stays the fallback and the input for derived colours.
   */
  accentGradient?: string;
}

/** Font stacks, the same in light and dark. */
export interface BrandFonts {
  /** Body text: a font-family list, e.g. `"Inter", sans-serif`. */
  body?: string;
  /** Headings and component titles. Defaults to the body font. */
  heading?: string;
}

/** A brand's light and dark values. Inverse bands use the other appearance's. */
export interface BrandDefinition {
  light?: BrandAppearanceTokens;
  dark?: BrandAppearanceTokens;
  fonts?: BrandFonts;
}

const KEYS: Record<keyof BrandAppearanceTokens, string> = {
  primary: "primary",
  primaryHover: "primary-hover",
  primaryActive: "primary-active",
  onPrimary: "on-primary",
  accent: "accent",
  onAccent: "on-accent",
  focus: "focus",
  link: "link",
  selected: "selected",
  paper: "paper",
  surface: "surface",
  sunken: "sunken",
  accentGradient: "accent-gradient",
};
const FONT_KEYS: Record<keyof BrandFonts, string> = {
  body: "font",
  heading: "font-heading",
};

const NAME = /^[a-z0-9][a-z0-9-]*$/i;

/* Value validation. A value from tenant data must be colour (or gradient, or
   font-family) syntax and nothing else, so it can neither end the declaration
   nor inject other CSS, and a value of the wrong kind throws here instead of
   failing silently in the browser. Values are tokenised, and every function is
   checked against an allowlist, recursively. */
const NAMED = new Set(
  (
    "transparent currentcolor aliceblue antiquewhite aqua aquamarine azure beige bisque black " +
    "blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral " +
    "cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen " +
    "darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon " +
    "darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink " +
    "deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro " +
    "ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo " +
    "ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan " +
    "lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen " +
    "lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen " +
    "magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen " +
    "mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream " +
    "mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid " +
    "palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum " +
    "powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown " +
    "seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen " +
    "steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen"
  ).split(" "),
);
const COLOUR_FUNCTIONS = new Set([
  "rgb",
  "rgba",
  "hsl",
  "hsla",
  "hwb",
  "lab",
  "lch",
  "oklab",
  "oklch",
  "color",
  "color-mix",
  "light-dark",
  "var",
]);
/** Allowed only inside a colour or gradient, e.g. for relative colour channels. */
const MATH_FUNCTIONS = new Set(["calc", "min", "max", "clamp"]);
const GRADIENTS = new Set(
  ["linear-gradient", "radial-gradient", "conic-gradient"].flatMap((name) => [
    name,
    `repeating-${name}`,
  ]),
);

type Fn = { kind: "function"; name: string; args: Node[] };
type Node =
  | Fn
  | {
      kind: "hash" | "ident" | "number" | "comma" | "slash" | "op";
      value: string;
    };

// One token per match: whitespace, #hash, function name with its "(", ident
// (including --custom-property), number with optional unit, ")", ",", "/" or
// an arithmetic operator. Anything else (quotes, ; { } < > comments, bare
// parentheses, backslashes) fails to tokenise.
const TOKEN =
  /(\s+)|(#[0-9a-z]+)|(-{0,2}[a-z_][a-z0-9_-]*)\(|(-{0,2}[a-z_][a-z0-9_-]*)|([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?(?:%|[a-z]+)?)|(\))|(,)|(\/)|([*+-])/giy;

/** The value as a tree of functions and tokens, or undefined if it holds anything else. */
function parse(value: string): Node[] | undefined {
  const root: Node[] = [];
  const open: Fn[] = [];
  TOKEN.lastIndex = 0;
  while (TOKEN.lastIndex < value.length) {
    const at = TOKEN.lastIndex;
    const m = TOKEN.exec(value);
    if (!m || m.index !== at) return undefined;
    const [, space, hash, fn, ident, number, close, comma, slash, op] = m;
    const top = open.length ? open[open.length - 1].args : root;
    if (space) continue;
    if (fn) {
      const node: Fn = { kind: "function", name: fn.toLowerCase(), args: [] };
      top.push(node);
      open.push(node);
    } else if (close) {
      if (!open.pop()) return undefined;
    } else if (hash) top.push({ kind: "hash", value: hash });
    else if (ident) top.push({ kind: "ident", value: ident.toLowerCase() });
    else if (number) top.push({ kind: "number", value: number });
    else if (comma) top.push({ kind: "comma", value: comma });
    else if (slash) top.push({ kind: "slash", value: slash });
    else if (op) top.push({ kind: "op", value: op });
  }
  return open.length ? undefined : root;
}

/** Arguments of an allowed function: plain tokens and allowed functions only. */
function validArgs(fn: Fn): boolean {
  if (fn.name === "var") {
    const [name, next] = fn.args;
    if (name?.kind !== "ident" || !name.value.startsWith("--")) return false;
    if (next && next.kind !== "comma") return false;
  }
  return fn.args.every(
    (node) =>
      node.kind !== "function" ||
      ((COLOUR_FUNCTIONS.has(node.name) || MATH_FUNCTIONS.has(node.name)) &&
        validArgs(node)),
  );
}

function isColourNode(node: Node): boolean {
  if (node.kind === "hash")
    return /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(node.value);
  if (node.kind === "ident") return NAMED.has(node.value);
  return (
    node.kind === "function" &&
    COLOUR_FUNCTIONS.has(node.name) &&
    validArgs(node)
  );
}

/**
 * True for colour syntax only: hex, a colour name (including `transparent`
 * and `currentcolor`), or rgb(), rgba(), hsl(), hsla(), hwb(), lab(), lch(),
 * oklab(), oklch(), color(), color-mix(), light-dark() or var(), whose
 * arguments may nest those functions and calc(), min(), max() or clamp().
 */
export function isBrandColour(value: string): boolean {
  const nodes = parse(value.trim());
  return nodes?.length === 1 && isColourNode(nodes[0]);
}

/**
 * True for a CSS gradient whose stops are colour syntax: linear-, radial- or
 * conic-gradient() (or a repeating- form) with at least two colour stops.
 * Angles, positions, percentages and keywords such as `to right` are allowed;
 * other functions (url(), image-set(), attr() …) are not.
 */
export function isBrandGradient(value: string): boolean {
  const nodes = parse(value.trim());
  if (nodes?.length !== 1) return false;
  const [gradient] = nodes;
  if (gradient.kind !== "function" || !GRADIENTS.has(gradient.name))
    return false;
  if (!validArgs(gradient)) return false;
  const segments: Node[][] = [[]];
  for (const node of gradient.args)
    if (node.kind === "comma") segments.push([]);
    else segments[segments.length - 1].push(node);
  return segments.filter((s) => s.some(isColourNode)).length >= 2;
}

const FAMILY =
  /\s*("[^"]*"|'[^']*'|-?[a-z_][a-z0-9_-]*(?:\s+-?[a-z_][a-z0-9_-]*)*)\s*(,|$)/iy;
/**
 * True for a font-family list: family names, quoted names and generic
 * families, separated by commas. No functions, url() or CSS punctuation.
 */
export function isBrandFont(value: string): boolean {
  const text = value.trim();
  if (!text || /[;{}<>\\()]|\/\*/.test(text)) return false;
  FAMILY.lastIndex = 0;
  let last = "";
  while (FAMILY.lastIndex < text.length) {
    const at = FAMILY.lastIndex;
    const m = FAMILY.exec(text);
    if (!m || m.index !== at) return false;
    last = m[2];
  }
  return last !== ",";
}

function assertName(name: string) {
  if (!NAME.test(name))
    throw new Error(
      `Mortar brand names use letters, digits and hyphens: "${name}"`,
    );
}

const COLOUR_SYNTAX =
  "a hex value, a colour name, or rgb(), hsl(), hwb(), lab(), lch(), oklab(), oklch(), color(), color-mix(), light-dark() or var()";

/** The brand's custom properties, validated, as `--m-brand-*` entries. */
export function brandToStyle(
  brand: BrandDefinition,
): Record<`--m-brand-${string}`, string> {
  const out: Record<`--m-brand-${string}`, string> = {};
  for (const [prefix, mode, tokens] of [
    ["l", "light", brand.light],
    ["d", "dark", brand.dark],
  ] as const) {
    if (!tokens) continue;
    for (const key of Object.keys(KEYS) as (keyof BrandAppearanceTokens)[]) {
      const value = tokens[key]?.trim();
      if (!value) continue;
      if (key === "accentGradient") {
        if (!isBrandGradient(value))
          throw new Error(
            `Invalid Mortar brand gradient for ${mode}.${key}: "${value}". Use linear-gradient(), radial-gradient() or conic-gradient(), or a repeating- form, with at least two colour stops, each ${COLOUR_SYNTAX}.`,
          );
      } else if (!isBrandColour(value))
        throw new Error(
          `Invalid Mortar brand colour for ${mode}.${key}: "${value}". Use ${COLOUR_SYNTAX}.`,
        );
      out[`--m-brand-${prefix}-${KEYS[key]}`] = value;
    }
  }
  for (const key of Object.keys(FONT_KEYS) as (keyof BrandFonts)[]) {
    const value = brand.fonts?.[key]?.trim();
    if (!value) continue;
    if (!isBrandFont(value))
      throw new Error(
        `Invalid Mortar brand font for fonts.${key}: "${value}". Use family names, quoted names and generic families separated by commas, e.g. "Inter", sans-serif.`,
      );
    out[`--m-brand-${FONT_KEYS[key]}`] = value;
  }
  return out;
}

/** The brand as a CSS rule, for a stylesheet or a `<style>` element. */
export function brandToCss(name: string, brand: BrandDefinition): string {
  assertName(name);
  const body = Object.entries(brandToStyle(brand))
    .map(([property, value]) => `  ${property}: ${value};`)
    .join("\n");
  return `[data-mortar-brand="${name}"] {\n${body}\n}`;
}

const registered = new Map<
  string,
  { element: HTMLStyleElement; count: number }
>();
/**
 * Adds the brand's stylesheet to the document, for apps that don't use
 * ThemeProvider's `brandTokens`. Each call returns a disposer; the stylesheet
 * stays until every caller for that name has disposed.
 */
export function registerBrand(
  name: string,
  brand: BrandDefinition,
): () => void {
  const css = brandToCss(name, brand);
  if (typeof document === "undefined") return () => {};
  let entry = registered.get(name);
  if (!entry) {
    const element = document.createElement("style");
    element.dataset.mortarBrandStyle = name;
    document.head.append(element);
    entry = { element, count: 0 };
    registered.set(name, entry);
  }
  entry.element.textContent = css;
  entry.count += 1;
  let disposed = false;
  return () => {
    if (disposed || !entry) return;
    disposed = true;
    entry.count -= 1;
    if (entry.count === 0) {
      entry.element.remove();
      registered.delete(name);
    }
  };
}
