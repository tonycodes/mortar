import test from "node:test";
import assert from "node:assert/strict";
import { html, Calendar } from "./support/render.mjs";
const base = {
  view: "year",
  today: "2026-10-21",
  selected: "2026-03-14",
  locale: "en-GB",
  events: [{ id: "a", date: "2026-07-04", title: "Offsite" }],
};

test("year view shows twelve labelled months with one tab stop", () => {
  const markup = html(Calendar, base);
  assert.match(markup, /data-view="year"/);
  assert.match(
    markup,
    /<h2 id="[^"]+" class="m-calendar-title" aria-live="polite">2026<\/h2>/,
  );
  const months = [
    ...markup.matchAll(
      /<section class="m-calendar-month" aria-labelledby="([^"]+)"><h3 id="\1" class="m-calendar-month-title">([^<]+)<\/h3>/g,
    ),
  ].map((m) => m[2]);
  assert.deepEqual(months.slice(0, 2), ["January", "February"]);
  assert.equal(months.length, 12);
  assert.equal(months[11], "December");
  assert.equal(markup.match(/tabindex="0"/g)?.length, 1);
  assert.match(
    markup,
    /<button[^>]*tabindex="0"[^>]*aria-label="Saturday, 14 March 2026"/,
  );
  assert.match(
    markup,
    /aria-pressed="true"[^>]*aria-label="Saturday, 14 March 2026"|aria-label="Saturday, 14 March 2026"[^>]*aria-pressed="true"/,
  );
  assert.match(
    markup,
    /aria-current="date"[^>]*aria-label="Wednesday, 21 October 2026"/,
  );
  assert.match(markup, /aria-label="Saturday, 4 July 2026, 1 event"/);
  assert.match(markup, /aria-label="Previous year"/);
  assert.match(markup, /aria-label="Next year"/);
  // Only real days of each month are buttons: 365 in 2026.
  assert.equal(markup.match(/data-date="/g)?.length, 365);
});

test("year view headers name each weekday and the switcher offers Year", () => {
  const markup = html(Calendar, { ...base, onViewChange() {} });
  assert.match(markup, /<th scope="col" abbr="Monday">M<\/th>/);
  assert.match(markup, /aria-pressed="true">Year<\/button>/);
});

test("the switcher offers Year in every view and the month view is unchanged", () => {
  const month = html(Calendar, { ...base, view: "month", onViewChange() {} });
  assert.match(month, /<table role="grid"/);
  assert.match(month, />Year<\/button>/);
});
