# Charts

`@tonycodes-ui/mortar/charts` draws charts as SVG with Mortar's tokens, so they follow your brand, density and light or dark appearance. It has no runtime dependencies. This release has `Sparkline`; line, area and bar charts and a meter are planned.

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

## Accessibility

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
