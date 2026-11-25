# Charts

`@tonycodes-ui/mortar/charts` draws charts as SVG with Mortar's tokens, so they follow your brand, density and light or dark appearance. It has no runtime dependencies. This release has `Sparkline`, `LineChart`, `AreaChart` and `BarChart`; a meter is planned.

## Sparkline

A sparkline is a small trend line with no axes. Use it beside a number to show which way the number has been moving: in a stat tile, a table cell or a list row. When people need to read values off the chart, use a full chart instead.

```tsx
import { Sparkline } from "@tonycodes-ui/mortar/charts";

<Sparkline
  label="Revenue, last 12 months"
  values={[42, 45, 44, 51, 49, 56, 61, 58, 64, 70, 68, 75]}
  format={(n) => `$${n}k`}
  area
/>;
```

- `values` are in order, oldest first. A missing value (`NaN`) leaves a gap in the line rather than joining across it.
- The width follows the container; `height` defaults to 32 pixels.
- `showLast` (on by default) marks the latest value with a dot. `area` fills under the line. `band` shades a reference range, such as a target or a normal range.
- `slot` picks the series colour (1 to 8, default 1); see [Colour](#colour).

`MetricGroup` items take a `sparkline` of recent values and draw it under the value, so a stat tile with a trend needs no extra layout:

```tsx
<MetricGroup
  label="Summary"
  items={[
    {
      label: "Requests",
      value: "1.42M",
      change: "+12.4%",
      sparkline: requestsByWeek,
    },
  ]}
/>
```

## Line, area and bar charts

`LineChart`, `AreaChart` and `BarChart` take rows and a list of series that name the field each one plots, so data from an API needs no reshaping.

```tsx
import { LineChart } from "@tonycodes-ui/mortar/charts";

<LineChart
  title="Monthly revenue by plan"
  description="Revenue in thousands of dollars, January to June 2026."
  rows={months}
  x={{ key: "month", label: "Month" }}
  series={[
    { key: "pro", label: "Pro" },
    { key: "team", label: "Team" },
  ]}
  y={{ format: (n) => `$${n}k` }}
/>;
```

| Chart       | Use it for                                                       | Options                                                       |
| ----------- | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| `LineChart` | Change over time, one to eight series                            | `markers` puts a dot on every value                           |
| `AreaChart` | Change over time when the series add up to a meaningful total    | `stacked` (default true); unstacked series draw as lines only |
| `BarChart`  | Comparing values across categories or a few periods; starts at 0 | `layout`: `grouped` (default) or `stacked`                    |

- `title` is required: it names the chart for screen readers and shows above it (`titleHidden` hides it visually). `description` is one sentence on what the chart shows.
- `x.format`, `y.format` and each series' `format` control how values read in the axis, tooltip and table. `y.label` names the axis and its unit above the plot, for example "Revenue ($k)".
- `y.min` and `y.max` fix the axis range; marks outside it are clipped to the plot. Bar charts always include zero.
- Stacks diverge: positive values stack up from zero and negative values stack down from it, so layers never overlap. A missing value leaves a gap rather than dropping to zero.
- `height` sets the plot height (default 240 pixels); the width follows the container. Below 400 pixels wide, line charts drop their end labels and keep the legend.
- `loading`, `error` and `empty` show the same states as tables.
- Charts draw at most eight series, each with its own colour. A pinned `slot` is never reused: series without one take the lowest free slots. Fold anything past eight into "Other", or split it across charts.
- Never put two measures with different scales on one chart. Use two charts instead.

## Accessibility

Every line, area and bar chart is a named figure:

- A legend names every series when there are two or more, and a line chart labels up to four lines at their ends, so identity never depends on colour.
- The plot takes one tab stop. Left and Right move between x values, Home and End jump to the first and last, and Escape closes the tooltip. Each keyboard move is announced, for example "Apr: Pro $51k, Team $29k"; pointer movement shows the tooltip without announcing.
- **Show data** swaps the plot for a table of the same rows with formatted values, and **Show chart** swaps back.
- Text uses the text tokens; marks keep a surface-coloured gap or ring where they meet.
- In high-contrast (forced colours) mode, series keep their colours so they stay distinguishable, and axes and labels follow the system colours.

A sparkline is an image with a spoken summary built from `label` and the values: "Revenue, last 12 months: 12 values from $42k to $75k, latest $75k". Give `label` the measure and the period, and pass `format` so the summary reads like the number beside it. The summary never depends on colour, and the line keeps its shape in forced-colours mode.

## Colour

Series use eight colour tokens, `--m-chart-1` to `--m-chart-8`, in a fixed order:

| Slot | Hue     | Light     | Dark      |
| ---- | ------- | --------- | --------- |
| 1    | blue    | `#2a78d6` | `#3987e5` |
| 2    | orange  | `#eb6834` | `#d95926` |
| 3    | aqua    | `#1baf7a` | `#199e70` |
| 4    | yellow  | `#eda100` | `#c98500` |
| 5    | magenta | `#e87ba4` | `#d55181` |
| 6    | green   | `#008300` | `#0ca30c` |
| 7    | violet  | `#6250d6` | `#9085e9` |
| 8    | red     | `#e34948` | `#e66767` |

The palette was checked against Mortar's light and dark surfaces for colour-blind separation between neighbouring slots, a consistent lightness band and enough saturation to tell the hues apart. The dark column is the same hues stepped for the dark surface, not an automatic inversion. `tests/charts.test.mjs` pins the values, so changing one means checking the palette again.

Rules that keep charts readable:

- Give a series the same slot everywhere it appears, and keep it when other series are hidden.
- There are eight slots and they are never reused. A ninth series belongs in "Other" or in a separate chart.
- Series colours carry identity only. Success, warning, danger and info stay the status tones, shown with a label or icon, and are never a series colour.
- Text uses the text tokens, never a series colour.
- On white, slots 3, 4 and 5 are below 3:1 contrast, so a chart that uses them needs labels or a data table beside it.
