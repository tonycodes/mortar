// #68: composing a split landing page (header with a descriptor, hero with an
// emphasised title and a supporting note, compact footer) from public APIs.
import test from "node:test";
import assert from "node:assert/strict";
import { h, html as markup, UI } from "./support/render.mjs";
import {
  declaration,
  readSource,
  section,
  selectorBody,
} from "./support/css.mjs";

const action = { label: "Choose", href: "/choose" };
const heroProps = {
  title: "Connect every team today",
  description: "Desc",
  actions: [action],
};
const footerProps = {
  brand: "Acme",
  description: "Desc",
  columns: [{ label: "Product", items: [action] }],
  copyright: "© Acme",
  legal: [{ label: "Privacy", href: "/privacy" }],
};
const css = await readSource("src/marketing.css");

test("Hero emphasis wraps the phrase inside the single heading", () => {
  const html = markup(UI.Hero, { ...heroProps, emphasis: "every team" });
  assert.match(
    html,
    /<h1 class="m-section-title">Connect <em class="m-emphasis">every team<\/em> today<\/h1>/,
  );
  assert.equal(html.match(/<h[1-6]/g).length, 1);
});

test("Hero emphasis follows headingLevel and marks only the first match", () => {
  const html = markup(UI.Hero, {
    ...heroProps,
    title: "Team to team",
    emphasis: "team",
    headingLevel: 2,
  });
  assert.match(
    html,
    /<h2 class="m-section-title">Team to <em class="m-emphasis">team<\/em><\/h2>/,
  );
});

test("Hero emphasis that is not in the title leaves the title plain", () => {
  const plain = markup(UI.Hero, heroProps);
  assert.equal(markup(UI.Hero, { ...heroProps, emphasis: "missing" }), plain);
  assert.equal(markup(UI.Hero, { ...heroProps, emphasis: "" }), plain);
});

test("Hero note sits below the actions in the copy column", () => {
  const html = markup(UI.Hero, {
    ...heroProps,
    layout: "split",
    note: h("p", null, "No card needed"),
  });
  assert.match(
    html,
    /<div class="m-actions">.*?<\/div><div class="m-hero-note"><p>No card needed<\/p><\/div><\/div>/,
  );
});

test("Hero wide sets the wider split column and is ignored outside split", () => {
  assert.match(
    markup(UI.Hero, { ...heroProps, layout: "split", wide: "copy" }),
    /<section class="m-hero m-hero-split" data-m-component="Hero" data-wide="copy">/,
  );
  assert.match(
    markup(UI.Hero, { ...heroProps, layout: "split", wide: "preview" }),
    /data-wide="preview"/,
  );
  assert.doesNotMatch(
    markup(UI.Hero, { ...heroProps, wide: "copy" }),
    /data-wide/,
  );
  for (const wide of ["copy", "preview"])
    assert.match(
      declaration(
        selectorBody(css, `.m-hero-split[data-wide="${wide}"]`),
        "grid-template-columns",
      ),
      /fr/,
    );
});

test("MarketingHeader tagline sits beside the brand link, outside its name", () => {
  const html = markup(UI.MarketingHeader, {
    brand: "Acme",
    tagline: "Field service",
    links: [],
  });
  assert.match(
    html,
    /<div class="m-brand-lockup"><a class="m-brand" href="\/"><span class="m-mark" aria-hidden="true"><\/span>Acme<\/a><span class="m-brand-tagline">Field service<\/span><\/div>/,
  );
  // The centred layout places the lockup in the brand's grid cell.
  const center = '.m-marketing-header[data-layout="center"] > .m-brand-lockup';
  assert.equal(declaration(selectorBody(css, center), "grid-column"), "2");
});

test("MarketingHeader tagline is hidden on narrow screens", () => {
  const narrow = section(css, "MarketingHeader").match(
    /@media \(max-width: 560px\) \{([\s\S]*?)\n  \}/,
  )?.[1];
  assert.ok(narrow, "missing the header's 560px media block");
  assert.equal(
    declaration(selectorBody(narrow, ".m-brand-tagline"), "display"),
    "none",
  );
});

test("Footer inline puts everything in one wrapping row in reading order", () => {
  const html = markup(UI.Footer, { ...footerProps, layout: "inline" });
  assert.match(
    html,
    /^<footer class="m-footer" data-m-component="Footer" data-layout="inline"><div class="m-footer-inline">/,
  );
  assert.doesNotMatch(html, /<h[1-6]|m-footer-bottom|m-footer-grid/);
  const order = [
    "Acme</strong>",
    "<p>Desc",
    'aria-label="Product"',
    "© Acme",
    "Privacy",
  ];
  const at = order.map((text) => html.indexOf(text));
  assert.ok(
    at.every((i) => i >= 0),
    `missing part: ${at}`,
  );
  assert.deepEqual(
    [...at].sort((a, b) => a - b),
    at,
  );
  const row = selectorBody(css, ".m-footer-inline");
  assert.equal(declaration(row, "flex-wrap"), "wrap");
  assert.doesNotMatch(css, /\.m-footer-inline[^{]*\{[^}]*\border\s*:/);
});

test("Footer description and columns are optional for a short footer", () => {
  const html = markup(UI.Footer, {
    brand: "Acme",
    layout: "inline",
    note: "Made in Leeds",
    copyright: "© Acme",
  });
  assert.match(html, /<p>Made in Leeds<\/p>/);
  assert.doesNotMatch(html, /<nav|<p><\/p>/);
});

test("MarketingPage frames header, main and footer in reading order", () => {
  const html = markup(
    UI.MarketingPage,
    {
      header: h("header", null, "H"),
      footer: h("footer", null, "F"),
      id: "page",
      className: "x",
    },
    h("p", null, "Body"),
  );
  assert.equal(
    html,
    '<div id="page" class="m-marketing-page x" data-m-component="MarketingPage"><header>H</header><main class="m-marketing-main"><p>Body</p></main><footer>F</footer></div>',
  );
  assert.match(
    markup(UI.MarketingPage, { align: "center" }, "x"),
    /data-align="center"/,
  );
});

test("MarketingPage fills the viewport and lets content grow", () => {
  const page = selectorBody(css, ".m-marketing-page");
  assert.match(declaration(page, "min-height"), /100dvh/);
  assert.equal(declaration(page, "height"), "");
  const main = selectorBody(css, ".m-marketing-main");
  assert.match(declaration(main, "flex"), /^1\b/);
  assert.equal(declaration(main, "overflow"), "");
  assert.equal(
    declaration(
      selectorBody(
        css,
        '.m-marketing-page[data-align="center"] > .m-marketing-main',
      ),
      "justify-content",
    ),
    "center",
  );
});
