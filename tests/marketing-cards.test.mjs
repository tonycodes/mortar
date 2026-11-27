// Section heading emphasis, richer FeatureGrid items and captioned Hero tiles,
// for marketing pages that move onto Mortar (tony.codes Home, Services, Work).
import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup as html } from "react-dom/server";
import { h, UI } from "./support/render.mjs";
import { readSource, selectorBody } from "./support/css.mjs";

const action = { label: "Start", href: "/start" };
const item = { title: "Item", description: "D" };
const title = "You talk to me. I do the building.";
const emphasised = [
  ["Section", UI.Section, {}],
  ["HeaderSection", UI.HeaderSection, {}],
  ["ContentSection", UI.ContentSection, {}],
  ["FeatureSection", UI.FeatureSection, { description: "D", children: "P" }],
  ["ProcessSteps", UI.ProcessSteps, { items: [item] }],
  ["ContactSection", UI.ContactSection, {}],
  ["CallToAction", UI.CallToAction, { actions: [action] }],
];

for (const [name, Component, props] of emphasised)
  test(`${name} emphasis wraps the first match inside its one heading`, () => {
    const markup = html(
      h(Component, { ...props, title, emphasis: "I do the building." }),
    );
    assert.match(
      markup,
      /<h([1-6])[^>]*>You talk to me\. <em class="m-emphasis">I do the building\.<\/em><\/h\1>/,
    );
    assert.equal(markup.match(/m-emphasis/g)?.length, 1);
    // Without emphasis, or with a phrase not in the title, the title is plain.
    const plain = html(h(Component, { ...props, title }));
    assert.doesNotMatch(plain, /m-emphasis/);
    assert.equal(
      html(h(Component, { ...props, title, emphasis: "missing" })),
      plain,
    );
  });

test("emphasis is styled once for every section, from the brand's emphasis tokens", async () => {
  const css = await readSource("src/marketing.css");
  const body = selectorBody(css, ".m-emphasis");
  assert.match(body, /font-family: var\(--m-brand-font-emphasis, inherit\)/);
  assert.match(
    body,
    /font-style: var\(--m-brand-font-emphasis-style, normal\)/,
  );
  assert.match(body, /color: var\(--m-link\)/);
  assert.doesNotMatch(css, /\.m-hero \.m-emphasis\s*\{/);
});

test("FeatureGrid items without the new fields render unchanged", () => {
  const markup = html(
    h(UI.FeatureGrid, { title: "T", items: [item], marker: "none" }),
  );
  assert.match(markup, /<article><h3>Item<\/h3><p>D<\/p><\/article>/);
  assert.doesNotMatch(markup, /m-feature-(eyebrow|link|meta|footer|actions)/);
});

test("FeatureGrid items take an eyebrow, linked title, meta, footer and actions", () => {
  const markup = html(
    h(UI.FeatureGrid, {
      title: "Selected engagements",
      items: [
        {
          eyebrow: "Northwind",
          title: "A rebuild",
          href: "/work/northwind",
          meta: "Lead engineer · 2024",
          description: "Summary",
          footer: "React, Node.js",
          actions: [{ label: "Read the brief", href: "/work/northwind" }],
        },
      ],
    }),
  );
  assert.match(
    markup,
    /<article><p class="m-feature-eyebrow">Northwind<\/p><h3><a class="m-feature-link" href="\/work\/northwind">A rebuild<\/a><\/h3><div class="m-feature-meta">Lead engineer · 2024<\/div><p>Summary<\/p><div class="m-feature-footer">React, Node.js<\/div><div class="m-feature-actions"><a href="\/work\/northwind">Read the brief<span aria-hidden="true"> →<\/span><\/a><\/div><\/article>/,
  );
});

test("FeatureGrid card links use the kit's visible focus ring", async () => {
  const css = await readSource("src/marketing.css");
  for (const selector of [
    ".m-feature-grid .m-feature-link",
    ".m-feature-actions a",
  ])
    assert.doesNotMatch(selectorBody(css, selector), /outline/);
});

test("Hero image tiles take an optional caption in a figure", () => {
  const markup = html(
    h(UI.Hero, {
      title: "T",
      description: "D",
      images: [
        {
          image: h("img", { alt: "Portrait", src: "/a.jpg" }),
          caption: "A · B",
        },
        h("img", { alt: "", src: "/b.jpg" }),
      ],
    }),
  );
  assert.match(
    markup,
    /<div class="m-hero-tiles"><figure><div><img alt="Portrait" src="\/a.jpg"\/><\/div><figcaption>A · B<\/figcaption><\/figure><div><img alt="" src="\/b.jpg"\/><\/div><\/div>/,
  );
});

test("FAQ answers accept rich content such as inline links", () => {
  const markup = html(
    h(UI.FAQ, {
      title: "Questions",
      items: [
        {
          question: "Where?",
          answer: h(
            "p",
            null,
            "See ",
            h("a", { href: "/contact" }, "contact"),
            ".",
          ),
        },
      ],
    }),
  );
  assert.match(
    markup,
    /<div><p>See <a href="\/contact">contact<\/a>\.<\/p><\/div>/,
  );
});
