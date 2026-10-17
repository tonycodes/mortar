import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as UI from "../dist/index.js";
import { probes } from "../scripts/test-contract.mjs";
const h = React.createElement;
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const base = {
  label: "Choose a date",
  value: "2026-01-12",
  today: "2026-01-12",
  locale: "en-US",
  weekStartsOn: 1,
  onChange() {},
};
const render = (props = {}) => {
  assert.equal(typeof UI.Calendar, "function", "Calendar is exported");
  return renderToStaticMarkup(h(UI.Calendar, { ...base, ...props }));
};
// Attribute order is React's business; compare parsed opening tags instead.
function tags(html, where = () => true) {
  const found = [];
  for (const [, name, attrs] of html.matchAll(/<([a-z0-9]+)([^>]*)>/g)) {
    const a = { tag: name };
    for (const [, key, value] of attrs.matchAll(/([\w:-]+)="([^"]*)"/g))
      a[key.toLowerCase()] = value;
    if (where(a)) found.push(a);
  }
  return found;
}
const days = (html) =>
  tags(html, (t) => t.tag === "button" && t["aria-label"]?.includes(", 20"));
const day = (html, name) =>
  days(html).find((t) => t["aria-label"].startsWith(name));
// Week rows of { date, outside } read from each gridcell's day button.
function weeks(html) {
  return html
    .split(/<[a-z]+[^>]*role="row"/)
    .slice(1)
    .filter((row) => /role="gridcell"/.test(row))
    .map((row) =>
      row
        .split(/(?=<[a-z]+[^>]*role="gridcell")/)
        .slice(1)
        .map((cell) => {
          const button = tags(cell, (t) => t.tag === "button")[0];
          return {
            date: cell.match(/<time[^>]*datetime="([^"]+)"/i)?.[1],
            outside: button && "data-outside" in button,
          };
        }),
    );
}
// Calendar arithmetic for expectations only; UTC has no DST.
const next = (iso) =>
  new Date(Date.parse(`${iso}T00:00:00Z`) + 864e5).toISOString().slice(0, 10);
const weekday = (iso) => new Date(`${iso}T00:00:00Z`).getUTCDay();
function assertWholeWeeks(html, { month, weekStartsOn, count }) {
  const rows = weeks(html);
  if (count !== undefined) assert.equal(rows.length, count, `${month} weeks`);
  for (const row of rows) assert.equal(row.length, 7, `${month}: 7 per row`);
  const dates = rows.flat().map((c) => c.date);
  assert.equal(weekday(dates[0]), weekStartsOn, `${month} starts the week`);
  for (let i = 1; i < dates.length; i++)
    assert.equal(
      dates[i],
      next(dates[i - 1]),
      `${month}: after ${dates[i - 1]}`,
    );
  const inside = rows
    .flat()
    .filter((c) => !c.outside)
    .map((c) => c.date);
  assert.ok(
    inside.every((d) => d.startsWith(month)),
    `${month} inside days`,
  );
  assert.ok(
    rows.flat().every((c) => c.outside === !c.date.startsWith(month)),
    `${month}: data-outside marks exactly the adjacent-month days`,
  );
  return inside;
}

// Renders the same props in a fresh Node process under another time zone.
const root = fileURLToPath(new URL("..", import.meta.url));
function renderInZone(zone, list) {
  const script = `
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    const UI = await import("./dist/index.js");
    const offset = new Date(2026, 0, 12).getTimezoneOffset();
    const html = typeof UI.Calendar === "function"
      ? JSON.parse(process.argv[1]).map((p) =>
          renderToStaticMarkup(React.createElement(UI.Calendar, { ...p, onChange() {} })))
      : null;
    console.log(JSON.stringify({ offset, html }));
  `;
  const out = execFileSync(
    process.execPath,
    ["--input-type=module", "-e", script, JSON.stringify(list)],
    { cwd: root, env: { ...process.env, TZ: zone }, encoding: "utf8" },
  );
  const result = JSON.parse(out);
  assert.ok(result.html, "Calendar is exported");
  return result;
}
const { onChange, ...plain } = base;
const zoneCases = [
  {
    ...plain,
    min: "2025-12-01",
    max: "2026-03-31",
    disabledDates: ["2026-01-15"],
    events: [{ id: "a", date: "2026-01-12", title: "Design review" }],
  },
  { ...plain, value: "2025-12-31" },
  { ...plain, value: null, month: "2026-03" },
  { ...plain, value: null, month: "2026-10", weekStartsOn: 0 },
  { ...plain, value: null, month: "2026-11", weekStartsOn: 0 },
  { ...plain, value: "2028-02-29", weekStartsOn: 0 },
];

test("Calendar markup is identical in every time zone", () => {
  const zones = {
    "America/Los_Angeles": 480,
    "Pacific/Kiritimati": -840,
    UTC: 0,
  };
  const results = Object.entries(zones).map(([zone, offset]) => {
    const result = renderInZone(zone, zoneCases);
    assert.equal(result.offset, offset, `${zone} is in effect`);
    return result.html;
  });
  for (const html of results.slice(1)) assert.deepEqual(html, results[0]);
  // Identical and also right: the 12th is a Monday everywhere.
  const [january] = results[0];
  assert.match(january, />January 2026</);
  assert.equal(
    day(january, "Monday, January 12, 2026")?.["aria-current"],
    "date",
  );
  assert.match(january, /<time[^>]*datetime="2026-01-12"[^>]*>12<\/time>/i);
  assert.equal(weeks(january)[0][0].date, "2025-12-29");
  assert.equal(
    renderInZone("UTC", [zoneCases[0]]).html[0],
    render(zoneCases[0]),
  );
});

test("Calendar months stay consecutive across DST changes", () => {
  const months = [
    ["2026-03", 0],
    ["2026-03", 1],
    ["2026-10", 0],
    ["2026-10", 1],
    ["2026-11", 0],
    ["2026-11", 1],
  ];
  const list = months.map(([month, weekStartsOn]) => ({
    ...plain,
    value: null,
    month,
    weekStartsOn,
  }));
  for (const zone of ["America/New_York", "Europe/London"]) {
    const { html } = renderInZone(zone, list);
    html.forEach((markup, i) => {
      const [month, weekStartsOn] = months[i];
      const inside = assertWholeWeeks(markup, { month, weekStartsOn });
      const length = { "2026-03": 31, "2026-10": 31, "2026-11": 30 }[month];
      assert.equal(inside.length, length, `${zone} ${month}`);
      assert.equal(new Set(inside).size, length, `${zone} ${month} unique`);
    });
  }
});

test("Calendar is a labelled group around a month grid named by its heading", () => {
  const html = render();
  const [root] = tags(html);
  assert.equal(root.tag, "div");
  assert.match(root.class, /^m-calendar\b/);
  assert.equal(root.role, "group");
  assert.equal(root["aria-label"], "Choose a date");
  const [heading] = tags(html, (t) => t.tag === "h2");
  assert.ok(heading?.id, html);
  assert.equal(heading["aria-live"], "polite");
  assert.match(html, new RegExp(`id="${heading.id}"[^>]*>January 2026</h2>`));
  const [grid] = tags(html, (t) => t.role === "grid");
  assert.equal(grid?.["aria-labelledby"], heading.id);
  assert.ok(days(html).every((t) => /\bm-calendar-day\b/.test(t.class)));
  assert.ok(days(html).every((t) => t.type === "button"));
});

test("Calendar navigation buttons are named by label with hidden icons", () => {
  const html = render();
  for (const label of ["Previous month", "Next month"]) {
    const inner = html.match(
      new RegExp(`<button[^>]*aria-label="${label}"[^>]*>([^]*?)</button>`),
    )?.[1];
    assert.ok(inner, label);
    assert.match(inner, /^<(svg|span)[^>]*aria-hidden="true"/, label);
    assert.equal(
      inner.replace(/<(svg|span)[^>]*aria-hidden="true"[^>]*>[^]*?<\/\1>/g, ""),
      "",
      `${label}: nothing but the hidden icon`,
    );
  }
});

test("Calendar weekday headers show short names and label full names", () => {
  const headers = (html) =>
    [
      ...html.matchAll(
        /<([a-z]+)([^>]*role="columnheader"[^>]*)>([^]*?)<\/\1>/g,
      ),
    ].map(([, , attrs, inner]) => ({
      name: attrs.match(/aria-label="([^"]*)"/)?.[1],
      text: inner.replace(/<[^>]+>/g, ""),
    }));
  assert.deepEqual(headers(render()), [
    { name: "Monday", text: "Mon" },
    { name: "Tuesday", text: "Tue" },
    { name: "Wednesday", text: "Wed" },
    { name: "Thursday", text: "Thu" },
    { name: "Friday", text: "Fri" },
    { name: "Saturday", text: "Sat" },
    { name: "Sunday", text: "Sun" },
  ]);
  const fr = render({ locale: "fr-FR" });
  assert.match(fr, />janvier 2026</);
  assert.equal(headers(fr)[0].name, "lundi");
});

test("Calendar weeks start on Sunday unless weekStartsOn says otherwise", () => {
  const first = (html) =>
    tags(html, (t) => t.role === "columnheader")[0]["aria-label"];
  const { weekStartsOn, ...unset } = base;
  assert.equal(typeof UI.Calendar, "function", "Calendar is exported");
  const fallback = renderToStaticMarkup(h(UI.Calendar, unset));
  assert.equal(first(render({ weekStartsOn: undefined })), "Sunday");
  assert.equal(first(fallback), "Sunday");
  assertWholeWeeks(fallback, { month: "2026-01", weekStartsOn: 0, count: 5 });
  assert.equal(first(render({ weekStartsOn: 0 })), "Sunday");
  // The locale never decides the week start; only the prop does.
  for (const locale of ["en-GB", "fr-FR", "de-DE"])
    assertWholeWeeks(render({ ...unset, weekStartsOn: undefined, locale }), {
      month: "2026-01",
      weekStartsOn: 0,
    });
  const saturday = render({ weekStartsOn: 6 });
  assert.equal(first(saturday), "Saturday");
  assertWholeWeeks(saturday, { month: "2026-01", weekStartsOn: 6, count: 6 });
  const cells = weeks(saturday).flat();
  assert.equal(cells[0].date, "2025-12-27");
  assert.equal(cells.at(-1).date, "2026-02-06");
});

test("Calendar fills whole weeks with exactly the adjacent-month days", () => {
  const html = render();
  assertWholeWeeks(html, { month: "2026-01", weekStartsOn: 1, count: 5 });
  assert.deepEqual(
    weeks(html)
      .flat()
      .filter((c) => c.outside)
      .map((c) => c.date),
    ["2025-12-29", "2025-12-30", "2025-12-31", "2026-02-01"],
  );
  assert.match(days(html)[0]["aria-label"], /^Monday, December 29, 2025/);
  assert.match(html, /<time[^>]*datetime="2026-01-12"[^>]*>12<\/time>/i);
  // Six-week months render six rows rather than overflowing or truncating.
  for (const month of ["2026-03", "2026-08"])
    assertWholeWeeks(render({ value: null, month }), {
      month,
      weekStartsOn: 1,
      count: 6,
    });
});

test("Calendar knows leap years and month lengths", () => {
  const inside = (month) =>
    assertWholeWeeks(render({ value: null, month, weekStartsOn: 0 }), {
      month,
      weekStartsOn: 0,
    });
  assert.equal(inside("2028-02").at(-1), "2028-02-29");
  assert.equal(inside("2028-02").length, 29);
  assert.equal(inside("2027-02").at(-1), "2027-02-28");
  assert.equal(inside("2027-02").length, 28);
  assert.equal(inside("2026-04").length, 30);
  assert.equal(inside("2025-12").length, 31);
});

test("Calendar marks the selected cell, today and a single tab stop", () => {
  const html = render({ value: "2026-01-20" });
  const cells = tags(html, (t) => t.role === "gridcell");
  assert.ok(cells.every((c) => ["true", "false"].includes(c["aria-selected"])));
  assert.equal(cells.filter((c) => c["aria-selected"] === "true").length, 1);
  const selected = html
    .split(/(?=<[a-z]+[^>]*role="gridcell")/)
    .filter((part) => tags(part)[0]?.["aria-selected"] === "true");
  assert.match(selected[0], /aria-label="Tuesday, January 20, 2026/);
  assert.equal(day(html, "Monday, January 12, 2026")["aria-current"], "date");
  assert.equal(
    day(html, "Tuesday, January 20, 2026")["aria-current"],
    undefined,
  );
  const stops = days(html).filter((t) => t.tabindex === "0");
  assert.equal(stops.length, 1);
  assert.match(stops[0]["aria-label"], /^Tuesday, January 20, 2026/);
  assert.ok(days(html).every((t) => ["0", "-1"].includes(t.tabindex)));
  const none = render({ value: null });
  assert.match(
    days(none).find((t) => t.tabindex === "0")["aria-label"],
    /^Monday, January 12, 2026/,
  );
  assert.ok(
    tags(none, (t) => t.role === "gridcell").every(
      (c) => c["aria-selected"] === "false",
    ),
  );
});

test("Calendar shows the month of value, or the controlled month", () => {
  assert.match(render({ value: "2026-03-05" }), />March 2026</);
  assert.match(render({ month: "2026-02" }), />February 2026</);
  assert.match(render({ value: null, today: "2025-11-30" }), />November 2025</);
  // A selected outside day belongs to its own month.
  assert.match(render({ value: "2025-12-31" }), />December 2025</);
});

test("Calendar requires today instead of reading the clock", () => {
  const types = read("../dist/display.d.ts");
  const props = types.match(/(?:interface|type) CalendarProps\b[^]*?\n\}/)?.[0];
  assert.ok(props, "CalendarProps is declared in dist/display.d.ts");
  assert.match(props, /\btoday: string;/);
  assert.doesNotMatch(props, /\btoday\?:/);
});

test("Calendar marks out-of-range and disabled dates unavailable but focusable", () => {
  const html = render({
    min: "2026-01-05",
    max: "2026-01-28",
    disabledDates: ["2026-01-15"],
    isDateDisabled: (date) => date === "2026-01-22",
  });
  for (const name of [
    "Sunday, January 4, 2026",
    "Thursday, January 15, 2026",
    "Thursday, January 22, 2026",
    "Thursday, January 29, 2026",
  ]) {
    const button = day(html, name);
    assert.equal(button?.["aria-disabled"], "true", name);
    assert.equal(button.disabled, undefined, `${name} stays focusable`);
  }
  assert.equal(
    day(html, "Monday, January 5, 2026")["aria-disabled"],
    undefined,
  );
  const nav = (label) =>
    tags(html, (t) => t.tag === "button" && t["aria-label"] === label)[0];
  for (const label of ["Previous month", "Next month"]) {
    assert.match(nav(label)?.class ?? "", /\bm-button\b/, "reuses Button");
    assert.ok("disabled" in nav(label), `${label} disabled at the bound`);
  }
  const open = render({ min: "2025-12-01", max: "2026-03-31" });
  assert.ok(
    tags(open, (t) => t["aria-label"] === "Next month").every(
      (t) => !("disabled" in t),
    ),
  );
});

test("Calendar navigation labels are props, not fixed copy", () => {
  const html = render({
    locale: "fr-FR",
    previousLabel: "Mois précédent",
    nextLabel: "Mois suivant",
  });
  assert.match(html, /aria-label="Mois précédent"/);
  assert.match(html, /aria-label="Mois suivant"/);
  assert.doesNotMatch(html, /Previous month|Next month/);
});

test("Calendar disabled turns off navigation and every day", () => {
  const html = render({ disabled: true });
  const buttons = tags(html, (t) => t.tag === "button");
  assert.ok(buttons.length >= 37, "35 days and two navigation buttons");
  assert.ok(buttons.every((b) => "disabled" in b));
});

test("Calendar lists the selected day's events and counts events per day", () => {
  const events = [
    { id: "a", date: "2026-01-12", title: "Design review", time: "10:00" },
    {
      id: "b",
      date: "2026-01-12",
      title: "Team sync",
      time: "14:00",
      href: "#sync",
    },
    { id: "c", date: "2026-01-21", title: "Release planning" },
  ];
  const html = render({ events });
  assert.match(day(html, "Monday, January 12")["aria-label"], /, 2 events$/);
  assert.match(day(html, "Wednesday, January 21")["aria-label"], /, 1 event$/);
  const section = html.match(
    /<section[^>]*class="m-calendar-events"[^>]*>[^]*?<\/section>/,
  )?.[0];
  assert.ok(section, html);
  const heading = section.match(/aria-labelledby="([^"]+)"/)?.[1];
  assert.match(
    section,
    new RegExp(`id="${heading}"[^>]*>Monday, January 12, 2026<`),
  );
  assert.match(section, /<ol/);
  assert.match(section, /10:00[^]*Design review/);
  assert.match(section, /<a href="#sync"[^>]*>[^]*Team sync/);
  assert.doesNotMatch(section, /Release planning/);
  const empty = render({ events, value: "2026-01-13" });
  assert.match(empty, /class="m-calendar-events"[^]*No events/);
  assert.match(
    render({ events: [], emptyEventsLabel: "No records" }),
    /No records/,
  );
  assert.match(
    render({ events, eventCountLabel: (n) => `${n} rendez-vous` }),
    /aria-label="Monday, January 12, 2026, 2 rendez-vous"/,
  );
  assert.doesNotMatch(render(), /m-calendar-events/);
});

test("Calendar contract matches its data-display siblings", () => {
  const { components } = JSON.parse(read("../catalog.json"));
  const c = components.find((x) => x.export === "Calendar");
  assert.ok(c, "catalogue entry (npm run catalog)");
  assert.equal(c.id, "mortar-calendar");
  assert.equal(c.source, "src/display.tsx");
  assert.equal(c.kitId, "application");
  assert.equal(c.preview.source, "previews/CalendarPreview.tsx");
  assert.deepEqual(c.contract.dependencies, ["mortar-button"]);
  assert.deepEqual(c.testing, {
    profile: "control",
    target: ".m-calendar",
    probe: "calendar",
    states: ["disabled", "empty", "long"],
  });
  assert.ok(c.integrity?.source && c.integrity?.preview);
  assert.equal(probes.Calendar, "calendar");
  assert.match(
    read("../src/index.ts"),
    /export \{[^}]*\bCalendar\b[^}]*\} from "\.\/display\.js"/,
  );
  assert.match(
    read("../src/index.ts"),
    /export type \{[^}]*\bCalendarEvent\b[^}]*\} from "\.\/display\.js"/,
  );
  assert.match(
    read("../src/index.ts"),
    /export type \{[^}]*\bCalendarProps\b[^}]*\} from "\.\/display\.js"/,
  );
  const { kits } = JSON.parse(read("../playground/taxonomy.json"));
  const data = kits
    .find((k) => k.id === "application")
    .categories.find((x) => x.id === "data");
  assert.ok(data.components.includes("Calendar"));
});

// Rules and their enclosing at-rules; keep declarations on nested parents too.
function cssRules(css) {
  const rules = [];
  const stack = [];
  let buffer = "";
  for (const ch of css.replace(/\/\*[^]*?\*\//g, "")) {
    if (ch === "{") {
      const split = buffer.lastIndexOf(";") + 1;
      if (stack.length) stack.at(-1).body += buffer.slice(0, split);
      stack.push({ prelude: buffer.slice(split).trim(), body: "" });
      buffer = "";
    } else if (ch === "}") {
      const node = stack.pop();
      if (node)
        rules.push({
          selector: node.prelude,
          body: node.body + buffer,
          context: stack.map((n) => n.prelude),
        });
      buffer = "";
    } else buffer += ch;
  }
  return rules;
}
const touchesCalendar = ({ selector, context }) =>
  [selector, ...context].some((s) =>
    /\.m-calendar\b|\[data-(?:outside|calendar[\w-]*)\b|\[role\s*=\s*["']?(?:grid|gridcell|columnheader)\b|\[datetime\b/.test(
      s,
    ),
  );

test("Calendar styles live in a kits.css components layer", () => {
  assert.equal(
    cssRules(read("../src/components.css")).filter(touchesCalendar).length,
    0,
    "components.css holds foundation primitives only",
  );
  const rules = cssRules(read("../src/kits.css")).filter(touchesCalendar);
  assert.ok(rules.length > 0, "calendar rules exist");
  for (const { selector, context } of rules) {
    assert.ok(context.includes("@layer components"), `${selector}: layer`);
    if (!selector.startsWith("@"))
      for (const part of selector.split(","))
        assert.ok(
          /\.m-calendar\b/.test(part) ||
            (part.includes("&") &&
              context.some((s) => /\.m-calendar\b/.test(s))),
          `${part.trim()}: scope it`,
        );
  }
});

test("Calendar styles use semantic tokens only", () => {
  const rules = cssRules(read("../src/kits.css")).filter(touchesCalendar);
  assert.ok(rules.length > 0, "calendar rules exist");
  const sized = new Set();
  for (const { selector, body, context } of rules) {
    const where = selector;
    for (const s of [selector, ...context])
      assert.doesNotMatch(
        s,
        /\[data-mortar-appearance|\[data-theme|prefers-color-scheme|\.dark\b|:root/,
        `${where}: appearance comes from tokens, not selectors`,
      );
    assert.doesNotMatch(
      body,
      /(?:^|[;\s])--m-[\w-]+\s*:/,
      `${where}: new token`,
    );
    assert.doesNotMatch(body, /#[0-9a-f]{3,8}\b/i, `${where}: hex colour`);
    assert.doesNotMatch(
      body,
      /\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color)\(/i,
      where,
    );
    assert.doesNotMatch(
      body,
      /(?<![\w-])(?:white|black|gray|grey|silver|red|blue|green)(?![\w-])/i,
      `${where}: named colour`,
    );
    const declarations = body
      .split(";")
      .map((d) => d.split(/:(.*)/s).map((x) => x?.trim()))
      .filter(([property, value]) => property && value);
    for (const [property, value] of declarations) {
      if (
        /^(?:color|background(?:-color)?|border(?:-[a-z]+)*-color|outline-color|fill|stroke)$/.test(
          property,
        )
      )
        assert.match(
          value,
          /^(?:var\(--m-[a-z0-9-]+\)|transparent|currentColor|inherit|none)$/,
          `${where}: ${property}: ${value}`,
        );
      if (/^border(?:-[a-z]+)*-radius$/.test(property))
        assert.match(
          value,
          /^(?:var\(--m-radius(?:-[a-z]+)?\)|50%)$/,
          `${where}: ${property}: ${value}`,
        );
      if (
        /^(?:border(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?|outline|box-shadow|text-shadow)$/.test(
          property,
        )
      ) {
        const literal = value
          .replace(/var\(--m-[\w-]+\)/g, "")
          .replace(
            /\b(?:none|inherit|initial|unset|transparent|currentColor|inset|solid|dotted|dashed|double|groove|ridge|hidden|outset)\b/gi,
            "",
          )
          .replace(/-?(?:\d*\.)?\d+(?:px|rem|em|%)?/g, "")
          .replace(/[\s,]/g, "");
        assert.equal(
          literal,
          "",
          `${where}: ${property} must use token colours`,
        );
      }
      if (
        /\.m-calendar-day\b/.test([selector, ...context].join(" ")) &&
        /^(?:height|block-size|min-(?:height|width|block-size|inline-size))$/.test(
          property,
        )
      ) {
        assert.match(
          value,
          /^(?:var\(--m-control\)|calc\([^;]*var\(--m-control\)[^;]*\))$/,
          `${where}: ${property}`,
        );
        sized.add(
          property.includes("width") || property.includes("inline")
            ? "width"
            : "height",
        );
      }
    }
    if (/:focus-visible/.test(selector))
      assert.doesNotMatch(body, /outline/, `${where}: reuse the shared ring`);
  }
  assert.deepEqual(
    [...sized].sort(),
    ["height", "width"],
    "day cells take their height and minimum width from var(--m-control)",
  );
});

test("Calendar adds no dependencies", () => {
  const pkg = JSON.parse(read("../package.json"));
  assert.deepEqual(Object.keys(pkg.dependencies), ["@headlessui/react"]);
});
