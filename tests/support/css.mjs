// CSS helpers for the node suite. selectorBody is the same parser the
// baseline check (scripts/check.mjs) uses, so tests and M009 agree.
import { readFile } from "node:fs/promises";
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

/**
 * The `@layer components { … }` block of `css` that contains `selector`, so a
 * test checks its own block wherever later contributions append theirs.
 */
export function layerBlockWith(css, selector) {
  const at = css.indexOf(selector);
  if (at < 0) return "";
  const start = css.lastIndexOf("@layer components {", at);
  const end = css.indexOf("@layer components {", at);
  return css.slice(start, end === -1 ? undefined : end);
}
