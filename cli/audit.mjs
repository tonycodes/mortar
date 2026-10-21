// A local, read-only static audit of an application that uses Mortar. It never
// modifies files and never touches the network.
//
// The scanner is deliberately lightweight (no TypeScript or Babel at runtime):
// comments are blanked, imports from the package are read with patterns, and
// JSX opening tags of imported Mortar components are tokenised to read their
// attribute names and literal values. Known limits: props passed through a
// spread ({...props}) are not checked; components re-exported or wrapped under
// another name are not followed; JSX in .vue/.svelte/.astro/.html files is not
// read; dynamic class names built at runtime are not resolved.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { resolve, join, relative, dirname, extname, sep } from "node:path";
import { createHash } from "node:crypto";
import { loadData, PACKAGE_ROOT } from "./data.mjs";
import {
  REMOVED_EXPORTS,
  RENAMED_PROPS,
  GENERAL_PROPS,
  RENAMED_VALUES,
} from "./migrations.mjs";

export const RULES = {
  "not-installed": "@tony-ui/mortar is imported but not installed.",
  "not-declared": "@tony-ui/mortar is imported but not in package.json.",
  "version-mismatch":
    "The installed version does not satisfy the package.json range.",
  "unknown-export":
    "A named import from @tony-ui/mortar that the installed version does not export.",
  "deep-import":
    "An import or alias that reaches into the package's src or dist instead of its public entry points.",
  "unknown-prop": "A prop that the component's contract does not declare.",
  "invalid-value": "A literal value outside the prop's declared union.",
  "css-override":
    "Consumer CSS that selects Mortar's .m-* classes or [data-m-component].",
  "class-override":
    "A Tailwind arbitrary variant in a className that targets Mortar's .m-* classes.",
  "kit-class":
    "A Mortar-internal .m-* class used on the application's own markup.",
  "raw-colour":
    "A raw colour or Tailwind palette class in a file that renders Mortar components.",
  "missing-styles": "No import of @tony-ui/mortar/styles.css.",
  "styles-order":
    "@tony-ui/mortar/styles.css is imported before Tailwind in the same file.",
  "missing-theme-provider":
    "Mortar components are rendered but ThemeProvider is never rendered.",
  "local-copy": "A local copy of Mortar source.",
  "limited-data": "The audit could not use the installed version's own data.",
};

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "out",
  ".next",
  ".nuxt",
  ".output",
  ".svelte-kit",
  ".turbo",
  ".vercel",
  ".netlify",
  ".cache",
  ".parcel-cache",
  "coverage",
  "playwright-report",
  "test-results",
  "storybook-static",
]);
const CODE = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
]);
const JSX = new Set([".js", ".jsx", ".tsx", ".mjs"]);
const STYLE = new Set([".css", ".scss", ".sass", ".less", ".pcss", ".postcss"]);
const PKG = "@tony-ui/mortar";
const MAX_FILES = 20000;
const MAX_BYTES = 1_000_000;

function walk(root) {
  const files = [];
  const visit = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (files.length >= MAX_FILES) return;
      if (e.isSymbolicLink()) continue;
      const path = join(dir, e.name);
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name) && !e.name.startsWith(".")) visit(path);
      } else if (e.isFile()) {
        const ext = extname(e.name);
        if (CODE.has(ext) || STYLE.has(ext)) files.push(path);
      }
    }
  };
  visit(root);
  return files;
}

/** Index of the bracket that closes the one at `at`, skipping strings. */
function closing(src, at) {
  let depth = 0;
  for (let i = at; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") {
      // Quoted strings end at a newline, as in blankComments.
      for (i++; i < src.length && src[i] !== c; i++) {
        if (src[i] === "\\") i++;
        else if (c !== "`" && src[i] === "\n") break;
      }
    } else if (c === "(" || c === "{" || c === "[") depth++;
    else if (c === ")" || c === "}" || c === "]") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return src.length;
}

const BRAND_TYPE = /\bBrand(?:Definition|AppearanceTokens|Fonts)\b/;
/**
 * The [start, end] ranges of `src` that define a brand, where colour literals
 * belong: the value of a `brandTokens=` prop, the arguments of brandToCss,
 * brandToStyle and registerBrand, objects typed as or satisfying
 * BrandDefinition (or BrandAppearanceTokens), the declarations in this file
 * of names those reference, and `--m-brand-*` custom property values.
 */
export function brandRanges(src) {
  const ranges = [];
  // Object, array and call declarations in this file, by name.
  const declarations = new Map();
  for (const m of src.matchAll(
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(:[^=;]*)?=\s*(?=[{[(])/g,
  )) {
    const start = m.index + m[0].length;
    const end = closing(src, start);
    declarations.set(m[1], [start, end]);
    const after = src.slice(end + 1, end + 80);
    if (
      BRAND_TYPE.test(m[2] ?? "") ||
      new RegExp(`^\\s*(?:satisfies|as)\\s+[^;\\n]*${BRAND_TYPE.source}`).test(
        after,
      )
    )
      ranges.push([start, end]);
  }
  const withReferences = (start, end) => {
    ranges.push([start, end]);
    for (const name of src.slice(start, end + 1).match(/[A-Za-z_$][\w$]*/g) ??
      [])
      if (declarations.has(name)) ranges.push(declarations.get(name));
  };
  for (const m of src.matchAll(/\bbrandTokens\s*=\s*\{/g)) {
    const start = m.index + m[0].length - 1;
    withReferences(start, closing(src, start));
  }
  for (const m of src.matchAll(
    /\b(?:brandToCss|brandToStyle|registerBrand)\s*\(/g,
  )) {
    const start = m.index + m[0].length - 1;
    withReferences(start, closing(src, start));
  }
  // --m-brand-* values: a quoted string after a quoted key, or a CSS value up
  // to the end of the declaration.
  for (const m of src.matchAll(/--m-brand-[\w-]+(["'`]?)\s*:\s*/g)) {
    const start = m.index + m[0].length;
    const quote = src[start];
    let end;
    if (m[1] && (quote === '"' || quote === "'" || quote === "`"))
      end = src.indexOf(quote, start + 1);
    else end = src.slice(start).search(/[;}\n]/) + start;
    ranges.push([start, end < start ? src.length : end]);
  }
  return ranges;
}

/**
 * Comments replaced by spaces (line numbers and offsets kept). Strings and
 * template literals are respected; single and double quoted strings end at a
 * newline, so an apostrophe in JSX text cannot swallow the rest of the file.
 */
export function blankComments(text, { css = false } = {}) {
  const out = text.split("");
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    const next = text[i + 1];
    if (c === "/" && next === "*") {
      const end = text.indexOf("*/", i + 2);
      const stop = end < 0 ? n : end + 2;
      for (let j = i; j < stop; j++) if (out[j] !== "\n") out[j] = " ";
      i = stop;
    } else if (!css && c === "/" && next === "/") {
      while (i < n && text[i] !== "\n") out[i++] = " ";
    } else if (c === '"' || c === "'" || (!css && c === "`")) {
      i++;
      while (i < n && text[i] !== c) {
        if (text[i] === "\\") i++;
        else if (c !== "`" && text[i] === "\n") break;
        i++;
      }
      i++;
    } else i++;
  }
  return out.join("");
}

/** Index of the character after the `{…}` group starting at `i`. */
function skipBraces(src, i) {
  let depth = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return i + 1;
    } else if (c === '"' || c === "'") {
      i++;
      while (i < n && src[i] !== c && src[i] !== "\n") {
        if (src[i] === "\\") i++;
        i++;
      }
    } else if (c === "`") {
      i++;
      while (i < n && src[i] !== "`") {
        if (src[i] === "\\") i++;
        else if (src[i] === "$" && src[i + 1] === "{") {
          i = skipBraces(src, i + 1) - 1;
        }
        i++;
      }
    }
    i++;
  }
  return n;
}

const NAME = /[A-Za-z_$][\w$]*(?:[-:.][\w$]+)*/y;

/**
 * The attributes of a JSX opening tag whose name ends at `i`: name, offset and,
 * for string literals (`a="x"` or `a={"x"}`), the value.
 */
export function jsxAttributes(src, i) {
  const attrs = [];
  const n = src.length;
  while (i < n) {
    while (i < n && /\s/.test(src[i])) i++;
    if (src[i] === ">" || (src[i] === "/" && src[i + 1] === ">")) break;
    if (src[i] === "{") {
      i = skipBraces(src, i);
      continue;
    }
    NAME.lastIndex = i;
    const m = NAME.exec(src);
    if (!m) break;
    const attr = { name: m[0], index: i };
    i += m[0].length;
    while (i < n && /\s/.test(src[i])) i++;
    if (src[i] === "=") {
      i++;
      while (i < n && /\s/.test(src[i])) i++;
      const q = src[i];
      if (q === '"' || q === "'") {
        const end = src.indexOf(q, i + 1);
        if (end < 0) break;
        attr.value = src.slice(i + 1, end);
        i = end + 1;
      } else if (q === "{") {
        const end = skipBraces(src, i);
        const inner = src.slice(i + 1, end - 1).trim();
        const literal = inner.match(/^(["'`])([^"'`$\\]*)\1$/);
        if (literal) attr.value = literal[2];
        i = end;
      } else break;
    }
    attrs.push(attr);
  }
  return attrs;
}

function lineAt(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++)
    if (text[i] === "\n") starts.push(i + 1);
  return (index) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= index) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
}

function distance(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      prev = tmp;
    }
  }
  return row[b.length];
}

function closest(name, candidates, max = 3) {
  let best;
  let bestD = Infinity;
  for (const c of candidates) {
    const d = distance(name, c);
    if (d < bestD) {
      best = c;
      bestD = d;
    }
  }
  return bestD <= Math.min(max, Math.max(1, Math.floor(name.length / 2)))
    ? best
    : undefined;
}

// ---- semver (the subset package.json ranges use) ----

function parseVersion(v) {
  const m = String(v)
    .trim()
    .replace(/^[=v]+/, "")
    .match(/^(\d+)\.(\d+)\.(\d+)(?:-([\w.-]+))?/);
  return m ? { v: [+m[1], +m[2], +m[3]], pre: m[4] ?? "" } : undefined;
}

function compare(a, b) {
  for (let i = 0; i < 3; i++) if (a.v[i] !== b.v[i]) return a.v[i] - b.v[i];
  if (a.pre === b.pre) return 0;
  if (!a.pre) return 1;
  if (!b.pre) return -1;
  return a.pre < b.pre ? -1 : 1;
}

/** Comparators for one partial version: "1", "1.2", "1.x", "*". */
function partial(text) {
  const parts = text.replace(/^[=v]+/, "").split(/[.-]/);
  const nums = [];
  for (const p of parts.slice(0, 3)) {
    if (/^[x*X]?$/.test(p)) break;
    if (!/^\d+$/.test(p)) return undefined;
    nums.push(+p);
  }
  return nums;
}

function comparators(range) {
  const out = [];
  const tokens = range
    .trim()
    .replace(/([<>=~^]+)\s+/g, "$1")
    .split(/\s+/)
    .filter(Boolean);
  for (let k = 0; k < tokens.length; k++) {
    const t = tokens[k];
    if (tokens[k + 1] === "-" && tokens[k + 2]) {
      const lo = partial(t);
      const hi = partial(tokens[k + 2]);
      if (!lo || !hi) return undefined;
      out.push([">=", [...lo, 0, 0, 0].slice(0, 3)]);
      if (hi.length === 3) out.push(["<=", hi]);
      else if (hi.length) {
        const up = [...hi];
        up[up.length - 1]++;
        out.push(["<", [...up, 0, 0].slice(0, 3)]);
      }
      k += 2;
      continue;
    }
    const m = t.match(/^(\^|~|>=|<=|>|<|=)?(.*)$/);
    const op = m[1] ?? "";
    const exact = parseVersion(m[2]);
    const nums = exact ? exact.v : partial(m[2]);
    if (!nums) return undefined;
    const pad = (a) => [...a, 0, 0, 0].slice(0, 3);
    if (op === "^") {
      const lo = pad(nums);
      const i = lo.findIndex((x, idx) => x !== 0 || idx === nums.length - 1);
      const at = i < 0 ? Math.max(0, nums.length - 1) : Math.min(i, 2);
      const hi = lo.slice(0, at + 1);
      hi[at]++;
      out.push([">=", lo, exact?.pre], ["<", pad(hi)]);
    } else if (op === "~") {
      const lo = pad(nums);
      const at = nums.length >= 2 ? 1 : 0;
      const hi = lo.slice(0, at + 1);
      hi[at]++;
      out.push([">=", lo, exact?.pre], ["<", pad(hi)]);
    } else if (op === "" || op === "=") {
      if (nums.length === 3) out.push(["=", nums, exact?.pre]);
      else if (nums.length) {
        const hi = [...nums];
        hi[hi.length - 1]++;
        out.push([">=", pad(nums)], ["<", pad(hi)]);
      }
    } else out.push([op, pad(nums), exact?.pre]);
  }
  return out;
}

/** true/false, or undefined when the range is not a semver range (tags, urls …). */
export function satisfies(version, range) {
  const v = parseVersion(version);
  if (!v) return undefined;
  if (/^(npm|file|link|workspace|git|github|https?):|\//.test(range.trim()))
    return undefined;
  if (range.trim() === "" || range.trim() === "*") return true;
  let known = false;
  for (const part of range.split("||")) {
    const set = comparators(part);
    if (!set) continue;
    known = true;
    // A prerelease only satisfies a range that names the same major.minor.patch.
    if (
      v.pre &&
      !set.some(([, nums, pre]) => pre && nums.join(".") === v.v.join("."))
    )
      continue;
    if (
      set.every(([op, nums, pre]) => {
        const c = compare(v, { v: nums, pre: pre ?? "" });
        return op === ">="
          ? c >= 0
          : op === "<="
            ? c <= 0
            : op === ">"
              ? c > 0
              : op === "<"
                ? c < 0 && !(v.pre && nums.join(".") === v.v.join("."))
                : c === 0;
      })
    )
      return true;
  }
  return known ? false : undefined;
}

// ---- the audit ----

/** The nearest installed copy of the package, walking up from the app. */
function installedPackage(appRoot) {
  for (let dir = appRoot; ; dir = dirname(dir)) {
    const file = join(dir, "node_modules", ...PKG.split("/"), "package.json");
    if (existsSync(file)) return dirname(file);
    if (dirname(dir) === dir) return undefined;
  }
}

/** Value and type export names from a built index.d.ts (older releases). */
function exportsFromDts(root) {
  const file = join(root, "dist", "index.d.ts");
  if (!existsSync(file)) return undefined;
  const names = new Set();
  for (const [, list] of readFileSync(file, "utf8").matchAll(
    /export\s+(?:type\s+)?\{([^}]*)\}/g,
  ))
    for (const item of list.split(",")) {
      const name = item
        .trim()
        .replace(/^type\s+/, "")
        .split(/\s+as\s+/)
        .pop()
        .trim();
      if (name) names.add(name);
    }
  return names;
}

const IMPORT =
  /\b(import|export)\s+(type\s+)?((?:(?!\bfrom\b)[^;])*?)\s*\bfrom\s*(["'])(@tony-ui\/mortar(?:\/[^"']*)?)\4/g;
const SIDE_EFFECT = /\bimport\s*(["'])(@tony-ui\/mortar\/[^"']*)\1/g;
const DEEP =
  /@tony-ui\/mortar\/(src|dist)\b|node_modules\/@tony-ui\/mortar\/(src|dist)\b/g;
const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const UTILITY =
  "bg|text|border|ring|outline|fill|stroke|from|via|to|divide|decoration|shadow|accent|caret|placeholder";
const PALETTE_CLASS = new RegExp(
  `(?<![\\w-])(?:[\\w-]+:)*(?:${UTILITY})-(?:(?:${PALETTE})-\\d{2,3}(?:\\/\\d+)?|white|black|\\[#[0-9a-fA-F]{3,8}\\])(?![\\w-])`,
  "g",
);
const HEX =
  /(?<=["'`\s:(,])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/g;
const COLOUR_FN = /(?<![\w-])(?:rgba?|hsla?|hwb|oklch|oklab|lab|lch)\(/g;
const COLOURISH =
  /colou?r|background|fill|stroke|border|shadow|style|bg-|text-/i;

/**
 * Audit an application directory. Returns { root, mortar, findings, summary }.
 * Findings: { rule, severity, file, line, message, fix }.
 */
export async function auditApp(path = ".", { data: bundled } = {}) {
  const root = resolve(path);
  if (!existsSync(root) || !statSync(root).isDirectory())
    throw Error(`Not a directory: ${root}`);
  bundled ??= await loadData();
  const findings = [];
  const add = (rule, severity, file, line, message, fix) =>
    findings.push({
      rule,
      severity,
      file: file ? relative(root, file).split(sep).join("/") || "." : ".",
      line,
      message,
      ...(fix ? { fix } : {}),
    });

  // Which catalogue to check against: the installed copy when it carries its
  // own data, otherwise this tool's.
  const installedRoot = installedPackage(root);
  let installed;
  let data = bundled;
  if (installedRoot) {
    installed = JSON.parse(
      readFileSync(join(installedRoot, "package.json"), "utf8"),
    ).version;
    if (
      installedRoot !== PACKAGE_ROOT &&
      existsSync(join(installedRoot, "catalog.json"))
    ) {
      const own = await loadData(installedRoot);
      if (!own.agent.missing) data = own;
    }
  }
  let exportNames = new Set([
    ...data.agent.exports.values,
    ...data.agent.exports.types,
  ]);
  if (data === bundled && installedRoot && installed !== bundled.version) {
    const dts = exportsFromDts(installedRoot);
    if (dts) exportNames = dts;
    add(
      "limited-data",
      "info",
      undefined,
      undefined,
      `The installed ${PKG} ${installed} has no agent data; props and values were checked against this tool's catalogue (${bundled.version}).`,
      `Upgrade ${PKG} to ${bundled.version} or later for an exact check of the version you use.`,
    );
  }
  const classes = new Set(data.agent.classes);

  const files = walk(root);
  const hashes = data.agent.sourceHashes ?? {};
  let usesMortar = false;
  let stylesImported = false;
  let themeProvider = false;
  let firstMortarFile;
  let tailwindEntry;

  for (const file of files) {
    let text;
    try {
      if (statSync(file).size > MAX_BYTES) continue;
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const ext = extname(file);
    const line = lineAt(text);
    const hash = createHash("sha256").update(text).digest("hex");
    if (hashes[hash])
      add(
        "local-copy",
        "error",
        file,
        1,
        `This file is a copy of Mortar's ${hashes[hash]}.`,
        `Delete it and import from "${PKG}". Contribute changes to the kit through a pull request.`,
      );

    if (STYLE.has(ext)) {
      const css = blankComments(text, { css: true });
      const tw = css.search(/@import\s+["']tailwindcss["']/);
      const mortar = css.search(
        /@import\s+["']@tony-ui\/mortar\/styles\.css["']/,
      );
      if (tw >= 0) tailwindEntry ??= file;
      if (mortar >= 0) {
        stylesImported = true;
        if (tw >= 0 && mortar < tw)
          add(
            "styles-order",
            "warning",
            file,
            line(mortar),
            "Mortar's styles are imported before Tailwind.",
            '@import "tailwindcss"; first, then @import "@tony-ui/mortar/styles.css";',
          );
      }
      // Selectors: the text before each `{` that is not an at-rule.
      for (const m of css.matchAll(/([^{};]+)\{/g)) {
        const selector = m[1].trim();
        if (!selector || selector.startsWith("@")) continue;
        const hits = [
          ...[...selector.matchAll(/\.(m-[a-z][a-z0-9-]*)/g)]
            .map((x) => x[1])
            .filter((c) => classes.has(c))
            .map((c) => "." + c),
          ...(/\[data-m-component\b/.test(selector)
            ? ["[data-m-component]"]
            : []),
        ];
        if (hits.length)
          add(
            "css-override",
            "error",
            file,
            line(m.index + m[0].length - m[1].trimStart().length - 1),
            `Overrides Mortar markup (${[...new Set(hits)].join(", ")}).`,
            "Remove the override. Use component props, className for layout only, or theme tokens (brandTokens, --m-brand-*). If the kit is wrong, fix it centrally with a pull request.",
          );
      }
      continue;
    }

    const src = blankComments(text);
    for (const m of src.matchAll(DEEP)) {
      usesMortar = true;
      add(
        "deep-import",
        "error",
        file,
        line(m.index),
        `Reaches into ${m[0]}; only "${PKG}", "${PKG}/styles.css" and "${PKG}/brand" are public.`,
        `Import from "${PKG}" instead, and remove any alias to the package's source.`,
      );
    }
    if (
      /\bcomponentRoot\s*\(/.test(src) ||
      /<[\w.]+[^>]*\sdata-m-component\s*=/.test(src)
    ) {
      const at = src.search(/\bcomponentRoot\s*\(|\sdata-m-component\s*=/);
      add(
        "local-copy",
        "error",
        file,
        line(at),
        "This file renders Mortar's component marker, so it looks like a copy of Mortar source.",
        `Import the component from "${PKG}" instead. Contribute changes to the kit through a pull request.`,
      );
    }
    for (const m of src.matchAll(SIDE_EFFECT))
      if (m[2] === `${PKG}/styles.css`) stylesImported = true;

    // Local name → export name for this file.
    const locals = new Map();
    const namespaces = new Set();
    let imported = false;
    for (const m of src.matchAll(IMPORT)) {
      const [, kind, typeOnly, clause, , spec] = m;
      if (spec !== PKG) {
        if (spec !== `${PKG}/brand` && spec !== `${PKG}/styles.css`)
          if (!/\/(src|dist)\b/.test(spec))
            add(
              "deep-import",
              "error",
              file,
              line(m.index),
              `"${spec}" is not a public entry point.`,
              `Import from "${PKG}".`,
            );
        continue;
      }
      imported = usesMortar = true;
      firstMortarFile ??= file;
      const ns = clause.match(/\*\s*as\s+([\w$]+)/);
      if (ns) namespaces.add(ns[1]);
      const named = clause.match(/\{([\s\S]*)\}/);
      if (!named) continue;
      const offset = m.index + m[0].indexOf("{");
      for (const raw of named[1].split(",")) {
        const item = raw.trim();
        if (!item) continue;
        const [name, alias] = item
          .replace(/^type\s+/, "")
          .split(/\s+as\s+/)
          .map((s) => s.trim());
        const isType = !!typeOnly || /^type\s/.test(item);
        const at = offset + named[0].indexOf(raw.trimStart() || raw);
        if (!exportNames.has(name)) {
          const removed = REMOVED_EXPORTS[name];
          const guess = removed?.replacement ?? closest(name, exportNames, 3);
          add(
            "unknown-export",
            "error",
            file,
            line(at),
            `${PKG} ${data.version} has no export "${name}".${removed ? " " + removed.note : ""}`,
            guess
              ? `Import ${guess} instead.`
              : "Search the catalogue (mortar search) for the current component.",
          );
          continue;
        }
        if (!isType && kind === "import") locals.set(alias ?? name, name);
      }
    }
    if (!imported) continue;

    // className tokens on the app's own markup and arbitrary variants.
    for (const m of src.matchAll(
      /\bclass(?:Name)?\s*=\s*(?:\{\s*)?(["'`])([^"'`]*)\1/g,
    )) {
      const value = m[2];
      const at = m.index;
      for (const v of value.matchAll(/\[[^\]]*\.(m-[a-z][a-z0-9-]*)[^\]]*\]/g))
        if (classes.has(v[1]))
          add(
            "class-override",
            "error",
            file,
            line(at),
            `The variant ${v[0]} restyles Mortar's .${v[1]}.`,
            "Remove it. Use the component's props or theme tokens; className is for layout only.",
          );
      const own = value.split(/\s+/).filter((c) => classes.has(c));
      if (own.length)
        add(
          "kit-class",
          "warning",
          file,
          line(at),
          `Uses Mortar-internal class${own.length > 1 ? "es" : ""} ${own.join(", ")} on the app's markup.`,
          "Render the Mortar component instead of copying its classes; the class names are not a public API.",
        );
    }
    // Colour literals that define a brand are where colours belong.
    const brand = brandRanges(src);
    const inBrand = (at) =>
      brand.some(([start, end]) => at >= start && at <= end);
    let lineStart = 0;
    src.split("\n").forEach((l, i) => {
      const offset = lineStart;
      lineStart += l.length + 1;
      for (const p of l.matchAll(PALETTE_CLASS))
        add(
          "raw-colour",
          "warning",
          file,
          i + 1,
          `Palette class ${p[0]} next to Mortar components.`,
          "Use Mortar's semantic props (tone, color, variant) or tokens (var(--m-…)) so brand, dark mode and contrast stay correct.",
        );
      const hex = [...l.matchAll(HEX)].filter(
        (h) => /\d/.test(h[0]) || COLOURISH.test(l),
      );
      const fns = COLOURISH.test(l) ? [...l.matchAll(COLOUR_FN)] : [];
      for (const h of [...hex, ...fns].filter(
        (h) => !inBrand(offset + h.index),
      ))
        add(
          "raw-colour",
          "warning",
          file,
          i + 1,
          `Raw colour ${h[0].replace(/\($/, "()")} in a file that renders Mortar components.`,
          "Use semantic props or tokens (var(--m-…)); define brand colours once through ThemeProvider brandTokens or a [data-mortar-brand] rule.",
        );
    });

    if (!JSX.has(ext)) continue;
    // JSX opening tags of Mortar components.
    const tag = /<([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)?)(?=[\s/>])/g;
    for (const m of src.matchAll(tag)) {
      let exportName;
      const [ns, member] = m[1].split(".");
      if (member && namespaces.has(ns)) exportName = member;
      else if (!member) exportName = locals.get(m[1]);
      if (!exportName) continue;
      if (exportName === "ThemeProvider") themeProvider = true;
      const component = data.find(exportName);
      if (!component) {
        if (member && !exportNames.has(member))
          add(
            "unknown-export",
            "error",
            file,
            line(m.index),
            `${PKG} ${data.version} has no export "${member}".`,
          );
        continue;
      }
      const propTypes = component.contract.propTypes;
      if (!propTypes) continue;
      const accepts = data.accepts(component);
      for (const attr of jsxAttributes(src, m.index + m[0].length)) {
        const name = attr.name;
        if (name === "key" || /[-:]/.test(name)) continue;
        if (!accepts.has(name)) {
          const rename =
            RENAMED_PROPS[exportName]?.[name] ??
            (GENERAL_PROPS[name] && accepts.has(GENERAL_PROPS[name])
              ? { to: GENERAL_PROPS[name] }
              : undefined);
          const guess = rename?.to ?? closest(name, Object.keys(propTypes), 2);
          add(
            "unknown-prop",
            "error",
            file,
            line(attr.index),
            `<${exportName}> has no prop "${name}".${rename?.note ? " " + rename.note : ""}`,
            guess
              ? `Use \`${guess}\` (${propTypes[guess]?.type ?? "see the contract"}).`
              : `See the contract: mortar component ${exportName}.`,
          );
          continue;
        }
        const type = propTypes[name]?.type;
        if (attr.value === undefined || !type) continue;
        const members = type.split(" | ").map((s) => s.trim());
        if (!members.every((t) => /^"[^"]*"$|^null$|^boolean$|^\d+$/.test(t)))
          continue;
        const allowed = members
          .filter((t) => t.startsWith('"'))
          .map((t) => JSON.parse(t));
        if (!allowed.length || allowed.includes(attr.value)) continue;
        const renamed = RENAMED_VALUES[attr.value];
        const guess = allowed.includes(renamed)
          ? renamed
          : closest(attr.value, allowed, 3);
        add(
          "invalid-value",
          "error",
          file,
          line(attr.index),
          `<${exportName} ${name}="${attr.value}"> is not one of ${allowed.map((a) => `"${a}"`).join(", ")}.`,
          guess ? `Use ${name}="${guess}".` : undefined,
        );
      }
    }
  }

  // Package-level rules.
  let pkgJson;
  const pkgFile = join(root, "package.json");
  try {
    pkgJson = JSON.parse(readFileSync(pkgFile, "utf8"));
  } catch {}
  const range =
    pkgJson?.dependencies?.[PKG] ??
    pkgJson?.devDependencies?.[PKG] ??
    pkgJson?.peerDependencies?.[PKG];
  if (usesMortar || range) {
    if (!range && pkgJson)
      add(
        "not-declared",
        "error",
        pkgFile,
        1,
        `${PKG} is imported but not listed in package.json.`,
        `npm install ${PKG}`,
      );
    if (!installed)
      add(
        "not-installed",
        "error",
        pkgJson ? pkgFile : undefined,
        1,
        `${PKG} is not installed (no node_modules/${PKG}).`,
        "Run npm install.",
      );
    else if (range) {
      const ok = satisfies(installed, range);
      if (ok === false)
        add(
          "version-mismatch",
          "error",
          pkgFile,
          1,
          `Installed ${PKG} ${installed} does not satisfy "${range}".`,
          "Run npm install so the lockfile and node_modules match package.json.",
        );
    }
    if (usesMortar && !stylesImported)
      add(
        "missing-styles",
        "error",
        tailwindEntry ?? firstMortarFile,
        1,
        `No file imports "${PKG}/styles.css", so components render unstyled.`,
        `In the Tailwind CSS entry, after @import "tailwindcss";, add @import "${PKG}/styles.css";`,
      );
    if (usesMortar && !themeProvider && firstMortarFile)
      add(
        "missing-theme-provider",
        "warning",
        firstMortarFile,
        1,
        "Mortar components are used but ThemeProvider is never rendered.",
        `Wrap the app root once: <ThemeProvider brand="neutral" density="comfortable" initialAppearance="system">…</ThemeProvider>`,
      );
  }

  const order = { error: 0, warning: 1, info: 2 };
  findings.sort(
    (a, b) =>
      order[a.severity] - order[b.severity] ||
      a.file.localeCompare(b.file) ||
      (a.line ?? 0) - (b.line ?? 0),
  );
  const summary = { error: 0, warning: 0, info: 0, files: files.length };
  for (const f of findings) summary[f.severity]++;
  return {
    root,
    mortar: {
      range: range ?? null,
      installed: installed ?? null,
      checkedAgainst: data.version,
    },
    summary,
    findings,
  };
}
