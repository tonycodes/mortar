// Top navigation for application screens: Navbar and StackedShell take
// dropdown groups, a bar tone and (StackedShell) a second row of tabs.
import test from "node:test";
import assert from "node:assert/strict";
import { h, html as markup, UI } from "./support/render.mjs";
import {
  declaration,
  readSource,
  section,
  selectorBody,
} from "./support/css.mjs";

const items = [
  { label: "Dashboard", href: "/d", current: true },
  { label: "Team", href: "/t", count: 3 },
];
const group = {
  label: "Reports",
  items: [
    { label: "Revenue", href: "/r", description: "Monthly totals" },
    { label: "Usage", href: "/u", current: true },
  ],
};
const css = await readSource("src/application.css");
const navbarCss = section(css, "Navbar");

// Default markup captured from the build before these variants were added.
test("default markup of Navbar and StackedShell is unchanged", () => {
  assert.equal(
    markup(UI.Navbar, { brand: "Acme", items }),
    '<header data-m-component="Navbar" class="m-navbar"><a class="m-brand" href="/"><span class="m-mark" aria-hidden="true"></span>Acme</a><button data-m-component="Button" aria-expanded="false" aria-controls="_R_0_" type="button" class="m-button m-button-ghost m-navbar-toggle">Menu</button><nav id="_R_0_" aria-label="Primary"><a href="/d" aria-current="page">Dashboard</a><a href="/t">Team<span class="m-nav-count">3</span></a></nav></header>',
  );
  assert.equal(
    markup(
      UI.StackedShell,
      { brand: "Acme", navigation: items },
      h("p", null, "Body"),
    ),
    '<div data-m-component="StackedShell" class="m-stacked-shell"><a class="m-skip" href="#m-stacked-R0">Skip to content</a><header data-m-component="Navbar" class="m-navbar"><a class="m-brand" href="/"><span class="m-mark" aria-hidden="true"></span>Acme</a><button data-m-component="Button" aria-expanded="false" aria-controls="_R_5_" type="button" class="m-button m-button-ghost m-navbar-toggle">Menu</button><nav id="_R_5_" aria-label="Primary"><a href="/d" aria-current="page">Dashboard</a><a href="/t">Team<span class="m-nav-count">3</span></a></nav></header><main id="m-stacked-R0" tabindex="-1" data-width="lg"><p>Body</p></main></div>',
  );
});

test("a Navbar group is a disclosure button in the navigation, in item order", () => {
  const html = markup(UI.Navbar, {
    brand: "Acme",
    items: [items[0], group, items[1]],
  });
  const nav = html.match(/<nav [^>]*>([\s\S]*)<\/nav>/)[1];
  assert.match(
    nav,
    /^<a href="\/d" aria-current="page">Dashboard<\/a><div class="m-flyout"[^>]*><button class="m-flyout-trigger" type="button" aria-expanded="false"[^>]*>Reports<svg/,
  );
  assert.ok(nav.indexOf("Reports") < nav.indexOf("Team"));
});

test("a group holding the current page is marked current on its trigger", () => {
  const html = markup(UI.Navbar, { brand: "Acme", items: [group] });
  assert.match(html, /<div class="m-flyout" data-current="true"/);
  const plain = markup(UI.Navbar, {
    brand: "Acme",
    items: [{ ...group, items: [group.items[0]] }],
  });
  assert.doesNotMatch(plain, /data-current/);
});

test("Navbar tone: inverse and accent set data-tone; default sets nothing", () => {
  for (const tone of ["inverse", "accent"])
    assert.match(
      markup(UI.Navbar, { brand: "Acme", items, tone }),
      new RegExp(
        `^<header data-m-component="Navbar" class="m-navbar" data-tone="${tone}">`,
      ),
    );
  assert.doesNotMatch(
    markup(UI.Navbar, { brand: "Acme", items, tone: "default" }),
    /data-tone/,
  );
});

test("StackedShell passes the tone to its bar and puts tabs in a second row", () => {
  const html = markup(
    UI.StackedShell,
    {
      brand: "Acme",
      navigation: [items[0], group],
      tone: "inverse",
      tabs: {
        label: "Project sections",
        items: [{ label: "Overview", href: "/o", current: true }],
      },
    },
    "Body",
  );
  assert.match(
    html,
    /<header data-m-component="Navbar" class="m-navbar" data-tone="inverse">/,
  );
  assert.match(
    html,
    /<\/header><div class="m-stacked-tabs"><nav data-m-component="TabNav"[^>]*aria-label="Project sections"[\s\S]*?<\/nav><\/div><main /,
  );
  assert.match(
    html,
    /^<div data-m-component="StackedShell" class="m-stacked-shell"><a class="m-skip"/,
  );
});

test("Navbar styles: text follows the tone, accent remaps like the accent bands", () => {
  assert.equal(
    declaration(selectorBody(navbarCss, ".m-navbar"), "color"),
    "var(--m-ink)",
  );
  const accent = selectorBody(navbarCss, '.m-navbar[data-tone="accent"]');
  assert.equal(declaration(accent, "background-color"), "var(--m-accent)");
  assert.equal(declaration(accent, "background-image"), "var(--m-accent-fill)");
  for (const [token, value] of [
    ["--m-ink", "var(--m-on-accent)"],
    ["--m-secondary", "var(--m-on-accent)"],
    ["--m-focus", "var(--m-on-accent)"],
    ["--m-primary", "var(--m-on-accent)"],
    ["--m-on-primary", "var(--m-accent)"],
  ])
    assert.equal(declaration(accent, token), value, token);
  // Group triggers look like the links beside them.
  assert.equal(
    declaration(
      selectorBody(navbarCss, ".m-navbar .m-flyout-trigger"),
      "color",
    ),
    "var(--m-secondary)",
  );
  assert.equal(
    declaration(
      selectorBody(section(css, "StackedShell"), ".m-stacked-tabs"),
      "background",
    ),
    "var(--m-surface)",
  );
});
