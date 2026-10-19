import test from "node:test";
import assert from "node:assert/strict";
import { h, html as markup, UI } from "./support/render.mjs";
import { readSource, layerBlockWith } from "./support/css.mjs";

const go = { label: "Go", href: "/go" };
const img = (src) => h("img", { alt: "", src });
// Images add a preload link before the root; drop it to compare the root.
const root = (...args) => markup(...args).replace(/^(<link[^>]*\/>)+/, "");

// Default markup captured from the build before these variants were added.
const before = {
  hero: '<section class="m-hero m-hero-center" data-m-component="Hero"><div><h1 class="m-section-title">T</h1><p class="m-hero-description">D</p><div class="m-actions"><a class="m-button m-button-primary" href="/go">Go</a></div></div></section>',
  heroSplit:
    '<section class="m-hero m-hero-split" data-m-component="Hero"><div><h1 class="m-section-title">T</h1><p class="m-hero-description">D</p><div class="m-actions"></div></div><div class="m-hero-preview"><p>x</p></div></section>',
  feature:
    '<section class="m-feature-section" data-m-component="FeatureSection"><div><h2 class="m-section-title">T</h2><p>D</p></div><div class="m-feature-preview" data-framed="true"><p>x</p></div></section>',
  bento:
    '<section class="m-marketing-section" data-m-component="BentoGrid"><h2 class="m-section-title">T</h2><ul class="m-bento"><li data-span="2"><article><h3>A</h3><p>a</p></article></li><li data-span="1"><article data-tone="inverse"><h3>B</h3><p>b</p></article></li></ul></section>',
  stat: '<dl class="m-stat-group" aria-label="L" data-m-component="StatGroup"><div><dt>One</dt><dd>1</dd><dd class="m-stat-description">d</dd></div><div><dt>Two</dt><dd>2</dd></div></dl>',
  pricing:
    '<section class="m-marketing-section m-pricing" data-m-component="Pricing"><h2 class="m-section-title">P</h2><div class="m-pricing-grid"><article><h3>N1</h3><p>d</p><div class="m-price"><strong>$1</strong></div><ul><li>f</li></ul><a class="m-button m-button-secondary" href="/go">Go</a></article><article data-featured="true"><h3>N2</h3><p>d</p><div class="m-price"><strong>$2</strong></div><ul><li>f</li></ul><a class="m-button m-button-secondary" href="/go">Go</a></article><article><h3>N3</h3><p>d</p><div class="m-price"><strong>$3</strong></div><ul><li>f</li></ul><a class="m-button m-button-secondary" href="/go">Go</a></article></div></section>',
  content:
    '<link rel="preload" as="image" href="/x.png"/><section class="m-marketing-section m-content-section" data-media="end" aria-labelledby="_R_0_" data-m-component="ContentSection"><div class="m-content-copy"><h2 id="_R_0_" class="m-section-title">T</h2><p class="m-section-description">D</p><div class="m-prose"><p>x</p></div></div><figure class="m-content-media"><img alt="" src="/x.png"/></figure></section>',
  notFound:
    '<section class="m-not-found" data-m-component="NotFound"><p class="m-eyebrow">404</p><h1 class="m-section-title">T</h1><p>D</p><div class="m-actions"><a class="m-button m-button-primary" href="/go">Go</a></div></section>',
  mock: '<figure class="m-mock-window" aria-label="M" data-m-component="MockWindow"><div class="m-mock-bar" aria-hidden="true"><span class="m-mock-dots"><i></i><i></i><i></i></span></div><div class="m-mock-body"><p>x</p></div></figure>',
};
const plans = (count) =>
  Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    name: `N${i + 1}`,
    description: "d",
    monthly: `$${i + 1}`,
    features: ["f"],
    action: go,
    featured: i === 1,
  }));

test("default markup of every touched component is unchanged", () => {
  const p = h("p", null, "x");
  const now = {
    hero: markup(UI.Hero, { title: "T", description: "D", actions: [go] }),
    heroSplit: markup(
      UI.Hero,
      { title: "T", description: "D", layout: "split" },
      p,
    ),
    feature: markup(UI.FeatureSection, { title: "T", description: "D" }, p),
    bento: markup(UI.BentoGrid, {
      title: "T",
      items: [
        { title: "A", description: "a", span: 2 },
        { title: "B", description: "b", tone: "inverse" },
      ],
    }),
    stat: markup(UI.StatGroup, {
      label: "L",
      items: [
        { value: "1", label: "One", description: "d" },
        { value: "2", label: "Two" },
      ],
    }),
    pricing: markup(UI.Pricing, { title: "P", plans: plans(3) }),
    content: markup(
      UI.ContentSection,
      { title: "T", description: "D", media: img("/x.png") },
      p,
    ),
    notFound: markup(UI.NotFound, {
      title: "T",
      description: "D",
      actions: [go],
    }),
    mock: markup(UI.MockWindow, { label: "M" }, p),
  };
  assert.deepEqual(now, before);
});

test("Hero images render a tile collage; angled is a layout class", () => {
  const tiles = root(UI.Hero, {
    title: "T",
    description: "D",
    layout: "split",
    images: [img("/a.png"), img("/b.png")],
  });
  assert.match(
    tiles,
    /<div class="m-hero-tiles"><div><img alt="" src="\/a.png"\/><\/div><div><img alt="" src="\/b.png"\/><\/div><\/div><\/section>$/,
  );
  assert.doesNotMatch(tiles, /m-hero-preview/);
  const angled = root(
    UI.Hero,
    { title: "T", description: "D", layout: "angled" },
    img("/a.png"),
  );
  assert.match(
    angled,
    /^<section class="m-hero m-hero-angled" data-m-component="Hero">/,
  );
  assert.match(angled, /<div class="m-hero-preview"><img alt="" src="\/a.png"/);
});

test("MockWindow phone variant has no title bar", () => {
  const phone = markup(
    UI.MockWindow,
    { label: "App", variant: "phone", address: "app" },
    h("p", null, "x"),
  );
  assert.equal(
    phone,
    '<figure class="m-mock-window" data-variant="phone" aria-label="App" data-m-component="MockWindow"><div class="m-mock-body"><p>x</p></div></figure>',
  );
});

test("FeatureSection offset sets data-offset only when true", () => {
  const on = markup(
    UI.FeatureSection,
    { title: "T", description: "D", offset: true },
    h("p", null, "x"),
  );
  assert.match(on, /^<section class="m-feature-section" data-offset="true"/);
  const off = markup(
    UI.FeatureSection,
    { title: "T", description: "D", offset: false },
    h("p", null, "x"),
  );
  assert.doesNotMatch(off, /data-offset/);
});

test("BentoGrid takes a section tone and tall tiles", () => {
  const html = markup(UI.BentoGrid, {
    title: "T",
    tone: "inverse",
    items: [
      { title: "A", description: "a", rowSpan: 2 },
      { title: "B", description: "b", rowSpan: 1 },
    ],
  });
  assert.match(
    html,
    /^<section class="m-marketing-section" data-tone="inverse" data-m-component="BentoGrid">/,
  );
  assert.match(html, /<li data-span="1" data-row-span="2"><article>/);
  assert.match(html, /<li data-span="1"><article><h3>B/);
  const muted = markup(UI.BentoGrid, { title: "T", tone: "muted", items: [] });
  assert.match(muted, /data-tone="muted"/);
});

test("StatGroup layouts and background", () => {
  const items = [{ value: "2021", label: "Founded" }];
  for (const layout of ["timeline", "stepped"])
    assert.match(
      markup(UI.StatGroup, { label: "L", layout, items }),
      new RegExp(
        `^<dl class="m-stat-group" aria-label="L" data-layout="${layout}" data-m-component="StatGroup">`,
      ),
    );
  assert.doesNotMatch(
    markup(UI.StatGroup, { label: "L", layout: "grid", items }),
    /data-layout/,
  );
  const band = root(UI.StatGroup, {
    id: "stats",
    className: "mt",
    label: "L",
    items,
    background: img("/bg.png"),
  });
  assert.equal(
    band,
    '<div id="stats" class="m-stat-band mt" data-m-component="StatGroup" data-background="true" data-tone="inverse"><div class="m-cover-background" aria-hidden="true"><img alt="" src="/bg.png"/></div><dl class="m-stat-group" aria-label="L"><div><dt>Founded</dt><dd>2021</dd></div></dl></div>',
  );
});

test("Pricing adapts to four tiers and renders an extra tier band", () => {
  const four = markup(UI.Pricing, { title: "P", plans: plans(4) });
  assert.match(four, /<div class="m-pricing-grid" data-columns="4">/);
  for (const count of [3, 5])
    assert.doesNotMatch(
      markup(UI.Pricing, { title: "P", plans: plans(count) }),
      /data-columns/,
    );
  assert.doesNotMatch(
    markup(UI.Pricing, { title: "P", plans: plans(4), layout: "detailed" }),
    /data-columns/,
  );
  const extra = markup(UI.Pricing, {
    title: "P",
    headingLevel: 3,
    plans: plans(2),
    extra: {
      name: "Enterprise",
      description: "Custom terms",
      price: "Custom",
      unit: "billed yearly",
      action: { label: "Contact sales", href: "/sales" },
    },
  });
  assert.match(
    extra,
    /<article class="m-pricing-extra"><div><h4>Enterprise<\/h4><p>Custom terms<\/p><\/div><div class="m-price"><strong>Custom<\/strong><span>billed yearly<\/span><\/div><a class="m-button m-button-secondary" href="\/sales">Contact sales<\/a><\/article><\/div><\/section>$/,
  );
  const bare = markup(UI.Pricing, {
    title: "P",
    plans: plans(1),
    extra: { name: "E", description: "d", action: go },
  });
  assert.doesNotMatch(bare.slice(bare.indexOf("m-pricing-extra")), /m-price"/);
});

test("ContentSection shows stats and a testimonial under the copy", () => {
  const html = markup(
    UI.ContentSection,
    {
      title: "Mission",
      stats: [{ label: "Founded", value: "2021" }],
      testimonial: { quote: "Great.", name: "Ana", role: "CEO" },
    },
    h("p", null, "Body"),
  );
  assert.match(
    html,
    /<div class="m-prose"><p>Body<\/p><\/div><figure class="m-testimonial m-content-quote" data-m-component="Testimonial"><blockquote>Great.<\/blockquote><figcaption><strong>Ana<\/strong><span>CEO<\/span><\/figcaption><\/figure><dl class="m-stat-group m-content-stats" aria-label="Mission" data-m-component="StatGroup"><div><dt>Founded<\/dt><dd>2021<\/dd><\/div><\/dl><\/div><\/section>$/,
  );
});

test("NotFound background is decorative and switches to the inverse tone", () => {
  const html = root(UI.NotFound, {
    title: "T",
    description: "D",
    actions: [go],
    background: img("/bg.png"),
  });
  assert.match(
    html,
    /^<section class="m-not-found" data-m-component="NotFound" data-background="true" data-tone="inverse"><div class="m-cover-background" aria-hidden="true"><img alt="" src="\/bg.png"\/><\/div><p class="m-eyebrow">404<\/p>/,
  );
});

test("variant styles sit in one block of kits.css with semantic tokens", async () => {
  const css = await readSource("src/kits.css");
  const block = layerBlockWith(css, ".m-hero-tiles");
  for (const selector of [
    ".m-hero-tiles",
    ".m-hero-angled .m-hero-preview",
    '.m-mock-window[data-variant="phone"]',
    '.m-feature-section[data-offset="true"]',
    '.m-bento > li[data-row-span="2"]',
    '.m-stat-group[data-layout="timeline"]',
    '.m-stat-group[data-layout="stepped"]',
    ".m-cover-background::after",
    ".m-stat-band",
    ".m-not-found[data-background]",
    '.m-pricing-grid[data-columns="4"]',
    ".m-pricing-grid article.m-pricing-extra",
    ".m-testimonial.m-content-quote",
    ".m-content-copy > .m-content-stats",
  ])
    assert.ok(block.includes(selector), `missing ${selector}`);
  assert.doesNotMatch(block, /#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(/);
});
