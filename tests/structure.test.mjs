import test from "node:test";
import assert from "node:assert/strict";
import {
  h,
  html,
  Breadcrumbs,
  PageHeading,
  Sidebar,
  AppShell,
  Navbar,
  Fieldset,
  Input,
  ActionPanel,
  Banner,
} from "./support/render.mjs";

test("Breadcrumbs mark the current page and PageHeading reuses them", () => {
  const items = [
    { label: "Projects", href: "#projects" },
    { label: "Northwind" },
  ];
  const own = html(Breadcrumbs, { items, separator: "chevron" });
  assert.match(own, /<nav class="m-breadcrumbs" aria-label="Breadcrumb"/);
  assert.match(own, /data-separator="chevron"/);
  assert.match(own, /<a href="#projects">Projects<\/a>/);
  assert.match(own, /<span aria-current="page">Northwind<\/span>/);
  assert.ok(
    html(PageHeading, { title: "Northwind", breadcrumbs: items }).includes(
      '<nav class="m-breadcrumbs" aria-label="Breadcrumb"><ol>',
    ),
  );
});

test("Sidebar renders labelled navigation with icons and counts, and AppShell keeps its markup", () => {
  const navigation = [
    {
      label: "Inbox",
      href: "#inbox",
      current: true,
      count: "12",
      icon: h("svg", { viewBox: "0 0 24 24" }),
    },
  ];
  const own = html(Sidebar, {
    brand: "Northwind",
    navigation,
    sections: [{ label: "Teams", items: [{ label: "Design", href: "#d" }] }],
    footer: "Signed in",
  });
  assert.match(own, /^<div class="m-sidebar-panel">/);
  assert.match(own, /<nav aria-label="Primary">/);
  assert.match(own, /aria-current="page"/);
  assert.match(own, /<span class="m-nav-icon" aria-hidden="true"><svg/);
  const inbox = own.match(/<a href="#inbox"[^]*?<\/a>/)[0];
  assert.doesNotMatch(inbox, /m-nav-marker/);
  // Group labels name a group inside the navigation; they are not headings.
  assert.match(
    own,
    /<div role="group" aria-labelledby="([^"]+)"><p id="\1" class="m-nav-group-title">Teams<\/p>/,
  );
  assert.doesNotMatch(own, /<h2/);
  assert.match(own, /<div class="m-user">Signed in<\/div>/);
  const shell = html(AppShell, {
    brand: "Northwind",
    navigation: [{ label: "Overview", href: "#o" }],
    children: "Body",
  });
  assert.match(
    shell,
    /<aside class="m-sidebar"><a class="m-workspace" href="#o">/,
  );
  assert.match(
    shell,
    /<span class="m-nav-marker" aria-hidden="true"><\/span>Overview/,
  );
});

test("Navbar links its mobile menu button to the navigation it controls", () => {
  const own = html(Navbar, {
    brand: "Northwind",
    items: [
      { label: "Dashboard", href: "#dash", current: true },
      { label: "Team", href: "#team" },
    ],
    actions: "Actions",
  });
  const controls = own.match(/aria-controls="([^"]+)"/)?.[1];
  assert.ok(controls, own);
  assert.match(own, /aria-expanded="false"/);
  assert.match(own, new RegExp(`<nav id="${controls}" aria-label="Primary">`));
  assert.match(own, /<a href="#dash" aria-current="page">Dashboard<\/a>/);
});

test("Fieldset groups fields under a legend and disables them together", () => {
  const own = html(
    Fieldset,
    {
      legend: "Shipping",
      description: "Where should we send it?",
      disabled: true,
    },
    h(Input, { label: "Street" }),
  );
  assert.match(own, /^<fieldset class="m-fieldset" disabled=""/);
  assert.match(own, /<legend>Shipping<\/legend>/);
  const described = own.match(/aria-describedby="([^"]+)"/)?.[1];
  assert.ok(own.includes(`<p id="${described}">Where should we send it?</p>`));
});

test("ActionPanel names its section and places the action", () => {
  const own = html(ActionPanel, {
    title: "Delete account",
    description: "This cannot be undone.",
    action: h("button", {}, "Delete"),
    tone: "danger",
  });
  const id = own.match(/<h2 id="([^"]+)"/)?.[1];
  assert.ok(own.includes(`aria-labelledby="${id}"`));
  assert.match(own, /data-tone="danger"/);
  assert.match(
    own,
    /<div class="m-action-panel-action"><button>Delete<\/button>/,
  );
});

test("Banner is a labelled region with an optional link and dismiss button", () => {
  const own = html(Banner, {
    children: "Mortar 1.0 is out",
    action: { label: "Read the release", href: "#release" },
    onDismiss() {},
  });
  assert.match(own, /<section class="m-banner" aria-label="Announcement"/);
  assert.match(own, /<a href="#release">Read the release/);
  assert.match(own, /<button type="button" aria-label="Dismiss announcement"/);
  assert.doesNotMatch(html(Banner, { children: "Static" }), /<button/);
});
