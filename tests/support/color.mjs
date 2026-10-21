// WCAG 2.x relative luminance and contrast ratio, shared by every suite.
// Accepts #rgb, #rrggbb, rgb() and rgba() strings (alpha is ignored).

/** [r, g, b] in 0–255 from a hex or rgb() colour. */
export function channels(color) {
  const value = color.trim();
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const digits =
      hex[1].length === 3 ? [...hex[1]].map((d) => d + d) : hex[1].match(/../g);
    return digits.map((d) => parseInt(d, 16));
  }
  const rgb = value.match(/^rgba?\(([^)]+)\)$/i);
  if (rgb)
    return rgb[1]
      .match(/[\d.]+/g)
      .slice(0, 3)
      .map(Number);
  throw Error(`Unsupported colour: ${color}`);
}

export function luminance(color) {
  const [r, g, b] = channels(color)
    .map((n) => n / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Oklab conversion, so tests can evaluate the color-mix(in oklab, …) fallbacks
// in tokens.css and check contrast on derived states as the browser renders.
const linear = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const gamma = (v) =>
  Math.min(
    1,
    Math.max(0, v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055),
  );
function toOklab(color) {
  const [r, g, b] = channels(color).map((n) => linear(n / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
function fromOklab([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return `#${[
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
    .map((v) =>
      Math.round(gamma(v) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}
/** color-mix(in oklab, a p%, b) as a hex colour. */
export function mixOklab(a, b, percentA) {
  const t = percentA / 100;
  const [x, y] = [toOklab(a), toOklab(b)];
  return fromOklab(x.map((v, i) => v * t + y[i] * (1 - t)));
}

/** The accent hover wash: the text colour with its oklab lightness flipped to
    0 or 1, as oklch(from on-accent round(1 - l, 1) 0 0) does in CSS. */
export function accentWash(onAccent) {
  return toOklab(onAccent)[0] < 0.5 ? "#ffffff" : "#000000";
}
/** `over` at `alpha` composited onto `base`, as the browser paints a
    semi-transparent gradient layer over the fill (sRGB, gamma-encoded). */
export function composite(base, over, alpha) {
  const [b, o] = [channels(base), channels(over)];
  return `#${b
    .map((v, i) => Math.round(v * (1 - alpha) + o[i] * alpha))
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("")}`;
}
