import { appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const stable = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const validSha = (sha) =>
  typeof sha === "string" && /^[a-f0-9]{40}$/i.test(sha);

export function parseCommit(message) {
  const [subject, ...body] = message.split(/\r?\n/);
  const match = /^([a-z]+)(?:\(([^)]+)\))?(!)?:\s+(.+)$/i.exec(subject);
  return {
    type: match ? match[1].toLowerCase() : null,
    scope: match?.[2] ?? null,
    breaking: Boolean(
      match &&
      (match[3] ||
        body.some((line) => /^BREAKING(?: CHANGE|-CHANGE):\s/.test(line))),
    ),
    description: match ? match[4] : subject,
  };
}

export function latestStableTag(names) {
  const tags = names.filter(
    (name) => name.startsWith("v") && stable.test(name.slice(1)),
  );
  tags.sort((a, b) => {
    const left = a.slice(1).split(".").map(Number);
    const right = b.slice(1).split(".").map(Number);
    return left[0] - right[0] || left[1] - right[1] || left[2] - right[2];
  });
  const tag = tags.at(-1);
  return tag ? { tag, version: tag.slice(1) } : null;
}

export function nextVersion(version, messages) {
  if (!stable.test(version)) throw Error("Expected a stable semantic version");
  const [major, minor, patch] = version.split(".").map(Number);
  const parsed = messages.map(parseCommit);
  if (major > 0 && parsed.some((commit) => commit.breaking))
    return `${major + 1}.0.0`;
  if (parsed.some((commit) => commit.breaking || commit.type === "feat"))
    return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

const bumpBetween = (from, to) => {
  if (!from) return null;
  const before = from.split(".");
  const after = to.split(".");
  return before[0] !== after[0]
    ? "major"
    : before[1] !== after[1]
      ? "minor"
      : "patch";
};

// Decides what a run of the release workflow does for the checked main commit.
// `tags[].sha` is the peeled commit sha. `published` lists the versions on npm.
// A commit that already has a release tag is skipped only when that version is
// on npm; otherwise the tag is reused and the publish is resumed.
export function decideRelease({ sha, mainSha, tags, commits, published = [] }) {
  if (!validSha(sha) || !validSha(mainSha))
    throw Error("sha and mainSha must be full commit SHAs");
  const headTags = tags.filter((tag) => tag.sha === sha);
  const headTag = latestStableTag(headTags.map((tag) => tag.name));
  const previous = latestStableTag(
    tags.filter((tag) => tag.sha !== sha).map((tag) => tag.name),
  );
  if (!previous && !headTag) throw Error("A stable release tag is required");
  const skip = (reason) => ({ release: false, reason, version: null });
  if (sha !== mainSha) return skip("superseded");
  if (headTags.length) {
    // Resume only a tag newer than every other release; an older tag on main's
    // head would publish an out-of-order version.
    const newest =
      !previous ||
      latestStableTag([headTag?.tag, previous.tag].filter(Boolean))?.tag ===
        headTag?.tag;
    if (!headTag || !newest || published.includes(headTag.version))
      return skip("head-tagged");
    return {
      release: true,
      reason: "resume",
      version: headTag.version,
      tag: headTag.tag,
      bump: bumpBetween(previous?.version, headTag.version),
      previousTag: previous?.tag ?? null,
    };
  }
  if (!commits.length) return skip("no-commits");
  const version = nextVersion(previous.version, commits);
  // On npm without a tag: never publish over it, and the workflow fails loudly.
  if (published.includes(version)) return skip("npm-published");
  return {
    release: true,
    reason: "release",
    version,
    tag: `v${version}`,
    bump: bumpBetween(previous.version, version),
    previousTag: previous.tag,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const { values } = parseArgs({
      options: Object.fromEntries(
        ["repo", "sha", "main-sha", "published", "github-output"].map((key) => [
          key,
          { type: "string" },
        ]),
      ),
    });
    values.sha = values.sha?.toLowerCase();
    values["main-sha"] = values["main-sha"]?.toLowerCase();
    if (!validSha(values.sha) || !validSha(values["main-sha"]))
      throw Error("--sha and --main-sha must be full commit SHAs");
    const git = (...args) =>
      execFileSync("git", args, {
        cwd: values.repo ?? process.cwd(),
        encoding: "utf8",
      }).trim();
    git("cat-file", "-e", `${values.sha}^{commit}`);
    git("cat-file", "-e", `${values["main-sha"]}^{commit}`);
    const tags = git("tag", "--list")
      .split("\n")
      .filter(Boolean)
      .flatMap((name) => {
        try {
          // Peel annotated tags to the commit they point at.
          return [
            { name, sha: git("rev-parse", "--verify", `${name}^{commit}`) },
          ];
        } catch {
          return [];
        }
      });
    const previous =
      latestStableTag(
        tags.filter((tag) => tag.sha !== values.sha).map((tag) => tag.name),
      ) ?? latestStableTag(tags.map((tag) => tag.name));
    if (!previous) throw Error("A stable release tag is required");
    const hasPrevious = tags.some(
      (tag) => tag.name === previous.tag && tag.sha !== values.sha,
    );
    const range = hasPrevious ? `${previous.tag}..${values.sha}` : values.sha;
    const commits = git("log", "--reverse", "--format=%B%x00", range)
      .split("\0")
      .map((message) => message.trim())
      .filter(Boolean);
    const raw = values.published ?? "";
    const published =
      raw.startsWith("[") || raw.startsWith('"')
        ? [].concat(JSON.parse(raw))
        : raw.split(",").filter(Boolean);
    const result = {
      ...decideRelease({
        sha: values.sha,
        mainSha: values["main-sha"],
        tags,
        commits,
        published,
      }),
      commits,
    };
    if (values["github-output"]) {
      appendFileSync(
        values["github-output"],
        `publish=${result.release}\nreason=${result.reason}\nversion=${result.version ?? ""}\ntag=${result.tag ?? ""}\n`,
      );
    }
    if (result.reason === "npm-published") {
      console.error(
        `::error::Version ${nextVersion(previous.version, commits)} is already on npm but has no tag. Tag the commit it was published from (or deprecate it) before releasing again.`,
      );
    }
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
