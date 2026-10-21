// Build-time data for the `mortar` CLI and MCP server (bin/mortar.mjs). The CLI
// has no runtime dependencies, so everything that needs the TypeScript parser is
// computed here, during `npm run build`, into dist/agent-data.json:
//   - each component's example JSX (the playground Code view, playground/examples.mjs)
//   - the playground taxonomy and page templates with the components they compose
//   - the package's value and type exports
//   - every prop name each component accepts, including inherited DOM attributes
//   - the kit's `m-*` class names and source file hashes, for the application audit
// catalog.json and the shipped docs are read at runtime, so the CLI always
// describes the installed version.
import ts from "typescript";
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { buildExamples } from "../playground/examples.mjs";
import { componentApi } from "./api.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const parse = (file) =>
  ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

/** Value and type names exported from src/index.ts. */
export function packageExports(root = ROOT) {
  const values = new Set();
  const types = new Set();
  for (const statement of parse(resolve(root, "src/index.ts")).statements) {
    if (
      !ts.isExportDeclaration(statement) ||
      !statement.exportClause ||
      !ts.isNamedExports(statement.exportClause)
    )
      continue;
    for (const element of statement.exportClause.elements)
      (statement.isTypeOnly || element.isTypeOnly ? types : values).add(
        element.name.text,
      );
  }
  return { values: [...values].sort(), types: [...types].sort() };
}

/** `UI.X` components rendered by a function, following local helper components. */
function usedComponents(tree, fn, exports) {
  const locals = new Map();
  for (const s of tree.statements)
    if (ts.isFunctionDeclaration(s) && s.name) locals.set(s.name.text, s);
  const used = new Set();
  const seen = new Set();
  const visitFn = (node) => {
    if (seen.has(node)) return;
    seen.add(node);
    const visit = (n) => {
      if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
        const tag = n.tagName;
        if (
          ts.isPropertyAccessExpression(tag) &&
          tag.expression.getText() === "UI" &&
          exports.has(tag.name.text)
        )
          used.add(tag.name.text);
        else if (ts.isIdentifier(tag) && locals.has(tag.text))
          visitFn(locals.get(tag.text));
      }
      ts.forEachChild(n, visit);
    };
    visit(node);
  };
  visitFn(fn);
  return [...used].sort();
}

/** Playground page templates: id, title, description, kind and components. */
export function pageTemplates(root, components) {
  const exports = new Set(components.map((c) => c.export));
  const tree = parse(resolve(root, "playground/templates.tsx"));
  const modules = {};
  const sources = {
    page: "playground/template-pages.tsx",
    recipe: "playground/recipes.tsx",
    auth: "playground/auth-pages.tsx",
  };
  const fn = (kind, name) => {
    modules[kind] ??= parse(resolve(root, sources[kind]));
    const t = modules[kind];
    const node = t.statements.find(
      (s) => ts.isFunctionDeclaration(s) && s.name?.text === name,
    );
    return node ? usedComponents(t, node, exports) : [];
  };
  const out = [];
  const visit = (node) => {
    if (ts.isObjectLiteralExpression(node)) {
      const prop = (key) =>
        node.properties.find(
          (p) => ts.isPropertyAssignment(p) && p.name.getText() === key,
        )?.initializer;
      const id = prop("id");
      const component = prop("Component");
      if (id && ts.isStringLiteral(id) && component) {
        let components = [];
        if (
          ts.isCallExpression(component) &&
          ts.isIdentifier(component.expression) &&
          sources[component.expression.text] &&
          ts.isStringLiteral(component.arguments[0])
        )
          components = fn(
            component.expression.text,
            component.arguments[0].text,
          );
        out.push({
          id: id.text,
          title: prop("title")?.text,
          description: prop("description")?.text,
          kind: prop("kind")?.text,
          components,
        });
        return;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return out;
}

/** Every `m-*` class the kit's styles define. */
export function kitClasses(root = ROOT) {
  const classes = new Set();
  for (const file of readdirSync(resolve(root, "src")))
    if (file.endsWith(".css"))
      for (const [, name] of readFileSync(
        resolve(root, "src", file),
        "utf8",
      ).matchAll(/\.(m-[a-z][a-z0-9-]*)/g))
        classes.add(name);
  return [...classes].sort();
}

export function agentData(root = ROOT) {
  const catalog = JSON.parse(
    readFileSync(resolve(root, "catalog.json"), "utf8"),
  );
  const { components } = catalog;
  const { examples } = buildExamples(root, components);
  const api = componentApi(root, components);
  // Inherited prop names repeat across components (div, button, input …), so
  // each distinct set is stored once.
  const inheritedSets = [];
  const setIndex = new Map();
  const inherited = {};
  for (const c of components) {
    const entry = api.get(c.id);
    if (!entry) continue;
    const names = [...entry.accepts].filter((n) => !(n in entry.props)).sort();
    if (!names.length) continue;
    const key = names.join(" ");
    if (!setIndex.has(key)) {
      setIndex.set(key, inheritedSets.length);
      inheritedSets.push(names);
    }
    inherited[c.export] = setIndex.get(key);
  }
  const hashes = {};
  for (const file of readdirSync(resolve(root, "src")).sort())
    hashes[
      createHash("sha256")
        .update(readFileSync(resolve(root, "src", file)))
        .digest("hex")
    ] = `src/${file}`;
  return {
    schemaVersion: 1,
    version: catalog.version,
    taxonomy: JSON.parse(
      readFileSync(resolve(root, "playground/taxonomy.json"), "utf8"),
    ),
    templates: pageTemplates(root, components),
    exports: packageExports(root),
    examples,
    inherited,
    inheritedSets,
    classes: kitClasses(root),
    sourceHashes: hashes,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const out = join(ROOT, "dist", "agent-data.json");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(agentData()) + "\n");
  console.log(`Wrote ${out}`);
}
