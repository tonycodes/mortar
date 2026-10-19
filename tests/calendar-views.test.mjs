import test from "node:test";
import assert from "node:assert/strict";
import { html, Calendar } from "./support/render.mjs";
const events = [
  {
    id: "a",
    date: "2026-10-20",
    title: "Design review",
    start: "10:00",
    end: "11:30",
  },
  {
    id: "b",
    date: "2026-10-20",
    title: "Customer call",
    start: "10:30",
    end: "11:00",
  },
  { id: "c", date: "2026-10-22", title: "Offsite" },
  {
    id: "d",
    date: "2026-10-27",
    title: "Following week",
    start: "09:00",
    end: "10:00",
  },
];
const base = {
  today: "2026-10-21",
  selected: "2026-10-20",
  locale: "en-GB",
  events,
};

test("week view shows the selected week as labelled day groups", () => {
  const markup = html(Calendar, { ...base, view: "week" });
  assert.match(markup, /data-view="week"/);
  assert.match(
    markup,
    /<h2 id="[^"]+" class="m-calendar-title" aria-live="polite">19\s.\s25 October 2026<\/h2>/,
  );
  const days = [
    ...markup.matchAll(
      /<div role="group" class="m-calendar-column"[^>]*aria-labelledby="([^"]+)"[^>]*><h3 id="\1" class="m-calendar-column-heading"/g,
    ),
  ];
  assert.equal(days.length, 7);
  // Seven day landmarks would crowd the landmark list.
  assert.doesNotMatch(markup, /<section/);
  assert.match(
    markup,
    /<span class="m-sr-only">Monday, 19 October 2026<\/span>/,
  );
  assert.match(
    markup,
    /<span class="m-sr-only">Sunday, 25 October 2026<\/span>/,
  );
  assert.doesNotMatch(markup, /Following week/);
  assert.match(markup, /aria-label="Previous week"/);
  assert.match(markup, /aria-label="Next week"/);
  // The month grid is not rendered in time views.
  assert.doesNotMatch(markup, /role="grid"/);
});

test("timed events are listed in order with times; untimed ones are all-day", () => {
  const markup = html(Calendar, { ...base, view: "week" });
  const tuesday = markup.slice(
    markup.indexOf("Tuesday, 20 October 2026"),
    markup.indexOf("Wednesday, 21 October 2026"),
  );
  assert.ok(
    tuesday.indexOf("Design review") < tuesday.indexOf("Customer call"),
  );
  assert.match(tuesday, /<time>10:00<\/time>–<time>11:30<\/time>/);
  // Overlapping events share the column in two lanes.
  assert.match(tuesday, /--m-lane:0;--m-lanes:2/);
  assert.match(tuesday, /--m-lane:1;--m-lanes:2/);
  // 10:00 with an 08:00 start over 11 hours: top = 120 / 660 minutes.
  assert.match(tuesday, /--m-top:18\.1818/);
  const thursday = markup.slice(markup.indexOf("Thursday, 22 October 2026"));
  assert.match(
    thursday,
    /<ul class="m-calendar-allday"[^>]*><li>Offsite<\/li><\/ul>/,
  );
  assert.match(markup, /aria-current="date"/);
});

test("day view shows one day and steps by day", () => {
  const markup = html(Calendar, { ...base, view: "day" });
  assert.equal(
    [...markup.matchAll(/<div role="group" class="m-calendar-column"/g)].length,
    1,
  );
  assert.match(
    markup,
    /<h2 id="[^"]+" class="m-calendar-title" aria-live="polite">Tuesday, 20 October 2026<\/h2>/,
  );
  assert.match(markup, /aria-label="Previous day"/);
  assert.match(markup, /Design review/);
});

test("events become buttons when selectable, and a view switcher appears on request", () => {
  const markup = html(Calendar, {
    ...base,
    view: "week",
    onEventSelect() {},
    onViewChange() {},
  });
  assert.match(
    markup,
    /<button type="button" class="m-calendar-event"[^>]*>Design review/,
  );
  assert.match(markup, /role="group" aria-label="Calendar view"/);
  assert.match(markup, /aria-pressed="true">Week<\/button>/);
});

test("month view is unchanged by default", () => {
  const markup = html(Calendar, base);
  assert.match(markup, /<table role="grid"/);
  assert.doesNotMatch(markup, /m-calendar-column"|Calendar view/);
});
