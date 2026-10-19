import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { componentApi } from "../scripts/api.mjs";
import { ROOT } from "../scripts/check.mjs";

const manifests = readdirSync(new URL("../manifests/", import.meta.url))
  .filter((file) => file.endsWith(".json"))
  .map((file) =>
    JSON.parse(
      readFileSync(new URL(`../manifests/${file}`, import.meta.url), "utf8"),
    ),
  );
const api = componentApi(ROOT, manifests);

/** Members of a literal union such as `"a" | "b"`, `2 | 3` or `"yes" | null`. */
const LITERAL = /^(?:"[^"]*"|-?\d+(?:\.\d+)?|null|boolean)$/;
function literals(type) {
  const parts = type.split(" | ");
  return parts.length > 1 && parts.every((p) => LITERAL.test(p))
    ? new Set(parts.map((p) => p.replace(/^"|"$/g, "")))
    : null;
}
/** The union a manifest documents, ignoring a trailing "(…)" explanation. */
function documented(text) {
  return new Set(
    text
      .replace(/\s*\(.*$/s, "")
      .split("|")
      .map((p) => p.trim().replace(/^"|"$/g, "")),
  );
}
/** A coarse classification both sides must agree on. */
function kind(text) {
  if (/^\(.*\)\s*=>/.test(text)) return "function";
  // Drop a trailing explanation: "string (YYYY-MM)", "T[] where T extends …".
  const t = text
    .replace(/\s+where\b[^]*$/, "")
    .replace(/\s+\([^()]*\)$/, "")
    .trim();
  if (/\[\](?:\s*\(.*\))?$|^Array</.test(t)) return "array";
  if (/^boolean\b/.test(t)) return "boolean";
  if (/^number\b/.test(t)) return "number";
  if (/^ReactNode\b/.test(t)) return "node";
  if (/^string(?: \| null)?$/.test(t)) return "string";
  return "value";
}

test("every prop the TypeScript checker reports is documented in its manifest", () => {
  const problems = [];
  for (const m of manifests) {
    const props = api.get(m.id)?.props;
    if (!props) {
      problems.push(`${m.export}: export not found by the checker`);
      continue;
    }
    for (const name of Object.keys(props))
      if (!(name in m.contract.props))
        problems.push(`${m.export}.${name}: undocumented`);
    for (const name of Object.keys(m.contract.props))
      if (!api.get(m.id).accepts.has(name))
        problems.push(
          `${m.export}.${name}: documented but not a prop the component accepts`,
        );
  }
  assert.deepEqual(problems, []);
});

test("documented unions and prop kinds match the TypeScript types", () => {
  const problems = [];
  for (const m of manifests)
    for (const [name, { type }] of Object.entries(api.get(m.id)?.props ?? {})) {
      const text = m.contract.props[name];
      if (typeof text !== "string") continue;
      const expected = literals(type);
      if (expected) {
        const actual = documented(text);
        if (
          actual.size !== expected.size ||
          [...expected].some((v) => !actual.has(v))
        )
          problems.push(
            `${m.export}.${name}: "${text}" but TypeScript has ${type}`,
          );
      } else if (kind(type) !== kind(text))
        problems.push(
          `${m.export}.${name}: "${text}" but TypeScript has ${type}`,
        );
    }
  assert.deepEqual(problems, []);
});
