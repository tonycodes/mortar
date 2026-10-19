import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, cp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkKit, ROOT } from "../scripts/check.mjs";
test("baseline rejects path escape, missing dependencies, hidden exports and hosted coupling", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mortar-baseline-"));
  try {
    for (const name of [
      "src",
      "previews",
      "playground",
      "styles.css",
      "catalog.json",
      "manifests",
      "package.json",
      "baseline-policy.json",
    ])
      await cp(join(ROOT, name), join(dir, name), { recursive: true });
    const file = join(dir, "manifests/mortar-button.json");
    const c = JSON.parse(await readFile(file, "utf8"));
    c.source = "../outside.tsx";
    c.contract.dependencies = ["missing"];
    await writeFile(file, JSON.stringify(c));
    await writeFile(
      join(dir, "src/index.ts"),
      "export { Surprise } from './primitives.js';\nexport function HiddenRuntime() {}\nexport * from './application.js';\n",
      { flag: "a" },
    );
    await writeFile(
      join(dir, "src/forbidden.ts"),
      "fetch('https://example.invalid'); const classes='bg-indigo-600';\n",
    );
    await writeFile(
      join(dir, "previews/Bad.tsx"),
      'export const bad = <div className="bg-[#ff0000]" />;',
    );
    const result = await checkKit(dir);
    assert.equal(result.passed, false);
    assert.ok(
      result.findings.some(
        (f) => f.rule === "M001" && f.message.includes("explicit named"),
      ),
      "Direct and wildcard exports cannot bypass the contract",
    );
    for (const rule of ["M001", "M002", "M003", "M004", "M005"])
      assert.ok(
        result.findings.some((f) => f.rule === rule),
        rule,
      );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("baseline rejects stale source/preview closure, catalogue drift and undocumented profiles", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mortar-integrity-"));
  try {
    for (const name of [
      "src",
      "previews",
      "playground",
      "manifests",
      "styles.css",
      "catalog.json",
      "package.json",
      "baseline-policy.json",
    ])
      await cp(join(ROOT, name), join(dir, name), { recursive: true });
    const before = await readFile(join(dir, "catalog.json"), "utf8");
    assert.equal((await checkKit(dir, { refresh: true })).passed, true);
    assert.equal(
      await readFile(join(dir, "catalog.json"), "utf8"),
      before,
      "Regeneration must preserve canonical formatting",
    );
    await writeFile(
      join(dir, "previews/Fixture.tsx"),
      "\n// changed shared preview\n",
      { flag: "a" },
    );
    const previewOnly = await checkKit(dir);
    assert.ok(
      previewOnly.findings.some(
        (f) => f.rule === "M007" && f.file.includes("mortar-button"),
      ),
      "An extensionless fixture edit must invalidate Button without a source or CSS edit",
    );
    await writeFile(
      join(dir, "src/components.css"),
      "\n/* changed central style */\n",
      { flag: "a" },
    );
    const file = join(dir, "manifests/mortar-button.json");
    const c = JSON.parse(await readFile(file, "utf8"));
    c.testing.profile = "display";
    await writeFile(file, JSON.stringify(c));
    const result = await checkKit(dir);
    for (const rule of ["M006", "M007", "M008"])
      assert.ok(
        result.findings.some((f) => f.rule === rule),
        rule,
      );
    assert.ok(
      result.findings.some(
        (f) => f.rule === "M007" && f.file.includes("mortar-button"),
      ),
    );
    c.testing.profile = "control";
    c.id = "../attempt-" + dir.split("/").pop();
    await writeFile(file, JSON.stringify(c));
    const refreshed = await checkKit(dir, { refresh: true });
    assert.ok(refreshed.findings.some((f) => f.rule === "M001"));
    await assert.rejects(readFile(join(dir, "manifests", c.id + ".json")));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("a shared CSS change invalidates fingerprints but regenerates only the catalogue", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mortar-css-"));
  try {
    for (const name of [
      "src",
      "previews",
      "playground",
      "manifests",
      "styles.css",
      "catalog.json",
      "package.json",
      "baseline-policy.json",
    ])
      await cp(join(ROOT, name), join(dir, name), { recursive: true });
    const manifest = join(dir, "manifests/mortar-button.json");
    const before = await readFile(manifest, "utf8");
    await writeFile(join(dir, "src/kits.css"), "\n/* restyle */\n", {
      flag: "a",
    });
    const stale = await checkKit(dir);
    assert.ok(
      stale.findings.some(
        (f) => f.rule === "M007" && f.file.includes("mortar-button"),
      ),
      "A CSS-only edit must invalidate Button",
    );
    assert.equal((await checkKit(dir, { refresh: true })).passed, true);
    assert.equal(await readFile(manifest, "utf8"), before);
    assert.equal((await checkKit(dir)).passed, true);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
