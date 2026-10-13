import {
  readFile,
  readdir,
  realpath,
  lstat,
  writeFile,
} from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import ts from "typescript";
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export async function checkKit(root = ROOT) {
  const findings = [];
  const add = (rule, file, message, line = 1) =>
    findings.push({ rule, file, line, severity: "error", message });
  const policy = JSON.parse(
    await readFile(resolve(root, "baseline-policy.json"), "utf8"),
  );
  const pkg = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
  const manifests = [];
  for (const file of (await readdir(resolve(root, "manifests"))).sort()) {
    if (!file.endsWith(".json")) continue;
    try {
      manifests.push(
        JSON.parse(await readFile(resolve(root, "manifests", file), "utf8")),
      );
    } catch {
      add("M001", `manifests/${file}`, "Manifest must be valid JSON.");
    }
  }
  const actualExports = new Set();
  const ast = ts.createSourceFile(
    "index.ts",
    await readFile(resolve(root, "src/index.ts"), "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  for (const node of ast.statements)
    if (
      ts.isExportDeclaration(node) &&
      !node.isTypeOnly &&
      node.exportClause &&
      ts.isNamedExports(node.exportClause)
    )
      for (const e of node.exportClause.elements)
        if (!e.isTypeOnly) actualExports.add(e.name.text);
  const ids = new Set();
  const names = new Set();
  const base = await realpath(root);
  for (const c of manifests) {
    if (
      !c.id ||
      ids.has(c.id) ||
      names.has(c.export) ||
      !actualExports.has(c.export)
    )
      add(
        "M001",
        `manifests/${c.id}.json`,
        "Use a unique component ID and an existing named export.",
      );
    ids.add(c.id);
    names.add(c.export);
    for (const [file, prefix] of [
      [c.source, "src/"],
      [c.preview?.source, "previews/"],
    ]) {
      try {
        if (
          typeof file !== "string" ||
          !file.startsWith(prefix) ||
          file.includes("..") ||
          !(await lstat(resolve(root, file))).isFile() ||
          !(await realpath(resolve(root, file))).startsWith(base + "/")
        )
          throw Error();
      } catch {
        add(
          "M002",
          String(file),
          "Source and explicit preview must be regular files within their canonical repository directories.",
        );
      }
    }
  }
  for (const name of actualExports)
    if (!names.has(name))
      add("M001", "src/index.ts", `Add a manifest and preview for ${name}.`);
  for (const c of manifests)
    for (const id of c.contract?.dependencies || [])
      if (!ids.has(id))
        add(
          "M003",
          `manifests/${c.id}.json`,
          `Unknown component dependency ${id}.`,
        );
  async function inspect(directory) {
    for (const entry of await readdir(resolve(root, directory), {
      withFileTypes: true,
    })) {
      const file = `${directory}/${entry.name}`;
      if (entry.isSymbolicLink()) {
        add("M002", file, "Symlinks cannot hide shared source.");
        continue;
      }
      if (entry.isDirectory()) {
        await inspect(file);
        continue;
      }
      if (!/\.tsx?$/.test(file)) continue;
      const source = await readFile(resolve(root, file), "utf8");
      const lines = source.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (
          /\b(?:fetch|XMLHttpRequest)\b|UI_TOKEN|@tony-ui\/control|ui\.tony\.codes|packages\/control/.test(
            lines[i],
          )
        )
          add(
            "M004",
            file,
            "Shared UI must not depend on hosted governance, credentials or network requests.",
            i + 1,
          );
        if (
          /(?:bg|text|border|ring)-(?:indigo|blue|green|red|amber|violet|slate|gray)-\d{2,3}\b/.test(
            lines[i],
          )
        )
          add(
            "M005",
            file,
            "Use semantic component tokens instead of a fixed Tailwind palette.",
            i + 1,
          );
      }
    }
  }
  await inspect("src");
  const catalog = {
    schemaVersion: 1,
    package: pkg.name,
    version: pkg.version,
    policyVersion: policy.version,
    components: manifests,
  };
  return {
    passed: findings.length === 0,
    policyVersion: policy.version,
    findings,
    catalog,
  };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const report = await checkKit();
  if (process.argv.includes("--write-catalog") && report.passed)
    await writeFile(
      resolve(ROOT, "catalog.json"),
      JSON.stringify(report.catalog, null, 2) + "\n",
    );
  const { catalog, ...result } = report;
  console.log(
    process.argv.includes("--format")
      ? JSON.stringify(result, null, 2)
      : `${report.passed ? "PASS" : "FAIL"}: ${catalog.components.length} components; baseline ${report.policyVersion}\n${report.findings.map((f) => `${f.file}:${f.line} ${f.rule} ${f.message}`).join("\n")}`,
  );
  process.exitCode = report.passed ? 0 : 1;
}
