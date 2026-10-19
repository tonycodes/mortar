// API conventions (DESIGN.md) for the application, workspace, layout and
// display components: className, heading levels, state props and data attributes.
import test from "node:test";
import assert from "node:assert/strict";
import { h, html, UI } from "./support/render.mjs";

const nav = [{ label: "Overview", href: "#o" }];
const rows = [{ id: "a", name: "Ana" }];
const column = { key: "name", label: "Name", render: (row) => row.name };

// Minimal props per component; the root element is the first tag rendered.
const roots = {
  AppShell: { brand: "B", navigation: nav, children: "x" },
  Sidebar: { navigation: nav },
  StackedShell: { brand: "B", navigation: nav, children: "x" },
  Navbar: { brand: "B", items: nav },
  Breadcrumbs: { items: [{ label: "Home" }] },
  TabNav: { label: "T", items: nav },
  ProgressSteps: { steps: [{ id: "1", name: "One", status: "current" }] },
  ActionPanel: { title: "Delete" },
  PageHeading: { title: "Page" },
  MetricGroup: { label: "M", items: [{ label: "A", value: "1" }] },
  DataTable: { caption: "C", columns: [column], rows, rowLabel: (r) => r.name },
  Table: { caption: "C", columns: [{ key: "a", label: "A" }] },
  Pagination: { page: 1, pageCount: 2, onChange() {} },
  SettingsSection: { title: "S", children: "x" },
  ActivityFeed: { label: "A", items: [] },
  SignInPanel: { title: "Sign in" },
  StackedList: { label: "L", items: [] },
  Stack: { children: "x" },
  Container: { children: "x" },
  Text: { children: "x" },
  Section: { title: "S" },
  Divider: {},
  Card: { children: "x" },
  MediaObject: { media: "m" },
  SectionHeading: { title: "S" },
  Prose: { children: "x" },
  Avatar: { name: "Ana" },
  AvatarGroup: { label: "A", people: [{ name: "Ana" }] },
  Kbd: { keys: ["K"] },
  ProgressBar: { label: "P", value: 1 },
  FilterChip: { label: "F" },
  CheckList: { items: ["a"] },
  DescriptionList: { items: [{ term: "T", details: "D" }] },
  GridList: { label: "G", items: [] },
  AttachmentList: { files: [] },
};

test("every component in the family merges className onto its root", () => {
  for (const [name, props] of Object.entries(roots)) {
    const markup = html(UI[name], { ...props, className: "consumer-x" });
    const root = markup.match(/^<[a-z]+[^>]*>/)?.[0] ?? "";
    assert.match(root, /class="[^"]*\bm-[^"]*\bconsumer-x"/, name);
    // Without a className there is no trailing space or "undefined".
    const plain = html(UI[name], props).match(/^<[a-z]+[^>]*>/)?.[0] ?? "";
    assert.doesNotMatch(plain, /class="[^"]* "|undefined/, name);
  }
});

test("section-level components accept an id on their root", () => {
  for (const name of [
    "ActionPanel",
    "PageHeading",
    "DataTable",
    "Table",
    "SettingsSection",
    "SignInPanel",
    "StackedList",
    "Section",
    "Card",
    "SectionHeading",
    "DescriptionList",
  ])
    assert.match(
      html(UI[name], { ...roots[name], id: "target" }),
      /^<[a-z]+ id="target"/,
      name,
    );
});

test("StackedList: title, heading levels, action-only header and items with groups", () => {
  const titled = html(UI.StackedList, {
    title: "Members",
    action: h("a", { href: "#m" }, "Manage"),
    items: [{ id: "a", title: "Ana" }],
    groups: [{ label: "T", items: [{ id: "t", title: "Tom" }] }],
  });
  const titleId = titled.match(
    /<h2 id="([^"]+)" class="m-stacked-title">Members<\/h2>/,
  )?.[1];
  assert.ok(titleId, titled);
  // Without a label the section is named by its visible title.
  assert.match(
    titled,
    new RegExp(
      `<section data-m-component="StackedList" class="m-stacked-list" aria-labelledby="${titleId}">`,
    ),
  );
  // Group headings sit one level below the title.
  assert.match(
    titled,
    /<h3 id="[^"]+" class="m-stacked-group-heading">T<\/h3>/,
  );
  // Ungrouped items render too, before the groups.
  assert.ok(titled.indexOf("Ana") < titled.indexOf("Tom"));
  const level = html(UI.StackedList, {
    title: "Members",
    headingLevel: 3,
    groups: [{ label: "T", items: [] }],
  });
  assert.match(level, /<h3 id="[^"]+" class="m-stacked-title">/);
  assert.match(level, /<h4 id="[^"]+" class="m-stacked-group-heading">/);
  // An action alone never renders an empty heading.
  const actionOnly = html(UI.StackedList, {
    label: "Files",
    action: h("a", { href: "#f" }, "View all"),
    items: [],
  });
  assert.doesNotMatch(actionOnly, /<h[1-6]/);
  assert.match(
    actionOnly,
    /<header><div class="m-stacked-action"><a href="#f">View all<\/a><\/div><\/header>/,
  );
  assert.match(actionOnly, /aria-label="Files"/);
});

test("DataTable: empty object, empty-state heading level, start/end alignment and a persistent status region", () => {
  const props = {
    caption: "Projects",
    columns: [column],
    rowLabel: (r) => r.name,
  };
  const empty = html(UI.DataTable, {
    ...props,
    rows: [],
    headingLevel: 2,
    empty: {
      title: "No projects",
      description: "Create one.",
      action: h("button", {}, "New project"),
    },
  });
  assert.match(
    empty,
    /<h2>No projects<\/h2><p>Create one.<\/p><button>New project<\/button>/,
  );
  assert.match(
    html(UI.DataTable, { ...props, rows: [] }),
    /<h3>No records<\/h3>/,
  );
  // The status region is mounted before loading so the change is announced.
  assert.match(empty, /<p class="m-sr-only" role="status"><\/p>/);
  assert.match(
    html(UI.DataTable, { ...props, rows, loading: true }),
    /<p class="m-table-state" role="status" data-loading="true">Loading records…<\/p>/,
  );
  const aligned = html(UI.DataTable, {
    ...props,
    rows,
    density: "default",
    columns: [column, { key: "n", label: "N", align: "end", render: () => 1 }],
  });
  assert.match(aligned, /<th scope="col" data-align="end">N<\/th>/);
  assert.doesNotMatch(aligned, /data-align="(start|left|right)"|data-density/);
  assert.match(
    html(UI.Table, {
      caption: "C",
      columns: [{ key: "a", label: "A", align: "end" }],
      rows: [{ a: "1" }],
    }),
    /<th scope="row" data-align="end">1<\/th>/,
  );
});

test("DataTable counts selections on every page", () => {
  const markup = html(UI.DataTable, {
    caption: "Projects",
    columns: [column],
    rows,
    rowLabel: (r) => r.name,
    selectedIds: ["a", "on-another-page"],
    onSelectionChange() {},
  });
  assert.match(markup, /<strong>2 selected<\/strong>/);
});

test("Pagination keeps Previous and Next focusable at the ends", () => {
  const first = html(UI.Pagination, { page: 1, pageCount: 3, onChange() {} });
  assert.match(
    first,
    /<button data-m-component="Button" aria-disabled="true" type="button" class="m-button m-button-secondary ?">Previous<\/button>/,
  );
  assert.doesNotMatch(first, /disabled=""/);
  const last = html(UI.Pagination, { page: 3, pageCount: 3, onChange() {} });
  assert.match(
    last,
    /<button data-m-component="Button" aria-disabled="true" type="button" class="m-button m-button-secondary ?">Next<\/button>/,
  );
});

test("AppShell: generated content id, footer and sections, and a Menu button named by its text", () => {
  const markup = html(UI.AppShell, {
    brand: "B",
    navigation: nav,
    sections: [{ label: "Teams", items: [{ label: "Design", href: "#d" }] }],
    footer: "Signed in",
    children: "x",
  });
  const id = markup.match(/<main id="([^"]+)"/)?.[1];
  assert.match(id, /^m-content-/);
  assert.notEqual(id, "m-content");
  assert.match(markup, new RegExp(`<a class="m-skip" href="#${id}">`));
  assert.match(markup, /<p id="[^"]+" class="m-nav-group-title">Teams<\/p>/);
  assert.match(markup, /<div class="m-user">Signed in<\/div>/);
  const menu = markup.match(
    /<button[^>]*m-menu-trigger[^>]*>Menu<\/button>/,
  )?.[0];
  assert.ok(menu, markup);
  assert.doesNotMatch(menu, /aria-label/);
  assert.match(menu, /aria-haspopup="dialog"/);
});

test("navigation counts show whenever they are defined, including 0", () => {
  const items = [{ label: "Inbox", href: "#i", count: 0 }];
  assert.match(
    html(UI.Sidebar, { navigation: items }),
    /<span class="m-nav-count">0<\/span>/,
  );
  assert.match(
    html(UI.Navbar, { brand: "B", items }),
    /<span class="m-nav-count">0<\/span>/,
  );
  assert.match(
    html(UI.TabNav, { label: "T", items }),
    /<span class="m-tab-count">0<\/span>/,
  );
  assert.doesNotMatch(html(UI.Sidebar, { navigation: nav }), /m-nav-count/);
});

test("heading levels: SettingsSection, Section, Card, SectionHeading, DescriptionList, ActionPanel, SignInPanel, GridList", () => {
  const cases = [
    [
      UI.SettingsSection,
      { title: "S", children: "x", headingLevel: 3 },
      "h3",
      "m-settings-title",
    ],
    [UI.Section, { title: "S", headingLevel: 3 }, "h3", "m-section-title"],
    [UI.Card, { title: "S", headingLevel: 5 }, "h5", "m-card-title"],
    [
      UI.SectionHeading,
      { title: "S", headingLevel: 6 },
      "h6",
      "m-section-heading-title",
    ],
    [
      UI.DescriptionList,
      { title: "S", items: [], headingLevel: 5 },
      "h5",
      "m-description-title",
    ],
    [
      UI.ActionPanel,
      { title: "S", headingLevel: 4 },
      "h4",
      "m-action-panel-title",
    ],
    [UI.PageHeading, { title: "S", headingLevel: 3 }, "h3", "m-page-title"],
    [UI.SignInPanel, { title: "S", headingLevel: 2 }, "h2", "m-sign-in-title"],
  ];
  for (const [Component, props, tag, hook] of cases)
    assert.match(
      html(Component, props),
      new RegExp(`<${tag}(?: id="[^"]+")? class="${hook}">S</${tag}>`),
      hook,
    );
  // Defaults are unchanged.
  assert.match(
    html(UI.SettingsSection, { title: "S", children: "x" }),
    /<h2 id="[^"]+" class="m-settings-title">/,
  );
  const grid = html(UI.GridList, {
    label: "G",
    itemHeadingLevel: 2,
    items: [{ id: "a", title: "A" }],
  });
  assert.match(grid, /<h2 class="m-grid-list-title">A<\/h2>/);
});

test("data attributes: booleans only when true, enums omitted at their default", () => {
  assert.match(
    html(UI.Container, { children: "x" }),
    /^<div data-m-component="Container" class="m-container" data-padded="true">/,
  );
  assert.match(
    html(UI.Container, { padded: false, children: "x" }),
    /^<div data-m-component="Container" class="m-container">/,
  );
  assert.match(
    html(UI.SectionHeading, { title: "S", divider: false }),
    /^<div data-m-component="SectionHeading" class="m-section-heading">/,
  );
  assert.match(
    html(UI.SectionHeading, { title: "S" }),
    /^<div data-m-component="SectionHeading" class="m-section-heading" data-divider="true">/,
  );
  assert.match(
    html(UI.Navbar, { brand: "B", items: nav }),
    /<nav id="[^"]+" aria-label="Primary">/,
  );
  assert.match(
    html(UI.Stack, { children: "x" }),
    /^<div data-m-component="Stack" class="m-layout-stack">/,
  );
  assert.match(
    html(UI.Text, { children: "x" }),
    /^<p data-m-component="Text" class="m-text">/,
  );
  // Text colour has its own attribute; data-tone is for status and surfaces.
  assert.match(
    html(UI.Text, { color: "muted", children: "x" }),
    /^<p data-m-component="Text" class="m-text" data-color="muted">/,
  );
  assert.match(
    html(UI.Card, { children: "x" }),
    /^<div data-m-component="Card" class="m-card">/,
  );
  assert.match(
    html(UI.Card, { tone: "muted", children: "x" }),
    /data-tone="muted"/,
  );
  assert.match(
    html(UI.Divider, {}),
    /^<hr data-m-component="Divider" class="m-divider"\/>/,
  );
  assert.match(
    html(UI.Section, { title: "S" }),
    /^<section class="m-marketing-section m-section" data-m-component="Section">/,
  );
  assert.match(
    html(UI.ActionPanel, { title: "S" }),
    /^<section data-m-component="ActionPanel" class="m-action-panel" aria-labelledby="[^"]+">/,
  );
  assert.match(
    html(UI.FilterChip, { label: "F", onRemove() {} }),
    /^<span data-m-component="FilterChip" class="m-chip" data-selected="true">/,
  );
  assert.match(
    html(UI.FilterChip, { label: "F", selected: true }),
    /data-selected="true"/,
  );
});

test("FilterChip's remove button uses the shared close icon", () => {
  const chip = html(UI.FilterChip, { label: "Branch", onRemove() {} });
  assert.match(
    chip,
    /<button type="button" aria-label="Remove Branch"><svg[^>]*aria-hidden="true"/,
  );
  assert.doesNotMatch(chip, /✕/);
});

test("Avatar can be decorative where its name is visible", () => {
  const avatar = html(UI.Avatar, { name: "Ana Kovač", decorative: true });
  assert.match(
    avatar,
    /^<span data-m-component="Avatar" class="m-avatar m-avatar-md" aria-hidden="true">/,
  );
  assert.doesNotMatch(avatar, /role="img"|aria-label/);
});

test("ProgressBar is named by its visible label and takes a status tone", () => {
  const bar = html(UI.ProgressBar, {
    label: "Storage",
    value: 92,
    valueLabel: "92%",
    tone: "warning",
  });
  const id = bar.match(/<span id="([^"]+)">Storage<\/span>/)?.[1];
  assert.ok(id, bar);
  assert.match(bar, new RegExp(`role="progressbar" aria-labelledby="${id}"`));
  assert.doesNotMatch(bar, /aria-label=/);
  assert.match(
    bar,
    /^<div data-m-component="ProgressBar" class="m-progress" data-tone="warning">/,
  );
  assert.match(
    html(UI.ProgressBar, { label: "P", value: 1 }),
    /^<div data-m-component="ProgressBar" class="m-progress">/,
  );
});

test("SignInPanel keeps its status region mounted before success", () => {
  const idle = html(UI.SignInPanel, {
    title: "Sign in",
    email: { onSubmit() {} },
  });
  assert.match(idle, /<p role="status" class="m-sr-only"><\/p>/);
  const done = html(UI.SignInPanel, {
    title: "Sign in",
    email: { onSubmit() {}, status: "success" },
  });
  assert.match(
    done,
    /<p role="status">Check your inbox for a sign-in link.<\/p>/,
  );
});

test("Sidebar keeps a parent's own link inside its disclosure", () => {
  const markup = html(UI.Sidebar, {
    navigation: [
      {
        label: "Reports",
        href: "#reports",
        current: true,
        children: [{ label: "Revenue", href: "#revenue" }],
      },
    ],
  });
  assert.match(
    markup,
    /<details class="m-nav-group" open=""><summary>[^]*?Reports<\/summary><div class="m-nav-children"><a href="#reports" aria-current="page">/,
  );
});
