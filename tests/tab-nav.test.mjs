import test from "node:test";
import assert from "node:assert/strict";
import { h, html, SectionHeading, TabNav } from "./support/render.mjs";
const items = [
  { label: "General", href: "/general" },
  { label: "Billing", href: "/billing", current: true, count: 2 },
  { label: "Team", href: "/team", icon: h("svg") },
];

test("TabNav renders page links without ARIA tab roles", () => {
  const markup = html(TabNav, { label: "Settings", items });
  assert.match(
    markup,
    /^<nav class="m-tab-nav" aria-label="Settings"><ul><li><a href="\/general">General<\/a><\/li>/,
  );
  assert.match(
    markup,
    /<li><a href="\/billing" aria-current="page">Billing<span class="m-tab-count">2<\/span><\/a><\/li>/,
  );
  assert.match(
    markup,
    /<a href="\/team"><span class="m-tab-icon" aria-hidden="true"><svg><\/svg><\/span>Team<\/a>/,
  );
  assert.equal((markup.match(/aria-current/g) || []).length, 1);
  assert.doesNotMatch(markup, /role=|aria-selected/);
});

test("TabNav pills and full width use data attributes", () => {
  assert.match(
    html(TabNav, { label: "S", items, variant: "pills", fullWidth: true }),
    /^<nav class="m-tab-nav" aria-label="S" data-variant="pills" data-full-width="true">/,
  );
  assert.match(
    html(TabNav, { label: "S", items, variant: "underline" }),
    /^<nav class="m-tab-nav" aria-label="S"><ul>/,
  );
});

test("SectionHeading keeps its default markup and renders tabs below", () => {
  assert.equal(
    html(SectionHeading, { title: "Jobs", description: "Open roles" }),
    '<div class="m-section-heading" data-divider="true"><div class="m-section-heading-text"><h2 class="m-section-heading-title">Jobs</h2><p>Open roles</p></div></div>',
  );
  assert.equal(
    html(SectionHeading, { title: "Jobs", actions: "Add", divider: false }),
    '<div class="m-section-heading"><div class="m-section-heading-text"><h2 class="m-section-heading-title">Jobs</h2></div><div class="m-actions">Add</div></div>',
  );
  const withTabs = html(SectionHeading, {
    title: "Candidates",
    actions: "Add",
    tabs: h(TabNav, { label: "Stages", items }),
  });
  assert.match(
    withTabs,
    /<div class="m-actions">Add<\/div><div class="m-section-heading-tabs"><nav class="m-tab-nav" aria-label="Stages">/,
  );
});
