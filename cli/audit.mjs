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
  "not-installed": "@tonycodes-ui/mortar is imported but not installed.",
  "not-declared": "@tonycodes-ui/mortar is imported but not in package.json.",
  "version-mismatch":
    "The installed version does not satisfy the package.json range.",
  "unknown-export":
    "A named import from @tonycodes-ui/mortar that the installed version does not export.",
  "deep-import":
    "An import or alias that reaches into the package's src or dist instead of its public entry points.",
  "unknown-prop": "A prop that the component's contract does not declare.",
  "invalid-value": "A literal value outside the prop's declared union.",
  "css-override":
    "Consumer CSS that selects Mortar's .m-* classes or [data-m-component].",
  "ancestor-override":
    "Consumer CSS that uses an ancestor/native-element selector to restyle a Mortar control.",
  "class-override":
    "A Tailwind arbitrary variant in a className that targets Mortar's .m-* classes.",
  "kit-class":
    "A Mortar-internal .m-* class used on the application's own markup.",
  "raw-colour":
    "A raw colour or Tailwind palette class in a file that renders Mortar components.",
  "missing-styles": "No import of @tonycodes-ui/mortar/styles.css.",
  "styles-order":
    "@tonycodes-ui/mortar/styles.css is imported before Tailwind in the same file.",
  "missing-theme-provider":
    "Mortar components are rendered but ThemeProvider is never rendered.",
  "local-copy": "A local copy of Mortar source.",
  "raw-element":
    "A raw HTML element (such as <table> or <select>) that a Mortar component replaces, in an app that uses Mortar.",
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
const PKG = "@tonycodes-ui/mortar";
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

/**
 * The text with string and template-literal contents blanked, so HTML inside
 * strings (an email template, say) is not read as JSX. Lengths and newlines
 * are kept, so offsets still map to lines.
 *
 * A quote starts a string when it follows an operator, a bracket, `=>`, or
 * `return`, `case`, `throw`, `from` or `import`. An apostrophe in JSX text
 * (`Don't`) does not. Template literals recurse into `${…}`: strings and
 * nested templates there are blanked, and a backtick quoted inside the
 * interpolation does not end the outer template or blank the lines after it.
 * JSX in an interpolation is left in place.
 */
export function blankStrings(src) {
  const out = src.split("");
  const n = src.length;
  // A quote in JSX text (Don't) is not a string.
  const starts = (i) => {
    const q = src[i];
    if (q !== '"' && q !== "'" && q !== "`") return false;
    if (q === "`") return true;
    const before = src.slice(0, i).trimEnd();
    return /(?:^|=>|[=(,:?&|[{}+;!]|\b(?:return|case|throw|from|import))$/.test(
      before,
    );
  };
  const blank = (from, to) => {
    for (let k = from; k < Math.min(to, n); k++)
      if (out[k] !== "\n") out[k] = " ";
  };
  // Blank the string whose opening quote is at `i`. Returns the index of the
  // closing quote, the newline that ends a non-template, or `end`.
  const blankOne = (i, end) => {
    const q = src[i];
    let j = i + 1;
    let literal = j;
    while (j < end) {
      if (src[j] === "\\") {
        j += 2;
        continue;
      }
      if (q === "`" && src[j] === "$" && src[j + 1] === "{") {
        blank(literal, j);
        const close = blankCode(j + 2, end, true);
        j = close < end ? close + 1 : end;
        literal = j;
        continue;
      }
      if (src[j] === q) break;
      if (q !== "`" && src[j] === "\n") break;
      j++;
    }
    blank(literal, j);
    return j;
  };
  // Walk code in [start, end). With `expr`, the `{` of `${` is already
  // counted and the walk stops at the matching `}`.
  const blankCode = (start, end, expr) => {
    let depth = expr ? 1 : 0;
    let i = start;
    while (i < end) {
      const c = src[i];
      if (expr && c === "{") depth++;
      else if (expr && c === "}") {
        if (--depth === 0) return i;
      } else if ((c === '"' || c === "'" || c === "`") && starts(i)) {
        i = blankOne(i, end);
        if (i < end) i++;
        continue;
      }
      i++;
    }
    return i;
  };
  blankCode(0, n, false);
  return out.join("");
}

/**
 * Raw element → the Mortar components that replace it, from each contract's
 * `replaces` (an element name, optionally with `[type=…]` for inputs).
 */
function replacements(data) {
  const map = new Map();
  for (const c of data.components ?? [])
    for (const element of c.contract?.replaces ?? [])
      map.set(element, [...(map.get(element) ?? []), c.export]);
  return map;
}

/** Export → the native elements that component replaces. */
function replacesByExport(data) {
  const map = new Map();
  for (const c of data.components ?? []) {
    const list = c.contract?.replaces ?? [];
    if (list.length) map.set(c.export, list);
  }
  return map;
}

/**
 * Visual properties that restyle a control. Layout (margin, display, flex,
 * width, …) is ignored so composition wrappers stay quiet.
 */
const VISUAL_PROP = new Set([
  "background",
  "background-color",
  "background-image",
  "border",
  "border-color",
  "border-style",
  "border-width",
  "border-top",
  "border-right",
  "border-bottom",
  "border-left",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "border-top-style",
  "border-right-style",
  "border-bottom-style",
  "border-left-style",
  "border-top-width",
  "border-right-width",
  "border-bottom-width",
  "border-left-width",
  "border-radius",
  "border-top-left-radius",
  "border-top-right-radius",
  "border-bottom-right-radius",
  "border-bottom-left-radius",
  "color",
  "font",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "font-variant",
  "line-height",
  "letter-spacing",
  "text-decoration",
  "text-decoration-line",
  "text-decoration-color",
  "text-decoration-style",
  "text-transform",
  "text-shadow",
]);

/** True when a CSS rule body sets a visual property. */
export function hasVisualDeclarations(body) {
  for (const m of body.matchAll(/(?:^|[{;])\s*([a-z-]+)\s*:/gi)) {
    if (VISUAL_PROP.has(m[1].toLowerCase())) return true;
  }
  return false;
}

/**
 * An obvious ancestor + native-element selector: `.toolbar button`,
 * `#bar > input`, `div.panel select:hover`. Returns nothing when the selector
 * is complex, targets kit classes, or has no class/id ancestor marker.
 */
export function parseAncestorNativeSelector(selector) {
  const parts = [];
  let buf = "";
  let depth = 0;
  for (let i = 0; i < selector.length; i++) {
    const c = selector[i];
    if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth = Math.max(0, depth - 1);
    else if (c === "," && depth === 0) {
      parts.push(buf);
      buf = "";
      continue;
    }
    buf += c;
  }
  parts.push(buf);

  const out = [];
  for (const raw of parts) {
    const part = raw.trim();
    if (!part || part.startsWith("@")) continue;
    if (/\.m-[a-z]|\[data-m-component\b/.test(part)) continue;
    const m = part.match(
      /^(.+?)\s*(?:>|\s)\s*([a-z][a-z0-9]*)(\[[^\]]+\])?((?:::[a-z-]+|:[a-z-]+(?:\([^)]*\))?)*)\s*$/i,
    );
    if (!m) continue;
    const ancestor = m[1].trim();
    const subject = m[2].toLowerCase();
    const attr = m[3] ?? "";
    // One simple ancestor only: `.a .b button` stays manual.
    if (/[\s>+~]/.test(ancestor)) continue;
    // Subject must stay a bare native element (optional [type=…] / pseudos).
    if (/[.#]/.test(m[4] ?? "")) continue;
    const classes = [...ancestor.matchAll(/\.([A-Za-z_][\w-]*)/g)].map(
      (x) => x[1],
    );
    const id = ancestor.match(/#([A-Za-z_][\w-]*)/)?.[1];
    if (!classes.length && !id) continue;
    const type = attr.match(
      /^\[\s*type\s*=\s*(?:["']?)([\w-]+)(?:["']?)\s*\]$/i,
    )?.[1];
    if (attr && !type) continue;
    out.push({
      selector: part,
      tag: subject,
      type: type?.toLowerCase(),
      classes,
      id,
    });
  }
  return out;
}

function openingEnd(src, i) {
  const n = src.length;
  while (i < n) {
    while (i < n && /\s/.test(src[i])) i++;
    if (src[i] === "/" && src[i + 1] === ">")
      return { end: i + 2, selfClose: true };
    if (src[i] === ">") return { end: i + 1, selfClose: false };
    if (src[i] === "{") {
      i = skipBraces(src, i);
      continue;
    }
    NAME.lastIndex = i;
    const m = NAME.exec(src);
    if (!m) return { end: i, selfClose: false };
    i += m[0].length;
    while (i < n && /\s/.test(src[i])) i++;
    if (src[i] !== "=") continue;
    i++;
    while (i < n && /\s/.test(src[i])) i++;
    const q = src[i];
    if (q === '"' || q === "'") {
      const end = src.indexOf(q, i + 1);
      if (end < 0) return { end: n, selfClose: false };
      i = end + 1;
    } else if (q === "{") i = skipBraces(src, i);
    else return { end: i, selfClose: false };
  }
  return { end: n, selfClose: false };
}

function replacesMatch(replaces, tag, type) {
  for (const r of replaces) {
    const m = /^([a-z]+)(?:\[type=(.+)\])?$/.exec(r);
    if (!m || m[1] !== tag) continue;
    if (!type) return true;
    if (!m[2] || m[2] === type) return true;
  }
  return false;
}

/**
 * Mortar controls in `src` that replace a native element, with literal
 * className/id markers on open host ancestors. Complex className expressions
 * are ignored.
 */
export function findMortarPlacements(src, locals, namespaces, byExport) {
  const stack = [];
  const placements = [];
  const re = /<\/?([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)?)(?=[\s/>])/g;
  let m;
  while ((m = re.exec(src))) {
    const at = m.index;
    const name = m[1];
    const isClose = src[at + 1] === "/";
    const host = /^[a-z]/.test(name);
    if (isClose) {
      if (host) {
        for (let i = stack.length - 1; i >= 0; i--) {
          if (stack[i].name === name) {
            stack.length = i;
            break;
          }
        }
      }
      continue;
    }
    const attrsStart = at + m[0].length;
    const { end, selfClose } = openingEnd(src, attrsStart);
    const attrs = jsxAttributes(src, attrsStart);
    let exportName;
    const [ns, member] = name.split(".");
    if (member && namespaces.has(ns)) exportName = member;
    else if (!member) exportName = locals.get(name);
    const replaces = exportName ? byExport.get(exportName) : undefined;
    if (replaces) {
      placements.push({
        exportName,
        replaces,
        frames: stack.map((f) => ({
          classes: new Set(f.classes),
          id: f.id,
        })),
      });
    }
    if (host && !selfClose) {
      const classAttr = attrs.find(
        (a) => a.name === "className" || a.name === "class",
      );
      const idAttr = attrs.find((a) => a.name === "id");
      const classes = (classAttr?.value ?? "").split(/\s+/).filter(Boolean);
      stack.push({
        name,
        classes,
        id: idAttr?.value,
      });
    }
    re.lastIndex = end;
  }
  return placements;
}

function frameMatches(frame, classes, id) {
  if (id && frame.id !== id) return false;
  return classes.every((c) => frame.classes.has(c));
}

// Inputs with no Mortar equivalent (hidden values, file pickers, sliders).
const NATIVE_ONLY = new Set(["hidden", "file", "range", "color", "image"]);
const TEXT_LIKE = new Set([
  "text",
  "email",
  "search",
  "url",
  "tel",
  "number",
  "date",
  "time",
  "datetime-local",
  "month",
  "week",
]);

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
  /\b(import|export)\s+(type\s+)?((?:(?!\bfrom\b)[^;])*?)\s*\bfrom\s*(["'])(@tonycodes-ui\/mortar(?:\/[^"']*)?)\4/g;
const SIDE_EFFECT = /\bimport\s*(["'])(@tonycodes-ui\/mortar\/[^"']*)\1/g;
// A file that builds an email: it imports Mortar's email entry or React Email.
const EMAIL_FILE =
  /\bfrom\s*["'](?:@tonycodes-ui\/mortar\/email|@react-email\/[^"']+)["']/;
// App components with an email counterpart, for the email-app-import fix.
const EMAIL_EQUIVALENT = {
  Button: "EmailButton",
  ActionLink: "EmailButton",
  Notice: "EmailCallout",
  Banner: "EmailCallout",
  Divider: "EmailDivider",
  OrderSummary: "EmailSummary",
  Text: "EmailText",
  PageHeading: "EmailHeading",
  SectionHeading: "EmailHeading",
  CodeInput: "EmailCode",
};
const DEEP =
  /@tonycodes-ui\/mortar\/(src|dist)\b|node_modules\/@tonycodes-ui\/mortar\/(src|dist)\b/g;
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
  // An installed release older than the `replaces` field falls back to this
  // tool's mapping; every component it names has existed since 0.1.
  let rawElements = replacements(data);
  if (!rawElements.size) rawElements = replacements(bundled);
  const byExport = replacesByExport(data);
  if (![...byExport.keys()].length)
    for (const [k, v] of replacesByExport(bundled)) byExport.set(k, v);
  // Raw elements are collected from every JSX file and reported once the
  // whole app is known to use Mortar.
  const rawHits = [];
  // Ancestor/native-element CSS rules that set visual properties, matched
  // later against Mortar controls under a matching host ancestor.
  const ancestorRules = [];
  const mortarPlacements = [];

  const files = walk(root);
  const hashes = data.agent.sourceHashes ?? {};
  let usesMortar = false;
  let usesEmail = false;
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
        /@import\s+["']@tonycodes-ui\/mortar\/styles\.css["']/,
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
            '@import "tailwindcss"; first, then @import "@tonycodes-ui/mortar/styles.css";',
          );
      }
      // Selectors: the text before each `{` that is not an at-rule.
      for (const m of css.matchAll(/([^{};]+)\{/g)) {
        const selector = m[1].trim();
        if (!selector || selector.startsWith("@")) continue;
        const selAt = m.index + m[0].length - m[1].trimStart().length - 1;
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
            line(selAt),
            `Overrides Mortar markup (${[...new Set(hits)].join(", ")}).`,
            "Remove the override. Use component props, className for layout only, or theme tokens (brandTokens, --m-brand-*). If the kit is wrong, fix it centrally with a pull request.",
          );
        const braceAt = m.index + m[0].length - 1;
        const body = css.slice(braceAt + 1, closing(css, braceAt));
        if (!hits.length && hasVisualDeclarations(body)) {
          for (const target of parseAncestorNativeSelector(selector))
            ancestorRules.push({
              file,
              line: line(selAt),
              ...target,
            });
        }
      }
      continue;
    }

    const src = blankComments(text);
    // Email markup is tables by design, and has its own components.
    const emailFile = EMAIL_FILE.test(src);
    if (JSX.has(ext) && !emailFile) {
      const jsx = blankStrings(src);
      for (const m of jsx.matchAll(/<([a-z][a-z0-9]*)(?=[\s/>])/g)) {
        const tagName = m[1];
        let element = tagName;
        if (tagName === "input") {
          const type = jsxAttributes(jsx, m.index + m[0].length).find(
            (a) => a.name === "type",
          );
          // A dynamic type is read as a text-like input.
          const value = type
            ? src
                .slice(type.index)
                .match(/^type\s*=\s*(?:\{\s*)?(["'`])([^"'`]*)\1/)?.[2]
            : undefined;
          if (value && NATIVE_ONLY.has(value)) continue;
          element =
            value && !TEXT_LIKE.has(value) ? `input[type=${value}]` : "input";
        }
        const components = rawElements.get(element);
        if (!components) continue;
        rawHits.push({ file, line: line(m.index), tag: element, components });
      }
    }
    for (const m of src.matchAll(DEEP)) {
      usesMortar = true;
      add(
        "deep-import",
        "error",
        file,
        line(m.index),
        `Reaches into ${m[0]}; only "${PKG}", "${PKG}/styles.css", "${PKG}/brand" and "${PKG}/email" are public.`,
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
      if (m[2] === `${PKG}/styles.css`) {
        if (emailFile)
          add(
            "email-app-import",
            "error",
            file,
            line(m.index),
            "Imports Mortar's stylesheet into an email. Email clients don't load stylesheets.",
            `Remove the import. The components from "${PKG}/email" carry their styles inline.`,
          );
        else stylesImported = true;
      }

    // Local name → export name for this file.
    const locals = new Map();
    const namespaces = new Set();
    let imported = false;
    for (const m of src.matchAll(IMPORT)) {
      const [, kind, typeOnly, clause, , spec] = m;
      if (spec === `${PKG}/email`) {
        usesEmail = true;
        // Older releases' data has no email exports; skip the check then.
        const known = data.agent.emailExports;
        const named = clause.match(/\{([\s\S]*)\}/);
        if (!known || !named) continue;
        const names = new Set([...known.values, ...known.types]);
        const offset = m.index + m[0].indexOf("{");
        for (const raw of named[1].split(",")) {
          const name = raw
            .trim()
            .replace(/^type\s+/, "")
            .split(/\s+as\s+/)[0]
            .trim();
          if (!name || names.has(name)) continue;
          const guess = closest(name, names, 3);
          add(
            "unknown-export",
            "error",
            file,
            line(offset + named[0].indexOf(raw.trimStart() || raw)),
            `${PKG}/email ${data.version} has no export "${name}".`,
            guess
              ? `Import ${guess} instead.`
              : "See the email components and templates (get_guide email).",
          );
        }
        continue;
      }
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
      imported = true;
      // An email that imports app components is reported below; it doesn't
      // make the email service an app that needs styles and a ThemeProvider.
      if (!emailFile) {
        usesMortar = true;
        firstMortarFile ??= file;
      }
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
        if (!isType && emailFile) {
          const equivalent = EMAIL_EQUIVALENT[name];
          add(
            "email-app-import",
            "error",
            file,
            line(at),
            `Uses the app component ${name} in an email. App components need Mortar's stylesheet, which email clients don't load.`,
            equivalent
              ? `Use ${equivalent} from "${PKG}/email".`
              : `Compose the email from "${PKG}/email" (get_guide email).`,
          );
        }
        if (!isType && kind === "import") locals.set(alias ?? name, name);
      }
    }
    if (!imported) continue;

    if (JSX.has(ext) && !emailFile && byExport.size)
      for (const p of findMortarPlacements(src, locals, namespaces, byExport))
        mortarPlacements.push(p);

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

  if (usesMortar)
    for (const hit of rawHits) {
      const names = hit.components.map((c) => `<${c}>`);
      add(
        "raw-element",
        // A raw <button> is often a deliberate custom trigger; the rest are
        // contract breaks that ship unthemed, untested markup.
        hit.tag === "button" ? "warning" : "error",
        hit.file,
        hit.line,
        `Raw <${hit.tag.replace(/\[type=(.*)\]/, ' type="$1"')}> in an app that uses Mortar.`,
        `Use ${names.length > 1 ? `${names.slice(0, -1).join(", ")} or ${names.at(-1)}` : names[0]} from "${PKG}" (mortar component ${hit.components[0]}).`,
      );
    }

  if (usesMortar)
    for (const rule of ancestorRules) {
      const hit = mortarPlacements.find(
        (p) =>
          replacesMatch(p.replaces, rule.tag, rule.type) &&
          p.frames.some((f) => frameMatches(f, rule.classes, rule.id)),
      );
      if (!hit) continue;
      add(
        "ancestor-override",
        "error",
        rule.file,
        rule.line,
        `Ancestor selector \`${rule.selector}\` restyles Mortar's <${hit.exportName}> (${rule.tag}${rule.type ? `[type=${rule.type}]` : ""}).`,
        "Remove the override. Use component props, className for layout only, or theme tokens (brandTokens, --m-brand-*). If the kit is wrong, fix it centrally with a pull request.",
      );
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
  const reactEmail = "@react-email/components";
  if (
    usesEmail &&
    pkgJson &&
    !pkgJson.dependencies?.[reactEmail] &&
    !pkgJson.devDependencies?.[reactEmail]
  )
    add(
      "email-peer-missing",
      "error",
      pkgFile,
      1,
      `${PKG}/email is imported, but its peer dependency ${reactEmail} is not in package.json.`,
      `npm install ${reactEmail}`,
    );
  if (usesMortar || usesEmail || range) {
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
