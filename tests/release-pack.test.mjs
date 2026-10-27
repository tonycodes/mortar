import test from "node:test";
import assert from "node:assert/strict";
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import { delimiter, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

// P-1..P-3: release.mjs parses `npm pack --json`. `prepack` runs the build, whose last step
// (agent-data.mjs) prints "Wrote .../agent-data.json" to stdout ahead of the JSON array, so
// pack must run with --ignore-scripts (release.mjs builds just before). P-4/P-5 pin the docs
// the PO asked for, and P-6 forbids ${{ }} interpolation inside run: blocks.

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");

test("P-1 release.mjs packs with --ignore-scripts so prepack output cannot corrupt the JSON", () => {
  const source = read("scripts/release.mjs");
  const call = source.match(
    /execFileSync\(\s*"npm",\s*\[([^\]]*"pack"[^\]]*)\]/,
  );
  assert.ok(call, "P-1 finds the npm pack call");
  assert.match(call[1], /"--json"/, "P-1 pack still asks for --json");
  assert.match(
    call[1],
    /"--ignore-scripts"/,
    "P-1 pack carries --ignore-scripts (prepack writes to stdout)",
  );
  assert.match(
    call[1],
    /"--pack-destination"/,
    "P-1 pack still writes into release/<version>",
  );
  assert.match(
    source,
    /\["run",\s*"build"\][^;]*;[^]*"pack"/,
    "P-1 the build runs before pack",
  );
});

function stubNpm(dir) {
  const bin = join(dir, "bin");
  mkdirSync(bin);
  const file = join(bin, "npm");
  // Behaves like npm 10.9.x: without --ignore-scripts, pack runs prepack and its stdout
  // lands ahead of the JSON array.
  writeFileSync(
    file,
    `#!${process.execPath}
const { writeFileSync } = require("node:fs");
const { join } = require("node:path");
const args = process.argv.slice(2);
if (args[0] === "run") process.exit(0);
if (args[0] === "pack") {
  const dest = args[args.indexOf("--pack-destination") + 1];
  if (!args.includes("--ignore-scripts")) console.log("Wrote /tmp/dist/agent-data.json");
  writeFileSync(join(dest, "stub-mortar-1.2.3.tgz"), "stub archive");
  console.log(JSON.stringify([{ filename: "stub-mortar-1.2.3.tgz" }]));
  process.exit(0);
}
process.exit(2);
`,
  );
  chmodSync(file, 0o755);
  return bin;
}

function sandbox(t) {
  const dir = mkdtempSync(join(os.tmpdir(), "mortar-pack-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, "scripts", "auto-release"), { recursive: true });
  cpSync(
    join(root, "scripts", "release.mjs"),
    join(dir, "scripts", "release.mjs"),
  );
  cpSync(
    join(root, "scripts", "auto-release", "tree.mjs"),
    join(dir, "scripts", "auto-release", "tree.mjs"),
  );
  // The baseline check is not what is under test; a stub keeps this test to the pack call.
  writeFileSync(
    join(dir, "scripts", "check.mjs"),
    `import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export async function checkKit() { return { passed: true, policyVersion: 7 }; }
`,
  );
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({ name: "stub-mortar", version: "1.2.3", type: "module" }),
  );
  const env = {
    ...process.env,
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_SYSTEM: "/dev/null",
    GIT_AUTHOR_NAME: "t",
    GIT_AUTHOR_EMAIL: "t@example.com",
    GIT_COMMITTER_NAME: "t",
    GIT_COMMITTER_EMAIL: "t@example.com",
  };
  for (const args of [
    ["init", "-q"],
    ["add", "-A"],
    ["commit", "-q", "-m", "init"],
  ]) {
    const r = spawnSync("git", args, { cwd: dir, env, encoding: "utf8" });
    assert.equal(r.status, 0, `P-2 git ${args[0]}: ${r.stderr}`);
  }
  return { dir, env };
}

test("P-2 release:prepare survives a leading stdout line from npm pack and writes provenance", (t) => {
  const { dir, env } = sandbox(t);
  const bin = stubNpm(dir);
  const result = spawnSync(process.execPath, ["scripts/release.mjs"], {
    cwd: dir,
    encoding: "utf8",
    env: { ...env, PATH: `${bin}${delimiter}${process.env.PATH}` },
  });
  assert.equal(
    result.status,
    0,
    `P-2 release.mjs must not fail on pack noise:\n${result.stderr}`,
  );
  assert.doesNotMatch(result.stderr, /SyntaxError/, "P-2 no JSON SyntaxError");
  const provenance = join(dir, "release", "1.2.3", "provenance.json");
  assert.ok(existsSync(provenance), "P-2 provenance.json is written");
  const data = JSON.parse(readFileSync(provenance, "utf8"));
  assert.equal(data.filename, "stub-mortar-1.2.3.tgz", "P-2 filename recorded");
  assert.match(data.integrity, /^sha512-/, "P-2 integrity recorded");
  assert.match(data.commit, /^[0-9a-f]{40}$/, "P-2 commit recorded");
});

test("P-3 the stub really reproduces the failure when pack runs scripts", () => {
  // Control for P-2: without --ignore-scripts the stub's first stdout line is not JSON,
  // so a pack call that lacks the flag cannot pass P-2 by accident.
  assert.throws(
    () => JSON.parse("Wrote /tmp/dist/agent-data.json\n[]"),
    SyntaxError,
  );
});

test("P-4 README describes automatic releases on every merge to main, not a version bump", () => {
  const readme = read("README.md");
  assert.doesNotMatch(
    readme,
    /merging a version bump/i,
    "P-4 README must not say a version bump publishes",
  );
  assert.match(
    readme,
    /every merge to `main` (?:is )?auto-?releas(?:es|ed)[^.]*conventional commits/i,
    "P-4 README says every merge to main auto-releases from conventional commits",
  );
});

test("P-5 CONTRIBUTING says main's CHANGELOG keeps ## Unreleased by design", () => {
  assert.match(
    read("CONTRIBUTING.md"),
    /`CHANGELOG\.md` on `main` (?:always )?keeps? (?:a )?`## Unreleased` section by design/,
    "P-5 documents that promotion happens in CI only and is never committed",
  );
});

test("P-6 no run: block in release.yml interpolates ${{ }}", () => {
  const lines = read(".github/workflows/release.yml").split(/\r?\n/);
  const offenders = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*)(?:- )?run:\s*(.*)$/);
    if (!m) continue;
    const indent = m[1].length;
    const block = [m[2]];
    if (/^[|>]/.test(m[2])) {
      block.length = 0;
      for (let j = i + 1; j < lines.length; j++) {
        const l = lines[j];
        if (l.trim() && l.match(/^\s*/)[0].length <= indent) break;
        block.push(l);
      }
    }
    block.forEach((l) => {
      if (/\$\{\{/.test(l)) offenders.push(`line ${i + 1}: ${l.trim()}`);
    });
  }
  assert.deepEqual(offenders, [], "P-6 pass values through env:, not ${{ }}");
});
