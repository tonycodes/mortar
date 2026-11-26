import * as Charts from "../src/charts.js";

const gb = (n: number) => `${n} GB`;
const quota = [
  { at: 80, tone: "warning", label: "Near limit" },
  { at: 100, tone: "danger", label: "Over limit" },
] as const;

export default function Preview() {
  // The playground Code view shows this element (playground/examples.mjs).
  const example = (
    <Charts.Meter
      label="Storage"
      value={82}
      max={100}
      format={gb}
      thresholds={quota}
    />
  );
  return (
    <div style={{ display: "grid", gap: 24, maxWidth: 420 }}>
      {example}
      <Charts.Meter label="Seats" value={12} max={25} thresholds={quota} />
      <Charts.Meter
        label="API calls this month"
        value={1_120_000}
        max={1_000_000}
        format={(n) => `${(n / 1_000_000).toFixed(2)}M`}
        thresholds={quota.map((t) => ({ ...t, at: t.at * 10_000 }))}
      />
      <Charts.Meter
        label="Uptime this quarter"
        value={99.4}
        max={100}
        format={(n) => `${n}%`}
        thresholds={[
          { at: 0, tone: "danger", label: "Below target" },
          { at: 99.5, tone: "success", label: "On target" },
        ]}
      />
    </div>
  );
}
