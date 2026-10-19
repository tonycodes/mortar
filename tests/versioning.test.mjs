import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const read = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));

test("the catalogue stamps every component with the package version", () => {
  const { version } = read("../package.json");
  const stamped = readdirSync(new URL("../manifests", import.meta.url))
    .filter((file) => file.endsWith(".json"))
    .filter((file) => "version" in read(`../manifests/${file}`));
  assert.deepEqual(stamped, [], "manifests must not carry a version");
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
