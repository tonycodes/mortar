import { useId } from "react";
import { componentRoot, cx } from "./internal.js";

export interface MeterThreshold {
  /** The value this status starts at. */
  at: number;
  tone: "success" | "warning" | "danger";
  /** Shown beside the value and read with it, so the status never depends on colour. */
  label: string;
}

export interface MeterProps {
  /** What is measured, e.g. "Storage". The meter's accessible name. */
  label: string;
  value: number;
  /** The capacity or target. Default 100. */
  max?: number;
  /** Formats the value and the maximum. Defaults to the locale's number format. */
  format?: (value: number) => string;
  /**
   * Statuses by value. The highest threshold the value has reached sets the
   * fill tone and shows its label; below every threshold the fill is the
   * accent colour. Each one is marked on the track.
   */
  thresholds?: readonly MeterThreshold[];
  id?: string;
  className?: string;
}

const number = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

/** The threshold in effect: the highest one the value has reached. */
export function meterStatus(
  value: number,
  thresholds: readonly MeterThreshold[] = [],
): MeterThreshold | undefined {
  if (!Number.isFinite(value)) return undefined;
  let status: MeterThreshold | undefined;
  for (const t of thresholds)
    if (
      Number.isFinite(t.at) &&
      value >= t.at &&
      (!status || t.at >= status.at)
    )
      status = t;
  return status;
}

/** The text shown and read for the value: "82 GB of 100 GB, Near limit". */
export function meterText(
  value: number,
  max: number,
  format: (value: number) => string = (v) => number.format(v),
  status?: MeterThreshold,
) {
  if (!Number.isFinite(value)) return "No data";
  // Without a usable capacity, the amount is all there is to say.
  const text = validMax(max)
    ? `${format(value)} of ${format(max)}`
    : format(value);
  return status ? `${text}, ${status.label}` : text;
}

const validMax = (max: number) => Number.isFinite(max) && max > 0;

const percentOf = (value: number, max: number) =>
  validMax(max) && Number.isFinite(value)
    ? Math.min(100, Math.max(0, (value / max) * 100))
    : 0;

/**
 * One measured value against a capacity or target, such as storage or a
 * quota, with optional status thresholds. For the progress of a task, use
 * ProgressBar.
 */
export function Meter({
  label,
  value,
  max = 100,
  format,
  thresholds = [],
  id,
  className,
}: MeterProps) {
  const labelId = useId();
  const status = meterStatus(value, thresholds);
  const amount = meterText(value, max, format);
  // ARIA needs a current value inside the range; the value text carries the
  // real amount, including one over the maximum or missing.
  const range = validMax(max) ? max : 100;
  const now = Number.isFinite(value) ? Math.min(range, Math.max(0, value)) : 0;
  const ticks = new Map(
    thresholds
      .filter((t) => t.at > 0 && t.at < max)
      .map((t) => [t.at, t] as const),
  );
  return (
    <div
      id={id}
      {...componentRoot("Meter")}
      className={cx("m-meter", className)}
      data-tone={status?.tone}
    >
      <div className="m-meter-label">
        <span id={labelId}>{label}</span>
        <span className="m-meter-value" aria-hidden="true">
          <span className="m-meter-amount">{amount}</span>
          {status && <span className="m-meter-status">{status.label}</span>}
        </span>
      </div>
      <div
        className="m-meter-track"
        role="meter"
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={range}
        aria-valuenow={now}
        aria-valuetext={meterText(value, max, format, status)}
      >
        <span
          className="m-meter-fill"
          style={{ width: `${percentOf(value, max)}%` }}
        />
        {[...ticks.keys()].map((at) => (
          <span
            key={at}
            className="m-meter-tick"
            style={{ left: `${percentOf(at, max)}%` }}
          />
        ))}
      </div>
    </div>
  );
}
