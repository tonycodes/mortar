import * as Charts from "../src/charts.js";

// Shared fixtures for LineChart, AreaChart and BarChart. Each component's
// preview renders this with its own name; the harness picks states with ?state=.
export const months = [
  { month: "Jan", pro: 42, team: 18, starter: 9, enterprise: 30 },
  { month: "Feb", pro: 45, team: 21, starter: 11, enterprise: 31 },
  { month: "Mar", pro: 44, team: 26, starter: 10, enterprise: 33 },
  { month: "Apr", pro: 51, team: 29, starter: 14, enterprise: 32 },
  { month: "May", pro: 49, team: 33, starter: 13, enterprise: 36 },
  { month: "Jun", pro: 56, team: 38, starter: 17, enterprise: 39 },
];
export const plans = [
  { key: "pro", label: "Pro" },
  { key: "team", label: "Team" },
  { key: "starter", label: "Starter" },
  { key: "enterprise", label: "Enterprise" },
];
const money = (n: number) => `$${n}k`;

function StateChart({ name, state }: { name: string; state: string }) {
  const Chart =
    name === "BarChart"
      ? Charts.BarChart
      : name === "AreaChart"
        ? Charts.AreaChart
        : Charts.LineChart;
  return (
    <div data-state={state}>
      <Chart
        title="State example"
        rows={state === "empty" ? [] : months}
        x={{ key: "month" }}
        series={plans.slice(0, 2)}
        loading={state === "loading"}
        error={state === "error" ? "Check this value" : undefined}
        empty={{ title: "No records" }}
      />
    </div>
  );
}

export function ChartPreview({ name }: { name: string }) {
  const state = new URLSearchParams(location.search).get("state");
  if (state) return <StateChart name={name} state={state} />;
  let example;
  switch (name) {
    case "LineChart":
      example = (
        <Charts.LineChart
          title="Monthly revenue by plan"
          description="Revenue in thousands of dollars, January to June 2026."
          rows={months}
          x={{ key: "month", label: "Month" }}
          series={plans}
          y={{ format: money }}
        />
      );
      break;
    case "AreaChart":
      example = (
        <Charts.AreaChart
          title="Revenue by plan, stacked"
          description="The top edge is total monthly revenue."
          rows={months}
          x={{ key: "month", label: "Month" }}
          series={plans.slice(0, 3)}
          y={{ format: money }}
        />
      );
      break;
    case "BarChart":
      example = (
        <Charts.BarChart
          title="Revenue by plan"
          description="Pro and Team revenue each month."
          rows={months}
          x={{ key: "month", label: "Month" }}
          series={plans.slice(0, 2)}
          y={{ format: money }}
        />
      );
      break;
  }
  return <div style={{ maxWidth: 720 }}>{example}</div>;
}
