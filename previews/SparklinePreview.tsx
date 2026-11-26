import * as Charts from "../src/charts.js";

const revenue = [42, 45, 44, 51, 49, 56, 61, 58, 64, 70, 68, 75];
const latency = [180, 176, 190, 210, 205, 188, 172, 169, 175, 160, 158, 152];
const money = (n: number) => `$${n}k`;

export default function Preview() {
  // The playground Code view shows this element (playground/examples.mjs).
  const example = (
    <Charts.Sparkline
      label="Revenue, last 12 months"
      values={revenue}
      format={money}
      area
    />
  );
  return (
    <div style={{ display: "grid", gap: 24, maxWidth: 360 }}>
      {example}
      <Charts.Sparkline
        label="Median latency, last 12 days"
        values={latency}
        format={(n) => `${n}ms`}
        slot={2}
        band={{ min: 150, max: 200 }}
      />
      <Charts.Sparkline
        label="Sign-ups, with a missing day"
        values={[12, 14, 13, Number.NaN, 18, 21, 19]}
        slot={3}
        height={24}
        showLast={false}
      />
    </div>
  );
}
