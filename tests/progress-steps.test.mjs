import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProgressSteps, Tabs } from "../dist/index.js";
const h = React.createElement;
const html = (type, props) => renderToStaticMarkup(h(type, props));
const steps = [
  { id: "a", name: "Job details", href: "#a", status: "complete" },
  { id: "b", name: "Application form", status: "current" },
  { id: "c", name: "Preview", description: "Check it", status: "upcoming" },
];

test("ProgressSteps marks the current step and announces completed ones", () => {
  const markup = html(ProgressSteps, { label: "Job application", steps });
  assert.match(
    markup,
    /^<nav class="m-progress-steps" aria-label="Job application" data-variant="simple"><ol>/,
  );
  assert.match(
    markup,
    /<li data-status="complete"><a href="#a"><span class="m-progress-step-text"><span class="m-progress-step-number">Step 1<\/span><span class="m-progress-step-name">Job details<\/span><span class="m-sr-only"> \(completed\)<\/span><\/span><\/a><\/li>/,
  );
  assert.match(markup, /<li data-status="current"><span aria-current="step">/);
  assert.equal((markup.match(/aria-current/g) || []).length, 1);
});

test("ProgressSteps variants: circles show descriptions, bullets count steps", () => {
  const circles = html(ProgressSteps, { steps, variant: "circles" });
  assert.match(
    circles,
    /<span class="m-progress-step-marker" aria-hidden="true"><svg/,
  );
  assert.match(
    circles,
    /<span class="m-progress-step-description">Check it<\/span>/,
  );
  const bullets = html(ProgressSteps, { steps, variant: "bullets" });
  assert.match(bullets, /<p>Step 2 of 3<\/p>/);
  assert.match(
    bullets,
    /<span class="m-sr-only"><span class="m-progress-step-name">/,
  );
  assert.doesNotMatch(bullets, /m-progress-step-description/);
});

test("Tabs keeps its default markup and adds pills and full width", () => {
  const items = [{ id: "a", label: "A", content: "a" }];
  const base = { label: "T", value: "a", onChange() {}, items };
  assert.match(
    html(Tabs, base),
    /<div class="m-tabs" role="tablist" aria-label="T">/,
  );
  assert.match(
    html(Tabs, { ...base, variant: "pills", fullWidth: true }),
    /<div class="m-tabs" role="tablist" aria-label="T" data-variant="pills" data-full-width="true">/,
  );
});
