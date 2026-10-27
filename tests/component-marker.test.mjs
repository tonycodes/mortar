import test from "node:test";
import assert from "node:assert/strict";
import { h, html, UI } from "./support/render.mjs";
import { readSource } from "./support/css.mjs";

// Every exported component names itself on its root element with
// data-m-component (DESIGN.md, "Component marker"). Each factory renders the
// component with minimal props; variants whose root element changes are listed
// too, so a wrapper that appears for some props is checked as well.
const noop = () => {};
const action = { label: "Explore", href: "/explore" };
const image = { src: "/a.png", alt: "A" };
const product = { id: "p", name: "Tote", href: "/p", price: "£1", image };
const line = { ...product, quantity: 1 };
const review = {
  id: "r",
  author: "Ana",
  rating: 5,
  date: "d",
  title: "T",
  body: "B",
};
const order = {
  id: "o",
  number: "1",
  date: "d",
  total: "£1",
  status: "Delivered",
  href: "/o",
  items: [{ id: "i", name: "N", image, quantity: 1, price: "£1" }],
};
const navigation = [{ label: "Home", href: "/", current: true }];
const plan = {
  id: "basic",
  name: "Basic",
  description: "Personal projects",
  monthly: "£19",
  features: ["One project"],
  action: { label: "Choose", href: "/choose" },
};
const stats = [{ value: "12", label: "Projects" }];

const factories = {
  ActionLink: [() => html(UI.ActionLink, action)],
  ActionPanel: [() => html(UI.ActionPanel, { title: "Delete" })],
  ActivityFeed: [
    () =>
      html(UI.ActivityFeed, {
        label: "Activity",
        items: [{ id: "a", title: "Created", time: "now" }],
      }),
  ],
  ApiEndpoint: [
    () =>
      html(UI.ApiEndpoint, {
        method: "GET",
        path: "/v1/x",
        title: "List",
        params: [],
      }),
  ],
  AppShell: [() => html(UI.AppShell, { brand: "B", navigation }, "Body")],
  AppearanceControl: [
    () => html(UI.AppearanceControl, { value: "light", onChange: noop }),
  ],
  AttachmentList: [
    () =>
      html(UI.AttachmentList, {
        files: [{ id: "f", name: "a.pdf", href: "/a.pdf" }],
      }),
  ],
  AuthLayout: [
    () => html(UI.AuthLayout, { title: "Sign in" }, "Form"),
    () =>
      html(UI.AuthLayout, { title: "Sign in", layout: "split", aside: "A" }),
  ],
  AvatarGroup: [
    () => html(UI.AvatarGroup, { label: "Team", people: [{ name: "Ana" }] }),
  ],
  CodeInput: [() => html(UI.CodeInput, { label: "Code" })],
  PasswordInput: [
    () => html(UI.PasswordInput, { label: "Password" }),
    () =>
      html(UI.PasswordInput, {
        label: "Password",
        purpose: "new",
        requirements: [{ label: "12 characters", met: false }],
        strength: { value: 1, label: "Weak" },
      }),
  ],
  ProviderButtons: [
    () =>
      html(UI.ProviderButtons, {
        providers: [{ id: "g", label: "GitHub", onSelect: noop }],
      }),
  ],
  Avatar: [() => html(UI.Avatar, { name: "Ana Ruiz" })],
  Badge: [() => html(UI.Badge, null, "New")],
  Banner: [() => html(UI.Banner, { children: "Announcement" })],
  BentoGrid: [
    () =>
      html(UI.BentoGrid, {
        title: "Layout",
        items: [{ title: "Wide", description: "Spans two.", span: 2 }],
      }),
  ],
  Breadcrumbs: [() => html(UI.Breadcrumbs, { items: [{ label: "Home" }] })],
  ButtonGroup: [
    () =>
      html(UI.ButtonGroup, { label: "Actions", items: [{ label: "Copy" }] }),
  ],
  Button: [() => html(UI.Button, null, "Save")],
  Calendar: [
    () => html(UI.Calendar, { today: "2026-10-17" }),
    () => html(UI.Calendar, { today: "2026-10-17", agenda: true }),
    () => html(UI.Calendar, { today: "2026-10-17", view: "week" }),
    () => html(UI.Calendar, { today: "2026-10-17", view: "year" }),
  ],
  CallToAction: [
    () => html(UI.CallToAction, { title: "Start", actions: [action] }),
  ],
  Callout: [() => html(UI.Callout, null, "Note")],
  Card: [() => html(UI.Card, null, "Body")],
  ChatPreview: [
    () =>
      html(UI.ChatPreview, {
        title: "Example",
        messages: [{ from: "user", content: "Hello" }],
      }),
  ],
  CheckList: [() => html(UI.CheckList, { items: ["One"] })],
  Checkbox: [
    () => html(UI.Checkbox, { label: "Agree" }),
    () => html(UI.Checkbox, { label: "Agree", description: "Terms" }),
    () => html(UI.Checkbox, { label: "Agree", error: "Agree to continue" }),
  ],
  CodeBlock: [() => html(UI.CodeBlock, { code: "npm i" })],
  CodeTabs: [
    () =>
      html(UI.CodeTabs, { tabs: [{ id: "npm", label: "npm", code: "npm i" }] }),
  ],
  Combobox: [
    () =>
      html(UI.Combobox, {
        label: "Owner",
        value: null,
        onChange: noop,
        options: [{ value: "a", label: "Ana" }],
      }),
  ],
  CommentComposer: [() => html(UI.CommentComposer, { onSubmit: noop })],
  ContactSection: [
    () => html(UI.ContactSection, { title: "Contact", children: "Form" }),
  ],
  Container: [() => html(UI.Container, null, "Body")],
  ContentSection: [() => html(UI.ContentSection, { title: "Story" })],
  DataTable: [
    () =>
      html(UI.DataTable, {
        caption: "Projects",
        columns: [{ key: "name", label: "Name", render: (row) => row.name }],
        rows: [{ id: "1", name: "A" }],
        rowLabel: (row) => row.name,
      }),
  ],
  DescriptionList: [
    () => html(UI.DescriptionList, { items: [{ term: "a", details: "b" }] }),
  ],
  Divider: [() => html(UI.Divider), () => html(UI.Divider, { label: "Or" })],
  DocsShell: [
    () =>
      html(UI.DocsShell, {
        brand: "Docs",
        navigation: [{ label: "Start", items: navigation }],
        children: "Body",
      }),
  ],
  Dropdown: [
    () =>
      html(UI.Dropdown, {
        label: "More",
        items: [{ label: "Edit", onSelect: noop }],
      }),
  ],
  EmptyState: [() => html(UI.EmptyState, { title: "Nothing here" })],
  ErrorSummary: [
    () =>
      html(UI.ErrorSummary, {
        errors: [{ message: "Enter your email", target: "email" }],
      }),
  ],
  FAQ: [
    () =>
      html(UI.FAQ, {
        title: "Questions",
        items: [{ question: "Is it open?", answer: "Yes." }],
      }),
  ],
  FeatureGrid: [
    () =>
      html(UI.FeatureGrid, {
        title: "Features",
        items: [{ title: "One", description: "Detail" }],
      }),
  ],
  FeatureSection: [
    () =>
      html(UI.FeatureSection, {
        title: "Feature",
        description: "Detail",
        children: "Preview",
      }),
  ],
  Fieldset: [() => html(UI.Fieldset, { legend: "Shipping" }, "Fields")],
  FileTree: [
    () => html(UI.FileTree, { label: "Files", items: [{ name: "src" }] }),
  ],
  FilterChip: [
    () => html(UI.FilterChip, { label: "Status" }),
    () => html(UI.FilterChip, { label: "Status", onRemove: noop }),
  ],
  Footer: [
    () =>
      html(UI.Footer, {
        brand: "Northwind",
        description: "Example product",
        columns: [{ label: "Product", items: [action] }],
        copyright: "2026 Northwind",
      }),
  ],
  GridList: [
    () =>
      html(UI.GridList, {
        label: "Projects",
        items: [{ id: "g", title: "A" }],
      }),
  ],
  HeaderSection: [() => html(UI.HeaderSection, { title: "About" })],
  Hero: [() => html(UI.Hero, { title: "Example", actions: [action] })],
  Input: [() => html(UI.Input, { label: "Name" })],
  Kbd: [() => html(UI.Kbd, { keys: ["⌘K"] })],
  LinkCards: [
    () => html(UI.LinkCards, { items: [{ label: "Guide", href: "/g" }] }),
  ],
  Listbox: [
    () =>
      html(UI.Listbox, {
        label: "Owner",
        value: "a",
        onChange: noop,
        options: [{ value: "a", label: "Ana" }],
      }),
  ],
  LogoCloud: [
    () =>
      html(UI.LogoCloud, {
        label: "Customers",
        items: [{ name: "Northwind" }],
      }),
  ],
  MarketingHeader: [
    () => html(UI.MarketingHeader, { brand: "Northwind", links: [action] }),
    () =>
      html(UI.MarketingHeader, {
        brand: "Northwind",
        tagline: "Scheduling",
        links: [action],
      }),
  ],
  MarketingPage: [
    () =>
      html(
        UI.MarketingPage,
        { header: h(UI.MarketingHeader, { brand: "N", links: [] }) },
        "Body",
      ),
  ],
  MediaObject: [() => html(UI.MediaObject, { media: "M" }, "Body")],
  MetricGroup: [
    () =>
      html(UI.MetricGroup, {
        label: "Metrics",
        items: [{ label: "A", value: "1" }],
      }),
  ],
  MockWindow: [
    () => html(UI.MockWindow, { label: "Example window", children: "Body" }),
  ],
  Navbar: [() => html(UI.Navbar, { brand: "B", items: navigation })],
  NetworkIllustration: [
    () =>
      html(UI.NetworkIllustration, {
        nodes: [
          { id: "a", x: 0, y: 0 },
          { id: "b", x: 10, y: 0 },
        ],
        connections: [{ from: "a", to: "b" }],
      }),
    () =>
      html(UI.NetworkIllustration, {
        motion: "static",
        label: "Two points",
        nodes: [],
        connections: [],
      }),
  ],
  Newsletter: [() => html(UI.Newsletter, { title: "Updates", onSubmit: noop })],
  NotFound: [() => html(UI.NotFound, { title: "Missing", actions: [action] })],
  Notice: [() => html(UI.Notice, { title: "Saved" })],
  OrderHistory: [
    () => html(UI.OrderHistory, { orders: [order] }),
    () => html(UI.OrderHistory, { orders: [] }),
  ],
  OrderSummary: [
    () =>
      html(UI.OrderSummary, {
        lines: [{ label: "Subtotal", value: "£1" }],
        total: { label: "Total", value: "£1" },
      }),
  ],
  PageFeedback: [() => html(UI.PageFeedback, { value: null, onChange: noop })],
  PageHeading: [() => html(UI.PageHeading, { title: "Page" })],
  PagerLinks: [() => html(UI.PagerLinks, { next: action })],
  Pagination: [
    () => html(UI.Pagination, { page: 1, pageCount: 3, onChange: noop }),
  ],
  PlanComparison: [
    () =>
      html(UI.PlanComparison, {
        title: "Compare",
        plans: ["Basic", "Team"],
        groups: [
          {
            label: "Limits",
            rows: [{ feature: "Projects", values: ["1", "2"] }],
          },
        ],
      }),
  ],
  PostList: [
    () =>
      html(UI.PostList, {
        title: "Notes",
        posts: [
          {
            href: "/notes/one",
            title: "One",
            excerpt: "Excerpt",
            date: "2026-10-15",
            dateLabel: "15 Oct 2026",
          },
        ],
      }),
  ],
  PreviewFrame: [
    () => html(UI.PreviewFrame, { label: "Example", src: "/frame" }),
  ],
  Pricing: [() => html(UI.Pricing, { title: "Plans", plans: [plan] })],
  ProcessSteps: [
    () =>
      html(UI.ProcessSteps, {
        title: "Steps",
        items: [{ title: "Sign up", description: "Create an account." }],
      }),
  ],
  ProductFilters: [
    () =>
      html(UI.ProductFilters, {
        facets: [
          {
            id: "c",
            label: "Colour",
            options: [{ value: "b", label: "Black" }],
          },
        ],
        selected: {},
        onChange: noop,
      }),
  ],
  ProductList: [
    () => html(UI.ProductList, { label: "Products", products: [product] }),
  ],
  ProductOverview: [
    () =>
      html(UI.ProductOverview, { name: "Tote", price: "£1", images: [image] }),
  ],
  ProductReviews: [
    () =>
      html(UI.ProductReviews, {
        average: 5,
        count: 1,
        distribution: [{ stars: 5, count: 1 }],
        reviews: [review],
      }),
  ],
  ProgressBar: [() => html(UI.ProgressBar, { label: "Upload", value: 50 })],
  ProgressSteps: [
    () =>
      html(UI.ProgressSteps, {
        steps: [{ id: "a", name: "A", status: "current" }],
      }),
  ],
  Prose: [() => html(UI.Prose, null, h("p", null, "Body"))],
  RadioGroup: [
    () =>
      html(UI.RadioGroup, {
        label: "Plan",
        name: "plan",
        value: "a",
        onChange: noop,
        options: [{ value: "a", label: "A" }],
      }),
  ],
  Release: [
    () =>
      html(UI.Release, {
        version: "1.0.0",
        date: "2026-10-19",
        dateLabel: "19 Oct",
        changes: [{ type: "added", items: ["X"] }],
      }),
  ],
  SaveBar: [
    () => html(UI.SaveBar, { open: false, onSave: noop, onDiscard: noop }),
    () => html(UI.SaveBar, { open: true, onSave: noop, onDiscard: noop }),
  ],
  SearchTrigger: [() => html(UI.SearchTrigger, { onOpen: noop })],
  Section: [() => html(UI.Section, { title: "Band", children: "Body" })],
  SectionHeading: [() => html(UI.SectionHeading, { title: "Section" })],
  SegmentedControl: [
    () =>
      html(UI.SegmentedControl, {
        label: "View",
        value: "a",
        onChange: noop,
        options: [{ value: "a", label: "A" }],
      }),
  ],
  Select: [
    () =>
      html(UI.Select, { label: "Plan", options: [{ value: "a", label: "A" }] }),
  ],
  SettingsSection: [
    () => html(UI.SettingsSection, { title: "Profile" }, "Fields"),
  ],
  ShoppingCart: [
    () =>
      html(UI.ShoppingCart, {
        items: [line],
        onQuantityChange: noop,
        onRemove: noop,
      }),
    () =>
      html(UI.ShoppingCart, {
        items: [],
        onQuantityChange: noop,
        onRemove: noop,
      }),
    () =>
      html(UI.ShoppingCart, {
        items: [line],
        onQuantityChange: noop,
        onRemove: noop,
        summary: "Summary",
      }),
  ],
  Sidebar: [() => html(UI.Sidebar, { navigation })],
  SignInPanel: [
    () => html(UI.SignInPanel, { title: "Sign in" }),
    () => html(UI.SignInPanel, { title: "Sign in", aside: "Aside" }),
  ],
  Stack: [() => html(UI.Stack, null, "Body")],
  StackedList: [
    () =>
      html(UI.StackedList, { label: "List", items: [{ id: "a", title: "A" }] }),
  ],
  StackedShell: [
    () => html(UI.StackedShell, { brand: "B", navigation }, "Body"),
  ],
  StatGroup: [
    () => html(UI.StatGroup, { label: "Numbers", items: stats }),
    () =>
      html(UI.StatGroup, {
        label: "Numbers",
        items: stats,
        background: h("img", { alt: "" }),
      }),
  ],
  Steps: [() => html(UI.Steps, { items: [{ title: "Install" }] })],
  Switch: [
    () => html(UI.Switch, { label: "On" }),
    () => html(UI.Switch, { label: "On", description: "Details" }),
  ],
  TabNav: [() => html(UI.TabNav, { label: "Sections", items: navigation })],
  Table: [
    () =>
      html(UI.Table, {
        caption: "Rows",
        columns: [{ key: "a", label: "A" }],
        rows: [],
      }),
  ],
  Tabs: [
    () =>
      html(UI.Tabs, {
        label: "Tabs",
        value: "a",
        onChange: noop,
        items: [{ id: "a", label: "A", content: "a" }],
      }),
  ],
  TeamGrid: [
    () =>
      html(UI.TeamGrid, {
        title: "Team",
        members: [{ name: "Ana", role: "Design" }],
      }),
  ],
  Testimonial: [
    () =>
      html(UI.Testimonial, { quote: "It works.", name: "Example customer" }),
  ],
  TestimonialGrid: [
    () =>
      html(UI.TestimonialGrid, {
        title: "Quotes",
        items: [{ quote: "Clear.", name: "Ana" }],
      }),
  ],
  Text: [() => html(UI.Text, null, "Body")],
  TextArea: [() => html(UI.TextArea, { label: "Notes" })],
  // The default document scope renders no element of its own; see below.
  ThemeProvider: [() => html(UI.ThemeProvider, { scope: "container" }, "Body")],
  Toast: [() => html(UI.Toast, { title: "Saved" })],
  Toaster: [() => html(UI.Toaster, { items: [], onDismiss: noop })],
};

// Dialogs mark their portalled dialog root, which the server does not render;
// the browser overlay probe checks it (tests/support/preview.mjs openOverlay).
const portalled = [
  "CommandPalette",
  "ConfirmDialog",
  "Modal",
  "ProductQuickView",
  "SearchDialog",
  "SlideOver",
];

/** The first element, skipping hoisted resource hints such as image preloads. */
const opening = (markup) =>
  markup
    .replace(/^(<link\b[^>]*\/>)+/, "")
    .match(/^<[a-z][a-z0-9]*\b[^>]*>/)?.[0];

test("every catalogue component names itself on its root with data-m-component", async () => {
  const { components } = JSON.parse(await readSource("catalog.json"));
  const names = components.map((c) => c.export).sort();
  assert.deepEqual(
    [...Object.keys(factories), ...portalled].sort(),
    names,
    "add a factory (or a portalled entry) for every catalogue component",
  );
  const problems = [];
  for (const [name, renders] of Object.entries(factories))
    renders.forEach((render, index) => {
      const root = opening(render());
      if (!root?.includes(` data-m-component="${name}"`))
        problems.push(`${name}[${index}]: ${root}`);
    });
  assert.deepEqual(problems, []);
  for (const name of portalled)
    assert.equal(
      components.find((c) => c.export === name).testing.probe,
      "dialog",
      `${name} needs the dialog probe, which checks its marker`,
    );
});

test("the marker names only the outermost component", () => {
  // SearchDialog's root is a CommandPalette, AppearanceControl's a
  // SegmentedControl: the outer name replaces the inner one.
  assert.doesNotMatch(
    html(UI.AppearanceControl, { value: "light", onChange: noop }),
    /data-m-component="SegmentedControl"/,
  );
  // A wrapper takes the name; the element it wraps is no longer the root.
  for (const markup of [
    html(UI.SignInPanel, { title: "Sign in", aside: "Aside" }),
    html(UI.ShoppingCart, {
      items: [line],
      onQuantityChange: noop,
      onRemove: noop,
      summary: "S",
    }),
    html(UI.StatGroup, {
      label: "N",
      items: stats,
      background: h("img", { alt: "" }),
    }),
  ])
    assert.equal(
      markup.match(/data-m-component="(SignInPanel|ShoppingCart|StatGroup)"/g)
        .length,
      1,
    );
  // A nested component keeps its own marker.
  assert.match(
    html(UI.PageHeading, { title: "P", breadcrumbs: [{ label: "Home" }] }),
    /<nav data-m-component="Breadcrumbs"/,
  );
  // ThemeProvider with the default document scope renders only its children.
  assert.equal(
    html(UI.ThemeProvider, null, h("p", null, "Body")),
    "<p>Body</p>",
  );
});
