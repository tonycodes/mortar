// Run by the credential-free prepare job of .github/workflows/release.yml on the
// exact main commit whose checks passed. It builds, packs and records provenance;
// the separate publish job (the only one allowed to publish, via npm trusted publishing) publishes it.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { checkKit, ROOT } from "./check.mjs";
import { unexpectedChanges } from "./auto-release/tree.mjs";
import { parsePackOutput } from "./release-pack.mjs";
const report = await checkKit();
if (!report.passed)
  throw Error("Baseline checks failed; run npm run check:json.");
if (
  unexpectedChanges(
    execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], {
      cwd: ROOT,
      encoding: "utf8",
    }),
  ).length
)
  throw Error("Release requires a clean checkout.");
const commit = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: ROOT,
  encoding: "utf8",
}).trim();
// Pack exactly what this commit builds, never a stale dist. Pack itself runs with
// --ignore-scripts: prepack would rebuild and write to stdout ahead of the --json output.
execFileSync("npm", ["run", "build"], { cwd: ROOT, stdio: "inherit" });
const pkg = JSON.parse(await readFile(resolve(ROOT, "package.json"), "utf8"));
const out = resolve(ROOT, "release", pkg.version);
await mkdir(resolve(ROOT, "release"), { recursive: true });
await mkdir(out, { recursive: false });
const packed = parsePackOutput(
  execFileSync(
    "npm",
    ["pack", "--json", "--ignore-scripts", "--pack-destination", out],
    {
      cwd: ROOT,
      encoding: "utf8",
    },
  ),
);
const bytes = await readFile(resolve(out, packed.filename));
const provenance = {
  schemaVersion: 1,
  package: pkg.name,
  version: pkg.version,
  commit,
  policyVersion: report.policyVersion,
  integrity: "sha512-" + createHash("sha512").update(bytes).digest("base64"),
  filename: packed.filename,
};
await writeFile(
  resolve(out, "provenance.json"),
  JSON.stringify(provenance, null, 2) + "\n",
  { flag: "wx" },
);
console.log(JSON.stringify(provenance, null, 2));
