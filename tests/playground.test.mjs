import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const { components } = read("../catalog.json");
const { kits } = read("../playground/taxonomy.json");

test("every catalogue component appears in exactly one playground category of its own kit", () => {
  const placed = new Map();
  for (const kit of kits)
    for (const category of kit.categories)
      for (const name of category.components) {
        assert.ok(!placed.has(name), `${name} is listed twice`);
        placed.set(name, kit.id);
      }
  for (const c of components)
    assert.equal(placed.get(c.export), c.kitId, `${c.export} placement`);
  assert.equal(placed.size, components.length);
});

test("category thumbnails are components from that category", () => {
  for (const kit of kits)
    for (const category of kit.categories)
      if (category.thumbnail !== null)
        assert.ok(category.components.includes(category.thumbnail));
});
