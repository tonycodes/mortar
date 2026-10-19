// API conventions and accessibility fixes for the marketing and docs kits:
// headingLevel, id and className on section roots, data attributes, renamed
// props, and the audited markup bugs.
import test from "node:test";
import assert from "node:assert/strict";
import { h, html, UI } from "./support/render.mjs";
import { readSource, selectorBody } from "./support/css.mjs";

const action = { label: "Start", href: "/start" };
const opening = (markup) =>
  markup.replace(/^(<link[^>]*>)+/, "").match(/^<[a-z0-9]+\b[^>]*>/)?.[0] ?? "";

/** Section-level components with their minimal props. */
const sections = {
  Hero: [UI.Hero, { title: "Title", description: "Desc" }],
  HeaderSection: [UI.HeaderSection, { title: "Title" }],
  ContentSection: [UI.ContentSection, { title: "Title" }],
  FeatureGrid: [
    UI.FeatureGrid,
    { title: "Title", items: [{ title: "Item", description: "D" }] },
  ],
  FeatureSection: [
    UI.FeatureSection,
    { title: "Title", description: "D", children: "Preview" },
  ],
  ProcessSteps: [
    UI.ProcessSteps,
    { title: "Title", items: [{ title: "Item", description: "D" }] },
  ],
  LogoCloud: [
    UI.LogoCloud,
    { label: "Customers", title: "Title", layout: "split", items: [] },
  ],
  Pricing: [UI.Pricing, { title: "Title", plans: [] }],
  FAQ: [UI.FAQ, { title: "Title", items: [] }],
  CallToAction: [UI.CallToAction, { title: "Title", actions: [action] }],
  BentoGrid: [UI.BentoGrid, { title: "Title", items: [] }],
  TestimonialGrid: [UI.TestimonialGrid, { title: "Title", items: [] }],
  PlanComparison: [
    UI.PlanComparison,
    { title: "Title", plans: ["A"], groups: [] },
  ],
  PostList: [UI.PostList, { title: "Title", posts: [] }],
  TeamGrid: [UI.TeamGrid, { title: "Title", members: [] }],
  ContactSection: [UI.ContactSection, { title: "Title", children: "Form" }],
  Newsletter: [UI.Newsletter, { title: "Title", onSubmit: () => undefined }],
  NotFound: [
    UI.NotFound,
    { title: "Title", description: "D", actions: [action] },
  ],
  ApiEndpoint: [
    UI.ApiEndpoint,
    { method: "GET", path: "/x", title: "Title", params: [] },
  ],
  Release: [
    UI.Release,
    { version: "Title", date: "2026-01-01", dateLabel: "1 Jan", changes: [] },
  ],
};

test("section-level components take id, className and headingLevel", () => {
  const problems = [];
  for (const [name, [Component, props]] of Object.entries(sections)) {
    const markup = html(Component, {
      ...props,
      id: "target",
      className: "layout-hook",
      headingLevel: 4,
    });
    const root = opening(markup);
    if (!root.includes('id="target"')) problems.push(`${name}: no id on root`);
    if (!/class="[^"]*\blayout-hook\b/.test(root))
      problems.push(`${name}: no className on root`);
    if (!/<h4\b[^>]*>Title<\/h4>/.test(markup))
      problems.push(`${name}: headingLevel 4 did not render the title as h4`);
    if (/<h[123]\b/.test(markup))
      problems.push(`${name}: a heading sits above headingLevel 4`);
  }
  assert.deepEqual(problems, []);
});

test("section titles carry m-section-title so any level keeps the style", async () => {
  for (const name of [
    "Hero",
    "HeaderSection",
    "FeatureGrid",
    "Pricing",
    "FAQ",
    "CallToAction",
    "TeamGrid",
    "NotFound",
  ]) {
    const [Component, props] = sections[name];
    assert.match(
      html(Component, { ...props, headingLevel: 3 }),
      /<h3\b[^>]*class="m-section-title"[^>]*>Title<\/h3>/,
      name,
    );
  }
  const css = await readSource("src/components.css");
  assert.match(css, /> :is\(h2, :where\(\.m-section-title\)\) \{/);
  assert.notEqual(selectorBody(css, ".m-hero .m-section-title"), "");
});

test("NotFound and Hero default to h1; nested headings follow headingLevel", () => {
  assert.match(html(...sections.NotFound), /<h1 class="m-section-title">/);
  assert.match(html(...sections.Hero), /<h1 class="m-section-title">/);
  const grid = html(UI.FeatureGrid, {
    ...sections.FeatureGrid[1],
    headingLevel: 3,
  });
  assert.match(grid, /<h4>Item<\/h4>/);
  const pricing = html(UI.Pricing, {
    title: "Plans",
    headingLevel: 3,
    plans: [
      {
        id: "a",
        name: "Basic",
        description: "D",
        monthly: "$1",
        features: [],
        action,
      },
    ],
  });
  assert.match(pricing, /<h4>Basic<\/h4>/);
  const posts = html(UI.PostList, {
    title: "Notes",
    itemHeadingLevel: 5,
    posts: [
      {
        href: "/a",
        title: "Post",
        excerpt: "E",
        date: "2026-01-01",
        dateLabel: "1 Jan",
      },
    ],
  });
  assert.match(posts, /<h5 class="m-post-title"><a href="\/a">Post<\/a><\/h5>/);
  const release = html(UI.Release, {
    ...sections.Release[1],
    headingLevel: 2,
    changes: [{ type: "added", items: ["X"] }],
  });
  assert.match(release, /<h2 class="m-release-version">Title<\/h2>/);
  assert.match(release, /<h3 class="m-release-type">Added<\/h3>/);
  const api = html(UI.ApiEndpoint, { ...sections.ApiEndpoint[1] });
  assert.match(api, /<h2 id="[^"]+" class="m-api-title">Title<\/h2>/);
  assert.match(api, /<h3 class="m-api-params-title">Body parameters<\/h3>/);
});

test("Steps uses itemHeadingLevel for each step title", () => {
  const items = [{ title: "Install" }];
  assert.match(html(UI.Steps, { items }), /<h3>Install<\/h3>/);
  assert.match(
    html(UI.Steps, { items, itemHeadingLevel: 2 }),
    /<h2>Install<\/h2>/,
  );
});

test("Hero layout replaces align; FAQ center replaces centered", () => {
  const split = html(UI.Hero, {
    ...sections.Hero[1],
    layout: "split",
  });
  assert.match(opening(split), /class="m-hero m-hero-split"/);
  const faq = html(UI.FAQ, {
    title: "Q",
    items: [{ question: "A?", answer: "B" }],
    layout: "center",
  });
  assert.match(opening(faq), /data-layout="center"/);
});

test("section tones: the default tone sets no data-tone; boolean attributes only when true", () => {
  for (const Component of [
    UI.FeatureGrid,
    UI.ProcessSteps,
    UI.HeaderSection,
    UI.ContentSection,
  ]) {
    const props = Object.values(sections).find(([c]) => c === Component)[1];
    assert.doesNotMatch(opening(html(Component, props)), /data-tone/);
    assert.match(
      opening(html(Component, { ...props, tone: "muted" })),
      /data-tone="muted"/,
    );
  }
  assert.doesNotMatch(
    opening(html(UI.HeaderSection, { title: "T" })),
    /data-align/,
  );
  const feature = html(UI.FeatureSection, {
    ...sections.FeatureSection[1],
    framed: false,
  });
  assert.doesNotMatch(feature, /data-reverse|data-framed|data-tone/);
  const framed = html(UI.FeatureSection, {
    ...sections.FeatureSection[1],
    reverse: true,
  });
  assert.match(framed, /data-reverse="true"/);
  assert.match(framed, /class="m-feature-preview" data-framed="true"/);
  assert.doesNotMatch(
    html(UI.MockWindow, { label: "Shot", children: "x" }),
    /data-variant/,
  );
});

test("BentoGrid tiles take a section tone and no data-inverse", () => {
  const markup = html(UI.BentoGrid, {
    title: "Layout",
    items: [
      { title: "Dark", description: "D", tone: "inverse" },
      { title: "Plain", description: "D" },
    ],
  });
  assert.match(markup, /<article data-tone="inverse">/);
  assert.match(markup, /<article><h3>Plain<\/h3>/);
  assert.doesNotMatch(markup, /data-inverse/);
});

test("MarketingHeader generates a distinct nav id for each header", () => {
  const props = { brand: "Northwind", links: [action] };
  const markup = html(
    "div",
    null,
    h(UI.MarketingHeader, props),
    h(UI.MarketingHeader, props),
  );
  const controls = [...markup.matchAll(/aria-controls="([^"]+)"/g)].map(
    (m) => m[1],
  );
  const navs = [...markup.matchAll(/<nav id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(controls).size, 2);
  assert.deepEqual(navs, controls);
  assert.doesNotMatch(markup, /m-marketing-nav"/);
  // Closed: the boolean attribute is absent rather than "false".
  assert.doesNotMatch(markup, /data-open/);
});

test("PlanComparison marks included cells with hidden glyphs and screen-reader text", () => {
  const markup = html(UI.PlanComparison, {
    title: "Compare",
    plans: ["Basic", "Team"],
    groups: [
      { label: "Limits", rows: [{ feature: "SSO", values: [false, true] }] },
    ],
  });
  // aria-label on a plain span is prohibited (axe aria-prohibited-attr).
  assert.doesNotMatch(markup, /<span[^>]*aria-label/);
  assert.match(
    markup,
    /<span aria-hidden="true" class="m-comparison-no">—<\/span><span class="m-sr-only">Not included<\/span>/,
  );
  assert.match(
    markup,
    /<span aria-hidden="true">✓<\/span><span class="m-sr-only">Included<\/span>/,
  );
});

test("TestimonialGrid and TeamGrid hide avatars that repeat a visible name", () => {
  const grid = html(UI.TestimonialGrid, {
    items: [{ quote: "Q", name: "Ana Ruiz" }],
  });
  const team = html(UI.TeamGrid, {
    title: "Team",
    members: [{ name: "Ana Ruiz", role: "Design" }],
  });
  for (const markup of [grid, team])
    assert.match(
      markup,
      /<span class="m-avatar-decorative" aria-hidden="true"><span class="m-avatar[^"]*"[^>]*role="img" aria-label="Ana Ruiz">/,
    );
});

test("Newsletter announces success in a persistent status region", () => {
  const props = { title: "Updates", onSubmit: () => undefined };
  // The region exists before the message so screen readers announce it.
  assert.match(
    html(UI.Newsletter, props),
    /<p role="status" class="m-newsletter-status"><\/p>/,
  );
  const success = html(UI.Newsletter, {
    ...props,
    status: "success",
    message: "Check your inbox",
  });
  assert.match(
    success,
    /<p role="status" class="m-newsletter-status">Check your inbox<\/p>/,
  );
  assert.match(
    html(UI.Newsletter, { ...props, status: "success" }),
    /m-newsletter-status">Thanks for subscribing\.<\/p>/,
  );
  const busy = html(UI.Newsletter, { ...props, status: "submitting" });
  assert.match(busy, /<form aria-busy="true">/);
  assert.match(busy, /<input[^>]*disabled=""/);
  // Native email validation, as in SignInPanel.
  assert.doesNotMatch(busy, /novalidate/i);
});

test("Callout is a named note with a status tone instead of type", () => {
  const plain = html(UI.Callout, { children: "Builds time out." });
  assert.doesNotMatch(plain, /<aside|data-type|data-tone/);
  const id = plain.match(/<strong id="([^"]+)">Note<\/strong>/)?.[1];
  assert.ok(id, plain);
  assert.match(
    opening(plain),
    new RegExp(`^<div class="m-callout" role="note" aria-labelledby="${id}">`),
  );
  const danger = html(UI.Callout, {
    tone: "danger",
    title: "Breaking",
    children: "Removed.",
  });
  assert.match(opening(danger), /data-tone="danger"/);
  assert.match(danger, />Breaking<\/strong>/);
  assert.match(html(UI.Callout, { tone: "success", children: "x" }), />Tip</);
});

test("PagerLinks has its own landmark name, hidden arrows and data-next=true", () => {
  const markup = html(UI.PagerLinks, {
    previous: { label: "Install", href: "/install" },
    next: { label: "Deploy", href: "/deploy" },
  });
  // "Pagination" collided with the Pagination component's landmark.
  assert.doesNotMatch(markup, /aria-label="Pagination"/);
  assert.match(
    markup,
    /<nav class="m-pager" aria-label="Previous and next page">/,
  );
  assert.match(markup, /<span aria-hidden="true">← <\/span>Install/);
  assert.match(markup, /Deploy<span aria-hidden="true"> →<\/span>/);
  assert.match(markup, /rel="next" data-next="true"/);
  assert.match(
    html(UI.PagerLinks, { next: action, label: "Guide pages" }),
    /aria-label="Guide pages"/,
  );
});

test("LinkCards items use label and hide the arrow", () => {
  const markup = html(UI.LinkCards, {
    items: [{ label: "Variables", href: "/env", description: "Secrets." }],
  });
  assert.match(
    markup,
    /<a href="\/env"><strong>Variables<span aria-hidden="true"> →<\/span><\/strong><span>Secrets\.<\/span><\/a>/,
  );
});

test("CodeTabs tabs control the panel they label", () => {
  const markup = html(UI.CodeTabs, {
    tabs: [
      { id: "npm", label: "npm", code: "npm i" },
      { id: "pnpm", label: "pnpm", code: "pnpm add" },
    ],
  });
  const panel = markup.match(
    /<pre tabindex="0" id="([^"]+)" role="tabpanel" aria-labelledby="([^"]+)"/,
  );
  assert.ok(panel, markup);
  const controls = [...markup.matchAll(/aria-controls="([^"]+)"/g)].map(
    (m) => m[1],
  );
  assert.deepEqual(controls, [panel[1], panel[1]]);
  assert.match(markup, new RegExp(`id="${panel[2]}"[^>]*aria-selected="true"`));
});

test("DocsShell groups use label and render item icon, count and children", () => {
  const markup = html(UI.DocsShell, {
    brand: "Docs",
    navigation: [
      {
        label: "Guides",
        items: [
          {
            label: "Deploy",
            href: "/deploy",
            icon: h("svg", { "data-icon": "rocket" }),
            count: 0,
          },
          {
            label: "Domains",
            href: "/domains",
            children: [{ label: "DNS", href: "/dns", current: true }],
          },
        ],
      },
    ],
    children: h("h1", null, "Page"),
  });
  assert.match(markup, /<h2>Guides<\/h2>/);
  assert.match(
    markup,
    /<a href="\/deploy"><span class="m-nav-icon" aria-hidden="true"><svg data-icon="rocket"><\/svg><\/span>Deploy<span class="m-nav-count">0<\/span><\/a>/,
  );
  assert.match(
    markup,
    /<details class="m-nav-group" open=""><summary>Domains<\/summary><div class="m-nav-children"><a href="\/dns" aria-current="page">DNS<\/a><\/div><\/details>/,
  );
  // The visible "Menu" is the accessible name (WCAG label in name).
  const menu = markup.match(/<button[^>]*m-menu-trigger[^>]*>/)?.[0] ?? "";
  assert.doesNotMatch(menu, /aria-label/);
  assert.match(menu, /aria-haspopup="dialog"/);
  assert.match(menu, /aria-expanded="false"/);
});

test("Footer columns are ItemGroups of links", () => {
  const markup = html(UI.Footer, {
    brand: "Northwind",
    description: "D",
    copyright: "C",
    columns: [
      { label: "Company", items: [{ label: "About", href: "/about" }] },
    ],
  });
  assert.match(
    markup,
    /<nav aria-label="Company"><h2>Company<\/h2><a href="\/about">About<\/a><\/nav>/,
  );
});
