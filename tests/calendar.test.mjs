import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Calendar, StackedShell, AppShell } from "../dist/index.js";
const h = React.createElement;
const html = (type, props, ...children) =>
  renderToStaticMarkup(h(type, props, ...children));
const days = (markup) =>
  [...markup.matchAll(/data-date="(\d{4}-\d{2}-\d{2})"/g)].map((m) => m[1]);

test("Calendar lays out six whole weeks starting on the chosen weekday", () => {
  const monday = html(Calendar, {
    month: "2026-10",
    today: "2026-10-17",
    locale: "en-GB",
  });
  const cells = days(monday);
  assert.equal(cells.length, 42);
  assert.equal(cells[0], "2026-09-28");
  assert.equal(cells[41], "2026-11-08");
  assert.match(monday, /<h2 id="[^"]+" aria-live="polite">October 2026<\/h2>/);
  const sunday = days(
    html(Calendar, { month: "2026-10", today: "2026-10-17", weekStartsOn: 0 }),
  );
  assert.equal(sunday[0], "2026-09-27");
});

test("Calendar crosses a leap day and year boundary without time-zone drift", () => {
  const feb = days(html(Calendar, { month: "2028-02", today: "2028-02-01" }));
  assert.ok(feb.includes("2028-02-29"));
  assert.ok(!feb.includes("2028-02-30"));
  const dec = days(html(Calendar, { month: "2026-12", today: "2026-12-01" }));
  assert.equal(dec.at(-1), "2027-01-10");
});

test("Calendar exposes a grid with one tab stop, today, selection and event counts", () => {
  const markup = html(Calendar, {
    month: "2026-10",
    today: "2026-10-17",
    selected: "2026-10-20",
    locale: "en-GB",
    events: [
      { id: "a", date: "2026-10-20", title: "Design review", time: "10:00" },
      { id: "b", date: "2026-10-20", title: "Retro" },
    ],
  });
  const grid = markup.match(/<table role="grid" aria-labelledby="([^"]+)"/);
  assert.ok(grid, markup);
  assert.match(markup, new RegExp(`<h2 id="${grid[1]}"`));
  assert.equal(markup.match(/tabindex="0"/g)?.length, 1);
  assert.match(
    markup,
    /<td aria-selected="true"[^>]*><button[^>]*tabindex="0"[^>]*aria-label="Tuesday, 20 October 2026, 2 events"/,
  );
  assert.match(
    markup,
    /aria-current="date"[^>]*aria-label="Saturday, 17 October 2026"/,
  );
  assert.match(markup, /<th scope="col" abbr="Monday">/);
  assert.match(markup, /aria-label="Previous month"/);
  assert.match(markup, /aria-label="Next month"/);
});

test("full Calendar lists event titles in their day cells", () => {
  const markup = html(Calendar, {
    month: "2026-10",
    today: "2026-10-17",
    variant: "full",
    events: [
      { id: "a", date: "2026-10-20", title: "Design review", time: "10:00" },
      { id: "b", date: "2026-10-20", title: "Retro" },
      { id: "c", date: "2026-10-20", title: "1:1" },
    ],
  });
  assert.match(markup, /data-variant="full"/);
  assert.match(markup, /<li><time>10:00<\/time> Design review<\/li>/);
  assert.match(markup, /<li>Retro<\/li>/);
  assert.match(markup, /<li class="m-calendar-more">\+1 more<\/li>/);
});

test("StackedShell puts a skip link, navbar and labelled main region in order", () => {
  const markup = html(StackedShell, {
    brand: "Northwind",
    navigation: [{ label: "Dashboard", href: "#d", current: true }],
    header: h("h1", {}, "Dashboard"),
    children: "Body",
  });
  const target = markup.match(
    /<a class="m-skip" href="#([^"]+)">Skip to content<\/a>/,
  )?.[1];
  assert.ok(target, markup);
  assert.ok(markup.indexOf("m-navbar") > markup.indexOf("m-skip"));
  assert.match(markup, new RegExp(`<main id="${target}" tabindex="-1"`));
  assert.match(
    markup,
    /<div class="m-stacked-header"><h1>Dashboard<\/h1><\/div>/,
  );
});

test("AppShell adds a labelled secondary column only when given one", () => {
  const props = {
    brand: "Northwind",
    navigation: [{ label: "Overview", href: "#o" }],
    children: "Body",
  };
  const plain = html(AppShell, props);
  assert.doesNotMatch(plain, /m-app-columns|<aside class="m-app-aside"/);
  const columns = html(AppShell, {
    ...props,
    aside: "Activity",
    asideLabel: "Recent activity",
  });
  assert.match(
    columns,
    /<div class="m-app-columns"><main id="m-content" tabindex="-1">Body<\/main><aside class="m-app-aside" aria-label="Recent activity">Activity<\/aside><\/div>/,
  );
});
