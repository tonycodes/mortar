import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as UI from "../dist/index.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFile(resolve(root, path), "utf8");

function markup(Component, props) {
  return renderToStaticMarkup(React.createElement(Component, props));
}
function plan(extra = {}) {
  return {
    id: "basic",
    name: "Basic",
    description: "Personal projects",
    monthly: "£19",
    features: ["One project"],
    action: { label: "Choose", href: "/choose" },
    ...extra,
  };
}
function pricing(props) {
  return markup(UI.Pricing, {
    title: "Plans",
    description: "Example prices",
    ...props,
  });
}
function ruleBodies(css, selector) {
  const bodies = [];
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = match[1]
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split(",")
      .map((item) => item.trim());
    if (selectors.includes(selector)) bodies.push(match[2]);
  }
  return bodies.join("\n");
}
function declaration(body, property) {
  const match = body.match(
    new RegExp(`(?:^|[;{}])\\s*${property}\\s*:\\s*([^;]+)`, "i"),
  );
  return match ? match[1].trim() : "";
}

test("dark surface tokens for CallToAction and featured pricing", async () => {
  const css = await read("src/components.css");
  const cta = ruleBodies(css, ".m-cta");
  const featured = ruleBodies(
    css,
    '.m-pricing-grid article[data-featured="true"]',
  );
  assert.notEqual(cta, "", "missing .m-cta rule");
  assert.notEqual(featured, "", "missing featured pricing rule");
  const problems = [];
  for (const [name, body] of [
    [".m-cta", cta],
    ['.m-pricing-grid article[data-featured="true"]', featured],
  ]) {
    const background = declaration(body, "background");
    const color = declaration(body, "color");
    if (background !== "var(--m-surface)")
      problems.push(`${name} background is ${background || "unset"}`);
    if (color !== "var(--m-ink)")
      problems.push(`${name} color is ${color || "unset"}`);
  }
  assert.deepEqual(problems, []);
});

test("CallToAction and featured Pricing cards accept tone surface or inverse", () => {
  const action = { label: "Start", href: "/start" };
  const problems = [];
  const surface = markup(UI.CallToAction, {
    title: "Start a project",
    actions: [action],
    tone: "surface",
  });
  const inverse = markup(UI.CallToAction, {
    title: "Start a project",
    actions: [action],
    tone: "inverse",
  });
  if (!surface.includes('data-tone="surface"'))
    problems.push("CallToAction tone=surface did not set data-tone");
  if (!inverse.includes('data-tone="inverse"'))
    problems.push("CallToAction tone=inverse did not set data-tone");
  for (const tone of ["surface", "inverse"]) {
    const html = pricing({
      tone,
      plans: [plan({ featured: true, id: "team", name: "Team" })],
    });
    const tag =
      html
        .match(/<article\b[^>]*>/g)
        ?.find((item) => item.includes('data-featured="true"')) ?? "";
    if (!tag.includes(`data-tone="${tone}"`))
      problems.push(`featured Pricing card tone=${tone} did not set data-tone`);
  }
  assert.deepEqual(problems, []);
});

test("Pricing availability hides the purchase link and exposes a status", () => {
  const problems = [];
  const available = pricing({
    plans: [plan({ availability: "available" })],
  });
  if (!available.includes('href="/choose"'))
    problems.push("available plan has no purchase link");
  for (const [availability, label] of [
    ["coming-soon", "Coming soon"],
    ["unavailable", "Not available"],
  ]) {
    const html = pricing({
      plans: [
        plan({
          availability,
          availabilityLabel: label,
          action: { label: "Buy", href: "/buy" },
        }),
      ],
    });
    if (html.includes('href="/buy"'))
      problems.push(`${availability}: purchase link still rendered`);
    if (!html.includes(`data-availability="${availability}"`))
      problems.push(`${availability}: missing data-availability`);
    const status = html.match(
      /<([a-z0-9]+)[^>]*\brole="status"[^>]*>([\s\S]*?)<\/\1>/,
    );
    if (!status || !status[2].includes(label))
      problems.push(`${availability}: label is not an accessible status`);
  }
  assert.deepEqual(problems, []);
});

test("Pricing billing toggle is explicit or requires an annual price on every plan", () => {
  const problems = [];
  const mixed = pricing({
    plans: [
      plan({ id: "basic" }),
      plan({ id: "team", name: "Team", monthly: "£24", annual: "£20" }),
    ],
  });
  if (mixed.includes("Billing interval"))
    problems.push("toggle rendered because one plan has an annual price");
  const explicit = pricing({
    billingToggle: true,
    plans: [plan({ id: "basic" }), plan({ id: "team", name: "Team" })],
  });
  if (!explicit.includes("Billing interval"))
    problems.push("billingToggle did not render the toggle");
  const suppressed = pricing({
    billingToggle: false,
    plans: [
      plan({ id: "basic", annual: "£160" }),
      plan({ id: "team", name: "Team", monthly: "£24", annual: "£20" }),
    ],
  });
  if (suppressed.includes("Billing interval"))
    problems.push("billingToggle false still rendered the toggle");
  const allAnnual = pricing({
    plans: [
      plan({ id: "basic", annual: "£160" }),
      plan({ id: "team", name: "Team", monthly: "£24", annual: "£20" }),
    ],
  });
  if (!allAnnual.includes("Billing interval"))
    problems.push("plans that all have an annual price hid the toggle");
  assert.deepEqual(problems, []);
});

test("Pricing unit rendering does not fabricate /month", () => {
  const problems = [];
  const omitted = pricing({ plans: [plan({ monthly: "£19" })] });
  if (omitted.includes("/month")) problems.push("omitted unit rendered /month");
  const monthly = pricing({
    plans: [plan({ monthly: "£19", unit: "/month" })],
  });
  if (!monthly.includes("/month"))
    problems.push("explicit monthly unit was dropped");
  const annual = pricing({
    plans: [
      plan({
        monthly: "£19",
        annual: "£190",
        unit: "/month",
      }),
    ],
  });
  if (!annual.includes("£190")) problems.push("annual price was not shown");
  if (annual.includes("/month"))
    problems.push("annual price is labelled /month");
  const custom = pricing({
    plans: [plan({ monthly: "£19", unit: "per seat" })],
  });
  if (!custom.includes("per seat") || custom.includes("/month"))
    problems.push("custom unit was replaced with /month");
  assert.deepEqual(problems, []);
});

test("MarketingHeader forwards a logo slot, className and id", () => {
  const html = markup(UI.MarketingHeader, {
    brand: "Northwind",
    className: "site-header",
    id: "site-header",
    logo: React.createElement("img", { alt: "", src: "/mark.svg" }),
    links: [{ label: "Pricing", href: "/pricing" }],
  });
  const problems = [];
  if (!html.includes('src="/mark.svg"'))
    problems.push("logo slot not rendered");
  if (!html.includes('id="site-header"')) problems.push("id not forwarded");
  if (!/class="[^"]*\bsite-header\b/.test(html))
    problems.push("className not forwarded");
  assert.deepEqual(problems, []);
});

test("duplicate href actions and links render all labels", () => {
  const link = (label, href) => ({ label, href });
  const html = [
    markup(UI.MarketingHeader, {
      brand: "Northwind",
      links: [link("Docs", "/docs"), link("Guide", "/docs")],
    }),
    markup(UI.Hero, {
      title: "Example",
      description: "A shared foundation.",
      actions: [link("Start", "/start"), link("Tour", "/start")],
    }),
    markup(UI.CallToAction, {
      title: "Next",
      actions: [link("Primary", "/next"), link("Secondary", "/next")],
    }),
    markup(UI.Footer, {
      brand: "Northwind",
      description: "Example product",
      columns: [
        {
          title: "Product",
          links: [link("Pricing", "/pricing"), link("Plans", "/pricing")],
        },
      ],
      legal: [link("Terms", "/legal"), link("Privacy", "/legal")],
      copyright: "2026 Northwind",
    }),
  ].join("");
  const problems = [];
  for (const label of [
    "Docs",
    "Guide",
    "Start",
    "Tour",
    "Primary",
    "Secondary",
    "Pricing",
    "Plans",
    "Terms",
    "Privacy",
  ]) {
    if (!html.includes(`>${label}<`))
      problems.push(`missing rendered label ${label}`);
  }
  assert.deepEqual(problems, []);
});

/* browser-launcher guard */
test("marketing-gaps node suite does not launch a browser", async () => {
  const source = await read("tests/marketing-gaps.test.mjs");
  const marker = "/* browser-launcher guard */";
  const at = source.indexOf(marker);
  const resume = at === -1 ? -1 : source.indexOf("\ntest(", at + marker.length);
  const scanned =
    at === -1
      ? source
      : source.slice(0, at) + (resume === -1 ? "" : source.slice(resume));
  const launch = ["chromium", ".launch"].join("");
  const specifier = ["@", "playwright", "/test"].join("");
  const dynamicImport = ["import(", JSON.stringify(specifier), ")"].join("");
  const staticFrom = ["from ", JSON.stringify(specifier)].join("");
  assert.deepEqual(
    [launch, dynamicImport, staticFrom].filter((needle) =>
      scanned.includes(needle),
    ),
    [],
  );
});

test("catalog tokens list --m-accent and --m-on-accent", async () => {
  const catalog = JSON.parse(await read("catalog.json"));
  const names = (Array.isArray(catalog.tokens) ? catalog.tokens : []).map(
    (token) => (typeof token === "string" ? token : token.name),
  );
  const problems = [];
  if (!names.includes("--m-accent"))
    problems.push("catalog.json tokens missing --m-accent");
  if (!names.includes("--m-on-accent"))
    problems.push("catalog.json tokens missing --m-on-accent");
  assert.deepEqual(problems, []);
});

test("Footer headingLevel sets the column title level and defaults to h2", () => {
  const base = {
    brand: "Northwind",
    description: "Example product",
    columns: [
      { title: "Product", links: [{ label: "Pricing", href: "/pricing" }] },
    ],
    copyright: "2026 Northwind",
  };
  const problems = [];
  const defaults = markup(UI.Footer, base);
  if (!defaults.includes("<h2>Product</h2>"))
    problems.push("default column title is not h2");
  const demoted = markup(UI.Footer, { ...base, headingLevel: 3 });
  if (!demoted.includes("<h3>Product</h3>"))
    problems.push("headingLevel 3 did not render h3");
  if (demoted.includes("<h2>Product</h2>"))
    problems.push("headingLevel 3 still rendered h2");
  assert.deepEqual(problems, []);
});

test("Footer note renders plain text that is not a link", () => {
  const html = markup(UI.Footer, {
    brand: "Northwind",
    description: "Example product",
    note: "Weekdays 9 to 5",
    columns: [
      { title: "Product", links: [{ label: "Pricing", href: "/pricing" }] },
    ],
    copyright: "2026 Northwind",
  });
  const problems = [];
  if (!html.includes("Weekdays 9 to 5")) problems.push("note text missing");
  if (/<a\b[^>]*>[^<]*Weekdays 9 to 5/.test(html))
    problems.push("note rendered as a link");
  assert.deepEqual(problems, []);
});

test("marketing component roots expose data-m-component", async () => {
  const action = { label: "Explore", href: "/explore" };
  const factories = {
    Banner: () => markup(UI.Banner, { children: "Announcement" }),
    MarketingHeader: () =>
      markup(UI.MarketingHeader, { brand: "Northwind", links: [action] }),
    Hero: () =>
      markup(UI.Hero, {
        title: "Example",
        description: "A shared foundation.",
        actions: [action],
      }),
    FeatureGrid: () =>
      markup(UI.FeatureGrid, {
        title: "Features",
        items: [{ title: "One", description: "Detail" }],
      }),
    FeatureSection: () =>
      markup(UI.FeatureSection, {
        title: "Feature",
        description: "Detail",
        children: "Preview",
      }),
    ProcessSteps: () =>
      markup(UI.ProcessSteps, {
        title: "Steps",
        items: [{ title: "Sign up", description: "Create an account." }],
      }),
    Testimonial: () =>
      markup(UI.Testimonial, { quote: "It works.", name: "Example customer" }),
    LogoCloud: () =>
      markup(UI.LogoCloud, {
        label: "Customers",
        items: [{ name: "Northwind" }],
      }),
    Pricing: () => pricing({ plans: [plan()] }),
    FAQ: () =>
      markup(UI.FAQ, {
        title: "Questions",
        items: [{ question: "Is it open?", answer: "Yes." }],
      }),
    CallToAction: () =>
      markup(UI.CallToAction, { title: "Start", actions: [action] }),
    Footer: () =>
      markup(UI.Footer, {
        brand: "Northwind",
        description: "Example product",
        columns: [{ title: "Product", links: [action] }],
        copyright: "2026 Northwind",
      }),
    BentoGrid: () =>
      markup(UI.BentoGrid, {
        title: "Layout",
        items: [{ title: "Wide", description: "Spans two.", span: 2 }],
      }),
    StatGroup: () =>
      markup(UI.StatGroup, {
        label: "Numbers",
        items: [{ value: "12", label: "Projects" }],
      }),
    TestimonialGrid: () =>
      markup(UI.TestimonialGrid, {
        title: "Quotes",
        items: [{ quote: "Clear.", name: "Example customer" }],
      }),
    PlanComparison: () =>
      markup(UI.PlanComparison, {
        title: "Compare",
        plans: ["Basic", "Team"],
        groups: [
          {
            label: "Limits",
            rows: [{ feature: "Projects", values: ["1", "Unlimited"] }],
          },
        ],
      }),
    PostList: () =>
      markup(UI.PostList, {
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
    TeamGrid: () =>
      markup(UI.TeamGrid, {
        title: "Team",
        members: [{ name: "Example person", role: "Design" }],
      }),
    ContactSection: () =>
      markup(UI.ContactSection, { title: "Contact", children: "Form" }),
    Newsletter: () =>
      markup(UI.Newsletter, { title: "Updates", onSubmit: () => undefined }),
    NotFound: () =>
      markup(UI.NotFound, {
        title: "Missing",
        description: "That page is not here.",
        actions: [action],
      }),
    Section: () => markup(UI.Section, { title: "Band", children: "Body" }),
    ChatPreview: () =>
      markup(UI.ChatPreview, {
        title: "Example",
        messages: [{ from: "user", content: "Hello" }],
      }),
    MockWindow: () =>
      markup(UI.MockWindow, { label: "Example window", children: "Body" }),
  };
  const catalog = JSON.parse(await read("catalog.json"));
  const expected = catalog.components
    .filter((component) => component.kitId === "marketing")
    .map((component) => component.export)
    .sort();
  assert.deepEqual(Object.keys(factories).sort(), expected);
  const problems = [];
  for (const name of expected) {
    let html = "";
    try {
      html = factories[name]();
    } catch (error) {
      problems.push(`${name} threw ${error.message}`);
      continue;
    }
    const opening = html.match(/^<([a-z0-9]+)\b[^>]*>/);
    if (!opening || !opening[0].includes(`data-m-component="${name}"`))
      problems.push(`${name} root missing data-m-component`);
  }
  assert.deepEqual(problems, []);
});
