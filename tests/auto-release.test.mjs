import test from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import * as nv from "../scripts/auto-release/next-version.mjs";
import * as changelog from "../scripts/auto-release/changelog.mjs";
import * as tree from "../scripts/auto-release/tree.mjs";
import { changelogSection } from "../scripts/release-notes.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");
const sha = (digit) => digit.repeat(40);
const input = () => ({
  sha: sha("a"),
  mainSha: sha("a"),
  tags: [{ name: "v0.11.0", sha: sha("1") }],
  commits: ["feat: add a component"],
  published: [],
});

function childEnv() {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  env.GIT_CONFIG_GLOBAL = "/dev/null";
  env.GIT_CONFIG_NOSYSTEM = "1";
  return env;
}

function tempDir(t) {
  const dir = mkdtempSync(join(os.tmpdir(), "mortar-auto-release-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function git(dir, id, ...args) {
  const result = spawnSync("git", args, {
    cwd: dir,
    encoding: "utf8",
    env: childEnv(),
  });
  assert.equal(result.status, 0, `${id} git ${args[0]}: ${result.stderr}`);
  return result.stdout.trim();
}

function repo(t, id) {
  const dir = tempDir(t);
  git(dir, id, "init", "-q", "-b", "main");
  git(dir, id, "config", "user.email", "t@example.com");
  git(dir, id, "config", "user.name", "T");
  git(dir, id, "config", "commit.gpgsign", "false");
  git(dir, id, "commit", "--allow-empty", "-m", "chore: initial commit");
  return dir;
}

function cli(script, args) {
  return spawnSync(process.execPath, [join(root, script), ...args], {
    encoding: "utf8",
    env: childEnv(),
  });
}

function planArgs(dir, head, main = head) {
  return ["--repo", dir, "--sha", head, "--main-sha", main];
}

function assertSkip(result, reason, id) {
  assert.equal(result.release, false, `${id} skip does not release`);
  assert.equal(result.reason, reason, `${id} skip reason`);
  assert.equal(result.version, null, `${id} skip has no version`);
}

function assertOrder(text, commands, id) {
  let previous = -1;
  for (const command of commands) {
    const index = text.indexOf(command);
    assert.ok(index >= 0, `${id} contains ${command}`);
    assert.ok(index > previous, `${id} orders ${command}`);
    previous = index;
  }
}

test("R-AR-1 parseCommit recognises conventional subjects and breaking footers", () => {
  for (const type of [
    "feat",
    "fix",
    "chore",
    "docs",
    "ci",
    "refactor",
    "test",
    "perf",
    "build",
    "revert",
  ]) {
    for (const scope of [null, "button", "#68"]) {
      const subject = `${type}${scope ? `(${scope})` : ""}: improve it (#70)`;
      assert.deepEqual(
        nv.parseCommit(`${subject}\n\nFull explanatory body.`),
        { type, scope, breaking: false, description: "improve it (#70)" },
        `R-AR-1 parses ${subject}`,
      );
    }
  }
  for (const message of [
    "feat(x)!: replace API",
    "feat!: replace API",
    "fix: replace API\n\nBREAKING CHANGE: remove the old prop",
    "fix: replace API\n\nBREAKING-CHANGE: remove the old prop",
  ]) {
    assert.equal(
      nv.parseCommit(message).breaking,
      true,
      "R-AR-1 breaking syntax",
    );
  }
  for (const message of [
    "docs: explain BREAKING CHANGE: syntax",
    "docs: explain BREAKING-CHANGE: syntax",
    "docs: guide\n\nThis explains BREAKING CHANGE: syntax in a sentence.",
    "docs: guide\n\nThis explains BREAKING-CHANGE: syntax in a sentence.",
  ]) {
    assert.equal(
      nv.parseCommit(message).breaking,
      false,
      "R-AR-1 ordinary words",
    );
  }
  assert.deepEqual(
    nv.parseCommit("Feat: add a panel"),
    { type: "feat", scope: null, breaking: false, description: "add a panel" },
    "R-AR-1 normalises type case",
  );
  for (const message of [
    "Merge pull request #66 from topic",
    "Some free text",
  ]) {
    const parsed = nv.parseCommit(message);
    assert.equal(parsed.type, null, "R-AR-1 non-conventional type");
    assert.equal(
      parsed.breaking,
      false,
      "R-AR-1 non-conventional not breaking",
    );
  }
});

test("R-AR-2 nextVersion uses minor for pre-1.0 features and breaking changes", () => {
  for (const [version, messages, expected] of [
    ["0.11.0", ["feat: add panel"], "0.12.0"],
    ["0.11.0", ["fix: repair panel"], "0.11.1"],
    ["0.11.0", ["feat!: replace panel"], "0.12.0"],
    ["0.11.0", ["fix: update\n\nBREAKING CHANGE: remove API"], "0.12.0"],
    ["0.11.5", ["feat: add panel"], "0.12.0"],
    ["0.11.0", ["chore: tidy", "fix: repair", "feat: add"], "0.12.0"],
    [
      "0.11.0",
      ["docs: guide", "ci: checks", "Merge pull request #66"],
      "0.11.1",
    ],
    ["0.0.9", ["feat: add panel"], "0.1.0"],
  ]) {
    assert.equal(
      nv.nextVersion(version, messages),
      expected,
      `R-AR-2 ${version} + ${messages.join(", ")} -> ${expected}`,
    );
  }
});

test("R-AR-3 nextVersion uses major for breaking changes at or above 1.0", () => {
  for (const [message, expected] of [
    ["feat: add panel", "1.3.0"],
    ["fix: repair panel", "1.2.4"],
    ["feat!: replace panel", "2.0.0"],
    ["fix: update\n\nBREAKING CHANGE: remove API", "2.0.0"],
  ]) {
    assert.equal(
      nv.nextVersion("1.2.3", [message]),
      expected,
      `R-AR-3 1.2.3 + ${message} -> ${expected}`,
    );
  }
});

test("R-AR-4 latestStableTag sorts numerically and ignores other names", () => {
  const stable = ["v0.9.0", "v0.10.0", "v0.11.0"];
  const ignored = ["v1.0.0-rc.1", "latest", "0.12.0", "v1.0", "release-3"];
  for (const names of [stable, [...ignored, ...stable].reverse()]) {
    assert.deepEqual(
      nv.latestStableTag(names),
      { tag: "v0.11.0", version: "0.11.0" },
      "R-AR-4 latest stable tag is numeric",
    );
  }
  assert.equal(
    nv.latestStableTag(ignored),
    null,
    "R-AR-4 ignores non-stable tags",
  );
  assert.equal(nv.latestStableTag([]), null, "R-AR-4 empty list");
});

test("R-AR-5 decideRelease skips stale, tagged and empty runs and validates inputs", () => {
  assertSkip(
    nv.decideRelease({ ...input(), mainSha: sha("b") }),
    "superseded",
    "R-AR-5",
  );
  for (const name of ["v0.11.0", "v0.8.0", "v1.0.0-rc.1"]) {
    const data = input();
    data.tags = data.tags.filter((tag) => tag.name !== name);
    data.tags.push({ name, sha: data.sha });
    assertSkip(nv.decideRelease(data), "head-tagged", "R-AR-5");
  }
  assertSkip(
    nv.decideRelease({ ...input(), commits: [] }),
    "no-commits",
    "R-AR-5",
  );
  for (const key of ["sha", "mainSha"]) {
    for (const value of ["", "abc", "g".repeat(40), "a".repeat(39)]) {
      assert.throws(
        () => nv.decideRelease({ ...input(), [key]: value }),
        `R-AR-5 rejects invalid ${key}`,
      );
    }
  }
  assert.throws(
    () => nv.decideRelease({ ...input(), tags: [] }),
    "R-AR-5 requires a stable tag",
  );
});

test("R-AR-6 decideRelease computes real releases without mutating inputs", () => {
  const data = {
    ...input(),
    tags: [
      { name: "v0.8.0", sha: sha("1") },
      { name: "v0.9.0", sha: sha("2") },
      { name: "v0.10.0", sha: sha("3") },
      { name: "v0.11.0", sha: sha("4") },
    ],
    commits: [
      "feat(#68): landing-page composition (#69)\n\nAdd MarketingPage and hero emphasis.",
      "feat(#68): NetworkIllustration (#70)\n\nDraw connected nodes with motion controls.",
      "ci: raise check timeout (#71)\n\nAllow the complete browser suite to finish.",
    ],
  };
  const before = structuredClone(data);
  const result = nv.decideRelease(data);
  assert.deepEqual(
    result,
    {
      release: true,
      reason: "release",
      version: "0.12.0",
      tag: "v0.12.0",
      bump: "minor",
      previousTag: "v0.11.0",
    },
    "R-AR-6 real scenario releases 0.12.0",
  );
  assert.deepEqual(data, before, "R-AR-6 inputs are unchanged");
  assert.deepEqual(
    nv.decideRelease(data),
    result,
    "R-AR-6 deterministic result",
  );
  const patch = nv.decideRelease({ ...data, commits: ["fix: repair focus"] });
  assert.equal(patch.version, "0.11.1", "R-AR-6 fix-only version");
  assert.equal(patch.bump, "patch", "R-AR-6 fix-only bump");
});

test("R-AR-7 decideRelease guards npm versions and concurrent merges", () => {
  assertSkip(
    nv.decideRelease({ ...input(), published: ["0.12.0"] }),
    "npm-published",
    "R-AR-7",
  );
  const a = nv.decideRelease({ ...input(), published: ["0.10.0", "0.11.0"] });
  assert.equal(a.release, true, "R-AR-7 unrelated published versions allow A");
  assert.equal(a.version, "0.12.0", "R-AR-7 merge A feature version");
  const b = {
    ...input(),
    sha: sha("b"),
    mainSha: sha("b"),
    tags: [...input().tags, { name: "v0.12.0", sha: sha("a") }],
    commits: ["fix: repair focus"],
    published: ["0.12.0"],
  };
  const result = nv.decideRelease(b);
  assert.equal(result.release, true, "R-AR-7 merge B releases");
  assert.equal(result.version, "0.12.1", "R-AR-7 B increments A's tag");
  assert.equal(result.previousTag, "v0.12.0", "R-AR-7 B uses latest tag");
  assertSkip(
    nv.decideRelease({
      ...b,
      tags: [...input().tags, { name: "v0.12.0", sha: b.sha }],
    }),
    "head-tagged",
    "R-AR-7",
  );
});

test("R-AR-8 CLI releases from annotated and lightweight tags with full messages", (t) => {
  for (const annotated of [false, true]) {
    const dir = repo(t, "R-AR-8");
    git(
      dir,
      "R-AR-8",
      "commit",
      "--allow-empty",
      "-m",
      "feat!: before the tag",
    );
    git(
      dir,
      "R-AR-8",
      "tag",
      ...(annotated ? ["-a", "v0.11.0", "-m", "x"] : ["v0.11.0"]),
    );
    const subject = "feat: add a panel (#70)";
    const body = "Keep this full body.\nIt spans more than one line.";
    git(dir, "R-AR-8", "commit", "--allow-empty", "-m", subject, "-m", body);
    const head = git(dir, "R-AR-8", "rev-parse", "HEAD");
    const output = join(dir, "github-output");
    writeFileSync(output, "existing=value\n");
    const result = cli("scripts/auto-release/next-version.mjs", [
      ...planArgs(dir, head),
      "--github-output",
      output,
    ]);
    assert.equal(result.status, 0, `R-AR-8 CLI succeeds: ${result.stderr}`);
    const decision = JSON.parse(result.stdout);
    assert.equal(decision.release, true, "R-AR-8 releases");
    assert.equal(decision.version, "0.12.0", "R-AR-8 feature version");
    assert.equal(decision.previousTag, "v0.11.0", "R-AR-8 peels tag");
    assert.deepEqual(
      decision.commits.map((message) => message.trim()),
      [`${subject}\n\n${body}`],
      "R-AR-8 only full messages after the tag",
    );
    const lines = readFileSync(output, "utf8").split(/\r?\n/);
    for (const line of [
      "existing=value",
      "version=0.12.0",
      "tag=v0.12.0",
      "publish=true",
      "reason=release",
    ]) {
      assert.ok(lines.includes(line), `R-AR-8 appends ${line}`);
    }
    git(dir, "R-AR-8", "tag", "v1.0.0");
    git(
      dir,
      "R-AR-8",
      "commit",
      "--allow-empty",
      "-m",
      "fix: replace API",
      "-m",
      "BREAKING CHANGE: remove old API",
    );
    const breakingHead = git(dir, "R-AR-8", "rev-parse", "HEAD");
    const breaking = cli(
      "scripts/auto-release/next-version.mjs",
      planArgs(dir, breakingHead),
    );
    assert.equal(breaking.status, 0, `R-AR-8 breaking CLI: ${breaking.stderr}`);
    const major = JSON.parse(breaking.stdout);
    assert.equal(major.version, "2.0.0", "R-AR-8 breaking body causes major");
    assert.equal(
      major.commits.length,
      1,
      "R-AR-8 excludes all pre-tag commits",
    );
    assert.match(
      major.commits[0],
      /BREAKING CHANGE: remove old API/,
      "R-AR-8 retains footer",
    );
  }
});

test("R-AR-9 CLI skips tagged, superseded, published and empty runs", (t) => {
  for (const reason of [
    "head-tagged",
    "superseded",
    "npm-published",
    "no-commits",
  ]) {
    const dir = repo(t, "R-AR-9");
    git(dir, "R-AR-9", "tag", "v0.11.0");
    const base = git(dir, "R-AR-9", "rev-parse", "HEAD");
    let head = base;
    let main = base;
    if (reason !== "head-tagged" && reason !== "no-commits") {
      git(dir, "R-AR-9", "commit", "--allow-empty", "-m", "feat: add panel");
      head = git(dir, "R-AR-9", "rev-parse", "HEAD");
      main = head;
    }
    if (reason === "superseded") {
      git(dir, "R-AR-9", "commit", "--allow-empty", "-m", "fix: later merge");
      main = git(dir, "R-AR-9", "rev-parse", "HEAD");
    }
    if (reason === "no-commits") {
      // A tag ahead of the requested SHA leaves tag..SHA empty without tagging SHA.
      git(dir, "R-AR-9", "tag", "-d", "v0.11.0");
      git(
        dir,
        "R-AR-9",
        "commit",
        "--allow-empty",
        "-m",
        "chore: later baseline",
      );
      git(dir, "R-AR-9", "tag", "v0.11.0");
    }
    const output = join(dir, "github-output");
    const result = cli("scripts/auto-release/next-version.mjs", [
      ...planArgs(dir, head, main),
      "--published",
      reason === "npm-published" ? "0.10.0,0.12.0" : "0.10.0",
      "--github-output",
      output,
    ]);
    assert.equal(result.status, 0, `R-AR-9 ${reason}: ${result.stderr}`);
    assertSkip(JSON.parse(result.stdout), reason, "R-AR-9");
    const text = readFileSync(output, "utf8");
    assert.match(text, /^publish=false\r?$/m, "R-AR-9 publish false");
    assert.match(
      text,
      new RegExp(`^reason=${reason}\\r?$`, "m"),
      "R-AR-9 output reason",
    );
    assert.doesNotMatch(text, /^version=\S+/m, "R-AR-9 no version value");
  }
});

test("R-AR-10 CLI rejects bad inputs without appending GitHub outputs", (t) => {
  const dir = repo(t, "R-AR-10");
  git(dir, "R-AR-10", "tag", "v0.11.0");
  git(dir, "R-AR-10", "commit", "--allow-empty", "-m", "fix: repair panel");
  const head = git(dir, "R-AR-10", "rev-parse", "HEAD");
  // A valid control prevents a CLI that always throws from satisfying error tests.
  const valid = cli(
    "scripts/auto-release/next-version.mjs",
    planArgs(dir, head),
  );
  assert.equal(valid.status, 0, `R-AR-10 valid control: ${valid.stderr}`);
  const untagged = repo(t, "R-AR-10");
  const untaggedHead = git(untagged, "R-AR-10", "rev-parse", "HEAD");
  const cases = [
    planArgs(dir, "bad-sha", head),
    planArgs(dir, sha("f"), head),
    ["--repo", dir, "--main-sha", head],
    planArgs(untagged, untaggedHead),
  ];
  for (const args of cases) {
    const output = join(dir, "github-output");
    writeFileSync(output, "existing=value\n");
    const result = cli("scripts/auto-release/next-version.mjs", [
      ...args,
      "--github-output",
      output,
    ]);
    assert.ok(
      Number.isInteger(result.status) && result.status !== 0,
      "R-AR-10 non-zero exit",
    );
    assert.ok(result.stderr.trim(), "R-AR-10 explains error on stderr");
    assert.equal(
      readFileSync(output, "utf8"),
      "existing=value\n",
      "R-AR-10 output untouched",
    );
  }
});

test("R-AR-11 promoteUnreleased renames a section and preserves its body", () => {
  const source = `# Changelog

Mortar release history.

## Unreleased

### Added

- A panel.
  A continuation with two spaces.
  Another continuation.

## 0.11.0 (2026-10-20)

### Added

- Existing component.
`;
  const result = changelog.promoteUnreleased(source, "0.12.0", "2026-10-27");
  assert.equal(
    result,
    source.replace("## Unreleased", "## 0.12.0 (2026-10-27)"),
    "R-AR-11 only the heading changes",
  );
  assert.equal(
    changelogSection(result, "0.12.0"),
    changelogSection(source, "Unreleased"),
    "R-AR-11 release notes preserve the body",
  );
  assert.doesNotMatch(
    result,
    /^## Unreleased\s*$/m,
    "R-AR-11 no Unreleased remains",
  );
});

test("R-AR-12 promoteUnreleased merges repeated sections and groups in order", () => {
  const source = `# Changelog

Mortar release history.

## Unreleased

### Added

- First panel.
  Its continuation stays attached.
  More detail stays attached too.

### Changed

- First adjustment.

## Unreleased

### Added

- Second panel.

### Changed

- Second adjustment.

## Unreleased

### Added

- Third panel.

## 0.11.0 (2026-10-20)

### Added

- Existing component.
`;
  const result = changelog.promoteUnreleased(source, "0.12.0", "2026-10-27");
  const notes = changelogSection(result, "0.12.0");
  assert.equal(
    (result.match(/^## 0\.12\.0\b/gm) ?? []).length,
    1,
    "R-AR-12 one release section",
  );
  assert.doesNotMatch(
    result,
    /^## Unreleased\s*$/m,
    "R-AR-12 no Unreleased remains",
  );
  assert.deepEqual(
    notes.match(/^### .+$/gm),
    ["### Added", "### Changed"],
    "R-AR-12 groups once in first-seen order",
  );
  assert.deepEqual(
    notes.match(/^- .+$/gm),
    [
      "- First panel.",
      "- Second panel.",
      "- Third panel.",
      "- First adjustment.",
      "- Second adjustment.",
    ],
    "R-AR-12 all entries in their group order",
  );
  assert.ok(
    notes.includes(
      "- First panel.\n  Its continuation stays attached.\n  More detail stays attached too.",
    ),
    "R-AR-12 continuation preserved",
  );
  const older = source.slice(source.indexOf("## 0.11.0"));
  assert.ok(result.endsWith(older), "R-AR-12 older section untouched");
});

test("R-AR-13 promoteUnreleased subtracts complete previous entries", () => {
  const source = `# Changelog

Mortar release history.

## Unreleased

### Added

- Existing panel.
  Existing detail.
  Another existing detail.
- New panel.
  New detail.

### Changed

- Existing adjustment.

## Unreleased

### Added

- Second new panel.

## Unreleased

### Added

- Third new panel.

## 0.11.0 (2026-10-20)

### Added

- Older component.
`;
  const previous = `# Changelog

Mortar release history.

## Unreleased

### Added

- Existing panel.
  Existing detail.
  Another existing detail.

## Unreleased

### Changed

- Existing adjustment.

## Unreleased

### Added

- Some other old entry.

## 0.11.0 (2026-10-20)

### Added

- Older component.
`;
  const result = changelog.promoteUnreleased(source, "0.12.0", "2026-10-27", {
    previous,
  });
  const notes = changelogSection(result, "0.12.0");
  assert.doesNotMatch(
    notes,
    /Existing|existing|### Changed/,
    "R-AR-13 old entries and empty group removed",
  );
  assert.ok(
    notes.includes("- New panel.\n  New detail."),
    "R-AR-13 new complete entry retained",
  );
  assert.match(notes, /Second new panel/, "R-AR-13 second section retained");
  assert.match(notes, /Third new panel/, "R-AR-13 third section retained");
  const older = source.slice(source.indexOf("## 0.11.0"));
  assert.ok(result.endsWith(older), "R-AR-13 older section untouched");
  const retained = changelogSection(
    changelog.promoteUnreleased(source, "0.12.0", "2026-10-27", {
      previous: `# Changelog\n\n${older}`,
    }),
    "0.12.0",
  );
  for (const entry of source.match(/^- .+$/gm).slice(0, -1)) {
    assert.ok(
      retained.includes(entry),
      `R-AR-13 no previous Unreleased keeps ${entry}`,
    );
  }
});

test("R-AR-14 promoteUnreleased generates nonempty grouped commit notes", () => {
  const source = `# Changelog

Mortar release history.

## Unreleased

### Added

- Existing panel.
  Existing detail.

## Unreleased

### Added

- Existing second panel.

## Unreleased

### Added

- Existing third panel.

## 0.11.0 (2026-10-20)

### Added

- Older component.
`;
  const commits = [
    "feat: new panel (#70)",
    "feat!: replacement panel",
    "fix: repair focus",
    "fix: replace focus\n\nBREAKING CHANGE: focus API changed",
    "docs: explain usage",
    "ci: speed checks",
    "chore: tidy files",
    "Free text maintenance",
    "Merge pull request #66 from topic",
  ];
  for (const current of [
    source,
    `# Changelog\n\n${source.slice(source.indexOf("## 0.11.0"))}`,
  ]) {
    const result = changelog.promoteUnreleased(
      current,
      "0.12.0",
      "2026-10-27",
      {
        previous: source,
        commits,
      },
    );
    const notes = changelogSection(result, "0.12.0");
    assert.ok(notes.trim(), "R-AR-14 nonempty readable release notes");
    assert.match(
      result,
      /^## 0\.12\.0 \(2026-10-27\)$/m,
      "R-AR-14 generated heading",
    );
    const group = (name) =>
      notes.split(`### ${name}\n`)[1]?.split(/^### /m)[0] ?? "";
    assert.match(
      group("Added"),
      /new panel \(#70\)/,
      "R-AR-14 feat and PR suffix",
    );
    assert.match(
      group("Added"),
      /\*\*Breaking:\*\*[^\n]*replacement panel/,
      "R-AR-14 bang prefix",
    );
    assert.match(group("Fixed"), /repair focus/, "R-AR-14 fixes grouped");
    assert.match(
      group("Fixed"),
      /\*\*Breaking:\*\*[^\n]*replace focus/,
      "R-AR-14 footer prefix",
    );
    for (const description of [
      "explain usage",
      "speed checks",
      "tidy files",
      "Free text maintenance",
    ]) {
      assert.ok(
        group("Changed").includes(description),
        `R-AR-14 Changed contains ${description}`,
      );
    }
    assert.doesNotMatch(
      notes,
      /Merge pull request|Existing panel/,
      "R-AR-14 skips merges and previous entries",
    );
  }
});

test("R-AR-15 unexpectedChanges allows only release-generated paths", () => {
  const allowed =
    " M package.json\n M package-lock.json\n M catalog.json\n M manifests/button.json\n M CHANGELOG.md\n";
  assert.deepEqual(
    tree.unexpectedChanges(allowed),
    [],
    "R-AR-15 allows release files",
  );
  const paths = [
    "src/Button.tsx",
    "notes.txt",
    ".github/workflows/release.yml",
    "scripts/release.mjs",
    "manifests/sub/x.json",
  ];
  const status = paths
    .map((path) => `${path === "notes.txt" ? "??" : " M"} ${path}`)
    .join("\n");
  assert.deepEqual(
    tree.unexpectedChanges(allowed + status).sort(),
    [...paths].sort(),
    "R-AR-15 reports unexpected paths",
  );
  const renamed = tree.unexpectedChanges("R  a -> b\n");
  assert.ok(renamed.length > 0, "R-AR-15 reports rename");
  assert.ok(
    renamed.some((path) => /\bb\b/.test(path)),
    "R-AR-15 rename identifies destination",
  );
  assert.deepEqual(
    tree.unexpectedChanges(" D src/Old.tsx\nD  notes.txt\n").sort(),
    ["notes.txt", "src/Old.tsx"],
    "R-AR-15 reports deleted unexpected paths",
  );
  assert.deepEqual(tree.unexpectedChanges(""), [], "R-AR-15 blank status");
});

test("R-AR-16 release.yml computes and applies the version before preparation", () => {
  const workflow = read(".github/workflows/release.yml");
  const [prepare] = workflow.split(/\n  (?=prepare:|publish:)/).slice(1);
  assert.match(
    prepare,
    /actions\/checkout@[^\n]+\n(?:(?!\s+- (?:name:|uses:)).*\n)*?\s+fetch-depth: 0\b/,
    "R-AR-16 checkout fetches tags",
  );
  assert.match(
    prepare,
    /github\.event\.workflow_run\.head_sha/,
    "R-AR-16 uses checked SHA",
  );
  assert.match(prepare, /--sha\s+\S+/, "R-AR-16 passes sha");
  assert.match(prepare, /--main-sha\s+\S+/, "R-AR-16 passes current main sha");
  assert.match(
    prepare,
    /--published\s+\S+/,
    "R-AR-16 passes published versions",
  );
  assert.match(
    prepare,
    /npm view[^\n]*\bversions\b/,
    "R-AR-16 reads npm versions",
  );
  assert.match(
    prepare,
    /(?:git\/ref\/heads\/main|git ls-remote[^\n]*main|git rev-parse[^\n]*main)/,
    "R-AR-16 resolves current main",
  );
  assertOrder(
    prepare,
    [
      "node scripts/auto-release/next-version.mjs",
      'npm version "$VERSION" --no-git-tag-version',
      "npm run catalog",
      "node scripts/auto-release/changelog.mjs",
      "npm run release:prepare",
    ],
    "R-AR-16",
  );
  assert.doesNotMatch(
    prepare,
    /carries an unpublished version|require\(["']\.\/package\.json["']\)\.version/,
    "R-AR-16 removes package-version decision",
  );
});

test("R-AR-17 release.yml retains credential isolation and serialized publishing", () => {
  const workflow = read(".github/workflows/release.yml");
  const [prepare, publish] = workflow
    .split(/\n  (?=prepare:|publish:)/)
    .slice(1);
  assert.doesNotMatch(
    workflow,
    /\bgit\s+(?:push|commit|tag|config)\b|secrets\./,
    "R-AR-17 no git writes or secrets",
  );
  const triggers = workflow.match(/^on:\s*\n([\s\S]*?)(?=^\S)/m)?.[1] ?? "";
  assert.deepEqual(
    triggers.match(/^  [\w-]+:/gm),
    ["  workflow_run:"],
    "R-AR-17 only workflow_run trigger",
  );
  assert.match(
    triggers,
    /workflows:\s*\[Mortar contribution checks\]/,
    "R-AR-17 contribution checks",
  );
  assert.match(triggers, /branches:\s*\[main\]/, "R-AR-17 main only");
  assert.match(triggers, /types:\s*\[completed\]/, "R-AR-17 completed checks");
  assert.match(
    prepare,
    /workflow_run\.conclusion\s*==\s*'success'/,
    "R-AR-17 success only",
  );
  assert.match(
    prepare,
    /workflow_run\.event\s*==\s*'push'/,
    "R-AR-17 push only",
  );
  assert.match(
    prepare,
    /workflow_run\.head_branch\s*==\s*'main'/,
    "R-AR-17 checks main head",
  );
  assert.match(
    workflow,
    /^permissions:\n  contents: read\s*$/m,
    "R-AR-17 top-level read permission",
  );
  assert.match(
    workflow,
    /^concurrency:\n  group: npm-release\n  cancel-in-progress: false/m,
    "R-AR-17 serialized non-cancelled releases",
  );
  assert.doesNotMatch(
    prepare,
    /id-token|contents:\s*write/,
    "R-AR-17 prepare has no publishing permissions",
  );
  assert.match(
    publish,
    /contents:\s*write/,
    "R-AR-17 publish can create release",
  );
  assert.match(publish, /id-token:\s*write/, "R-AR-17 trusted publishing OIDC");
  assert.match(
    publish,
    /environment:\s*(?:\n\s+name:\s*)?npm-release\b/,
    "R-AR-17 protected environment",
  );
  assert.doesNotMatch(
    publish,
    /actions\/checkout/,
    "R-AR-17 publish never checks out",
  );
  assert.deepEqual(
    readdirSync(join(root, ".github/workflows")).sort(),
    [
      "check.yml",
      "deploy-playground.yml",
      "release.yml",
      "visual-candidates.yml",
    ].sort(),
    "R-AR-17 exactly four workflow files",
  );
});

test("R-AR-18 release.mjs checks unexpected changes and retains provenance", () => {
  const script = read("scripts/release.mjs");
  assert.match(
    script,
    /import\s*\{[^}]*\bunexpectedChanges\b[^}]*\}\s*from\s*["']\.\/auto-release\/tree\.mjs["']/,
    "R-AR-18 imports shared tree guard",
  );
  assert.match(
    script,
    /unexpectedChanges\s*\(/,
    "R-AR-18 calls shared tree guard",
  );
  assert.match(
    script,
    /throw\s+(?:new\s+)?Error\(\s*["']Release requires a clean checkout\.["']\s*,?\s*\)/,
    "R-AR-18 retains clean-checkout error",
  );
  assert.match(script, /await checkKit\(\)/, "R-AR-18 still checks kit");
  assert.match(
    script,
    /if\s*\(!report\.passed\)/,
    "R-AR-18 check failure still guarded",
  );
  assert.match(
    script,
    /const provenance\s*=\s*\{/,
    "R-AR-18 records provenance",
  );
  assert.match(
    script,
    /writeFile\([\s\S]*["']provenance\.json["'][\s\S]*JSON\.stringify\(provenance/,
    "R-AR-18 writes provenance record",
  );
});

test("R-AR-19 CONTRIBUTING.md documents automatic conventional-commit releases", () => {
  const text = read("CONTRIBUTING.md").toLowerCase().replace(/\s+/g, " ");
  assert.match(
    text,
    /(?:every|each|all) merge[^.]*main[^.]*automatic|automatic[^.]*releas[^.]*every merge[^.]*main/,
    "R-AR-19 every main merge releases automatically",
  );
  assert.match(text, /\bfeat\b/, "R-AR-19 feature rule");
  assert.match(text, /\bbreaking\b/, "R-AR-19 breaking rule");
  assert.match(text, /\bminor\b/, "R-AR-19 minor bump rule");
  assert.match(text, /\bpatch\b/, "R-AR-19 patch rule");
  assert.match(
    text,
    /pre[- ]1\.0|before (?:version )?1\.0|below 1\.0|0\.x/,
    "R-AR-19 pre-1.0 rule",
  );
  assert.match(
    text,
    /tag[^.]*github release[^.]*source(?:s)? of truth|source(?:s)? of truth[^.]*tag[^.]*github release|github release[^.]*tag[^.]*source(?:s)? of truth/,
    "R-AR-19 tags and releases are authoritative",
  );
  assert.match(
    text,
    /(?:ci|workflow)[^.]*\b(?:never|does not|doesn't|without)[^.]*commit[^.]*main/,
    "R-AR-19 CI does not commit to main",
  );
  for (const phrase of [
    /agents must not open or merge version bumps/i,
    /to release, merge a pr that bumps the version/i,
    /merges that do not change the version publish nothing/i,
  ]) {
    assert.doesNotMatch(
      text,
      phrase,
      "R-AR-19 obsolete version-bump guidance removed",
    );
  }
});

test("R-AR-20 changelog CLI promotes in place and preserves files on input errors", (t) => {
  const dir = tempDir(t);
  const file = join(dir, "CHANGELOG.md");
  const plan = join(dir, "plan.json");
  const previousFile = join(dir, "previous.md");
  const source = `# Changelog

Mortar release history.

## Unreleased

### Added

- Existing panel.
  Existing detail.

## Unreleased

### Added

- Second panel.

## Unreleased

### Added

- Third panel.

## 0.11.0 (2026-10-20)

### Added

- Older component.
`;
  const data = { version: "0.12.0", commits: ["feat: generated panel (#70)"] };
  writeFileSync(plan, JSON.stringify(data));
  writeFileSync(previousFile, source);
  for (const withPrevious of [false, true]) {
    writeFileSync(file, source);
    const result = cli("scripts/auto-release/changelog.mjs", [
      "--file",
      file,
      "--plan",
      plan,
      "--date",
      "2026-10-27",
      ...(withPrevious ? ["--previous-file", previousFile] : []),
    ]);
    assert.equal(result.status, 0, `R-AR-20 CLI succeeds: ${result.stderr}`);
    const expected = changelog.promoteUnreleased(
      source,
      data.version,
      "2026-10-27",
      {
        previous: withPrevious ? source : "",
        commits: data.commits,
      },
    );
    assert.equal(
      readFileSync(file, "utf8"),
      expected,
      "R-AR-20 same result as API",
    );
    assert.ok(
      changelogSection(expected, data.version),
      "R-AR-20 readable notes",
    );
  }
  for (const args of [
    ["--file", file, "--date", "2026-10-27"],
    [
      "--file",
      file,
      "--plan",
      join(dir, "missing-plan.json"),
      "--date",
      "2026-10-27",
    ],
    ["--plan", plan, "--date", "2026-10-27"],
    ["--file", join(dir, "missing.md"), "--plan", plan, "--date", "2026-10-27"],
  ]) {
    writeFileSync(file, source);
    const result = cli("scripts/auto-release/changelog.mjs", args);
    assert.ok(
      Number.isInteger(result.status) && result.status !== 0,
      "R-AR-20 missing input fails",
    );
    assert.equal(
      readFileSync(file, "utf8"),
      source,
      "R-AR-20 existing file untouched",
    );
    assert.equal(
      existsSync(join(dir, "missing.md")),
      false,
      "R-AR-20 missing file not created",
    );
  }
});
