// Ranked, offline search over the catalogue: component names, kit and category,
// descriptions, usage notes, capabilities and prop names.

const STOP = new Set(
  (
    "a an and are as at be by for from has have i in into is it its of on or " +
    "our the their this to use used using with we want need needs should " +
    "mortar central semantic tokens component components ui page pages " +
    "screen screens show shows build make some that which can my your " +
    "where when what who will would like also each one all any"
  ).split(" "),
);

// Everyday words for what the kit calls something else.
const SYNONYMS = {
  login: ["sign", "auth"],
  logon: ["sign", "auth"],
  signin: ["sign", "auth"],
  signup: ["sign", "auth", "registration"],
  register: ["sign", "registration", "auth"],
  registration: ["sign", "auth"],
  auth: ["sign", "authentication"],
  authentication: ["sign", "auth"],
  otp: ["code", "verification"],
  verification: ["verify"],
  verify: ["verification"],
  "2fa": ["two", "factor", "code"],
  mfa: ["two", "factor", "code"],
  password: ["password", "auth"],
  dashboard: ["application", "shell", "metric", "stat"],
  admin: ["application", "shell"],
  app: ["application", "shell"],
  landing: ["marketing", "hero"],
  homepage: ["marketing", "hero"],
  website: ["marketing"],
  modal: ["dialog", "overlay"],
  popup: ["dialog", "overlay"],
  drawer: ["slide", "over"],
  sheet: ["slide", "over"],
  dialog: ["modal", "overlay"],
  menu: ["dropdown", "navigation"],
  nav: ["navigation"],
  navbar: ["navigation", "header"],
  topbar: ["navbar", "header"],
  sidenav: ["sidebar", "navigation"],
  toast: ["notification"],
  notification: ["toast", "notice"],
  alert: ["notice", "banner", "callout"],
  grid: ["table", "list"],
  datagrid: ["table", "data"],
  spreadsheet: ["table"],
  kpi: ["metric", "stat"],
  stats: ["stat", "metric"],
  analytics: ["metric", "stat", "chart"],
  shop: ["ecommerce", "product"],
  store: ["ecommerce", "product"],
  basket: ["cart", "bag"],
  bag: ["cart"],
  docs: ["documentation"],
  documentation: ["docs"],
  plans: ["pricing", "plan"],
  plan: ["pricing"],
  faq: ["question"],
  questions: ["faq"],
  testimonials: ["testimonial", "social"],
  reviews: ["review", "testimonial"],
  tooltip: ["popover"],
  toggle: ["switch"],
  spinner: ["loading", "progress"],
  loader: ["loading", "progress"],
  wizard: ["steps", "progress"],
  stepper: ["steps", "progress"],
  upload: ["attachment", "file"],
  files: ["attachment"],
  chat: ["chat", "comment"],
  comments: ["comment", "activity"],
  timeline: ["activity", "feed"],
  schedule: ["calendar"],
  events: ["calendar"],
  search: ["search", "command", "combobox"],
  theme: ["theme", "appearance", "brand"],
  darkmode: ["appearance", "theme"],
  avatar: ["avatar", "person"],
  profile: ["avatar", "description"],
  team: ["team", "people"],
};

const stem = (word) =>
  word.length > 4 && word.endsWith("ies")
    ? word.slice(0, -3) + "y"
    : word.length > 3 && word.endsWith("s") && !word.endsWith("ss")
      ? word.slice(0, -1)
      : word;

/** Lower-case terms: camelCase split, punctuation removed, stop words dropped. */
export function terms(text) {
  return String(text ?? "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !STOP.has(w))
    .map(stem);
}

/** Query terms with their weights: typed terms 1, synonyms 0.5. */
function queryTerms(query) {
  const raw = String(query ?? "").toLowerCase();
  const out = new Map();
  const add = (t, w) => {
    t = stem(t);
    if (!STOP.has(t)) out.set(t, Math.max(out.get(t) ?? 0, w));
  };
  // "sign in", "log in", "sign-up" and "two-factor" read as one idea.
  const joined = raw
    .replace(/\blog[\s-]?(in|on)\b/g, "login")
    .replace(/\bsign[\s-]?in\b/g, "signin sign")
    .replace(/\bsign[\s-]?up\b/g, "signup sign");
  for (const t of terms(joined)) {
    add(t, 1);
    for (const s of SYNONYMS[t] ?? []) add(s, 0.5);
  }
  return out;
}

const FIELDS = [
  ["name", 6],
  ["category", 3],
  ["kit", 2],
  ["description", 2],
  ["usage", 1],
  ["capabilities", 1],
  ["props", 0.5],
];

function documentFor(data, c) {
  const p = data.placement(c);
  const doc = {
    name: terms(c.export),
    category: terms(`${p.categoryTitle ?? ""} ${p.category ?? ""}`),
    kit: terms(`${p.kitTitle} ${p.kit}`),
    description: terms(c.description),
    usage: terms(`${c.contract.usage ?? ""} ${c.contract.accessibility ?? ""}`),
    capabilities: terms((c.capabilities ?? []).join(" ")),
    props: terms(Object.keys(c.contract.propTypes ?? {}).join(" ")),
  };
  return Object.fromEntries(
    Object.entries(doc).map(([k, v]) => [k, new Set(v)]),
  );
}

const cache = new WeakMap();

function score(doc, query) {
  let total = 0;
  const matched = [];
  for (const [term, weight] of query) {
    let best = 0;
    for (const [field, w] of FIELDS) {
      const set = doc[field];
      let hit = set.has(term) ? w : 0;
      if (!hit && term.length >= 4)
        for (const word of set)
          if (word.length > term.length && word.startsWith(term)) {
            hit = w * 0.6;
            break;
          }
      best = Math.max(best, hit);
    }
    if (best) {
      total += best * weight;
      if (weight === 1) matched.push(term);
    }
  }
  return { total, matched };
}

/**
 * Components ranked for a query. Optional kit and category filters accept ids
 * or titles. Each result: name, kit, category, description, capabilities, score.
 */
export function searchComponents(
  data,
  { query = "", kit, category, limit = 10 } = {},
) {
  let docs = cache.get(data);
  if (!docs) {
    docs = new Map(data.components.map((c) => [c, documentFor(data, c)]));
    cache.set(data, docs);
  }
  const q = queryTerms(query);
  const exact = data.find(String(query).replace(/\s+/g, ""));
  const norm = (s) => String(s ?? "").toLowerCase();
  const results = [];
  for (const c of data.components) {
    const p = data.placement(c);
    if (kit && ![p.kit, p.kitTitle].map(norm).includes(norm(kit))) continue;
    if (
      category &&
      ![p.category, p.categoryTitle].map(norm).includes(norm(category))
    )
      continue;
    let { total, matched } = q.size
      ? score(docs.get(c), q)
      : { total: 1, matched: [] };
    if (c === exact) total += 100;
    // Every typed term in the name: "sign in panel" → SignInPanel.
    const typed = [...q].filter(([, w]) => w === 1).map(([t]) => t);
    if (typed.length && typed.every((t) => docs.get(c).name.has(t))) total += 4;
    // Shell-first: a page shell ranks above the parts it holds.
    if (total && p.category === "shells") total += 1;
    if (total > 0)
      results.push({
        name: c.export,
        kit: p.kit,
        category: p.categoryTitle ?? null,
        description: c.description,
        capabilities: c.capabilities,
        score: Math.round(total * 10) / 10,
        matched,
      });
  }
  results.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return results.slice(0, Math.max(1, Math.min(Number(limit) || 10, 115)));
}

/** Page templates ranked for a query (title, description, kind and components). */
export function searchTemplates(data, query, limit = 3) {
  const q = queryTerms(query);
  const out = [];
  for (const t of data.agent.templates) {
    const doc = {
      name: new Set([...terms(`${t.id} ${t.title}`), t.id.replace(/-/g, "")]),
      category: new Set(terms(t.kind)),
      kit: new Set(),
      description: new Set(terms(t.description)),
      usage: new Set(terms(t.components.join(" "))),
      capabilities: new Set(),
      props: new Set(),
    };
    const { total } = score(doc, q);
    if (total > 0) out.push({ ...t, score: Math.round(total * 10) / 10 });
  }
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, limit);
}
