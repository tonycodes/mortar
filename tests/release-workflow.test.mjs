import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const workflow = read("../.github/workflows/release.yml");
const pkg = JSON.parse(read("../package.json"));
const [prepare, publish] = workflow.split(/\n  (?=prepare:|publish:)/).slice(1);
const NPMJS = "https://registry.npmjs.org/";

test("releases publish to npmjs.com after main checks pass", () => {
  assert.match(
    workflow,
    /workflow_run:\n\s+workflows: \[Mortar contribution checks\]\n\s+branches: \[main\]/,
  );
  assert.match(workflow, /conclusion == 'success'/);
  assert.match(workflow, /workflow_run\.event == 'push'/);
  assert.equal(pkg.publishConfig.registry, NPMJS);
  assert.equal(pkg.publishConfig.access, "public");
  assert.equal(pkg.publishConfig.provenance, true);
  assert.ok(
    workflow.includes(`REGISTRY: ${pkg.publishConfig.registry}\n`),
    "workflow registry must match publishConfig",
  );
  assert.match(publish, /registry-url: https:\/\/registry\.npmjs\.org\n/);
});

test("publishing uses OIDC trusted publishing, never a long-lived token", () => {
  assert.ok(prepare.startsWith("prepare:") && publish.startsWith("publish:"));
  assert.doesNotMatch(workflow, /secrets\./);
  assert.doesNotMatch(workflow, /NODE_AUTH_TOKEN|_authToken/);
  assert.doesNotMatch(prepare, /id-token/);
  assert.match(publish, /permissions:\n\s+contents: write\n\s+id-token: write/);
  // The trusted publisher on npmjs.com is bound to this environment.
  assert.match(publish, /environment:\n\s+name: npm-release/);
  // Trusted publishing needs npm 11.5.1+, installed at an exact version.
  const npm = workflow.match(/NPM_VERSION: (\d+)\.(\d+)\.(\d+)\n/);
  assert.ok(npm, "NPM_VERSION must be an exact version");
  const [major, minor, patch] = npm.slice(1).map(Number);
  assert.ok(
    major > 11 || (major === 11 && (minor > 5 || (minor === 5 && patch >= 1))),
  );
  assert.match(publish, /npm install -g "npm@\$NPM_VERSION"/);
  assert.match(
    publish,
    /npm publish "\.\/tonycodes-ui-mortar-\$VERSION\.tgz" --registry "\$REGISTRY" --tag "\$DIST_TAG" --provenance --access public/,
  );
});

test("the publish job runs no repository code", () => {
  assert.doesNotMatch(publish, /actions\/checkout/);
  assert.doesNotMatch(publish, /npm (ci|run|exec|test)\b|npx /);
  // The only install is the pinned npm CLI itself.
  for (const line of publish.match(/npm install[^\n]*/g) ?? [])
    assert.equal(line, 'npm install -g "npm@$NPM_VERSION"');
  assert.doesNotMatch(publish, /scripts\//);
  assert.match(prepare, /persist-credentials: false/);
});

test("the published archive is the provenance-checked one and versions are never overwritten", () => {
  assert.match(prepare, /npm run release:prepare/);
  assert.match(prepare, /already published; nothing to release/);
  assert.match(prepare, /grep -q E404/);
  assert.match(prepare, /already belongs to \$TAGGED; nothing to release/);
  assert.match(publish, /Verify the archive against its provenance/);
  assert.match(publish, /already points at/);
  assert.match(publish, /was published by an earlier attempt/);
  assert.match(publish, /DIST_TAG=next/);
  assert.match(publish, /dist\.integrity/);
  assert.match(publish, /differs from provenance/);
  assert.match(publish, /for attempt in 1 2 3 4 5 6 7 8 9 10; do/);
  assert.match(
    prepare,
    /node scripts\/release-notes\.mjs "\$VERSION" > "\$DIR\/notes\.md"/,
  );
  assert.match(publish, /--notes-file notes\.md/);
});
