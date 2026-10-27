// #68 part 2: a decorative or informative network illustration with optional
// travelling signals. Motion behaviour (reduced motion, visibility, off-screen,
// pause/resume and cleanup) is exercised in the browser probe "network".
import test from "node:test";
import assert from "node:assert/strict";
import { html as markup, UI } from "./support/render.mjs";
import {
  declaration,
  readSource,
  section,
  selectorBody,
} from "./support/css.mjs";

const nodes = [
  { id: "a", x: 40, y: 60, label: "Source" },
  { id: "b", x: 200, y: 60, tone: "accent" },
  { id: "c", x: 120, y: 160, label: "Sink" },
];
const connections = [
  { from: "a", to: "b" },
  { from: "b", to: "c", signal: false },
  { from: "c", to: "missing" },
];
const props = { nodes, connections, width: 240, height: 200 };
const css = section(
  await readSource("src/marketing.css"),
  "NetworkIllustration",
);

test("decorative by default: the drawing is hidden from assistive technology", () => {
  const html = markup(UI.NetworkIllustration, props);
  assert.match(
    html,
    /^<div class="m-network" data-m-component="NetworkIllustration">/,
  );
  assert.match(
    html,
    /<svg viewBox="0 0 240 200" aria-hidden="true" focusable="false"/,
  );
  assert.doesNotMatch(html, /role="img"|<title|<desc|aria-live|role="status"/);
});

test("informative with a label: one named image with an optional description", () => {
  const html = markup(UI.NetworkIllustration, {
    ...props,
    label: "Three connected services",
    description: "Source sends to a hub, which sends to Sink.",
  });
  assert.match(
    html,
    /<svg viewBox="0 0 240 200" role="img" aria-labelledby="([^"]+)" aria-describedby="([^"]+)"/,
  );
  const [, title, desc] = html.match(
    /aria-labelledby="([^"]+)" aria-describedby="([^"]+)"/,
  );
  assert.match(
    html,
    new RegExp(`<title id="${title}">Three connected services</title>`),
  );
  assert.match(
    html,
    new RegExp(
      `<desc id="${desc}">Source sends to a hub, which sends to Sink.</desc>`,
    ),
  );
  assert.doesNotMatch(html, /aria-hidden="true" focusable="false"/);
});

test("nodes, labels and connections come from data; unknown ends are skipped", () => {
  const html = markup(UI.NetworkIllustration, props);
  assert.equal(html.match(/<circle class="m-network-node"/g).length, 3);
  assert.match(
    html,
    /<circle class="m-network-node" cx="200" cy="60" r="8" data-tone="accent"/,
  );
  assert.match(
    html,
    /<text class="m-network-label" x="40" y="84"[^>]*>Source<\/text>/,
  );
  assert.equal(html.match(/<line class="m-network-link"/g).length, 2);
  assert.match(
    html,
    /<line class="m-network-link" x1="40" y1="60" x2="200" y2="60"/,
  );
});

test("signals travel only on connections that carry one, with configurable timing", () => {
  const html = markup(UI.NetworkIllustration, {
    ...props,
    duration: 4,
    connections: [
      { from: "a", to: "b" },
      { from: "b", to: "c", duration: 2, delay: 1 },
      { from: "a", to: "c", signal: false },
    ],
  });
  const signals = html.match(/<circle class="m-network-signal"[^>]*>/g);
  assert.equal(signals.length, 2);
  assert.match(signals[0], /--m-signal-from:40px 60px/);
  assert.match(signals[0], /--m-signal-to:200px 60px/);
  assert.match(signals[0], /animation-duration:4s/);
  assert.match(signals[1], /animation-duration:2s/);
  assert.match(signals[1], /animation-delay:1s/);
});

test("the pause control is a real button and starts as Pause animation", () => {
  const html = markup(UI.NetworkIllustration, props);
  assert.match(
    html,
    /<button type="button" class="m-network-toggle">Pause animation<\/button><\/div>$/,
  );
  const paused = markup(UI.NetworkIllustration, { ...props, paused: true });
  assert.match(paused, /data-paused="user"/);
  assert.match(paused, />Play animation<\/button>/);
});

test("static: the same drawing with no signals and no control", () => {
  const html = markup(UI.NetworkIllustration, { ...props, motion: "static" });
  assert.match(html, /data-motion="static"/);
  assert.doesNotMatch(html, /m-network-signal|<button/);
  assert.equal(html.match(/<line class="m-network-link"/g).length, 2);
  const none = markup(UI.NetworkIllustration, {
    ...props,
    connections: [{ from: "a", to: "b", signal: false }],
  });
  assert.doesNotMatch(none, /<button/);
});

test("styles: tokens only, paused signals stop, reduced motion is static before scripts run", () => {
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|rgba?\(/i);
  assert.match(
    declaration(selectorBody(css, ".m-network-node"), "fill"),
    /var\(--m-/,
  );
  assert.match(
    declaration(selectorBody(css, ".m-network-link"), "stroke"),
    /var\(--m-/,
  );
  assert.match(
    declaration(selectorBody(css, ".m-network-signal"), "fill"),
    /var\(--m-/,
  );
  assert.equal(
    declaration(
      selectorBody(css, ".m-network[data-paused] .m-network-signal"),
      "animation-play-state",
    ),
    "paused",
  );
  const reduced = css.match(
    /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n  \}/,
  )?.[1];
  assert.ok(reduced, "missing the reduced-motion block");
  assert.equal(
    declaration(selectorBody(reduced, ".m-network-signal"), "display"),
    "none",
  );
  assert.equal(
    declaration(selectorBody(reduced, ".m-network-toggle"), "display"),
    "none",
  );
});
