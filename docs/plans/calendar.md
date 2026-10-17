# Calendar (red phase plan)

A site-agnostic month-grid date picker with an optional event list for the
selected day, comparable to Tailwind Plus Application UI › Data Display ›
Calendars. Content arrives through props; styling uses semantic tokens only.
No product copy or branding: every visible label is a prop with a neutral
English default.

Status: **red**. `tests/calendar.test.mjs`, `tests/browser/calendar.spec.mjs`
and the `calendar` probe in `tests/support/probes.mjs` describe the contract.
The component, manifest, fixture, taxonomy entry and probe registration are
added in the green phase.

## Placement (mirrors siblings)

| Concern        | Location                                                                                    | Sibling precedent                                                       |
| -------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Implementation | `src/display.tsx`, `export function Calendar`                                               | `DescriptionList`, `FilterChip` in `src/display.tsx`                    |
| Public export  | `src/index.ts` display block; `export type { CalendarEvent, CalendarProps }`                | `Listbox` / `ChoiceOption` in `src/index.ts`                            |
| Styles         | `.m-calendar*` rules in a new `@layer components` block appended to `src/kits.css`          | `138e023` / `adb7a52`: new application components in `src/kits.css`     |
| Manifest       | `manifests/mortar-calendar.json`, `kitId: "application"`                                    | `manifests/mortar-description-list.json`, `mortar-pagination.json`      |
| Catalogue      | `npm run catalog` (catalog.json entry + source/preview integrity hashes)                    | every manifest                                                          |
| Preview        | `previews/CalendarPreview.tsx` → shared fixture case; states in `previews/StateFixture.tsx` | `previews/ListboxPreview.tsx` → `ChoiceFixture.tsx`, `StateFixture.tsx` |
| Taxonomy       | `playground/taxonomy.json` › application › `data` (“Data display”)                          | `DescriptionList`, `MetricGroup`                                        |
| Probe registry | `scripts/test-contract.mjs` `probes.Calendar = "calendar"`                                  | `Listbox: "listbox"`, `Pagination: "pagination"`                        |

Manifest `testing`: `{ "profile": "control", "target": ".m-calendar", "probe":
"calendar", "states": ["disabled", "empty", "long"] }`; `dependencies:
["mortar-button"]`; capabilities `["theme", "application", "keyboard",
"responsive"]`.

No visual baselines are added and `baseline-policy.json` is unchanged.

## API

Dates are ISO calendar strings (`YYYY-MM-DD`; months `YYYY-MM`) so server and
client render identically and no time zone shifts a day.

```ts
interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  time?: string; // display text, e.g. "10:00"
  href?: string;
}
interface CalendarProps {
  label: string; // accessible name of the whole calendar group
  value: string | null;
  onChange: (value: string) => void;
  month?: string; // controlled visible month
  onMonthChange?: (month: string) => void;
  min?: string;
  max?: string;
  disabledDates?: string[];
  isDateDisabled?: (date: string) => boolean;
  locale?: string; // Intl locale; month/weekday names and day labels
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6; // default 0 (Sunday)
  today: string; // YYYY-MM-DD, supplied by the caller; no clock-derived default
  disabled?: boolean;
  events?: CalendarEvent[]; // omit to hide the event list
  previousLabel?: string; // default "Previous month"
  nextLabel?: string; // default "Next month"
  emptyEventsLabel?: string; // default "No events"
  eventCountLabel?: (count: number) => string; // default "1 event" / "N events"
}
```

- Visible month: `month` if given, else the month of `value`, else `today`.
  Uncontrolled navigation keeps its own month state; `onMonthChange` fires
  either way. With controlled `month`, navigation only requests a month;
  the heading and grid remain unchanged until the parent updates the prop.
  A pending keyboard target receives focus when that update arrives.
- `today` is required: this is simpler than an implicit local clock and lets
  the host supply the same date for SSR and hydration, even across time zones.
  Calendar does not read the clock. `locale` controls labels only, never the
  week start: omitted `weekStartsOn` always means Sunday (`0`).
- `min`/`max`, `disabledDates` and `isDateDisabled` mark days unavailable.
  Previous/next buttons are disabled when the adjacent month lies wholly
  outside `min`/`max`.
- Leading/trailing days of adjacent months fill complete weeks
  (`data-outside` on the day button), muted, and remain selectable when in
  range. Selecting one calls `onChange` and navigates to its month (requests
  it via `onMonthChange` when controlled). Render the minimum complete weeks:
  January 2026 Monday-start has five; March/August 2026 Monday-start have six.

## Markup and accessibility

- Root `<div class="m-calendar" role="group" aria-label={label}>`.
- Header: month heading `<h2 id>` (`Intl` month + year, `aria-live="polite"`),
  and two `Button variant="ghost"` controls with `aria-label` previous/next
  labels (icons `aria-hidden`).
- Grid: `role="grid"` labelled by the heading (`aria-labelledby`); weekday
  `role="columnheader"` cells carry the full weekday name as `aria-label` and
  show a short name; `role="row"` of seven `role="gridcell"` per week.
- Each gridcell has `aria-selected` (`"true"` only for `value`) and contains a
  day `<button type="button">` with:
  - `aria-label` = full localized date, plus `", N events"` when it has events;
  - class `m-calendar-day`, `<time dateTime="YYYY-MM-DD">` showing the day number;
  - `aria-current="date"` for `today`;
  - `aria-disabled="true"` for unavailable days (still focusable, Enter ignored);
  - roving `tabindex`: exactly one day is `0` (selected → today → first
    enabled day of the month), all others `-1`.
- Keyboard (focus inside the grid): ←/→ ±1 day, ↑/↓ ±1 week, Home/End start/end
  of week (respecting `weekStartsOn`), PageUp/PageDown previous/next month,
  Enter/Space select. Crossing a month boundary moves the visible month and
  keeps focus on the new day, even when it was already visible as an outside
  day. PageUp/PageDown clamp to the last day of the target month (Jan 31 →
  Feb 28, or Feb 29 in a leap year; Mar 31 → the same February endpoint).
  All keyboard date targets clamp to `min`/`max`; moving beyond either bound
  focuses that boundary date and never opens an out-of-range month. Disabled
  dates within those bounds remain focusable. Navigation never selects a day.
  Button navigation retains focus on that button while it remains enabled.
- Event list (only with `events`): `<section class="m-calendar-events"
aria-labelledby>` headed by the selected full date, `<ol>` of the day's events
  (time + title, `<a>` when `href`). With no events it shows `emptyEventsLabel`.
- `disabled` disables navigation and all day buttons; pointer, synthetic click
  and keyboard activation must never call `onChange`.

## States

| State                             | Fixture (`data-state`)                                                    | Assertion                                                    |
| --------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------ |
| default                           | value 2026-01-12, today 2026-01-12, Monday start, events on 12th and 21st | probe + `tests/browser/calendar.spec.mjs`                    |
| disabled                          | `disabled`, callback counter                                              | first control disabled, click leaves `Callback count` at `0` |
| empty                             | `events=[]`, `emptyEventsLabel="No records"`                              | shared harness expects “No records”                          |
| long                              | long event titles and a 6-week month                                      | no page overflow at 390px                                    |
| today/outside/min/max/unavailable | SSR tests                                                                 | `tests/calendar.test.mjs`                                    |

Default fixture (used by the probe and browser spec):
`label="Choose a date"`, `locale="en-US"`, `weekStartsOn={1}`,
`today="2026-01-12"`, initial value `2026-01-12`, `min="2025-12-01"`,
`max="2026-03-31"`, `disabledDates={["2026-01-15"]}`, events “Design review”
(10:00) and “Team sync” (14:00) on 2026-01-12, “Release planning” on
2026-01-21, plus `<output aria-label="Selected date">` echoing the value.

Additional browser scenarios, implemented in the green phase through the
existing `state` query/fixture mechanism (not new manifest state vocabulary):

- `unbounded`: value `2026-01-31`, today `2026-01-12`, locale `en-US`, explicit
  `weekStartsOn={0}`, no min/max. Owns selection, leaves `month` uncontrolled.
- `controlled`: value/today `2026-01-12`, locale `en-US`, Monday start, initial
  `month="2026-01"`. `onMonthChange` records the request in an output labelled
  `Requested month` and increments `Month request count`; only the existing
  Button labelled `Show requested month` applies it to `month`. Selection is
  echoed in `Selected date`. This makes Next and PageDown requests observable
  separately before the parent accepts February.
- `disabled`: uses the default January props, with `disabled`; every
  `onChange` increments the existing `Callback count` output.

The node matrix renders identical props under Los Angeles, Kiritimati and
UTC, and checks consecutive complete weeks in March/October/November under
New York and London. Browser contexts cover LA keyboard dates and both zones'
spring/autumn DST weeks. Date arithmetic must operate on calendar dates,
without local parsing shifts, duplicated days or gaps.

## Dark and light

Both appearances come from tokens only; no appearance-specific selectors.

- Selected day: `background: var(--m-primary)`, `color: var(--m-on-primary)`
  (browser spec compares computed colours against the tokens in each theme).
- Today (unselected): `color: var(--m-link)`, weight 600.
- Hover/keyboard-active day: `var(--m-selected)`; outside/unavailable:
  `var(--m-muted)`; borders `var(--m-line)`; surface `var(--m-surface)`.
- Focus: the shared `[data-mortar] :focus-visible` ring; calendar CSS does not
  redefine outlines.

## Reused primitives (no custom code)

- `Button` (`variant="ghost"`) for month navigation — `src/primitives.tsx`.
- Shared focus ring — `src/components.css` `[data-mortar] … :focus-visible`.
- Selection/active idiom of `.m-segmented [aria-pressed]` / `.m-choice-option[data-focus]`
  (`--m-selected`, `--m-primary`, `--m-on-primary`).
- `.m-sr-only` for any visually hidden text.
- Tokens: `--m-surface`, `--m-line`, `--m-ink`, `--m-muted`, `--m-link`,
  `--m-selected`, `--m-primary`, `--m-on-primary`, `--m-radius`,
  `--m-radius-sm`, `--m-control`, `--m-font-size`.
- `Intl.DateTimeFormat` (platform) for names; no date library, no new
  dependency.

Calendar CSS contains no raw colours (hex/rgb/hsl/named), appearance-specific
selectors (`[data-theme…]`, `.dark`, or `prefers-color-scheme`) or new `--m-*`
definitions. Every Calendar-specific rule, including `[data-outside]` and
grid internals, must be scoped to `.m-calendar` (or its `m-calendar-*` classes)
in the new final components layer in `kits.css`. Radius values use
`var(--m-radius*)` or `50%`; day height and minimum sizes use `var(--m-control)`
or a calc containing it. Other px values are allowed: there is no house
spacing scale. Reuse existing primitives/tokens only; a real primitive gap
requires its own PR first. No gap is currently identified: raw day buttons
follow the existing SegmentedControl/choice internals. The node token tests
enforce these requirements. The interactive `control` profile is retained.

## Reflow

No horizontal page overflow at 320, 768 and 1280px in both themes; the grid
stays inside the viewport and every day button is at least 24×24px (WCAG
2.5.8). The event list stacks below the grid when narrow.
