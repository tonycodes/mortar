// Scales and path builders shared by Mortar's charts. Internal: the charts
// entry and MetricGroup use it; nothing here is exported from a package entry.

export type Extent = readonly [number, number];

/** Smallest and largest finite value; [0, 0] when there are none. */
export function extent(values: readonly number[]): Extent {
  let min = Infinity;
  let max = -Infinity;
  for (const v of values)
    if (Number.isFinite(v)) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
  return min === Infinity ? [0, 0] : [min, max];
}

/** Maps a domain onto a range linearly. A flat domain maps to the range's middle. */
export function linearScale(domain: Extent, range: Extent) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  return (value: number) =>
    span === 0 ? (r0 + r1) / 2 : r0 + ((value - d0) / span) * (r1 - r0);
}

/** "Nice" tick values covering the extent: steps of 1, 2 or 5 × 10ⁿ. */
export function niceTicks(domain: Extent, count = 5): number[] {
  const [min, max] = domain;
  if (min === max) return [min];
  const raw = (max - min) / Math.max(1, count);
  const power = 10 ** Math.floor(Math.log10(raw));
  const step =
    [1, 2, 5, 10].map((m) => m * power).find((s) => s >= raw) ?? 10 * power;
  const ticks: number[] = [];
  // Round to the step's precision so 0.1 + 0.2 style drift never shows.
  const digits = Math.max(0, -Math.floor(Math.log10(step)));
  // From the step at or below the minimum to the first step at or above the
  // maximum, so the top gridline is never below the data.
  for (let v = Math.floor(min / step) * step; ; v += step) {
    ticks.push(Number(v.toFixed(digits)));
    if (v >= max - step * 1e-9) break;
  }
  return ticks;
}

export interface Point {
  x: number;
  y: number;
}

/** SVG path data for a polyline through the points; breaks at non-finite y. */
export function linePath(points: readonly Point[]): string {
  let d = "";
  let pen = false;
  for (const { x, y } of points) {
    if (!Number.isFinite(y)) {
      pen = false;
      continue;
    }
    d += `${pen ? "L" : "M"}${round(x)} ${round(y)}`;
    pen = true;
  }
  return d;
}

/** SVG path data for the area between a line and a baseline y. */
export function areaPath(points: readonly Point[], baseline: number): string {
  const finite = points.filter((p) => Number.isFinite(p.y));
  if (finite.length < 2) return "";
  const first = finite[0];
  const last = finite[finite.length - 1];
  return `${linePath(finite)}L${round(last.x)} ${round(baseline)}L${round(first.x)} ${round(baseline)}Z`;
}

/** SVG path data for the band between an upper and a lower edge (a stacked layer). */
export function bandPath(
  upper: readonly Point[],
  lower: readonly Point[],
): string {
  const pairs = upper
    .map((p, i) => [p, lower[i]] as const)
    .filter(([u, l]) => Number.isFinite(u.y) && Number.isFinite(l.y));
  if (pairs.length < 2) return "";
  const back = pairs
    .map(([, l]) => l)
    .reverse()
    .map((p) => `L${round(p.x)} ${round(p.y)}`)
    .join("");
  return `${linePath(pairs.map(([u]) => u))}${back}Z`;
}

const round = (n: number) => Math.round(n * 100) / 100;

/** A categorical series slot. There are eight and they are never reused: a
    ninth series belongs in "Other" or in its own chart. */
export type ChartSlot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** The CSS colour of a series slot, from the --m-chart-* tokens. */
export const seriesColour = (slot: ChartSlot) => `var(--m-chart-${slot})`;
