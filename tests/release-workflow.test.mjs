import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const workflow = read("../.github/workflows/release.yml");
const pkg = JSON.parse(read("../package.json"));
const [prepare, publish] = workflow.split(/\n  (?=prepare:|publish:)/).slice(1);

test("releases publish to the package's own registry after main checks pass", () => {
  assert.match(
    workflow,
    /workflow_run:\n\s+workflows: \[Mortar contribution checks\]\n\s+branches: \[main\]/,
  );
  assert.match(workflow, /conclusion == 'success'/);
  assert.match(workflow, /workflow_run\.event == 'push'/);
  assert.ok(
    workflow.includes(`REGISTRY: ${pkg.publishConfig.registry}\n`),
    "workflow registry must match publishConfig",
  );
});

test("only the publish job sees the registry token, and it runs no repository code", () => {
  assert.ok(prepare.startsWith("prepare:") && publish.startsWith("publish:"));
  assert.doesNotMatch(prepare, /secrets\./);
  assert.match(publish, /environment:\n\s+name: npm-release/);
  assert.match(publish, /secrets\.MORTAR_REGISTRY_TOKEN/);
  assert.doesNotMatch(publish, /actions\/checkout|npm (ci|install|run)/);
  assert.match(prepare, /persist-credentials: false/);
});

test("the published archive is the provenance-checked one and versions are never overwritten", () => {
  assert.match(prepare, /npm run release:prepare/);
  assert.match(prepare, /already published; nothing to release/);
  assert.match(publish, /Verify the archive against its provenance/);
  assert.match(publish, /already points at/);
  assert.match(publish, /npm publish "tony-ui-mortar-\$VERSION\.tgz"/);
  assert.match(publish, /differs from provenance/);
  assert.match(
    prepare,
    /node scripts\/release-notes\.mjs "\$VERSION" > "\$DIR\/notes\.md"/,
  );
  assert.match(publish, /--notes-file notes\.md/);
});
