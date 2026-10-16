import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

test("Calendar is a labelled group around a month grid named by its heading", () => {
  const html = render();
  const [root] = tags(html);
  assert.equal(root.tag, "div");
  assert.match(root.class, /^m-calendar\b/);
  assert.equal(root.role, "group");
  assert.equal(root["aria-label"], "Choose a date");
  const id = html.match(/<h2[^>]*id="([^"]+)"[^>]*>January 2026<\/h2>/)?.[1];
  assert.ok(id, html);
  const [grid] = tags(html, (t) => t.role === "grid");
  assert.equal(grid?.["aria-labelledby"], id);
});

test("Calendar weekday headers follow weekStartsOn and locale", () => {
  const names = (html) =>
    tags(html, (t) => t.role === "columnheader").map((t) => t["aria-label"]);
  assert.deepEqual(names(render()), [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ]);
  assert.equal(names(render({ weekStartsOn: 0 }))[0], "Sunday");
  const fr = render({ locale: "fr-FR" });
  assert.match(fr, />janvier 2026</);
  assert.equal(names(fr)[0], "lundi");
});

test("Calendar fills whole weeks of gridcells with adjacent-month days", () => {
  const html = render();
  const rows = html.split(/<[a-z]+[^>]*role="row"/).slice(1);
  // The first row holds the column headers; every following row is one week.
  const weeks = rows.filter((r) => /role="gridcell"/.test(r));
  assert.ok(weeks.length >= 5, html);
  for (const week of weeks)
    assert.equal(week.match(/role="gridcell"/g).length, 7);
  const first = days(html)[0];
  assert.match(first["aria-label"], /^Monday, December 29, 2025/);
  assert.ok("data-outside" in first || /data-outside/.test(html));
  assert.match(html, /<time[^>]*datetime="2026-01-12"[^>]*>12<\/time>/i);
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
  assert.ok(buttons.length > 30);
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
  const { kits } = JSON.parse(read("../playground/taxonomy.json"));
  const data = kits
    .find((k) => k.id === "application")
    .categories.find((x) => x.id === "data");
  assert.ok(data.components.includes("Calendar"));
});

test("Calendar styles use semantic tokens only", () => {
  const css = read("../src/components.css") + read("../src/kits.css");
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([, s]) =>
    s.includes(".m-calendar"),
  );
  assert.ok(rules.length > 0, "calendar rules exist");
  for (const [, selector, body] of rules) {
    const where = selector.trim();
    assert.doesNotMatch(body, /#[0-9a-f]{3,8}\b/i, `${where}: hex colour`);
    assert.doesNotMatch(body, /\b(?:rgba?|hsla?|oklch|lab|lch)\(/i, where);
    assert.doesNotMatch(
      body,
      /(?<![\w-])(?:white|black|gray|grey|silver|red|blue|green)(?![\w-])/i,
      `${where}: named colour`,
    );
    for (const [, value] of body.matchAll(
      /(?:^|;)\s*(?:color|background(?:-color)?|border(?:-[a-z]+)*-color|outline-color|fill|stroke)\s*:\s*([^;]+)/g,
    ))
      assert.match(
        value.trim(),
        /^(?:var\(--m-[a-z0-9-]+\)|transparent|currentColor|inherit|none)$/,
        `${where}: ${value.trim()}`,
      );
    for (const [px] of body.matchAll(/(?<![\w.-])\d*\.?\d+px\b/g))
      assert.equal(px, "1px", `${where}: raw ${px}; use a token`);
    if (/:focus-visible/.test(selector))
      assert.doesNotMatch(body, /outline/, `${where}: reuse the shared ring`);
  }
});

test("Calendar adds no dependencies", () => {
  const pkg = JSON.parse(read("../package.json"));
  assert.deepEqual(Object.keys(pkg.dependencies), ["@headlessui/react"]);
});
