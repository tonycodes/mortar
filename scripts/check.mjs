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
import { format } from "prettier";
import { contractErrors } from "./test-contract.mjs";
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export async function checkKit(root = ROOT, { refresh = false } = {}) {
  root = await realpath(root);
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
      const manifest = JSON.parse(
        await readFile(resolve(root, "manifests", file), "utf8"),
      );
      if (!manifest || Array.isArray(manifest) || typeof manifest !== "object")
        throw Error();
      if (
        !/^mortar-[a-z][a-z0-9-]*$/.test(manifest.id || "") ||
        file !== `${manifest.id}.json`
      ) {
        add(
          "M001",
          `manifests/${file}`,
          "Use a safe component ID matching its manifest filename.",
        );
      }
      manifests.push(manifest);
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
    for (const message of contractErrors(c))
      add("M006", `manifests/${c.id}.json`, message);
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
          /(?:bg|text|border|ring)-(?:indigo|blue|green|red|amber|violet|slate|gray)-\d{2,3}\b|(?:bg|text|border|ring)-\[#[0-9a-fA-F]+\]|(?:color|backgroundColor|borderColor):\s*["']#[0-9a-fA-F]+/.test(
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
  await inspect("previews");
  await inspect("playground");
  // Hash local import closures, not only the tiny preview entry point. Include shared
  // styles in implementation identity; style changes affect every consumer.
  async function digest(entry, styles = false) {
    const files = new Map();
    async function visit(file) {
      if (files.has(file)) return;
      const full = resolve(root, file);
      if (
        !(await realpath(full)).startsWith(base + "/") ||
        !(await lstat(full)).isFile()
      )
        throw Error("Unsafe dependency");
      const text = await readFile(full, "utf8");
      files.set(file, text);
      if (/\.tsx?$/.test(file)) {
        const tree = ts.createSourceFile(
          file,
          text,
          ts.ScriptTarget.Latest,
          true,
        );
        for (const node of tree.statements) {
          const spec = node.moduleSpecifier;
          if (!spec || !ts.isStringLiteral(spec) || !spec.text.startsWith("."))
            continue;
          const path = resolve(dirname(full), spec.text);
          for (const candidate of [
            path,
            path.replace(/\.js$/, ".tsx"),
            path.replace(/\.js$/, ".ts"),
          ]) {
            try {
              await lstat(candidate);
            } catch {
              continue;
            }
            await visit(candidate.slice(base.length + 1));
            break;
          }
        }
      }
    }
    await visit(entry);
    if (styles)
      for (const f of [
        "styles.css",
        ...(await readdir(resolve(root, "src")))
          .filter((f) => f.endsWith(".css"))
          .map((f) => `src/${f}`),
      ])
        await visit(f);
    return createHash("sha256")
      .update(
        [...files]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([p, t]) => `${p}\0${t}`)
          .join("\0"),
      )
      .digest("hex");
  }
  if (!findings.some((f) => f.rule === "M002")) {
    for (const c of manifests) {
      try {
        const integrity = {
          source: await digest(c.source, true),
          preview: await digest(c.preview.source),
        };
        if (refresh) c.integrity = integrity;
        else if (JSON.stringify(c.integrity) !== JSON.stringify(integrity))
          add(
            "M007",
            `manifests/${c.id}.json`,
            "Source or preview fingerprint is stale. Run npm run catalog and review the changed content.",
          );
      } catch {
        add(
          "M007",
          `manifests/${c.id}.json`,
          "Unable to fingerprint local source/preview dependencies.",
        );
      }
    }
  }
  const catalog = {
    schemaVersion: 1,
    package: pkg.name,
    version: pkg.version,
    policyVersion: policy.version,
    components: manifests,
  };
  if (refresh && findings.length === 0) {
    for (const c of manifests)
      await writeFile(
        resolve(root, `manifests/${c.id}.json`),
        await format(JSON.stringify(c, null, 2), { parser: "json" }),
      );
    await writeFile(
      resolve(root, "catalog.json"),
      await format(JSON.stringify(catalog, null, 2), { parser: "json" }),
    );
  } else if (!refresh) {
    try {
      if (
        JSON.stringify(
          JSON.parse(await readFile(resolve(root, "catalog.json"), "utf8")),
        ) !== JSON.stringify(catalog)
      )
        add(
          "M008",
          "catalog.json",
          "Catalogue does not match manifests. Run npm run catalog.",
        );
    } catch {
      add("M008", "catalog.json", "Missing or invalid catalogue.");
    }
  }
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
  const report = await checkKit(ROOT, {
    refresh: process.argv.includes("--write-catalog"),
  });
  const { catalog, ...result } = report;
  console.log(
    process.argv.includes("--format")
      ? JSON.stringify(result, null, 2)
      : `${report.passed ? "PASS" : "FAIL"}: ${catalog.components.length} components; baseline ${report.policyVersion}\n${report.findings.map((f) => `${f.file}:${f.line} ${f.rule} ${f.message}`).join("\n")}`,
  );
  process.exitCode = report.passed ? 0 : 1;
}
