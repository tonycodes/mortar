// Public npmjs package name. The old self-hosted private registry kept
// @tony-ui/mortar (versions <= 0.11). npmjs.com publishes @tonycodes-ui/mortar
// only. These tests name the retired scope so they can forbid it.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { auditApp } from "../cli/audit.mjs";
import { handleMessage } from "../cli/mcp.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = "@tonycodes-ui/mortar";
const NPX = `npx -y ${PUBLIC} mcp`;
const read = (path) => readFileSync(join(ROOT, path), "utf8");

// Retired tokens. @tony-ui matches the scope, including @tony-ui/mortar and
// @tony-ui/control. tony-ui-mortar- is the old npm pack archive prefix.
const RETIRED = /tony-ui-mortar-|@tony-ui(?:\/[A-Za-z0-9._-]+)?/g;

// The only legitimate remaining mentions of the retired scope. Each entry
// carries a reason. Generated catalogues are not listed: manifests/*.json and
// catalog.json must be regenerated onto the public name.
const ALLOWLIST = [
  {
    file: "CHANGELOG.md",
    reason:
      "Migration note telling consumers of the old private-registry package (@tony-ui/mortar, versions <= 0.11) how to move.",
    // Lines of the "### Migration" section only, not the rest of the changelog.
    lines(text) {
      const keep = new Set();
      let inNote = false;
      for (const [index, line] of text.split("\n").entries()) {
        if (/^### Migration\b/.test(line)) inNote = true;
        else if (inNote && /^#{1,3} /.test(line)) inNote = false;
        else if (inNote) keep.add(index + 1);
      }
      return keep;
    },
  },
  {
    file: "tests/npm-package-name.test.mjs",
    reason:
      "This test names the retired @tony-ui scope and tony-ui-mortar- archive so it can forbid them.",
    lines() {
      return null;
    },
  },
];

function allow(file, line) {
  const entry = ALLOWLIST.find((item) => item.file === file);
  if (!entry) return false;
  const kept = entry.lines(read(file));
  return kept === null || kept.has(line);
}

test("R1 package.json and package-lock.json name the public package", () => {
  const pkg = JSON.parse(read("package.json"));
  const lock = JSON.parse(read("package-lock.json"));
  const problems = [];
  if (pkg.name !== PUBLIC)
    problems.push(`package.json name is ${pkg.name}, not ${PUBLIC}`);
  if (lock.name !== PUBLIC)
    problems.push(`package-lock.json name is ${lock.name}, not ${PUBLIC}`);
  if (lock.packages[""].name !== PUBLIC)
    problems.push(
      `package-lock.json packages[""].name is ${lock.packages[""].name}, not ${PUBLIC}`,
    );
  assert.equal(problems.length, 0, problems.join("\n"));
});

test("R2 GUARD publishConfig is public npmjs with provenance", () => {
  assert.deepEqual(JSON.parse(read("package.json")).publishConfig, {
    registry: "https://registry.npmjs.org/",
    access: "public",
    provenance: true,
  });
});

test("R3 tracked text omits the retired @tony-ui scope and archive name", () => {
  const listed = execFileSync("git", ["ls-files", "-z"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  const hits = [];
  for (const name of listed.split("\0").filter(Boolean)) {
    let bytes;
    try {
      bytes = readFileSync(join(ROOT, name));
    } catch {
      continue;
    }
    if (bytes.subarray(0, 8000).includes(0)) continue;
    const text = bytes.toString("utf8");
    for (const [index, line] of text.split("\n").entries()) {
      const found = line.match(RETIRED);
      if (!found) continue;
      const lineNo = index + 1;
      if (allow(name, lineNo)) continue;
      hits.push(`${name}:${lineNo}: ${found.join(", ")}`);
    }
  }
  assert.equal(
    hits.length,
    0,
    `retired npm name remains outside the migration allowlist:\n${hits.join("\n")}`,
  );
});

test("R4 release.yml publishes @tonycodes-ui/mortar to npmjs with provenance", () => {
  const yml = read(".github/workflows/release.yml");
  const lines = yml.split("\n");
  const problems = [];
  if (!yml.includes("https://registry.npmjs.org"))
    problems.push("does not publish to registry.npmjs.org");
  if (!yml.includes("id-token: write"))
    problems.push("publish job is missing id-token: write");
  if (!yml.includes("--provenance"))
    problems.push("npm publish is missing --provenance");
  const oldHost = ["git", "tony", "codes"].join(".");
  if (yml.includes(oldHost))
    problems.push(`release.yml still contains ${oldHost}`);
  if (yml.includes("MORTAR_REGISTRY_TOKEN"))
    problems.push("release.yml still contains MORTAR_REGISTRY_TOKEN");
  if (yml.includes("NODE_AUTH_TOKEN"))
    problems.push("release.yml still contains NODE_AUTH_TOKEN");
  const scope = lines.find((line) => line.includes("scope:"));
  if (!scope?.includes('"@tonycodes-ui"'))
    problems.push(
      `setup-node scope is not @tonycodes-ui: ${(scope ?? "(missing)").trim()}`,
    );
  if (!yml.includes("tonycodes-ui-mortar-$VERSION.tgz"))
    problems.push("archive is not tonycodes-ui-mortar-$VERSION.tgz");
  for (const [index, line] of lines.entries()) {
    const at = `${index + 1}: ${line.trim()}`;
    if (line.includes("npm view") && !line.includes(PUBLIC))
      problems.push(`npm view does not use ${PUBLIC}: ${at}`);
    if (
      line.includes("npm publish") &&
      (!line.includes("tonycodes-ui-mortar-$VERSION.tgz") ||
        line.includes("@tony-ui") ||
        line.includes("tony-ui-mortar-"))
    )
      problems.push(`npm publish does not use the public archive: ${at}`);
    if (line.includes("npmjs.com/package/") && !line.includes(PUBLIC))
      problems.push(`environment url or summary uses the wrong package: ${at}`);
    if (line.includes("tony-ui-mortar-"))
      problems.push(`archive still uses tony-ui-mortar-: ${at}`);
    if (line.includes("@tony-ui"))
      problems.push(`release.yml still names @tony-ui: ${at}`);
  }
  assert.equal(problems.length, 0, problems.join("\n"));
});

test("R5 mortar --help shows the public npx command", () => {
  const help = execFileSync(process.execPath, ["bin/mortar.mjs", "--help"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  assert.equal(
    help.includes(NPX),
    true,
    `mortar --help does not contain ${NPX}. Output still names the old package:\n${help}`,
  );
});

test("R6 README, AGENTS, agents guide and skill use the public npx command", () => {
  const files = [
    "README.md",
    "AGENTS.md",
    "docs/agents.md",
    "skills/mortar/SKILL.md",
  ];
  const problems = [];
  for (const file of files) {
    const text = read(file);
    if (!text.includes(NPX)) {
      const old = text.includes("npx -y @tony-ui/mortar mcp")
        ? " (still has npx -y @tony-ui/mortar mcp)"
        : "";
      problems.push(`${file}: missing ${NPX}${old}`);
    }
    for (const match of text.matchAll(/"args"\s*:\s*\[([^\]]*)\]/g)) {
      if (match[1].includes("mcp") && !match[1].includes(`"${PUBLIC}"`))
        problems.push(
          `${file}: MCP JSON args use the wrong package: ${match[1].trim()}`,
        );
    }
  }
  const agents = read("docs/agents.md");
  const args = `["-y", "${PUBLIC}", "mcp"]`;
  if (!agents.includes(args))
    problems.push(
      `docs/agents.md: MCP JSON args are not ${args} (still ["-y", "@tony-ui/mortar", "mcp"])`,
    );
  assert.equal(problems.length, 0, problems.join("\n"));
});

test("R7 MCP initialize instructions name the public package", async () => {
  const response = await handleMessage(
    {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "npm-name-test", version: "0" },
      },
    },
    { data: async () => ({ version: "0.0.0" }), log() {} },
  );
  const instructions = response?.result?.instructions ?? "";
  assert.equal(
    instructions.includes(PUBLIC),
    true,
    `MCP instructions do not name ${PUBLIC}. They still say: ${instructions}`,
  );
});

test("R8 audit recognises an installed import of the public package", async (t) => {
  const version = JSON.parse(read("package.json")).version;
  const dir = mkdtempSync(join(tmpdir(), "mortar-public-name-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, "src"), { recursive: true });
  mkdirSync(join(dir, "node_modules", "@tonycodes-ui", "mortar"), {
    recursive: true,
  });
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({
      name: "public-name-fixture",
      private: true,
      dependencies: { [PUBLIC]: ">=0.6.0" },
    }),
  );
  writeFileSync(
    join(dir, "node_modules", "@tonycodes-ui", "mortar", "package.json"),
    JSON.stringify({ name: PUBLIC, version }),
  );
  writeFileSync(
    join(dir, "src", "index.css"),
    '@import "tailwindcss";\n@import "@tonycodes-ui/mortar/styles.css";\n',
  );
  writeFileSync(
    join(dir, "src", "App.tsx"),
    [
      'import { Button, ThemeProvider } from "@tonycodes-ui/mortar";',
      "export function App() {",
      "  return (",
      '    <ThemeProvider brand="neutral" density="comfortable" initialAppearance="system">',
      '      <Button type="button">Save</Button>',
      "    </ThemeProvider>",
      "  );",
      "}",
      "",
    ].join("\n"),
  );
  const report = await auditApp(dir);
  const falsePositives = report.findings
    .filter((finding) =>
      ["not-declared", "not-installed", "missing-styles"].includes(
        finding.rule,
      ),
    )
    .map((finding) => `${finding.rule}: ${finding.message}`);
  assert.deepEqual(
    {
      installed: report.mortar.installed,
      range: report.mortar.range,
      falsePositives,
    },
    { installed: version, range: ">=0.6.0", falsePositives: [] },
    `audit did not recognise installed ${PUBLIC}; it still keys off @tony-ui/mortar (installed=${report.mortar.installed}, range=${String(report.mortar.range)})`,
  );
});

test("R9 npm pack dry-run uses the public name and archive", () => {
  const version = JSON.parse(read("package.json")).version;
  const stdout = execFileSync(
    "npm",
    ["pack", "--dry-run", "--json", "--ignore-scripts"],
    {
      cwd: ROOT,
      encoding: "utf8",
      env: { ...process.env, npm_config_offline: "true" },
    },
  );
  const start = stdout.indexOf("[");
  const packed = JSON.parse(stdout.slice(start))[0];
  const filename = `tonycodes-ui-mortar-${version}.tgz`;
  assert.deepEqual(
    { name: packed.name, filename: packed.filename },
    { name: PUBLIC, filename },
    `npm pack reported name ${packed.name} and filename ${packed.filename}`,
  );
});

test("R10 manifest and catalog package fields are the public name", () => {
  const problems = [];
  const listed = execFileSync(
    "git",
    ["ls-files", "-z", "manifests", "catalog.json"],
    {
      cwd: ROOT,
      encoding: "utf8",
    },
  );
  for (const name of listed.split("\0").filter(Boolean)) {
    const data = JSON.parse(read(name));
    if (data.package !== PUBLIC)
      problems.push(`${name}: package is ${data.package}, not ${PUBLIC}`);
    for (const component of data.components ?? [])
      if (component.package !== PUBLIC)
        problems.push(
          `${name}: ${component.id} package is ${component.package}, not ${PUBLIC}`,
        );
  }
  assert.equal(problems.length, 0, problems.join("\n"));
});
