import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { componentRoot, cx } from "./internal.js";
import { Button, EmptyState, Notice } from "./primitives.js";
import { Table } from "./application.js";
import {
  bandPath,
  extent,
  linearScale,
  linePath,
  niceTicks,
  seriesColour,
  type ChartSlot,
  type Point,
} from "./chart-core.js";

type Row = Record<string, unknown>;

export interface ChartSeries {
  /** The row field this series plots. */
  key: string;
  label: string;
  /** Pins the series colour so it never moves when other series change. Defaults to the series' position. */
  slot?: ChartSlot;
  /** Formats this series' values; defaults to the y axis format. */
  format?: (value: number) => string;
}

export interface ChartX {
  /** The row field for the x value or category. */
  key: string;
  label?: string;
  format?: (value: unknown) => string;
}

export interface ChartY {
  label?: string;
  format?: (value: number) => string;
  min?: number;
  max?: number;
}

export interface ChartBaseProps {
  /** The chart's accessible name, shown above it unless titleHidden. */
  title: string;
  titleHidden?: boolean;
  /** A sentence that says what the chart shows; read before the chart. */
  description?: string;
  rows: Row[];
  x: ChartX;
  /** One to eight series; a ninth belongs in "Other" or another chart. */
  series: ChartSeries[];
  y?: ChartY;
  /** Plot height in pixels; the width follows the container. Default 240. */
  height?: number;
  /** `auto` shows a legend for two or more series. */
  legend?: "auto" | "hidden";
  /** Offer a "Show data" table of the rows. Default true. */
  tableView?: boolean;
  loading?: boolean;
  error?: string;
  /** Shown when there are no rows. */
  empty?: { title: string; description?: string };
  id?: string;
  className?: string;
}

const numberFormat = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
});
const defaultY = (n: number) => numberFormat.format(n);
const defaultX = (v: unknown) =>
  v instanceof Date ? v.toLocaleDateString() : String(v ?? "");
/**
 * A row's value for a series. Numbers pass through; numeric strings (common
 * in JSON from APIs) are read as numbers; anything else is a missing value.
 */
const valueOf = (row: Row, key: string) => {
  const v = row[key];
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : Number.NaN;
  }
  return Number.NaN;
};

/** At most eight series: slots are never reused, so a ninth is not drawn. */
const limitSeries = (series: ChartSeries[]) => series.slice(0, 8);

/**
 * One distinct slot per series. Pinned slots are kept (a repeated pin goes to
 * the first free slot); unpinned series take the lowest slots nobody pinned.
 */
export function assignSlots(series: ChartSeries[]): ChartSlot[] {
  const taken = new Set<number>();
  const slots: (ChartSlot | undefined)[] = series.map((s) => {
    if (s.slot && !taken.has(s.slot)) {
      taken.add(s.slot);
      return s.slot;
    }
    return undefined;
  });
  let next = 1;
  return slots.map((slot) => {
    if (slot) return slot;
    while (taken.has(next)) next++;
    taken.add(next);
    return next as ChartSlot;
  });
}

const colour = (slot: ChartSlot) =>
  ({ "--m-series": seriesColour(slot) }) as CSSProperties;

/**
 * Diverging stack: per row, positive values stack up from zero and negative
 * values stack down from zero, so layers never overlap. A missing value has
 * no extent and leaves a gap. Returns [from, to] per series per row.
 */
function stack(rows: Row[], series: ChartSeries[]) {
  return rows.map((row) => {
    let up = 0;
    let down = 0;
    return series.map((s) => {
      const v = valueOf(row, s.key);
      if (!Number.isFinite(v)) return [Number.NaN, Number.NaN] as const;
      if (v >= 0) {
        const from = up;
        up += v;
        return [from, up] as const;
      }
      const from = down;
      down += v;
      return [from, down] as const;
    });
  });
}

/** A bar with rounded corners on its data end only; the baseline end stays square. */
function barPath(
  x: number,
  y: number,
  w: number,
  h: number,
  up: boolean,
  r = 4,
) {
  const radius = Math.max(0, Math.min(r, w / 2, h));
  if (!radius) return `M${x} ${y}h${w}v${h}h${-w}Z`;
  return up
    ? `M${x} ${y + h}V${y + radius}Q${x} ${y} ${x + radius} ${y}H${x + w - radius}Q${x + w} ${y} ${x + w} ${y + radius}V${y + h}Z`
    : `M${x} ${y}V${y + h - radius}Q${x} ${y + h} ${x + radius} ${y + h}H${x + w - radius}Q${x + w} ${y + h} ${x + w} ${y + h - radius}V${y}Z`;
}

// Plot margins in pixels. The top grows to fit a y axis label; the left grows
// with the widest y tick label.
const TOP = 12;
const LABELLED_TOP = 28;
const BOTTOM = 28;
const CHAR = 7;
// Below this width, line charts drop direct end labels and keep the legend.
const DIRECT_MIN_WIDTH = 400;

interface Geometry {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  ticks: number[];
  y: (value: number) => number;
}

/** Container width, measured after layout; 640 until then (and on the server). */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const next = Math.round(el.getBoundingClientRect().width);
      if (next > 0) setWidth((old) => (old === next ? old : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** A clip-path id that is safe inside url(#…), from React's useId. */
const useClipId = () => `m-chart-clip-${useId().replace(/[^\w-]/g, "")}`;

function geometry(
  values: number[],
  width: number,
  height: number,
  y: ChartY,
  format: (n: number) => string,
  rightPad: number,
  zero: boolean,
): Geometry {
  let [min, max] = extent(values);
  if (y.min !== undefined) min = y.min;
  if (y.max !== undefined) max = y.max;
  // Bars measure from zero, so the axis always includes it, whatever y says.
  if (zero) {
    min = Math.min(0, min);
    max = Math.max(0, max);
  }
  if (!(min < max)) {
    // An inverted or flat override: fall back to the data, then to a unit
    // span, keeping zero where the chart measures from it.
    [min, max] = extent(values);
    if (zero) {
      min = Math.min(0, min);
      max = Math.max(0, max);
    }
    if (min === max) max = min + 1;
  }
  const ticks = niceTicks([min, max], Math.max(2, Math.floor(height / 48)));
  const lo = Math.min(min, ticks[0]);
  const hi = Math.max(max, ticks[ticks.length - 1]);
  const left = Math.max(...ticks.map((t) => format(t).length)) * CHAR + 12;
  const top = y.label ? LABELLED_TOP : TOP;
  return {
    width,
    height,
    left,
    right: Math.max(left + 1, width - rightPad),
    top,
    bottom: height - BOTTOM,
    ticks,
    y: linearScale([lo, hi], [height - BOTTOM, top]),
  };
}

/**
 * Spreads end-of-line labels so none overlap and all stay between the plot's
 * top and bottom: pushed down from the top, then back up from the bottom.
 */
export function spread(
  positions: { y: number; key: string }[],
  top: number,
  bottom: number,
  gap = 14,
) {
  const sorted = [...positions]
    .map((p) => ({ ...p, y: Math.min(bottom, Math.max(top, p.y)) }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < sorted.length; i++)
    sorted[i].y = Math.max(sorted[i].y, sorted[i - 1].y + gap);
  for (let i = sorted.length - 1; i >= 0; i--) {
    const limit = i === sorted.length - 1 ? bottom : sorted[i + 1].y - gap;
    sorted[i].y = Math.max(top, Math.min(sorted[i].y, limit));
  }
  return new Map(sorted.map((p) => [p.key, p.y]));
}

/** x positions spread across the plot; a single row sits in the middle. */
const spreadX = (count: number, g: Geometry) =>
  count === 1
    ? [(g.left + g.right) / 2]
    : Array.from({ length: count }, (_, i) =>
        linearScale([0, count - 1], [g.left, g.right])(i),
      );

/** A point with no known neighbour, which a line alone cannot show. */
const isolated = (points: Point[], j: number) =>
  Number.isFinite(points[j].y) &&
  !Number.isFinite(points[j - 1]?.y ?? Number.NaN) &&
  !Number.isFinite(points[j + 1]?.y ?? Number.NaN);

interface FrameProps extends ChartBaseProps {
  name: string;
  slots: ChartSlot[];
  /** Draws the plot for the measured geometry, highlighting the active index. */
  plot: (width: number, active: number | null) => ReactNode;
  /** x position of each row, for pointer hit-testing and the tooltip. */
  positions: (width: number) => number[];
}

/**
 * The chart frame: a named figure with its description, legend, plot,
 * tooltip, keyboard navigation and a table view of the same rows.
 */
function ChartFrame({
  name,
  title,
  titleHidden = false,
  description,
  rows,
  x,
  series,
  slots,
  y = {},
  legend = "auto",
  tableView = true,
  loading,
  error,
  empty = { title: "No data", description: "There is nothing to show yet." },
  height = 240,
  id,
  className,
  plot,
  positions,
}: FrameProps) {
  const autoId = useId();
  const titleId = `${autoId}-title`;
  const descId = `${autoId}-desc`;
  const [ref, width] = useWidth();
  const [activeState, setActive] = useState<number | null>(null);
  // Only keyboard moves are announced: announcing every pointer move would
  // flood a screen reader while the pointer crosses the chart.
  const [announce, setAnnounce] = useState(false);
  const [showTable, setShowTable] = useState(false);
  // Rows can shrink while a point is active; never point past the end.
  const active =
    activeState !== null && activeState < rows.length ? activeState : null;
  const xFormat = x.format ?? defaultX;
  const valueFormat = (s: ChartSeries) => s.format ?? y.format ?? defaultY;
  const xs = positions(width);

  const describe = (index: number) =>
    `${xFormat(rows[index][x.key])}: ${series
      .map((s) => {
        const v = valueOf(rows[index], s.key);
        return `${s.label} ${Number.isFinite(v) ? valueFormat(s)(v) : "no value"}`;
      })
      .join(", ")}`;

  const nearest = (px: number) => {
    let best = 0;
    for (let i = 1; i < xs.length; i++)
      if (Math.abs(xs[i] - px) < Math.abs(xs[best] - px)) best = i;
    return best;
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    if (!xs.length) return;
    setAnnounce(false);
    setActive(nearest(event.clientX - box.left));
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = rows.length - 1;
    const moves: Record<string, number> = {
      ArrowRight: Math.min(last, (active ?? -1) + 1),
      ArrowLeft: Math.max(0, (active ?? 1) - 1),
      Home: 0,
      End: last,
    };
    if (event.key in moves && last >= 0) {
      event.preventDefault();
      setAnnounce(true);
      setActive(moves[event.key]);
    } else if (event.key === "Escape") setActive(null);
  };

  const body = loading ? (
    <p className="m-chart-state" role="status">
      Loading chart…
    </p>
  ) : error ? (
    <Notice title="Unable to load chart" tone="danger" announce>
      {error}
    </Notice>
  ) : !rows.length ? (
    <EmptyState title={empty.title} description={empty.description} />
  ) : showTable ? (
    <Table
      caption={title}
      rowHeaders
      columns={[
        // Every column needs a name, even when x has no label.
        { key: "__x", label: x.label ?? x.key },
        ...series.map((s) => ({
          key: s.key,
          label: s.label,
          align: "end" as const,
        })),
      ]}
      rows={rows.map((row) => ({
        __x: xFormat(row[x.key]),
        ...Object.fromEntries(
          series.map((s) => {
            const v = valueOf(row, s.key);
            return [s.key, Number.isFinite(v) ? valueFormat(s)(v) : "—"];
          }),
        ),
      }))}
    />
  ) : (
    <div
      className="m-chart-plot"
      tabIndex={0}
      role="group"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      aria-roledescription="chart"
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <svg width={width} height="100%" aria-hidden="true" focusable="false">
        {plot(width, active)}
      </svg>
      {active !== null && (
        <div
          className="m-chart-tooltip"
          style={{ left: xs[active] }}
          data-side={xs[active] > width / 2 ? "start" : "end"}
          aria-hidden="true"
        >
          <strong>{xFormat(rows[active][x.key])}</strong>
          {series.map((s, i) => {
            const v = valueOf(rows[active], s.key);
            return (
              <span key={s.key}>
                <i style={colour(slots[i])} />
                {s.label}
                <b>{Number.isFinite(v) ? valueFormat(s)(v) : "—"}</b>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <figure
      id={id}
      {...componentRoot(name)}
      className={cx("m-chart", className)}
      aria-labelledby={titleId}
    >
      <figcaption className="m-chart-head">
        <span
          id={titleId}
          className={titleHidden ? "m-sr-only" : "m-chart-title"}
        >
          {title}
        </span>
        {description && (
          <span id={descId} className="m-chart-description">
            {description}
          </span>
        )}
      </figcaption>
      {legend === "auto" && series.length > 1 && !showTable && (
        <ul className="m-chart-legend" aria-label="Legend">
          {series.map((s, i) => (
            <li key={s.key} style={colour(slots[i])}>
              {s.label}
            </li>
          ))}
        </ul>
      )}
      <div
        ref={ref}
        className="m-chart-body"
        style={showTable ? undefined : { height }}
      >
        {body}
      </div>
      <p className="m-sr-only" aria-live="polite">
        {announce && active !== null ? describe(active) : ""}
      </p>
      {tableView && rows.length > 0 && !loading && !error && (
        <div className="m-chart-actions">
          <Button variant="ghost" onClick={() => setShowTable((v) => !v)}>
            {showTable ? "Show chart" : "Show data"}
          </Button>
        </div>
      )}
    </figure>
  );
}

/** Gridlines, y labels and the y axis label for a geometry. */
function YAxis({
  g,
  format,
  label,
}: {
  g: Geometry;
  format: (n: number) => string;
  label?: string;
}) {
  return (
    <g className="m-chart-axis" aria-hidden="true">
      {label && (
        <text className="m-chart-axis-label" x={0} y={12}>
          {label}
        </text>
      )}
      {g.ticks.map((t) => (
        <g key={t}>
          <line x1={g.left} x2={g.right} y1={g.y(t)} y2={g.y(t)} />
          <text x={g.left - 8} y={g.y(t)} dy="0.32em" textAnchor="end">
            {format(t)}
          </text>
        </g>
      ))}
    </g>
  );
}

/** Category labels along the bottom, thinned so they never overlap. */
function XLabels({
  xs,
  labels,
  g,
}: {
  xs: number[];
  labels: string[];
  g: Geometry;
}) {
  const longest = Math.max(1, ...labels.map((l) => l.length)) * CHAR + 12;
  const step = Math.max(
    1,
    Math.ceil(
      longest / Math.max(1, (g.right - g.left) / Math.max(1, xs.length)),
    ),
  );
  return (
    <g className="m-chart-axis" aria-hidden="true">
      {xs.map((x, i) =>
        i % step === 0 ? (
          <text key={i} x={x} y={g.height - 8} textAnchor="middle">
            {labels[i]}
          </text>
        ) : null,
      )}
    </g>
  );
}

/** Clips marks to the plot, so a y min or max inside the data never spills. */
function PlotClip({ id, g }: { id: string; g: Geometry }) {
  return (
    <clipPath id={id}>
      {/* A little slack keeps 2px lines and 4px markers at the edges whole. */}
      <rect
        x={g.left - 6}
        y={g.top - 6}
        width={g.right - g.left + 12}
        height={g.bottom - g.top + 12}
      />
    </clipPath>
  );
}

export interface LineChartProps extends ChartBaseProps {
  /** Mark each value with a dot. */
  markers?: boolean;
}

/** Change over time for one to eight series, with direct end labels for up to four. */
export function LineChart(input: LineChartProps) {
  const props = { ...input, series: limitSeries(input.series) };
  const { rows, x, series, y = {}, height = 240, markers = false } = props;
  const format = y.format ?? defaultY;
  const slots = assignSlots(series);
  const clipId = useClipId();
  const values = rows.flatMap((row) => series.map((s) => valueOf(row, s.key)));
  const layout = (width: number) => {
    const direct =
      series.length > 1 && series.length <= 4 && width >= DIRECT_MIN_WIDTH;
    const labelWidth = direct
      ? Math.min(
          width * 0.3,
          Math.max(...series.map((s) => s.label.length)) * CHAR + 16,
        )
      : 12;
    const g = geometry(values, width, height, y, format, labelWidth, false);
    return { g, direct, xs: spreadX(rows.length, g) };
  };
  return (
    <ChartFrame
      {...props}
      slots={slots}
      name="LineChart"
      className={cx("m-line-chart", props.className)}
      positions={(width) => layout(width).xs}
      plot={(width, active) => {
        const { g, direct, xs } = layout(width);
        const lines = series.map((s, i) => ({
          s,
          slot: slots[i],
          points: rows.map<Point>((row, j) => ({
            x: xs[j],
            y: g.y(valueOf(row, s.key)),
          })),
        }));
        const ends = spread(
          lines.flatMap(({ s, points }) => {
            const last = [...points]
              .reverse()
              .find((p) => Number.isFinite(p.y));
            // A line whose end is clipped out of the plot gets no label.
            return last && last.y >= g.top && last.y <= g.bottom
              ? [{ key: s.key, y: last.y }]
              : [];
          }),
          g.top,
          g.bottom,
        );
        return (
          <g>
            <PlotClip id={clipId} g={g} />
            <YAxis g={g} format={format} label={y.label} />
            <XLabels
              xs={xs}
              labels={rows.map((r) => (x.format ?? defaultX)(r[x.key]))}
              g={g}
            />
            {active !== null && (
              <line
                className="m-chart-crosshair"
                x1={xs[active]}
                x2={xs[active]}
                y1={g.top}
                y2={g.bottom}
              />
            )}
            {lines.map(({ s, slot, points }) => (
              <g key={s.key} style={colour(slot)}>
                <g clipPath={`url(#${clipId})`}>
                  <path className="m-chart-line" d={linePath(points)} />
                  {points.map((p, j) =>
                    Number.isFinite(p.y) &&
                    (markers || j === active || isolated(points, j)) ? (
                      <circle
                        key={j}
                        className="m-chart-marker"
                        cx={p.x}
                        cy={p.y}
                        r="4"
                      />
                    ) : null,
                  )}
                </g>
                {direct && ends.has(s.key) && (
                  <text
                    className="m-chart-end-label"
                    x={g.right + 8}
                    y={ends.get(s.key)}
                    dy="0.32em"
                  >
                    {s.label}
                  </text>
                )}
              </g>
            ))}
          </g>
        );
      }}
    />
  );
}

export interface AreaChartProps extends ChartBaseProps {
  /**
   * Stack the series so the top edge is their total. Default true. Without
   * stacking, several series draw as lines only: overlapping fills hide each
   * other.
   */
  stacked?: boolean;
}

/** Change over time where volume matters; stacked when the series sum to a whole. */
export function AreaChart(input: AreaChartProps) {
  const props = { ...input, series: limitSeries(input.series) };
  const { rows, series, y = {}, height = 240, stacked = true } = props;
  const format = y.format ?? defaultY;
  const slots = assignSlots(series);
  const clipId = useClipId();
  const fill = stacked || series.length === 1;
  // [from, to] per row and series: a diverging stack, or zero to the value.
  const layers = stacked
    ? stack(rows, series)
    : rows.map((row) => series.map((s) => [0, valueOf(row, s.key)] as const));
  const values = layers.flat(2).concat(0);
  const layout = (width: number) => {
    const g = geometry(values, width, height, y, format, 12, true);
    return { g, xs: spreadX(rows.length, g) };
  };
  return (
    <ChartFrame
      {...props}
      slots={slots}
      name="AreaChart"
      className={cx("m-area-chart", props.className)}
      positions={(width) => layout(width).xs}
      plot={(width, active) => {
        const { g, xs } = layout(width);
        return (
          <g>
            <PlotClip id={clipId} g={g} />
            <YAxis g={g} format={format} label={y.label} />
            <XLabels
              xs={xs}
              labels={rows.map((r) =>
                (props.x.format ?? defaultX)(r[props.x.key]),
              )}
              g={g}
            />
            {/* Each layer fills only its own band, from where it starts to
                where it ends, so fills never overlap and gaps stay gaps. */}
            <g clipPath={`url(#${clipId})`}>
              {series.map((s, i) => {
                const end = rows.map<Point>((_, j) => ({
                  x: xs[j],
                  y: g.y(layers[j][i][1]),
                }));
                const start = rows.map<Point>((_, j) => ({
                  x: xs[j],
                  y: Number.isFinite(layers[j][i][1])
                    ? g.y(layers[j][i][0])
                    : Number.NaN,
                }));
                return (
                  <g key={s.key} style={colour(slots[i])}>
                    {fill && (
                      <path className="m-chart-area" d={bandPath(end, start)} />
                    )}
                    <path className="m-chart-line" d={linePath(end)} />
                    {end.map((p, j) =>
                      Number.isFinite(p.y) &&
                      (j === active || isolated(end, j)) ? (
                        <circle
                          key={j}
                          className="m-chart-marker"
                          cx={p.x}
                          cy={p.y}
                          r="4"
                        />
                      ) : null,
                    )}
                  </g>
                );
              })}
            </g>
            {active !== null && (
              <line
                className="m-chart-crosshair"
                x1={xs[active]}
                x2={xs[active]}
                y1={g.top}
                y2={g.bottom}
              />
            )}
          </g>
        );
      }}
    />
  );
}

export interface BarChartProps extends ChartBaseProps {
  /** `grouped` puts series side by side; `stacked` stacks them when they sum to a whole. */
  layout?: "grouped" | "stacked";
}

/** Compares values across categories. Bars always start at zero. */
export function BarChart(input: BarChartProps) {
  const props = { ...input, series: limitSeries(input.series) };
  const { rows, series, y = {}, height = 240, layout = "grouped" } = props;
  const format = y.format ?? defaultY;
  const slots = assignSlots(series);
  const clipId = useClipId();
  const stacked = layout === "stacked" && series.length > 1;
  // [from, to] per row and series: a diverging stack, or zero to the value.
  const layers = stacked
    ? stack(rows, series)
    : rows.map((row) => series.map((s) => [0, valueOf(row, s.key)] as const));
  const values = layers.flat(2).concat(0);
  // The outermost segment on each side of zero carries the rounded data end.
  const ends = layers.map((row) => {
    let up = -1;
    let down = -1;
    row.forEach(([from, to], i) => {
      if (to > from) up = i;
      else if (to < from) down = i;
    });
    return { up, down };
  });
  const band = (width: number) => {
    const g = geometry(values, width, height, y, format, 12, true);
    const step = (g.right - g.left) / Math.max(1, rows.length);
    const xs = rows.map((_, i) => g.left + step * (i + 0.5));
    return { g, step, xs, bar: Math.min(48, step * 0.7) };
  };
  return (
    <ChartFrame
      {...props}
      slots={slots}
      name="BarChart"
      className={cx("m-bar-chart", props.className)}
      positions={(width) => band(width).xs}
      plot={(width, active) => {
        const { g, step, xs, bar } = band(width);
        const zero = g.y(0);
        const groupWidth = stacked ? bar : bar / series.length;
        return (
          <g>
            <PlotClip id={clipId} g={g} />
            <YAxis g={g} format={format} label={y.label} />
            <XLabels
              xs={xs}
              labels={rows.map((r) =>
                (props.x.format ?? defaultX)(r[props.x.key]),
              )}
              g={g}
            />
            <g clipPath={`url(#${clipId})`}>
              {layers.map((row, j) => (
                <g key={j} data-active={active === j || undefined}>
                  {active === j && (
                    <rect
                      className="m-chart-band"
                      x={xs[j] - step / 2}
                      width={step}
                      y={g.top}
                      height={g.bottom - g.top}
                    />
                  )}
                  {row.map(([from, to], i) => {
                    if (!Number.isFinite(to) || to === from) return null;
                    const left = stacked
                      ? xs[j] - bar / 2
                      : xs[j] - bar / 2 + i * groupWidth;
                    const top = Math.min(g.y(from), g.y(to));
                    const h = Math.abs(g.y(to) - g.y(from));
                    const w = Math.max(1, groupWidth - (stacked ? 0 : 2));
                    const up = to > from;
                    // Every grouped bar is its own data end; in a stack only
                    // the outermost segment on each side of zero is.
                    const isEnd =
                      !stacked || (up ? ends[j].up === i : ends[j].down === i);
                    return (
                      <path
                        key={series[i].key}
                        className="m-chart-bar"
                        style={colour(slots[i])}
                        d={barPath(
                          left + (stacked ? 0 : 1),
                          top,
                          w,
                          h,
                          up,
                          isEnd ? 4 : 0,
                        )}
                      />
                    );
                  })}
                </g>
              ))}
            </g>
            <line
              className="m-chart-zero"
              x1={g.left}
              x2={g.right}
              y1={zero}
              y2={zero}
            />
          </g>
        );
      }}
    />
  );
}
