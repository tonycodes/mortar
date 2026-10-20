// CSS helpers for the node suite. selectorBody is the same parser the
// baseline check (scripts/check.mjs) uses, so tests and M009 agree.
import { readFile } from "node:fs/promises";
import { mixOklab } from "./color.mjs";
export { selectorBody } from "../../scripts/check.mjs";

export const readSource = (path) =>
  readFile(new URL(`../../${path}`, import.meta.url), "utf8");

/** The value of the last `property` declaration in `body`, or "". */
export function declaration(body, property) {
  const values = [
    ...body.matchAll(
      new RegExp(`(?:^|[;{}])\\s*${property}\\s*:\\s*([^;]+)`, "gi"),
    ),
  ];
  return values.length ? values.at(-1)[1].trim() : "";
}

/** Custom properties declared in `body`, later declarations winning. */
export function customProperties(body) {
  return Object.fromEntries(
    [...body.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi)].map((m) => [
      m[1],
      m[2].trim(),
    ]),
  );
}

/** Every src stylesheet in cascade order, as styles.css imports them. */
export async function styleFiles() {
  const entry = await readSource("styles.css");
  return [...entry.matchAll(/@import "\.\/(src\/[\w-]+\.css)";/g)].map(
    (m) => m[1],
  );
}

const HEADING = /\/\* == (.+?) ==/g;

/**
 * The text of the named component section of a family stylesheet: from its
 * `/* == Name == *\/` heading to the next heading, or "" when absent. Each
 * component keeps all its rules in one section, so a test can check that a
 * selector lives with its component.
 */
export function section(css, name) {
  const headings = [...css.matchAll(HEADING)];
  const at = headings.findIndex((m) => m[1] === name);
  if (at < 0) return "";
  const end = headings[at + 1]?.index;
  return css.slice(headings[at].index, end);
}

/** The names of the sections of `css` that contain `selector`. */
export function sectionsWith(css, selector) {
  return [...css.matchAll(HEADING)]
    .map((m) => m[1])
    .filter((name) => section(css, name).includes(selector));
}

/**
 * Resolves a customProperties() map whose values use var(--x, fallback) and
 * color-mix(in oklab, a p%, b), as tokens.css does, into plain values.
 */
export function resolveTokens(tokens) {
  const resolve = (value, depth = 0) => {
    if (depth > 20) throw Error(`Circular token: ${value}`);
    let text = value.trim();
    for (;;) {
      const use = text.match(
        /var\(\s*--([a-z0-9-]+)\s*(?:,\s*((?:[^()]|\([^()]*\))*))?\)/i,
      );
      if (!use) break;
      const [whole, name, fallback] = use;
      const replacement =
        name in tokens && tokens[name] !== "initial"
          ? resolve(tokens[name], depth + 1)
          : fallback === undefined
            ? ""
            : resolve(fallback, depth + 1);
      text = text.replace(whole, replacement);
    }
    const mix = text.match(
      /^color-mix\(\s*in oklab,\s*(.+?)\s+([\d.]+)%,\s*(.+)\)$/i,
    );
    if (mix)
      return mixOklab(
        resolve(mix[1], depth + 1),
        resolve(mix[3], depth + 1),
        Number(mix[2]),
      );
    return text.replace(/\s+/g, " ");
  };
  return Object.fromEntries(
    Object.keys(tokens).map((name) => [name, resolve(tokens[name])]),
  );
}
