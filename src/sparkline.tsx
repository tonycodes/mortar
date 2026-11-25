import type { CSSProperties } from "react";
import { componentRoot, cx } from "./internal.js";
import {
  areaPath,
  extent,
  linearScale,
  linePath,
  seriesColour,
  type ChartSlot,
} from "./chart-core.js";

export interface SparklineProps {
  /** The values in order, oldest first. Missing values (NaN) break the line. */
  values: readonly number[];
  /** What the values measure, e.g. "Revenue, last 12 months". Read as the start of its summary. */
  label: string;
  /** Formats values in the spoken summary. Defaults to the locale's number format. */
  format?: (value: number) => string;
  /** Series colour slot, 1–8. Default 1. */
  slot?: ChartSlot;
  /** Height in pixels; the width follows the container. Default 32. */
  height?: number;
  /** Mark the latest value with a dot. Default true. */
  showLast?: boolean;
  /** Fill under the line. */
  area?: boolean;
  /** Shade a reference range, such as a target or normal band. */
  band?: { min: number; max: number };
  id?: string;
  className?: string;
}

const number = new Intl.NumberFormat();

/** The spoken summary: label, count, range and latest value. */
export function sparklineSummary(
  values: readonly number[],
  label: string,
  format: (value: number) => string = (v) => number.format(v),
) {
  const finite = values.filter(Number.isFinite);
  if (!finite.length) return `${label}: no data`;
  const [min, max] = extent(finite);
  const last = finite[finite.length - 1];
  return finite.length === 1
    ? `${label}: ${format(last)}`
    : `${label}: ${finite.length} values from ${format(min)} to ${format(max)}, latest ${format(last)}`;
}

/** A small, axis-free trend line for a stat tile, table cell or list row. */
export function Sparkline({
  values,
  label,
  format,
  slot = 1,
  height = 32,
  showLast = true,
  area = false,
  band,
  id,
  className,
}: SparklineProps) {
  const [min, max] = extent(
    band ? [...values, band.min, band.max] : [...values],
  );
  const x = linearScale([0, Math.max(1, values.length - 1)], [0, 100]);
  const y = linearScale([min, max], [100, 0]);
  const points = values.map((v, i) => ({ x: x(i), y: y(v) }));
  let lastIndex = values.length - 1;
  while (lastIndex >= 0 && !Number.isFinite(values[lastIndex])) lastIndex--;
  const last = lastIndex >= 0 ? points[lastIndex] : undefined;
  return (
    <span
      id={id}
      {...componentRoot("Sparkline")}
      className={cx("m-sparkline", className)}
      role="img"
      aria-label={sparklineSummary(values, label, format)}
      style={
        {
          height,
          "--m-sparkline-colour": seriesColour(slot),
        } as CSSProperties
      }
    >
      {/* The plot sits inside padding sized for the dot and its ring, so
          nothing reaches past the sparkline's own box. */}
      <span className="m-sparkline-plot">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          {band && (
            <rect
              className="m-sparkline-band"
              x="0"
              width="100"
              y={Math.min(y(band.min), y(band.max))}
              height={Math.abs(y(band.min) - y(band.max))}
            />
          )}
          {area && (
            <path className="m-sparkline-area" d={areaPath(points, 100)} />
          )}
          <path
            className="m-sparkline-line"
            d={linePath(points)}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {showLast && last && (
          <span
            className="m-sparkline-last"
            style={{ left: `${last.x}%`, top: `${last.y}%` }}
            aria-hidden="true"
          />
        )}
      </span>
    </span>
  );
}
