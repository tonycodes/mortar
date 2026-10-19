import test from "node:test";
import assert from "node:assert/strict";
import { h, html as markup, UI } from "./support/render.mjs";
import { selectorBody, declaration, readSource } from "./support/css.mjs";

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
test("dark surface tokens for CallToAction and featured pricing", async () => {
  const css = await readSource("src/marketing.css");
  const cta = selectorBody(css, ".m-cta");
  const featured = selectorBody(
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

test("CallToAction and featured Pricing cards take the section tones; default sets no data-tone", () => {
  const action = { label: "Start", href: "/start" };
  const problems = [];
  for (const tone of [undefined, "default", "muted", "inverse"]) {
    const expected =
      tone && tone !== "default" ? `data-tone="${tone}"` : undefined;
    const cta = markup(UI.CallToAction, {
      title: "Start a project",
      actions: [action],
      tone,
    });
    const root = cta.match(/^<section\b[^>]*>/)?.[0] ?? "";
    if (expected ? !root.includes(expected) : root.includes("data-tone"))
      problems.push(`CallToAction tone=${tone} rendered ${root}`);
    const html = pricing({
      tone,
      plans: [plan({ featured: true, id: "team", name: "Team" })],
    });
    const tag =
      html
        .match(/<article\b[^>]*>/g)
        ?.find((item) => item.includes('data-featured="true"')) ?? "";
    if (expected ? !tag.includes(expected) : tag.includes("data-tone"))
      problems.push(`featured Pricing card tone=${tone} rendered ${tag}`);
  }
  assert.deepEqual(problems, []);
});

test("Pricing availability hides the purchase link and shows a default or custom status", () => {
  const problems = [];
  const available = pricing({
    plans: [plan({ availability: "available" })],
  });
  if (!available.includes('href="/choose"'))
    problems.push("available plan has no purchase link");
  // A custom availabilityLabel replaces the default status text.
  for (const [availability, label, availabilityLabel] of [
    ["coming-soon", "Coming soon"],
    ["unavailable", "Unavailable"],
    ["coming-soon", "Opening in spring", "Opening in spring"],
    ["unavailable", "Not available", "Not available"],
  ]) {
    const html = pricing({
      plans: [
        plan({
          availability,
          availabilityLabel,
          action: { label: "Buy", href: "/buy" },
        }),
      ],
    });
    if (html.includes('href="/buy"'))
      problems.push(`${availability}: purchase link still rendered`);
    if (!html.includes(`data-availability="${availability}"`))
      problems.push(`${availability}: missing data-availability`);
    // Static text: a status role here would be a live region that never changes.
    if (html.includes('role="status"'))
      problems.push(`${availability}: static text has role=status`);
    const status = html.match(
      /<p class="m-pricing-availability">([\s\S]*?)<\/p>/,
    );
    if (!status || status[1] !== label)
      problems.push(`${availability}: "${label}" is not shown`);
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

test("Pricing shows annual prices only while the billing toggle is visible", () => {
  // Regression: annual was the default even when the toggle was hidden, so
  // plans with an annual price showed it beside monthly-only plans.
  const mixed = pricing({
    plans: [
      plan({ id: "basic", unit: "/month" }),
      plan({
        id: "team",
        name: "Team",
        monthly: "£24",
        annual: "£200",
        unit: "/month",
        annualUnit: "/year",
      }),
    ],
  });
  assert.doesNotMatch(mixed, /Billing interval/);
  assert.match(mixed, /£24/);
  assert.doesNotMatch(mixed, /£200|\/year/);
  const suppressed = pricing({
    billingToggle: false,
    plans: [plan({ annual: "£160", annualUnit: "/year", unit: "/month" })],
  });
  assert.match(suppressed, /£19/);
  assert.doesNotMatch(suppressed, /£160|\/year/);
  const toggled = pricing({
    plans: [plan({ annual: "£160", annualUnit: "/year" })],
  });
  assert.match(toggled, /aria-pressed="true">Annual/);
  assert.match(toggled, /£160/);
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
    logo: h("img", { alt: "", src: "/mark.svg" }),
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
          label: "Product",
          items: [link("Pricing", "/pricing"), link("Plans", "/pricing")],
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

test("Footer itemHeadingLevel sets the column title level and defaults to h2", () => {
  const base = {
    brand: "Northwind",
    description: "Example product",
    columns: [
      { label: "Product", items: [{ label: "Pricing", href: "/pricing" }] },
    ],
    copyright: "2026 Northwind",
  };
  const problems = [];
  const defaults = markup(UI.Footer, base);
  if (!defaults.includes('<nav aria-label="Product"><h2>Product</h2>'))
    problems.push("default column title is not h2");
  const demoted = markup(UI.Footer, { ...base, itemHeadingLevel: 3 });
  if (!demoted.includes("<h3>Product</h3>"))
    problems.push("itemHeadingLevel 3 did not render h3");
  if (demoted.includes("<h2>Product</h2>"))
    problems.push("itemHeadingLevel 3 still rendered h2");
  assert.deepEqual(problems, []);
});

test("Footer note renders plain text that is not a link", () => {
  const html = markup(UI.Footer, {
    brand: "Northwind",
    description: "Example product",
    note: "Weekdays 9 to 5",
    columns: [
      { label: "Product", items: [{ label: "Pricing", href: "/pricing" }] },
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
    HeaderSection: () => markup(UI.HeaderSection, { title: "About" }),
    ContentSection: () => markup(UI.ContentSection, { title: "Story" }),
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
        columns: [{ label: "Product", items: [action] }],
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
  const catalog = JSON.parse(await readSource("catalog.json"));
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
