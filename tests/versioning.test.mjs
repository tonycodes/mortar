import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const read = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));

test("every manifest and the catalogue carry the package version", () => {
  const { version } = read("../package.json");
  const stale = readdirSync(new URL("../manifests", import.meta.url))
    .filter((file) => file.endsWith(".json"))
    .filter((file) => read(`../manifests/${file}`).version !== version);
  assert.deepEqual(stale, []);
  const catalog = read("../catalog.json");
  assert.equal(catalog.version, version);
  assert.ok(catalog.components.every((c) => c.version === version));
});

test("the lockfile matches the package version", () => {
  const { version } = read("../package.json");
  const lock = read("../package-lock.json");
  assert.equal(lock.version, version);
  assert.equal(lock.packages[""].version, version);
});
