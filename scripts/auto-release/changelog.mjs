import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { parseCommit } from "./next-version.mjs";

function sections(text) {
  const headings = [...text.matchAll(/^## .+\r?$/gm)];
  return headings.map((heading, index) => ({
    start: heading.index,
    end: headings[index + 1]?.index ?? text.length,
    unreleased: /^## Unreleased\s*$/.test(heading[0]),
    body: text.slice(
      heading.index + heading[0].length,
      headings[index + 1]?.index ?? text.length,
    ),
  }));
}

function groups(text) {
  const result = new Map();
  for (const section of sections(text).filter(
    (section) => section.unreleased,
  )) {
    let group = "";
    let entry = [];
    const flush = () => {
      const value = entry.join("\n").trimEnd();
      if (value.trim()) {
        if (!result.has(group)) result.set(group, []);
        result.get(group).push(value);
      }
      entry = [];
    };
    for (const line of section.body.replace(/\r\n/g, "\n").split("\n")) {
      if (/^### /.test(line)) {
        flush();
        group = line.slice(4).trim();
      } else if (/^[-*+] /.test(line)) {
        flush();
        entry.push(line);
      } else if (entry.length || line.trim()) {
        entry.push(line);
      }
    }
    flush();
  }
  return result;
}

export function promoteUnreleased(
  changelog,
  version,
  date,
  { previous = "", commits = [] } = {},
) {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version))
    throw Error("A stable version is required");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(date)) ||
    new Date(date).toISOString().slice(0, 10) !== date
  )
    throw Error("A valid YYYY-MM-DD date is required");
  const all = sections(changelog);
  const unreleased = all.filter((section) => section.unreleased);
  const heading = `## ${version} (${date})`;
  if (unreleased.length === 1 && !previous && unreleased[0].body.trim()) {
    return changelog.replace(/^## Unreleased\s*$/m, (original) =>
      original.replace("## Unreleased", heading),
    );
  }
  const oldGroups = groups(previous);
  const current = groups(changelog);
  for (const [group, entries] of current) {
    const old = new Set(oldGroups.get(group) ?? []);
    current.set(
      group,
      entries.filter((entry) => !old.has(entry)),
    );
  }
  if (![...current.values()].some((entries) => entries.length)) {
    current.clear();
    for (const message of commits) {
      if (/^Merge\b/.test(message)) continue;
      const parsed = parseCommit(message);
      const group =
        parsed.type === "feat"
          ? "Added"
          : parsed.type === "fix"
            ? "Fixed"
            : "Changed";
      if (!current.has(group)) current.set(group, []);
      current
        .get(group)
        .push(
          `- ${parsed.breaking ? "**Breaking:** " : ""}${parsed.description}`,
        );
    }
  }
  const body = [...current]
    .filter(([, entries]) => entries.length)
    .map(
      ([group, entries]) =>
        `${group ? `### ${group}\n\n` : ""}${entries.join("\n")}`,
    )
    .join("\n\n");
  if (!body.trim())
    throw Error("No release notes or non-merge commits available");
  const insertion = unreleased[0]?.start ?? all[0]?.start ?? changelog.length;
  let remainder = changelog.slice(insertion);
  for (const section of [...unreleased].reverse()) {
    const start = section.start - insertion;
    remainder =
      remainder.slice(0, start) + remainder.slice(section.end - insertion);
  }
  const prefix = changelog.slice(0, insertion);
  return `${prefix}${prefix && !prefix.endsWith("\n\n") ? "\n\n" : ""}${heading}\n\n${body}\n\n${remainder}`;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const { values } = parseArgs({
      options: Object.fromEntries(
        ["file", "plan", "date", "previous-file"].map((key) => [
          key,
          { type: "string" },
        ]),
      ),
    });
    if (!values.file || !values.plan)
      throw Error("--file and --plan are required");
    const source = readFileSync(values.file, "utf8");
    const plan = JSON.parse(readFileSync(values.plan, "utf8"));
    const previous = values["previous-file"]
      ? readFileSync(values["previous-file"], "utf8")
      : "";
    const result = promoteUnreleased(
      source,
      plan.version,
      values.date ?? new Date().toISOString().slice(0, 10),
      { previous, commits: plan.commits ?? [] },
    );
    writeFileSync(values.file, result);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
