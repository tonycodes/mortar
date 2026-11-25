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
const valueOf = (row: Row, key: string) => {
  const v = row[key];
  return typeof v === "number" ? v : Number.NaN;
};
const slotOf = (series: ChartSeries[], i: number) =>
  series[i].slot ?? ((i + 1) as ChartSlot);

/** At most eight series: slots are never reused, so a ninth is not drawn. */
const limitSeries = (series: ChartSeries[]) => series.slice(0, 8);

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

// Plot margins in pixels. The left margin grows with the widest y tick label.
const TOP = 12;
const BOTTOM = 28;
const CHAR = 7;

interface Geometry {
  width: number;
  height: number;
  left: number;
  right: number;
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
  if (zero) {
    min = Math.min(0, min);
    max = Math.max(0, max);
  }
  if (y.min !== undefined) min = y.min;
  if (y.max !== undefined) max = y.max;
  const ticks = niceTicks([min, max], Math.max(2, Math.floor(height / 48)));
  const lo = Math.min(min, ticks[0]);
  const hi = Math.max(max, ticks[ticks.length - 1]);
  const left = Math.max(...ticks.map((t) => format(t).length)) * CHAR + 12;
  return {
    width,
    height,
    left,
    right: width - rightPad,
    ticks,
    y: linearScale([lo, hi], [height - BOTTOM, TOP]),
  };
}

/** Spreads end-of-line labels apart so none overlap. */
function spread(positions: { y: number; key: string }[], gap = 14) {
  const sorted = [...positions].sort((a, b) => a.y - b.y);
  for (let i = 1; i < sorted.length; i++)
    if (sorted[i].y - sorted[i - 1].y < gap)
      sorted[i].y = sorted[i - 1].y + gap;
  return new Map(sorted.map((p) => [p.key, p.y]));
}

interface FrameProps extends ChartBaseProps {
  name: string;
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
  const [active, setActive] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
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
    if (xs.length) setActive(nearest(event.clientX - box.left));
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = rows.length - 1;
    const moves: Record<string, number> = {
      ArrowRight: Math.min(last, (active ?? -1) + 1),
      ArrowLeft: Math.max(0, (active ?? 1) - 1),
      Home: 0,
      End: last,
    };
    if (event.key in moves) {
      event.preventDefault();
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
        { key: "__x", label: x.label ?? "" },
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
      {active !== null && rows[active] && (
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
                <i
                  style={
                    {
                      "--m-series": seriesColour(slotOf(series, i)),
                    } as CSSProperties
                  }
                />
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
            <li
              key={s.key}
              style={
                {
                  "--m-series": seriesColour(slotOf(series, i)),
                } as CSSProperties
              }
            >
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
      {/* Announces the point the keyboard or pointer moved to. */}
      <p className="m-sr-only" aria-live="polite">
        {active !== null && rows[active] ? describe(active) : ""}
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

/** Horizontal gridlines and y labels for a geometry. */
function YAxis({ g, format }: { g: Geometry; format: (n: number) => string }) {
  return (
    <g className="m-chart-axis" aria-hidden="true">
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

export interface LineChartProps extends ChartBaseProps {
  /** Mark each value with a dot. */
  markers?: boolean;
}

/** Change over time for one to eight series, with direct end labels for up to four. */
export function LineChart(input: LineChartProps) {
  const props = { ...input, series: limitSeries(input.series) };
  const { rows, x, series, y = {}, height = 240, markers = false } = props;
  const format = y.format ?? defaultY;
  const direct = series.length > 1 && series.length <= 4;
  const labelWidth = direct
    ? Math.max(...series.map((s) => s.label.length)) * CHAR + 16
    : 12;
  const values = rows.flatMap((row) => series.map((s) => valueOf(row, s.key)));
  const positions = (width: number) => {
    const g = geometry(values, width, height, y, format, labelWidth, false);
    const sx = linearScale(
      [0, Math.max(1, rows.length - 1)],
      [g.left, g.right],
    );
    return rows.map((_, i) => sx(i));
  };
  return (
    <ChartFrame
      {...props}
      name="LineChart"
      className={cx("m-line-chart", props.className)}
      positions={positions}
      plot={(width, active) => {
        const g = geometry(values, width, height, y, format, labelWidth, false);
        const xs = positions(width);
        const lines = series.map((s, i) => ({
          s,
          slot: slotOf(series, i),
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
            return last ? [{ key: s.key, y: last.y }] : [];
          }),
        );
        return (
          <g>
            <YAxis g={g} format={format} />
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
                y1={TOP}
                y2={height - BOTTOM}
              />
            )}
            {lines.map(({ s, slot, points }) => (
              <g
                key={s.key}
                style={{ "--m-series": seriesColour(slot) } as CSSProperties}
              >
                <path className="m-chart-line" d={linePath(points)} />
                {(markers || active !== null) &&
                  points.map((p, j) =>
                    Number.isFinite(p.y) && (markers || j === active) ? (
                      <circle
                        key={j}
                        className="m-chart-marker"
                        cx={p.x}
                        cy={p.y}
                        r="4"
                      />
                    ) : null,
                  )}
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
  const fill = stacked || series.length === 1;
  // Cumulative tops per row when stacking.
  const tops = rows.map((row) => {
    let sum = 0;
    return series.map((s) => {
      const v = valueOf(row, s.key);
      sum += Number.isFinite(v) ? v : 0;
      return stacked ? sum : v;
    });
  });
  const values = tops.flat().concat(0);
  const positions = (width: number) => {
    const g = geometry(values, width, height, y, format, 12, true);
    const sx = linearScale(
      [0, Math.max(1, rows.length - 1)],
      [g.left, g.right],
    );
    return rows.map((_, i) => sx(i));
  };
  return (
    <ChartFrame
      {...props}
      name="AreaChart"
      className={cx("m-area-chart", props.className)}
      positions={positions}
      plot={(width, active) => {
        const g = geometry(values, width, height, y, format, 12, true);
        const xs = positions(width);
        const baseline = g.y(0);
        return (
          <g>
            <YAxis g={g} format={format} />
            <XLabels
              xs={xs}
              labels={rows.map((r) =>
                (props.x.format ?? defaultX)(r[props.x.key]),
              )}
              g={g}
            />
            {/* Each stacked layer fills only its own band, between the layer
                below (or zero) and its top edge, so fills never overlap. */}
            {series.map((s, i) => {
              const top = rows.map<Point>((_, j) => ({
                x: xs[j],
                y: g.y(tops[j][i]),
              }));
              const below = rows.map<Point>((_, j) => ({
                x: xs[j],
                y: stacked && i > 0 ? g.y(tops[j][i - 1]) : baseline,
              }));
              return (
                <g
                  key={s.key}
                  style={
                    {
                      "--m-series": seriesColour(slotOf(series, i)),
                    } as CSSProperties
                  }
                >
                  {fill && (
                    <path className="m-chart-area" d={bandPath(top, below)} />
                  )}
                  <path className="m-chart-line" d={linePath(top)} />
                </g>
              );
            })}
            {active !== null && (
              <line
                className="m-chart-crosshair"
                x1={xs[active]}
                x2={xs[active]}
                y1={TOP}
                y2={height - BOTTOM}
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
  const stacked = layout === "stacked" && series.length > 1;
  const values = rows
    .flatMap((row) => {
      if (!stacked) return series.map((s) => valueOf(row, s.key));
      let sum = 0;
      for (const s of series) {
        const v = valueOf(row, s.key);
        sum += Number.isFinite(v) ? Math.max(0, v) : 0;
      }
      return [sum];
    })
    .concat(0);
  // Index of the last series with a positive value in a row: the stack's top.
  const lastStacked = (row: Row) => {
    let last = -1;
    series.forEach((s, i) => {
      if (valueOf(row, s.key) > 0) last = i;
    });
    return last;
  };
  const band = (width: number) => {
    const g = geometry(values, width, height, y, format, 12, true);
    const step = (g.right - g.left) / Math.max(1, rows.length);
    return { g, step, bar: Math.min(48, step * 0.7) };
  };
  const positions = (width: number) => {
    const { g, step } = band(width);
    return rows.map((_, i) => g.left + step * (i + 0.5));
  };
  return (
    <ChartFrame
      {...props}
      name="BarChart"
      className={cx("m-bar-chart", props.className)}
      positions={positions}
      plot={(width, active) => {
        const { g, step, bar } = band(width);
        const xs = positions(width);
        const zero = g.y(0);
        const groupWidth = stacked ? bar : bar / series.length;
        return (
          <g>
            <YAxis g={g} format={format} />
            <XLabels
              xs={xs}
              labels={rows.map((r) =>
                (props.x.format ?? defaultX)(r[props.x.key]),
              )}
              g={g}
            />
            {rows.map((row, j) => {
              let base = 0;
              return (
                <g key={j} data-active={active === j || undefined}>
                  {active === j && (
                    <rect
                      className="m-chart-band"
                      x={xs[j] - step / 2}
                      width={step}
                      y={TOP}
                      height={height - BOTTOM - TOP}
                    />
                  )}
                  {series.map((s, i) => {
                    const v = valueOf(row, s.key);
                    if (!Number.isFinite(v)) return null;
                    const from = stacked ? base : 0;
                    const to = stacked ? base + Math.max(0, v) : v;
                    if (stacked) base = to;
                    const left = stacked
                      ? xs[j] - bar / 2
                      : xs[j] - bar / 2 + i * groupWidth;
                    const top = Math.min(g.y(from), g.y(to));
                    const h = Math.abs(g.y(to) - g.y(from));
                    const w = Math.max(1, groupWidth - (stacked ? 0 : 2));
                    // Only the data end is rounded: the top segment of a stack,
                    // and every grouped bar, away from the zero line.
                    const isEnd = !stacked || i === lastStacked(row);
                    return (
                      <path
                        key={s.key}
                        className="m-chart-bar"
                        style={
                          {
                            "--m-series": seriesColour(slotOf(series, i)),
                          } as CSSProperties
                        }
                        d={barPath(
                          left + (stacked ? 0 : 1),
                          top,
                          w,
                          Math.max(0, h),
                          to >= from,
                          isEnd ? 4 : 0,
                        )}
                      />
                    );
                  })}
                </g>
              );
            })}
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
