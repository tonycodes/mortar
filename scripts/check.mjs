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
import {
  capabilityErrors,
  catalogCapabilities,
  contractErrors,
} from "./test-contract.mjs";
import { componentApi } from "./api.mjs";
/** Every declaration block whose selector list contains `selector`, joined. */
export function selectorBody(css, selector) {
  const bodies = [];
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = match[1]
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split(",")
      .map((item) => item.trim());
    if (selectors.includes(selector)) bodies.push(match[2]);
  }
  return bodies.join("\n");
}
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Every Tailwind palette name. Components use semantic tokens instead.
const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const UTILITY =
  "bg|text|border|ring|outline|fill|stroke|from|via|to|divide|decoration|shadow|accent|caret|placeholder";
const FIXED_CLASS = new RegExp(
  `(?<![\\w-])(?:${UTILITY})-(?:(?:${PALETTE})-\\d{2,3}\\b|(?:white|black)\\b|\\[#[0-9a-fA-F]+\\])|(?:color|backgroundColor|borderColor):\\s*["']#[0-9a-fA-F]+`,
);
// A raw colour literal in shared CSS. Only src/tokens.css defines colours.
const RAW_COLOUR =
  /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|oklch|oklab|lab|lch)\(/;
// Hosted-service coupling that is never legitimate in the public kit.
const HOSTED = /UI_TOKEN|ui\.tony\.codes|packages\/control/;
// Network APIs, matched as identifiers in code rather than words in prose.
const NETWORK = new Set([
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "EventSource",
  "sendBeacon",
]);

/** Comments blanked out, keeping line numbers. */
const withoutCssComments = (css) =>
  css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "));

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
    for (const message of [...contractErrors(c), ...capabilityErrors(c)])
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
          !(await realpath(resolve(root, file))).startsWith(root + "/")
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
      if (file.endsWith(".css") && directory === "src") {
        if (file === "src/tokens.css") continue;
        const lines = withoutCssComments(
          await readFile(resolve(root, file), "utf8"),
        ).split("\n");
        lines.forEach((line, i) => {
          if (RAW_COLOUR.test(line))
            add(
              "M005",
              file,
              "Define colours as tokens in src/tokens.css and reference them with var(--m-…).",
              i + 1,
            );
        });
        continue;
      }
      if (!/\.tsx?$/.test(file)) continue;
      const source = await readFile(resolve(root, file), "utf8");
      const lines = source.split("\n");
      const network = new Set();
      const tree = ts.createSourceFile(
        file,
        source,
        ts.ScriptTarget.Latest,
        true,
      );
      const visit = (node) => {
        if (ts.isIdentifier(node) && NETWORK.has(node.text)) {
          const parent = node.parent;
          // `fetch(…)`, `new WebSocket(…)`, `navigator.sendBeacon(…)`, or an
          // import of one; not a property or type that merely shares the name.
          const declaresName =
            (ts.isPropertyAssignment(parent) ||
              ts.isPropertySignature(parent) ||
              ts.isMethodDeclaration(parent) ||
              ts.isBindingElement(parent) ||
              ts.isVariableDeclaration(parent) ||
              ts.isParameter(parent)) &&
            parent.name === node;
          if (!declaresName && !ts.isJsxAttribute(parent))
            network.add(
              tree.getLineAndCharacterOfPosition(node.getStart()).line,
            );
        }
        ts.forEachChild(node, visit);
      };
      visit(tree);
      for (let i = 0; i < lines.length; i++) {
        if (network.has(i) || HOSTED.test(lines[i]))
          add(
            "M004",
            file,
            "Shared UI must not depend on hosted governance, credentials or network requests.",
            i + 1,
          );
        if (FIXED_CLASS.test(lines[i]))
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
        !(await realpath(full)).startsWith(root + "/") ||
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
          // "./x.js" (NodeNext source) or extensionless "./x" (previews).
          for (const candidate of [
            path,
            path.replace(/\.js$/, ".tsx"),
            path.replace(/\.js$/, ".ts"),
            `${path}.tsx`,
            `${path}.ts`,
          ]) {
            try {
              if (!(await lstat(candidate)).isFile()) continue;
            } catch {
              continue;
            }
            await visit(candidate.slice(root.length + 1));
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
  // Manifests hold the hand-written contract only. The package version,
  // fingerprints, provenance, derived capabilities and prop types are generated
  // into the catalogue, so a shared change never rewrites every manifest.
  for (const c of manifests) {
    for (const field of ["version", "integrity", "provenance"])
      if (field in c) {
        if (refresh) delete c[field];
        else
          add(
            "M007",
            `manifests/${c.id}.json`,
            `"${field}" is generated into catalog.json; remove it from the manifest.`,
          );
      }
    for (const field of ["states", "propTypes"])
      if (c.contract && field in c.contract) {
        if (refresh) delete c.contract[field];
        else
          add(
            "M007",
            `manifests/${c.id}.json`,
            field === "states"
              ? '"contract.states" was removed; declare tested scenarios in testing.states.'
              : '"contract.propTypes" is generated into catalog.json; remove it from the manifest.',
          );
      }
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
  // Prop types and composed components come from the TypeScript checker.
  let api = new Map();
  if (!findings.some((f) => ["M001", "M002"].includes(f.rule))) {
    api = componentApi(root, manifests);
    for (const c of manifests) {
      const derived = api.get(c.id)?.dependencies;
      if (!derived) continue;
      const declared = c.contract?.dependencies || [];
      const missing = derived.filter((id) => !declared.includes(id));
      const extra = declared.filter((id) => !derived.includes(id));
      if (missing.length || extra.length)
        add(
          "M010",
          `manifests/${c.id}.json`,
          `contract.dependencies must list exactly the catalogue components ${c.export} renders.${missing.length ? ` Add ${missing.join(", ")}.` : ""}${extra.length ? ` Remove ${extra.join(", ")}.` : ""}`,
        );
    }
  }
  const tokensCss = await readFile(resolve(root, "src/tokens.css"), "utf8");
  const tokens = [
    ...new Set(
      [...tokensCss.matchAll(/(--m-[a-z0-9-]+)\s*:/g)].map((match) => match[1]),
    ),
  ].sort();
  const declares = (body, name) =>
    new RegExp(`(?:^|[\\s;{])${name}\\s*:`).test(body);
  // Brands declare only the --m-brand-* contract; each appearance resolves the
  // accent pair for itself and for inverse bands, so every brand gets both.
  for (const selector of [":root", '[data-mortar-appearance="dark"]']) {
    const body = selectorBody(tokensCss, selector);
    const at = tokensCss.indexOf(selector);
    const line = at < 0 ? 1 : tokensCss.slice(0, at).split("\n").length;
    for (const name of [
      "--m-accent",
      "--m-on-accent",
      "--m-inv-accent",
      "--m-inv-on-accent",
    ])
      if (!declares(body, name))
        add(
          "M009",
          "src/tokens.css",
          `${selector} must resolve ${name}.`,
          line,
        );
  }
  for (const rule of tokensCss
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = rule[1].split(",").map((item) => item.trim());
    if (
      !selectors.every((item) => /^\[data-mortar-brand="[^"]+"\]$/.test(item))
    )
      continue;
    for (const [, name] of rule[2].matchAll(/(--[a-z0-9-]+)\s*:/gi))
      if (!name.startsWith("--m-brand-"))
        add(
          "M009",
          "src/tokens.css",
          `${selectors.join(", ")} declares ${name}; brands declare only --m-brand-* tokens.`,
          tokensCss.slice(0, tokensCss.indexOf(rule[0].trim())).split("\n")
            .length,
        );
  }
  const components = manifests.map((c) => catalogEntry(c));
  function catalogEntry(c) {
    const {
      id,
      logicalId,
      name,
      description,
      stack,
      package: packageName,
      export: exportName,
      source,
      capabilities,
      owner,
      kitId,
      contract = {},
      preview,
      testing,
      ...rest
    } = c;
    const {
      props,
      usage,
      avoid,
      accessibility,
      dependencies,
      ...contractRest
    } = contract;
    const propTypes = api.get(id)?.props;
    return {
      id,
      logicalId,
      name,
      description,
      stack,
      package: packageName,
      version: pkg.version,
      export: exportName,
      source,
      capabilities: catalogCapabilities(c),
      owner,
      kitId,
      provenance: { kitId, exampleId: `mortar-${kitId}-reference` },
      contract: {
        props,
        ...(propTypes ? { propTypes } : {}),
        usage,
        avoid,
        accessibility,
        dependencies,
        ...contractRest,
      },
      preview,
      testing,
      ...rest,
      integrity: fingerprints.get(id),
    };
  }
  const catalog = {
    schemaVersion: 1,
    package: pkg.name,
    version: pkg.version,
    policyVersion: policy.version,
    tokens,
    components,
  };
  let stored;
  try {
    stored = JSON.parse(await readFile(resolve(root, "catalog.json"), "utf8"));
  } catch {
    if (!refresh) add("M008", "catalog.json", "Missing or invalid catalogue.");
  }
  const changes = compareCatalogs(stored, catalog);
  let written = false;
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
    written = true;
  } else if (!refresh && stored) {
    for (const id of changes.fingerprints)
      add(
        "M007",
        `manifests/${id}.json`,
        "Source or preview fingerprint is stale. Review the change, then run npm run catalog.",
      );
    if (changes.catalogue) {
      const list = changes.contracts;
      const named =
        list.length > 8
          ? `${list.slice(0, 8).join(", ")} and ${list.length - 8} more`
          : list.join(", ");
      add(
        "M008",
        "catalog.json",
        `Catalogue does not match manifests${named ? ` (${named})` : ""}. Review the change, then run npm run catalog.`,
      );
    }
  }
  return {
    passed: findings.length === 0,
    policyVersion: policy.version,
    findings,
    catalog,
    changes,
    written,
  };
}

/**
 * What differs between the committed catalogue and a regenerated one:
 * components whose fingerprints changed, components whose generated entry
 * otherwise changed (contract, props, testing…), and whether anything at all
 * (including tokens or the version) changed.
 */
export function compareCatalogs(stored, catalog) {
  const before = new Map((stored?.components || []).map((c) => [c.id, c]));
  const after = new Map(catalog.components.map((c) => [c.id, c]));
  const fingerprints = [];
  const contracts = [];
  for (const [id, c] of after) {
    const old = before.get(id);
    if (!old) {
      contracts.push(`${id} (new)`);
      continue;
    }
    const { integrity, ...rest } = c;
    const { integrity: oldIntegrity, ...oldRest } = old;
    if (integrity && JSON.stringify(integrity) !== JSON.stringify(oldIntegrity))
      fingerprints.push(id);
    if (JSON.stringify(rest) !== JSON.stringify(oldRest)) contracts.push(id);
  }
  for (const id of before.keys())
    if (!after.has(id)) contracts.push(`${id} (removed)`);
  const withoutIntegrity = (value) =>
    JSON.stringify({
      ...value,
      components: (value?.components || []).map(
        ({ integrity, ...rest }) => rest,
      ),
    });
  return {
    fingerprints,
    contracts,
    catalogue:
      !stored ||
      contracts.length > 0 ||
      withoutIntegrity(stored) !== withoutIntegrity(catalog),
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const args = process.argv.slice(2);
  const at = args.indexOf("--format");
  const formatName = at >= 0 ? args[at + 1] : "text";
  if (!["text", "json"].includes(formatName)) {
    console.error(`Unknown --format ${formatName}; use text or json.`);
    process.exit(2);
  }
  const refresh = args.includes("--write-catalog");
  const report = await checkKit(ROOT, { refresh });
  const { catalog, written, ...result } = report;
  if (formatName === "json") console.log(JSON.stringify(result, null, 2));
  else {
    const lines = [
      `${report.passed ? "PASS" : "FAIL"}: ${catalog.components.length} components; baseline ${report.policyVersion}`,
      ...report.findings.map(
        (f) => `${f.file}:${f.line} ${f.rule} ${f.message}`,
      ),
    ];
    if (refresh) {
      const { fingerprints, contracts, catalogue } = report.changes;
      if (!written)
        lines.push(
          "catalog.json was not written: fix the findings above first.",
        );
      else if (!catalogue && !fingerprints.length)
        lines.push("catalog.json is already up to date.");
      else {
        lines.push(
          "catalog.json written. Review these changes before committing:",
        );
        if (fingerprints.length)
          lines.push(`  fingerprints: ${fingerprints.join(", ")}`);
        if (contracts.length)
          lines.push(`  contracts: ${contracts.join(", ")}`);
        if (catalogue && !contracts.length)
          lines.push("  catalogue-wide fields (version, policy or tokens)");
      }
    }
    console.log(lines.join("\n"));
  }
  process.exitCode = report.passed ? 0 : 1;
}
