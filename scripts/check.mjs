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
  for (const node of ast.statements) {
    if (
      (ts.isExportDeclaration(node) &&
        !node.isTypeOnly &&
        (!node.exportClause || !ts.isNamedExports(node.exportClause))) ||
      ts.isExportAssignment(node) ||
      (!ts.isExportDeclaration(node) &&
        !ts.isInterfaceDeclaration(node) &&
        !ts.isTypeAliasDeclaration(node) &&
        ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export)
    )
      add(
        "M001",
        "src/index.ts",
        "Public runtime exports must use explicit named export lists so every export receives a manifest and test contract.",
      );
  }
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
            `${path}.tsx`,
            `${path}.ts`,
            resolve(path, "index.tsx"),
            resolve(path, "index.ts"),
          ]) {
            try {
              if (!(await lstat(candidate)).isFile()) continue;
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
  // Manifests hold the hand-written contract only. The package version and the
  // fingerprints are generated into the catalogue, so a shared change never
  // rewrites every manifest.
  for (const c of manifests)
    for (const field of ["version", "integrity"])
      if (field in c) {
        if (refresh) delete c[field];
        else
          add(
            "M007",
            `manifests/${c.id}.json`,
            `"${field}" is generated into catalog.json; remove it from the manifest.`,
          );
      }
  const fingerprints = new Map();
  if (!findings.some((f) => f.rule === "M002")) {
    for (const c of manifests) {
      try {
        fingerprints.set(c.id, {
          source: await digest(c.source, true),
          preview: await digest(c.preview.source),
        });
      } catch {
        add(
          "M007",
          `manifests/${c.id}.json`,
          "Unable to fingerprint local source/preview dependencies.",
        );
      }
    }
  }
  const tokensCss = await readFile(resolve(root, "src/tokens.css"), "utf8");
  const tokens = [
    ...new Set(
      [...tokensCss.matchAll(/(--m-[a-z0-9-]+)\s*:/g)].map((match) => match[1]),
    ),
  ].sort();
  const selectorBody = (selector) => {
    const bodies = [];
    for (const match of tokensCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selectors = match[1]
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .split(",")
        .map((item) => item.trim());
      if (selectors.includes(selector)) bodies.push(match[2]);
    }
    return bodies.join("\n");
  };
  const declares = (body, name) =>
    new RegExp(`(?:^|[\\s;{])${name}\\s*:`).test(body);
  for (const selector of [
    ":root",
    '[data-mortar-appearance="dark"]',
    '[data-mortar-brand="green"]',
    '[data-mortar-brand="green"][data-mortar-appearance="dark"]',
  ]) {
    const body = selectorBody(selector);
    const at = tokensCss.indexOf(selector);
    const line = at < 0 ? 1 : tokensCss.slice(0, at).split("\n").length;
    for (const name of ["--m-accent", "--m-on-accent"])
      if (!declares(body, name))
        add(
          "M009",
          "src/tokens.css",
          `${selector} must declare ${name}.`,
          line,
        );
  }
  const components = manifests.map((c) => {
    const entry = {};
    for (const [key, value] of Object.entries(c)) {
      entry[key] = value;
      if (key === "package") entry.version = pkg.version;
    }
    entry.integrity = fingerprints.get(c.id);
    return entry;
  });
  const catalog = {
    schemaVersion: 1,
    package: pkg.name,
    version: pkg.version,
    policyVersion: policy.version,
    tokens,
    components,
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
    let stored;
    try {
      stored = JSON.parse(
        await readFile(resolve(root, "catalog.json"), "utf8"),
      );
    } catch {
      add("M008", "catalog.json", "Missing or invalid catalogue.");
    }
    if (stored) {
      const previous = new Map(
        (stored.components || []).map((c) => [c.id, c.integrity]),
      );
      for (const c of components)
        if (
          c.integrity &&
          JSON.stringify(previous.get(c.id)) !== JSON.stringify(c.integrity)
        )
          add(
            "M007",
            `manifests/${c.id}.json`,
            "Source or preview fingerprint is stale. Run npm run catalog and review the changed content.",
          );
      const withoutIntegrity = (value) =>
        JSON.stringify({
          ...value,
          components: (value.components || []).map(
            ({ integrity, ...rest }) => rest,
          ),
        });
      if (withoutIntegrity(stored) !== withoutIntegrity(catalog))
        add(
          "M008",
          "catalog.json",
          "Catalogue does not match manifests. Run npm run catalog.",
        );
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
