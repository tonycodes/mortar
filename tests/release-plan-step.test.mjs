import test from "node:test";
import assert from "node:assert/strict";
import {
  chmodSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

// S-1: runs the real `id: plan` step of release.yml against stub gh and npm, so the
// registry error handling is executed, not just pattern-matched. A non-E404 npm
// failure must fail the step; E404 (nothing published yet) must plan from [].

const root = fileURLToPath(new URL("..", import.meta.url));

function planScript() {
  const workflow = readFileSync(
    join(root, ".github/workflows/release.yml"),
    "utf8",
  );
  const lines = workflow.split(/\r?\n/);
  const start = lines.findIndex((line) => /^\s+id: plan\s*$/.test(line));
  assert.ok(start >= 0, "S-1 finds the plan step");
  const run = lines.findIndex(
    (line, index) => index > start && /^\s+run: \|\s*$/.test(line),
  );
  assert.ok(run > start, "S-1 finds the plan step script");
  const indent = lines[run + 1].match(/^\s*/)[0].length;
  const body = [];
  for (const line of lines.slice(run + 1)) {
    if (line.trim() && line.match(/^\s*/)[0].length < indent) break;
    body.push(line.slice(Math.min(indent, line.match(/^\s*/)[0].length)));
  }
  return body.join("\n");
}

function git(dir, ...args) {
  const result = spawnSync("git", args, {
    cwd: dir,
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_CONFIG_GLOBAL: "/dev/null",
      GIT_CONFIG_NOSYSTEM: "1",
    },
  });
  assert.equal(result.status, 0, `git ${args[0]}: ${result.stderr}`);
  return result.stdout.trim();
}

// A repo with release tag v0.11.0 and one unreleased feat commit.
function fixture(t) {
  const dir = mkdtempSync(join(os.tmpdir(), "mortar-plan-step-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  git(dir, "init", "-q", "-b", "main");
  git(dir, "config", "user.email", "t@example.com");
  git(dir, "config", "user.name", "T");
  git(dir, "config", "commit.gpgsign", "false");
  git(dir, "commit", "--allow-empty", "-m", "chore: initial commit");
  git(dir, "tag", "v0.11.0");
  git(dir, "commit", "--allow-empty", "-m", "feat: add panel");
  mkdirSync(join(dir, "scripts"));
  cpSync(
    join(root, "scripts/auto-release"),
    join(dir, "scripts/auto-release"),
    {
      recursive: true,
    },
  );
  const bin = join(dir, "stubs");
  mkdirSync(bin);
  writeFileSync(join(bin, "gh"), '#!/bin/sh\necho "$MAINSHA"\n');
  writeFileSync(
    join(bin, "npm"),
    [
      "#!/bin/sh",
      'if [ "$NPM_MODE" = e404 ]; then echo "npm error code E404" >&2; exit 1; fi',
      'if [ "$NPM_MODE" = boom ]; then echo "npm error network" >&2; exit 1; fi',
      'printf "%s" "$NPM_JSON"',
      "",
    ].join("\n"),
  );
  chmodSync(join(bin, "gh"), 0o755);
  chmodSync(join(bin, "npm"), 0o755);
  return { dir, bin, head: git(dir, "rev-parse", "HEAD") };
}

function runPlan(t, script, mode, json = "") {
  const { dir, bin, head } = fixture(t);
  const temp = join(dir, "runner-temp");
  mkdirSync(temp);
  const output = join(dir, "github-output");
  const summary = join(dir, "summary");
  writeFileSync(output, "");
  writeFileSync(summary, "");
  writeFileSync(join(dir, "plan.sh"), script);
  const result = spawnSync("bash", [join(dir, "plan.sh")], {
    cwd: dir,
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `${bin}:${process.env.PATH}`,
      NODE_TEST_CONTEXT: "",
      GIT_CONFIG_GLOBAL: "/dev/null",
      GIT_CONFIG_NOSYSTEM: "1",
      SHA: head,
      MAINSHA: head,
      REPO: "tonycodes/mortar",
      REGISTRY: "https://registry.npmjs.org/",
      RUNNER_TEMP: temp,
      GITHUB_OUTPUT: output,
      GITHUB_STEP_SUMMARY: summary,
      NPM_MODE: mode,
      NPM_JSON: json,
    },
  });
  return { ...result, outputs: readFileSync(output, "utf8").split(/\r?\n/) };
}

// Each scenario returns an error string, or null when the step behaves correctly.
const scenarios = {
  "non-E404 npm error fails the step": (t, script) => {
    const r = runPlan(t, script, "boom");
    if (r.status === 0) return "step succeeded despite an npm network error";
    if (r.outputs.some((line) => line.startsWith("publish=")))
      return "published a plan despite an npm network error";
    return null;
  },
  "E404 plans from an empty list": (t, script) => {
    const r = runPlan(t, script, "e404");
    if (r.status !== 0) return `E404 failed the step: ${r.stderr}`;
    for (const line of ["publish=true", "version=0.12.0", "tag=v0.12.0"])
      if (!r.outputs.includes(line)) return `E404 plan lacks ${line}`;
    return null;
  },
  "empty npm output fails the step": (t, script) => {
    const r = runPlan(t, script, "ok", "");
    return r.status === 0 ? "step succeeded on empty npm output" : null;
  },
  "a published list plans the next version": (t, script) => {
    const r = runPlan(t, script, "ok", '["0.10.0","0.11.0"]');
    if (r.status !== 0) return `step failed: ${r.stderr}`;
    return r.outputs.includes("version=0.12.0") ? null : "wrong version";
  },
  "a single published version arrives as a bare string": (t, script) => {
    const r = runPlan(t, script, "ok", '"0.11.0"');
    if (r.status !== 0) return `step failed: ${r.stderr}`;
    return r.outputs.includes("version=0.12.0") ? null : "wrong version";
  },
  "next version already on npm fails the step with an error": (t, script) => {
    const r = runPlan(t, script, "ok", '["0.11.0","0.12.0"]');
    if (r.status === 0) return "step succeeded with the next version on npm";
    if (!/^::error::.*0\.12\.0/m.test(r.stdout))
      return "no ::error:: annotation";
    return r.outputs.includes("publish=true") ? "planned a publish" : null;
  },
};

test("S-1 the plan step handles npm registry results correctly", (t) => {
  const script = planScript();
  for (const [name, scenario] of Object.entries(scenarios)) {
    assert.equal(scenario(t, script), null, `S-1 ${name}`);
  }
});

test("S-1 mutants of the npm error handling are caught by the plan step run", (t) => {
  const script = planScript();
  const mutants = {
    "swallow every npm error (grep -q .)": ["grep -q E404", "grep -q ."],
    "swallow every npm error (elif true)": [
      /elif grep -q E404[^\n]*; then/,
      "elif true; then",
    ],
    "change the E404 match": ["grep -q E404", "grep -q E4044"],
    "else branch swallows instead of failing": [
      /else\n(\s+)cat "\$RUNNER_TEMP\/view\.err" >&2\n\s+exit 1/,
      "else\n$1echo '[]' > \"$RUNNER_TEMP/versions.json\"",
    ],
  };
  for (const [name, [from, to]] of Object.entries(mutants)) {
    const mutated = script.replace(from, to);
    assert.notEqual(mutated, script, `S-1 mutant "${name}" applies`);
    const failures = Object.entries(scenarios)
      .map(([scenario, run]) => run(t, mutated))
      .filter(Boolean);
    assert.ok(failures.length > 0, `S-1 mutant survived: ${name}`);
  }
});
