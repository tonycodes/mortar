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
