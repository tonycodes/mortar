// Prints the CHANGELOG.md section for a version, used as the GitHub release notes.
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

/** The body of the `## <version>` section, without its heading, or "". */
export function changelogSection(changelog, version) {
  const lines = changelog.split("\n");
  const heading = new RegExp(
    `^## ${version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s|$)`,
  );
  const start = lines.findIndex((line) => heading.test(line));
  if (start < 0) return "";
  const end = lines.findIndex((line, i) => i > start && /^## /.test(line));
  return lines
    .slice(start + 1, end < 0 ? undefined : end)
    .join("\n")
    .trim();
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const version = process.argv[2];
  if (!version) throw Error("Usage: node scripts/release-notes.mjs <version>");
  const section = changelogSection(
    await readFile(new URL("../CHANGELOG.md", import.meta.url), "utf8"),
    version,
  );
  if (!section) throw Error(`CHANGELOG.md has no "## ${version}" section.`);
  process.stdout.write(section + "\n");
}
