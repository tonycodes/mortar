/* Programmatic brands. Mirrors the brand contract in tokens.css, so an app can
   define a brand from a config object, a CMS value or a tenant record without
   shipping brand CSS. Every value is optional; omitted values derive from
   primary exactly as the CSS layer does. */

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
}

/** A brand's light and dark values. Inverse bands use the other appearance's. */
export interface BrandDefinition {
  light?: BrandAppearanceTokens;
  dark?: BrandAppearanceTokens;
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
};

const NAME = /^[a-z0-9][a-z0-9-]*$/i;
// Colour syntax only: hex, named colours and functions such as rgb(), oklch(),
// color-mix() or var(). No ; { } < > quotes or comments, so a value taken from
// tenant data cannot end the declaration or inject other CSS.
const VALUE = /^[#a-z0-9(),.%\s/+-]+$/i;

function assertName(name: string) {
  if (!NAME.test(name))
    throw new Error(
      `Mortar brand names use letters, digits and hyphens: "${name}"`,
    );
}

/** The brand's custom properties, validated, as `--m-brand-*` entries. */
export function brandToStyle(
  brand: BrandDefinition,
): Record<`--m-brand-${string}`, string> {
  const out: Record<`--m-brand-${string}`, string> = {};
  for (const [prefix, tokens] of [
    ["l", brand.light],
    ["d", brand.dark],
  ] as const) {
    if (!tokens) continue;
    for (const key of Object.keys(KEYS) as (keyof BrandAppearanceTokens)[]) {
      const value = tokens[key]?.trim();
      if (!value) continue;
      if (!VALUE.test(value) || value.includes("/*"))
        throw new Error(`Invalid Mortar brand colour for ${key}: "${value}"`);
      out[`--m-brand-${prefix}-${KEYS[key]}`] = value;
    }
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
