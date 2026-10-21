import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(ROOT, path), "utf8");
// Retired owner-hosted origins. The old registry is named only in CHANGELOG.md,
// for anyone pinned to 0.11 or earlier. mortar.tony.codes is now the GitHub
// Pages custom domain, not the retired hosted service.
const RETIRED = [["ui", "tony", "codes"].join(".")];
const OLD_REGISTRY = ["git", "tony", "codes"].join(".");
const SITE = "https://mortar.tony.codes/";

function trackedText() {
  const listed = execFileSync("git", ["ls-files", "-z"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  const files = [];
  for (const name of listed.split("\0").filter(Boolean)) {
    if (name === "package-lock.json") continue;
    let bytes;
    try {
      bytes = readFileSync(join(ROOT, name));
    } catch {
      continue; // Deleted in the working tree.
    }
    if (bytes.subarray(0, 8000).includes(0)) continue;
    files.push({ name, text: bytes.toString("utf8") });
  }
  return files;
}

test("tracked text omits the retired hosted origins and old Pages URL", () => {
  const files = trackedText();
  const found = files
    .filter((file) => RETIRED.some((host) => file.text.includes(host)))
    .map((file) => file.name);
  assert.deepEqual(found, []);
  // The site lives on its custom domain; GitHub redirects the github.io URL.
  const oldSite = ["tonycodes", "github", "io/mortar"].join(".");
  assert.deepEqual(
    files.filter((file) => file.text.includes(oldSite)).map((f) => f.name),
    [],
  );
  const registry = files
    .filter((file) => file.text.includes(OLD_REGISTRY))
    .map((file) => file.name);
  assert.deepEqual(registry, ["CHANGELOG.md"]);
});

test("package homepage is the GitHub Pages site", () => {
  assert.equal(JSON.parse(read("package.json")).homepage, SITE);
});

test("README links the GitHub Pages playground and installs from npmjs", () => {
  const readme = read("README.md");
  assert.ok(readme.includes(`${SITE}playground/`));
  assert.match(readme, /npm install @tonycodes-ui\/mortar/);
  assert.doesNotMatch(readme, /npm config set @tony-ui:registry/);
});

test("the Pages site root links the playground", () => {
  assert.match(read("site/index.html"), /href="playground\/"/);
});

test("checks build the Pages site with a relative base on main only", () => {
  const check = read(".github/workflows/check.yml");
  const step = check.slice(
    check.indexOf("- name: Build the GitHub Pages site"),
  );
  assert.match(
    step,
    /if: github\.event_name == 'push' && github\.ref == 'refs\/heads\/main'/,
  );
  assert.match(
    step,
    /npm run build:playground -- --base \.\/ --outDir \.\.\/pages-site\/playground/,
  );
  assert.match(step, /cp site\/index\.html pages-site\/index\.html/);
  assert.match(step, /name: mortar-pages-\$\{\{ github\.sha \}\}/);
  assert.doesNotMatch(check, /secrets\.|pages: write|id-token/);
});

test("Pages deployment publishes the checked artifact and runs no repository code", () => {
  const deploy = read(".github/workflows/deploy-playground.yml");
  assert.match(
    deploy,
    /workflow_run:\n\s+workflows: \[Mortar contribution checks\]\n\s+branches: \[main\]/,
  );
  assert.match(deploy, /conclusion == 'success'/);
  assert.match(deploy, /workflow_run\.event == 'push'/);
  assert.match(deploy, /Superseded run/);
  assert.match(deploy, /select\(\.name == \\"mortar-pages-\$SHA\\"\)/);
  assert.match(deploy, /"\$\(cat "\$SITE\/commit\.txt"\)" = "\$SHA"/);
  assert.match(deploy, /environment:\n\s+name: github-pages/);
  assert.match(deploy, /uses: actions\/upload-pages-artifact@v\d+/);
  assert.match(deploy, /uses: actions\/deploy-pages@v\d+/);
  assert.match(
    deploy,
    /permissions:\n {6}actions: read\n {6}pages: write\n {6}id-token: write/,
  );
  // Workflow-wide permissions stay read-only.
  assert.match(deploy, /^permissions:\n {2}contents: read\n(?! )/m);
  assert.doesNotMatch(
    deploy,
    /actions\/checkout|actions\/setup-node|npm |npx |node |secrets\./,
  );
});
