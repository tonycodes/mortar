import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OLD_HOST = ["ui", "tony", "codes"].join(".");
const ORIGIN = "https://mortar.tony.codes";

function trackedText() {
  const listed = execFileSync("git", ["ls-files", "-z"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  const files = [];
  for (const name of listed.split("\0").filter(Boolean)) {
    if (name === "package-lock.json") continue;
    const bytes = readFileSync(join(ROOT, name));
    if (bytes.subarray(0, 8000).includes(0)) continue;
    files.push({ name, text: bytes.toString("utf8") });
  }
  return files;
}

function environmentUrl(workflow) {
  const lines = workflow.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const header = lines[index].match(/^(\s*)environment:\s*$/);
    if (!header) continue;
    const indent = header[1].length;
    for (let next = index + 1; next < lines.length; next += 1) {
      const line = lines[next];
      if (line.trim() === "") continue;
      if (line.match(/^\s*/)[0].length <= indent) break;
      const url = line.match(/^\s*url:\s+(\S+)\s*$/);
      if (url) return url[1];
    }
  }
  return undefined;
}

test("tracked text omits the retired public host", () => {
  const found = trackedText()
    .filter((file) => file.text.includes(OLD_HOST))
    .map((file) => file.name);
  assert.deepEqual(found, []);
});

test("package homepage is the mortar origin", () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  assert.equal(pkg.homepage, `${ORIGIN}/`);
});

test("README documents the public mortar URLs", () => {
  const readme = readFileSync(join(ROOT, "README.md"), "utf8");
  for (const path of ["/playground/", "/agent.md", "/agent-skill.md", "/mcp"])
    assert.ok(readme.includes(`${ORIGIN}${path}`), `${ORIGIN}${path}`);
});

test("deploy workflow environment url is the public playground", () => {
  const workflow = readFileSync(
    join(ROOT, ".github/workflows/deploy-playground.yml"),
    "utf8",
  );
  assert.equal(environmentUrl(workflow), `${ORIGIN}/playground/`);
});

test("playground receiver checks the public playground", () => {
  const source = readFileSync(join(ROOT, "ops/playground_receiver.py"), "utf8");
  assert.ok(source.includes(`${ORIGIN}/playground/`));
});
