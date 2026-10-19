import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { h, html as markup, UI } from "./support/render.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFile(resolve(root, path), "utf8");
const action = { label: "Choose", href: "/choose" };

// Default markup captured from the build before these variants were added.
test("Hero default markup is unchanged", () => {
  assert.equal(
    markup(UI.Hero, {
      eyebrow: "New",
      title: "Build",
      description: "Desc",
      actions: [action, { label: "More", href: "/more" }],
      align: "split",
      children: h("p", null, "Shot"),
    }),
    '<section class="m-hero m-hero-split" data-m-component="Hero"><div><p class="m-eyebrow">New</p><h1>Build</h1><p class="m-hero-description">Desc</p><div class="m-actions"><a class="m-button m-button-primary" href="/choose">Choose</a><a class="m-button m-button-secondary" href="/more">More</a></div></div><div class="m-hero-preview"><p>Shot</p></div></section>',
  );
});

test("Hero background is decorative and switches to the inverse tone", () => {
  const html = markup(UI.Hero, {
    title: "Build",
    description: "Desc",
    background: h("img", { src: "/bg.jpg", alt: "" }),
  });
  assert.match(
    html,
    /<section class="m-hero m-hero-center" data-m-component="Hero" data-background="true" data-tone="inverse"><div class="m-hero-background" aria-hidden="true"><img src="\/bg.jpg" alt=""\/><\/div><div><h1>Build<\/h1>/,
  );
});

test("FAQ default markup is unchanged", () => {
  assert.equal(
    markup(UI.FAQ, {
      title: "Questions",
      description: "Help",
      items: [
        { question: "Q1?", answer: "A1." },
        { question: "Q2?", answer: "A2." },
      ],
    }),
    '<section class="m-faq" data-m-component="FAQ"><div><h2>Questions</h2><div>Help</div></div><div><details><summary>Q1?<span aria-hidden="true">+</span></summary><div>A1.</div></details><details><summary>Q2?<span aria-hidden="true">+</span></summary><div>A2.</div></details></div></section>',
  );
});

test("FAQ grid shows every answer in a description list; centered keeps the accordion", () => {
  const items = [
    { question: "Q1?", answer: "A1." },
    { question: "Q2?", answer: "A2." },
  ];
  const grid = markup(UI.FAQ, { title: "Questions", items, layout: "grid" });
  assert.match(grid, /data-layout="grid"/);
  assert.match(
    grid,
    /<dl class="m-faq-grid"><div><dt>Q1\?<\/dt><dd>A1\.<\/dd><\/div><div><dt>Q2\?<\/dt><dd>A2\.<\/dd><\/div><\/dl>/,
  );
  assert.doesNotMatch(grid, /<details|<summary/);
  const centered = markup(UI.FAQ, {
    title: "Questions",
    items,
    layout: "centered",
  });
  assert.match(centered, /data-layout="centered"/);
  assert.equal((centered.match(/<details>/g) || []).length, 2);
});

const pricingPlans = [
  {
    id: "a",
    name: "Basic",
    description: "Personal",
    monthly: "$0",
    annual: "$0",
    unit: "/month",
    annualUnit: "/year",
    features: ["One"],
    action,
  },
  {
    id: "b",
    name: "Team",
    description: "Teams",
    monthly: "$20",
    annual: "$16",
    unit: "/month",
    annualUnit: "/year",
    features: ["Two"],
    action,
    featured: true,
    availability: "coming-soon",
  },
];

test("Pricing default markup is unchanged", () => {
  assert.equal(
    markup(UI.Pricing, {
      title: "Plans",
      description: "Prices",
      plans: pricingPlans,
      tone: "inverse",
    }),
    '<section class="m-marketing-section m-pricing" data-m-component="Pricing"><h2>Plans</h2><p class="m-section-description">Prices</p><div class="m-segmented" role="group" aria-label="Billing interval"><button type="button" aria-pressed="true">Annual</button><button type="button" aria-pressed="false">Monthly</button></div><div class="m-pricing-grid"><article><h3>Basic</h3><p>Personal</p><div class="m-price"><strong>$0</strong><span>/year</span></div><ul><li>One</li></ul><a class="m-button m-button-secondary" href="/choose">Choose</a></article><article data-featured="true" data-tone="inverse" data-availability="coming-soon"><h3>Team</h3><p>Teams</p><div class="m-price"><strong>$16</strong><span>/year</span></div><ul><li>Two</li></ul><p role="status">Coming soon</p></article></div></section>',
  );
});

test("Pricing detailed layout puts features beside a price panel", () => {
  const html = markup(UI.Pricing, {
    title: "Plans",
    layout: "detailed",
    featuresLabel: "Included",
    plans: [
      {
        id: "life",
        name: "Lifetime",
        description: "Pay once",
        monthly: "$349",
        unit: "One-time payment",
        features: ["Forum", "Resources"],
        action: { label: "Get access", href: "/buy" },
      },
    ],
  });
  assert.match(html, /<div class="m-pricing-grid" data-layout="detailed">/);
  assert.doesNotMatch(html, /Billing interval/);
  assert.match(
    html,
    /<article><div class="m-pricing-detail"><h3>Lifetime<\/h3><p>Pay once<\/p><p class="m-pricing-features-label">Included<\/p><ul><li>Forum<\/li><li>Resources<\/li><\/ul><\/div><div class="m-pricing-offer"><div class="m-price"><strong>\$349<\/strong><span>One-time payment<\/span><\/div><a class="m-button m-button-primary" href="\/buy">Get access<\/a><\/div><\/article>/,
  );
  // Unavailable plans still expose a status, never a purchase link.
  const blocked = markup(UI.Pricing, {
    title: "Plans",
    layout: "detailed",
    plans: [{ ...pricingPlans[0], availability: "unavailable" }],
  });
  assert.match(blocked, /<p role="status">Unavailable<\/p>/);
  assert.doesNotMatch(blocked, /href="\/choose"/);
  assert.match(blocked, /What’s included/);
});

test("StatGroup default markup is unchanged; descriptions are extra dd", () => {
  const items = [
    { value: "99%", label: "Uptime" },
    { value: "41s", label: "Build" },
  ];
  assert.equal(
    markup(UI.StatGroup, { label: "Numbers", items }),
    '<dl class="m-stat-group" aria-label="Numbers" data-m-component="StatGroup"><div><dt>Uptime</dt><dd>99%</dd></div><div><dt>Build</dt><dd>41s</dd></div></dl>',
  );
  const html = markup(UI.StatGroup, {
    label: "Numbers",
    items: [{ ...items[0], description: "Last quarter." }],
  });
  assert.match(
    html,
    /<div><dt>Uptime<\/dt><dd>99%<\/dd><dd class="m-stat-description">Last quarter\.<\/dd><\/div>/,
  );
});

test("LogoCloud default markup is unchanged; grid and split layouts", () => {
  const items = [{ name: "Northwind" }, { name: "Contoso", image: "/c.svg" }];
  assert.equal(
    markup(UI.LogoCloud, { label: "Companies", items }),
    '<link rel="preload" as="image" href="/c.svg"/><section class="m-logo-cloud" aria-label="Companies" data-m-component="LogoCloud"><p>Companies</p><ul><li><span>Northwind</span></li><li><img src="/c.svg" alt="Contoso"/></li></ul></section>',
  );
  const grid = markup(UI.LogoCloud, {
    label: "Companies",
    items,
    layout: "grid",
  });
  assert.match(grid, /data-layout="grid"><p>Companies<\/p><ul>/);
  const split = markup(UI.LogoCloud, {
    label: "Companies",
    items,
    layout: "split",
    title: "Trusted by teams",
    description: "Big and small.",
    actions: [{ label: "Case studies", href: "/cases" }],
  });
  assert.match(
    split,
    /aria-label="Companies" data-m-component="LogoCloud" data-layout="split"><div class="m-logo-cloud-copy"><h2>Trusted by teams<\/h2><p class="m-section-description">Big and small\.<\/p><div class="m-actions"><a class="m-button m-button-primary" href="\/cases">Case studies<\/a><\/div><\/div><ul>/,
  );
  // Without a title the split layout falls back to the visible label.
  assert.match(
    markup(UI.LogoCloud, { label: "Companies", items, layout: "split" }),
    /<div class="m-logo-cloud-copy"><p>Companies<\/p><\/div>/,
  );
});

test("variant styles use semantic tokens and the hero joins the inverse remap", async () => {
  const css = await read("src/kits.css");
  const start = css.lastIndexOf(
    "@layer components {",
    css.indexOf(".m-hero[data-background]"),
  );
  const end = css.indexOf("@layer components {", start + 1);
  const block = css.slice(start, end === -1 ? undefined : end);
  for (const selector of [
    ".m-hero-background::after",
    ".m-faq-grid",
    ".m-pricing-offer",
    ".m-stat-group .m-stat-description",
    '.m-logo-cloud[data-layout="split"]',
  ])
    assert.ok(block.includes(selector), `missing ${selector}`);
  assert.doesNotMatch(block, /#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(/);
  assert.match(css, /\.m-banner,\s*\.m-hero\s*\)\[data-tone="inverse"\]/);
});
