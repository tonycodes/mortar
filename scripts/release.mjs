// Run by a protected release job after maintainer review and exact-commit CI.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { checkKit, ROOT } from "./check.mjs";
const report = await checkKit();
if (!report.passed)
  throw Error("Baseline checks failed; run npm run check:json.");
if (
  execFileSync("git", ["status", "--porcelain"], {
    cwd: ROOT,
    encoding: "utf8",
  }).trim()
)
  throw Error("Release requires a clean checkout.");
const commit = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: ROOT,
  encoding: "utf8",
}).trim();
const pkg = JSON.parse(await readFile(resolve(ROOT, "package.json"), "utf8"));
const out = resolve(ROOT, "release", pkg.version);
await mkdir(resolve(ROOT, "release"), { recursive: true });
await mkdir(out, { recursive: false });
const packed = JSON.parse(
  execFileSync("npm", ["pack", "--json", "--pack-destination", out], {
    cwd: ROOT,
    encoding: "utf8",
  }),
)[0];
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
