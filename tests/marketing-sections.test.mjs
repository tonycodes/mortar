import test from "node:test";
import assert from "node:assert/strict";
import {
  h,
  html,
  MarketingHeader,
  HeaderSection,
  ContentSection,
} from "./support/render.mjs";

test("MarketingHeader renders a flyout group as a closed disclosure button", () => {
  const markup = html(MarketingHeader, {
    brand: "Northwind",
    links: [
      {
        label: "Product",
        items: [
          {
            label: "Analytics",
            href: "#analytics",
            description: "Understand your traffic",
          },
        ],
        footer: [{ label: "Watch demo", href: "#demo" }],
      },
      { label: "Pricing", href: "#pricing" },
    ],
  });
  assert.match(
    markup,
    /<button[^>]*class="m-flyout-trigger"[^>]*aria-expanded="false"[^>]*>Product/,
  );
  // Panel content renders only when open; plain links are unchanged.
  assert.doesNotMatch(markup, /Analytics/);
  assert.match(markup, /<a href="#pricing">Pricing<\/a>/);
});

test("HeaderSection is a labelled intro band with an h1 by default", () => {
  const markup = html(HeaderSection, {
    eyebrow: "About",
    title: "We build shared foundations",
    description: "A small team, a big kit.",
    tone: "muted",
    links: [{ label: "Open roles", href: "#jobs" }],
    stats: [{ label: "Components", value: "100" }],
  });
  const id = markup.match(
    /<h1 id="([^"]+)">We build shared foundations<\/h1>/,
  )?.[1];
  assert.ok(id, markup);
  assert.match(
    markup,
    new RegExp(
      `^<section class="m-marketing-section m-header-section" data-tone="muted" data-align="start" aria-labelledby="${id}" data-m-component="HeaderSection">`,
    ),
  );
  assert.match(
    markup,
    /<a href="#jobs">Open roles<span aria-hidden="true"> →<\/span><\/a>/,
  );
  assert.match(
    markup,
    /<dl class="m-header-stats"><div><dt>Components<\/dt><dd>100<\/dd><\/div><\/dl>/,
  );
});

test("ContentSection pairs prose with optional media", () => {
  const markup = html(
    ContentSection,
    {
      eyebrow: "Story",
      title: "Why Mortar exists",
      description: "Every product rebuilt the same buttons.",
      media: h("img", { src: "/team.png", alt: "The team" }),
      mediaPosition: "start",
    },
    h("p", {}, "So we made one kit."),
  );
  assert.match(markup, /data-m-component="ContentSection"/);
  assert.match(markup, /data-media="start"/);
  assert.match(markup, /<h2 id="[^"]+">Why Mortar exists<\/h2>/);
  assert.match(
    markup,
    /<div class="m-prose"><p>So we made one kit.<\/p><\/div>/,
  );
  assert.match(
    markup,
    /<figure class="m-content-media"><img src="\/team.png" alt="The team"\/><\/figure>/,
  );
  assert.doesNotMatch(
    html(ContentSection, { title: "Plain" }, "Text"),
    /m-content-media|data-media/,
  );
});
