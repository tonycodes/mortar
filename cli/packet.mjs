// Component contracts and build packets: everything an agent needs to compose
// with a set of components, from the installed catalogue and docs.
import { searchComponents, searchTemplates } from "./search.mjs";

export const CSS_SETUP = `@import "tailwindcss";
@import "@tony-ui/mortar/styles.css";`;

export const THEME_SETUP = `import { ThemeProvider } from "@tony-ui/mortar";

<ThemeProvider brand="neutral" density="comfortable" initialAppearance="system">
  <App />
</ThemeProvider>`;

const importLine = (data, names) =>
  `import { ${[...new Set(names)].sort().join(", ")} } from "${data.packageName}";`;

/** The full contract of one component, as get_component returns it. */
export function componentDetail(data, c, { example = true } = {}) {
  const p = data.placement(c);
  const props = Object.entries(c.contract.propTypes ?? {}).map(([name, t]) => ({
    name,
    type: t.type,
    required: t.required,
    ...(t.default !== undefined ? { default: t.default } : {}),
    ...(c.contract.props?.[name] && c.contract.props[name] !== t.type
      ? { description: c.contract.props[name] }
      : {}),
  }));
  // Required props first; the sort is stable, so the rest keep their order.
  props.sort((a, b) => Number(b.required) - Number(a.required));
  const inherited = data.agent.inherited[c.export] !== undefined;
  return {
    name: c.export,
    id: c.id,
    version: c.version,
    kit: p.kit,
    kitTitle: p.kitTitle,
    category: p.category ?? null,
    categoryTitle: p.categoryTitle ?? null,
    description: c.description,
    import: importLine(data, [c.export]),
    marker: `data-m-component="${c.export}"`,
    props,
    acceptsHtmlAttributes: inherited,
    usage: c.contract.usage,
    avoid: c.contract.avoid,
    accessibility: c.contract.accessibility,
    capabilities: c.capabilities,
    dependencies: (c.contract.dependencies ?? [])
      .map((id) => data.byId(id)?.export ?? id)
      .sort(),
    testing: c.testing,
    templates: data.agent.templates
      .filter((t) => t.components.includes(c.export))
      .map((t) => t.id),
    ...(example ? { example: data.agent.examples[c.export] ?? null } : {}),
  };
}

/** Components and the catalogue components they render, transitively. */
export function dependencyClosure(data, components) {
  const requiredBy = new Map();
  const queue = [...components];
  const seen = new Set(components.map((c) => c.id));
  while (queue.length) {
    const c = queue.shift();
    for (const id of c.contract.dependencies ?? []) {
      const dep = data.byId(id);
      if (!dep) continue;
      if (!requiredBy.has(dep.export)) requiredBy.set(dep.export, new Set());
      requiredBy.get(dep.export).add(c.export);
      if (!seen.has(id)) {
        seen.add(id);
        queue.push(dep);
      }
    }
  }
  const requested = new Set(components.map((c) => c.export));
  return [...requiredBy]
    .filter(([name]) => !requested.has(name))
    .map(([name, by]) => ({ name, requiredBy: [...by].sort() }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// What a brief is for, and the shared shell each purpose starts from
// (principle shell-first).
const PURPOSES = [
  {
    id: "auth",
    words:
      /\b(sign[\s-]?(in|up|on)|log[\s-]?(in|on)|login|register|registration|password|two[\s-]factor|2fa|mfa|otp|verify email)\b/i,
    shell: "AuthLayout",
    kit: "application",
    guide: "auth-flows",
    reason:
      "AuthLayout is the page for every sign-in and registration step (docs/auth-flows.md).",
  },
  {
    id: "ecommerce",
    words:
      /\b(shop|store|ecommerce|e-commerce|product|cart|basket|bag|checkout|order)s?\b/i,
    shell: "MarketingHeader",
    kit: "ecommerce",
    reason:
      "Storefront pages use the public-site chrome: MarketingHeader with Container and Footer, as the ecommerce templates do.",
  },
  {
    id: "docs",
    words:
      /\b(docs|documentation|api reference|guide|knowledge base|help centre|help center|changelog)\b/i,
    shell: "DocsShell",
    kit: "docs",
    reason: "DocsShell is the shared documentation shell.",
  },
  {
    id: "marketing",
    words:
      /\b(landing|marketing|homepage|home page|website|public site|pricing page|about page|blog|launch|waitlist)\b/i,
    shell: "MarketingHeader",
    kit: "marketing",
    reason:
      "Public pages start from MarketingHeader (principle shell-first), with Footer.",
  },
  {
    id: "application",
    words:
      /\b(app|application|dashboard|admin|console|portal|crm|settings|workspace|back[\s-]?office|internal tool|saas tool|inbox|account)\b/i,
    shell: "AppShell",
    kit: "application",
    reason:
      "Application screens start from AppShell (principle shell-first): navigation, page heading, content.",
  },
];

/** Pick components for a free-text brief, with the reason for each. */
export function chooseForBrief(data, brief) {
  const purposes = PURPOSES.filter((p) => p.words.test(brief));
  const kits = new Set(["foundation", ...purposes.map((p) => p.kit)]);
  const chosen = new Map();
  const choose = (name, reason) => {
    const c = data.find(name);
    if (!c) return;
    if (!chosen.has(c.export))
      chosen.set(c.export, { component: c, reasons: [] });
    chosen.get(c.export).reasons.push(reason);
  };
  for (const p of purposes) choose(p.shell, p.reason);
  if (purposes.some((p) => p.shell === "MarketingHeader"))
    choose("Footer", "Public pages close with the shared Footer.");
  let results = searchComponents(data, { query: brief, limit: 40 });
  if (purposes.length)
    results = results.map((r) => ({
      ...r,
      score: kits.has(r.kit) ? r.score : r.score / 2,
    }));
  results.sort((a, b) => b.score - a.score);
  const top = results[0]?.score ?? 0;
  for (const r of results.slice(0, 8))
    if (r.score >= top * 0.6 && r.matched.length)
      choose(r.name, `Matches “${r.matched.join("”, “")}” in the brief.`);
  const templates = searchTemplates(data, brief, 3);
  return { purposes, chosen: [...chosen.values()], templates };
}

/**
 * A build packet for the named components, or for a brief. Unknown names are
 * reported, not fatal.
 */
export function buildPacket(data, { components: names = [], brief } = {}) {
  const unknown = [];
  let selection = [];
  let reasons = new Map();
  let templates;
  let purposes = [];
  for (const n of names) {
    const c = data.find(n);
    if (c) selection.push(c);
    else unknown.push(n);
  }
  if (brief) {
    const picked = chooseForBrief(data, brief);
    purposes = picked.purposes;
    for (const { component, reasons: why } of picked.chosen) {
      if (!selection.includes(component)) selection.push(component);
      reasons.set(component.export, why);
    }
    templates = picked.templates;
  }
  selection = [...new Set(selection)];
  const requested = new Set(selection.map((c) => c.export));
  // Templates sharing the most components with the selection.
  if (!templates || !templates.length)
    templates = data.agent.templates
      .map((t) => ({
        ...t,
        overlap: t.components.filter((n) => requested.has(n)).length,
      }))
      .filter((t) => t.overlap > 0)
      .sort(
        (a, b) =>
          b.overlap / Math.sqrt(b.components.length) -
          a.overlap / Math.sqrt(a.components.length),
      )
      .slice(0, 3);
  const dependencies = dependencyClosure(data, selection);
  const usesAuth = selection.some((c) => data.placement(c).category === "auth");
  const guides = ["design", "conventions", "theming"];
  if (usesAuth || purposes.some((p) => p.id === "auth"))
    guides.push("auth-flows");
  return {
    package: data.packageName,
    version: data.version,
    ...(brief ? { brief } : {}),
    ...(unknown.length
      ? {
          unknown: unknown.map((n) => ({
            name: n,
            suggestions: searchComponents(data, { query: n, limit: 3 }).map(
              (r) => r.name,
            ),
          })),
        }
      : {}),
    install: `npm install ${data.packageName} react react-dom tailwindcss`,
    css: {
      where: "Your app's Tailwind CSS entry (for example src/index.css).",
      code: CSS_SETUP,
      notes:
        "Import Mortar after Tailwind. The package ships its compiled component styles, so no @source line is needed for Mortar itself. Do not override .m-* classes or [data-m-component] selectors; theme through tokens (get_guide theming).",
    },
    themeProvider: {
      code: THEME_SETUP,
      notes:
        "Render one ThemeProvider at the app root. brand (neutral | green, or your own via brandTokens) and density (compact | comfortable | spacious) are controlled props; appearance changes through AppearanceControl. Pass navigate={(href) => router.push(href)} to route kit links through your router.",
    },
    import: importLine(data, ["ThemeProvider", ...requested]),
    components: selection.map((c) => ({
      ...componentDetail(data, c),
      ...(reasons.has(c.export) ? { why: reasons.get(c.export) } : {}),
    })),
    dependencies: {
      note: "Rendered inside the components above. They need no import unless you use them directly; they are listed so you know which contracts and states you inherit.",
      components: dependencies,
    },
    templates: templates.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      kind: t.kind,
      components: t.components,
      playground: `?recipe=${t.id}`,
    })),
    principles: data.principles.map((p, i) => ({
      number: i + 1,
      id: p.id,
      instruction: p.instruction,
    })),
    conventions: data.guide("conventions"),
    guides,
    next: [
      "Compose with named imports from the package; keep product names, data, routes and actions in props and slots.",
      "Run `npx mortar audit` (or the audit_app tool) on the application and fix its findings.",
      "Verify in a browser: mobile and desktop, light and dark, keyboard and focus, loading/empty/error states.",
      "If a shared pattern is missing, contribute it to the kit through a GitHub pull request (get_guide contributing) instead of copying or overriding components.",
    ],
  };
}
