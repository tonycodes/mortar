import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { kits } from "../scripts/test-contract.mjs";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("DESIGN.md states the machine-readable principles word for word", () => {
  const { principles } = JSON.parse(read("design-principles.json"));
  // Principles end where the DESIGN.md-only API conventions begin.
  const [prose] = read("DESIGN.md").split(/^## /m);
  const listed = [
    ...prose.matchAll(/^(\d+)\. \*\*([a-z-]+)\*\* — (.+)$/gm),
  ].map(([, number, id, text]) => ({
    number: Number(number),
    id,
    // Markdown code spans are formatting; the JSON carries the same text.
    instruction: text.replace(/`/g, ""),
  }));
  assert.deepEqual(
    listed,
    principles.map(({ id, instruction }, i) => ({
      number: i + 1,
      id,
      instruction,
    })),
  );
});

test("the README does not hard-code a package version", () => {
  // A version (1.2.3), not an address such as 127.0.0.1.
  const versions = read("README.md").match(/(?<![\d.])\d+\.\d+\.\d+(?![\d.])/g);
  assert.deepEqual(versions ?? [], []);
});

test("contributor docs run npm run check before npm run catalog", () => {
  const problems = [];
  for (const file of [
    "AGENTS.md",
    "CONTRIBUTING.md",
    "TESTING.md",
    "README.md",
  ])
    // Within any sentence or command block, check must come first.
    for (const part of read(file).split(/```|(?<=\.)\s+|\n\n/)) {
      const catalog = part.indexOf("npm run catalog");
      const check = part.indexOf("npm run check");
      if (
        catalog >= 0 &&
        (check < 0 ? /^\s*npm /m.test(part) : catalog < check)
      )
        problems.push(`${file}: ${part.trim().slice(0, 80)}`);
    }
  assert.deepEqual(problems, []);
});

test("CONTRIBUTING.md counts the playground kits correctly", () => {
  const { kits: taxonomy } = JSON.parse(read("playground/taxonomy.json"));
  assert.deepEqual(
    taxonomy.map((k) => k.id),
    [...kits],
  );
  const words = ["zero", "one", "two", "three", "four", "five", "six", "seven"];
  const counted = read("CONTRIBUTING.md").match(/\b(\w+) kits\b/)?.[1];
  assert.equal(counted, words[taxonomy.length]);
});

test("CHANGELOG.md has a section for the package version, used as its release notes", async () => {
  const { changelogSection } = await import("../scripts/release-notes.mjs");
  const changelog = readFileSync(
    new URL("../CHANGELOG.md", import.meta.url),
    "utf8",
  );
  const { version } = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );
  assert.notEqual(
    changelogSection(changelog, version),
    "",
    `Add a "## ${version}" section to CHANGELOG.md in the version bump.`,
  );
  const sample = "# C\n\n## 1.2.0 (date)\n\nNew.\n\n## 1.1.0\n\nOld.\n";
  assert.equal(changelogSection(sample, "1.2.0"), "New.");
  assert.equal(changelogSection(sample, "1.1.0"), "Old.");
  assert.equal(changelogSection(sample, "1.2"), "");
});
