// Build-time extraction of each component's example JSX for the playground Code
// view. Fixtures are parsed with the TypeScript AST, so formatting, nested
// parentheses, fall-through cases and simple local variables do not break it.
// The Vite plugin below serves the result as a lazily imported virtual module;
// tests import the same functions from node.
// TypeScript 6 under an alias: TypeScript 7, which builds the kit, has no
// JavaScript compiler API. See .github/dependabot.yml.
import ts from "typescript-api";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { COMPONENT_ENTRIES } from "../scripts/entries.mjs";

const ROOT_PACKAGE = "@tonycodes-ui/mortar";
/** Package specifier by source entry stem, e.g. "data-grid" → ".../data-grid". */
const PACKAGE_BY_STEM = new Map(
  Object.entries(COMPONENT_ENTRIES).map(([specifier, entry]) => [
    entry.replace(/^src\//, "").replace(/\.tsx?$/, ""),
    specifier,
  ]),
);
/**
 * Namespace imports of component entries in a fixture (`import * as UI from
 * "../src/index.js"`), mapped to their package. Defaults to UI → the root.
 */
function namespaces(tree) {
  const found = new Map();
  for (const node of tree.statements) {
    const binding = ts.isImportDeclaration(node)
      ? node.importClause?.namedBindings
      : undefined;
    if (!binding || !ts.isNamespaceImport(binding)) continue;
    const stem = node.moduleSpecifier.text.match(/\/src\/([\w-]+)\.js$/)?.[1];
    if (stem && PACKAGE_BY_STEM.has(stem))
      found.set(binding.name.text, PACKAGE_BY_STEM.get(stem));
  }
  if (!found.size) found.set("UI", ROOT_PACKAGE);
  return found;
}

const parse = (file, text) =>
  ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

const unwrap = (node) => {
  while (node && ts.isParenthesizedExpression(node)) node = node.expression;
  return node;
};

const isJsx = (node) =>
  !!node &&
  (ts.isJsxElement(node) ||
    ts.isJsxSelfClosingElement(node) ||
    ts.isJsxFragment(node));

/** The fixture module a preview entry renders, and the case name it passes. */
export function previewTarget(previewText, previewFile = "Preview.tsx") {
  const tree = parse(previewFile, previewText);
  let fixture, name;
  for (const node of tree.statements)
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text.startsWith("./")
    )
      fixture ??= node.moduleSpecifier.text;
  const visit = (node) => {
    if (
      name === undefined &&
      ts.isJsxAttribute(node) &&
      node.name.getText() === "name" &&
      node.initializer &&
      ts.isStringLiteral(node.initializer)
    )
      name = node.initializer.text;
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return { fixture, name };
}

/** Find `const <id> = …` visible from `from`, walking outwards through enclosing blocks. */
function resolveLocal(id, from) {
  for (let scope = from.parent; scope; scope = scope.parent) {
    if (!ts.isBlock(scope) && !ts.isSourceFile(scope)) continue;
    for (const statement of scope.statements) {
      if (!ts.isVariableStatement(statement)) continue;
      for (const declaration of statement.declarationList.declarations)
        if (
          ts.isIdentifier(declaration.name) &&
          declaration.name.text === id &&
          declaration.initializer
        )
          return unwrap(declaration.initializer);
    }
  }
}

/**
 * The expression a `switch (name)` case assigns to its example (or returns),
 * plus the switch statement as the scope for resolving local variables.
 */
export function caseExpression(tree, name) {
  let found;
  const visit = (node) => {
    if (found) return;
    if (ts.isSwitchStatement(node)) {
      const clauses = node.caseBlock.clauses;
      const start = clauses.findIndex(
        (c) =>
          ts.isCaseClause(c) &&
          ts.isStringLiteralLike(c.expression) &&
          c.expression.text === name,
      );
      // Empty clauses fall through to the next clause with statements.
      let i = start;
      while (i >= 0 && i < clauses.length && !clauses[i].statements.length) i++;
      if (start >= 0 && i < clauses.length)
        for (const statement of clauses[i].statements) {
          let expr;
          if (
            ts.isExpressionStatement(statement) &&
            ts.isBinaryExpression(statement.expression) &&
            statement.expression.operatorToken.kind ===
              ts.SyntaxKind.EqualsToken
          )
            expr = statement.expression.right;
          else if (ts.isReturnStatement(statement)) expr = statement.expression;
          if (!expr) continue;
          expr = unwrap(expr);
          if (ts.isIdentifier(expr)) expr = resolveLocal(expr.text, node);
          if (expr) found = { expr, scope: node };
          break;
        }
    }
    if (!found) ts.forEachChild(node, visit);
  };
  visit(tree);
  // A preview with its own data names its example `const example = <… />`.
  const visitExample = (node) => {
    if (found) return;
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "example" &&
      isJsx(unwrap(node.initializer))
    )
      found = { expr: unwrap(node.initializer), scope: node.parent.parent };
    ts.forEachChild(node, visitExample);
  };
  if (!found) visitExample(tree);
  return found;
}

const lineIndent = (tree, pos) => {
  const { line } = tree.getLineAndCharacterOfPosition(pos);
  return tree.text.slice(tree.getLineStarts()[line]).match(/^ */)[0];
};

/**
 * The node's source, dedented, with `{local}` children that name a JSX-valued
 * local variable (for example `const controls = <UI.Input … />`) inlined.
 */
function render(tree, node, scope, depth = 0) {
  const start = node.getStart(tree);
  const edits = [];
  const visit = (child) => {
    if (
      depth < 4 &&
      ts.isJsxExpression(child) &&
      child.expression &&
      ts.isIdentifier(child.expression)
    ) {
      const value = resolveLocal(child.expression.text, scope);
      if (isJsx(value)) {
        const indent = lineIndent(tree, child.getStart(tree));
        const text = render(tree, value, scope, depth + 1)
          .split("\n")
          .map((l, i) => (i && l ? indent + l : l))
          .join("\n");
        edits.push([child.getStart(tree), child.end, text]);
        return;
      }
    }
    ts.forEachChild(child, visit);
  };
  ts.forEachChild(node, visit);
  let text = tree.text.slice(start, node.end);
  for (const [from, to, value] of edits.reverse())
    text = text.slice(0, from - start) + value + text.slice(to - start);
  const column = tree.getLineAndCharacterOfPosition(start).character;
  const lines = (" ".repeat(column) + text).split("\n");
  const indent = Math.min(
    ...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length),
  );
  return lines.map((l) => l.slice(indent)).join("\n");
}

/**
 * Components the playground host renders around every preview (main.tsx), so
 * their fixture case shows the content that sits inside them.
 */
const hosted = {
  ThemeProvider: (body) => {
    // A fragment root is redundant inside the provider.
    if (body.startsWith("<>\n") && body.endsWith("\n</>"))
      body = body.slice(3, -4).replace(/^ {2}/gm, "");
    return [
      `<UI.ThemeProvider brand="neutral" density="comfortable" initialAppearance="system">`,
      ...body.split("\n").map((l) => (l ? "  " + l : l)),
      "</UI.ThemeProvider>",
    ].join("\n");
  },
};

/**
 * The Code view text for one component: public imports plus the JSX its
 * fixture case renders, with the fixtures' `UI.` namespace removed.
 */
export function exampleCode(
  name,
  fixtureText,
  exports,
  fixtureFile = "Fixture.tsx",
  caseName = name,
  packageOf = () => ROOT_PACKAGE,
) {
  const tree = parse(fixtureFile, fixtureText);
  const found = caseExpression(tree, caseName);
  if (!found) return `import { ${name} } from "${packageOf(name)}";`;
  const spaces = namespaces(tree);
  let body = render(tree, found.expr, found.scope);
  if (hosted[name] && !body.includes(`<UI.${name}`)) body = hosted[name](body);
  // One import line per package, the root package first.
  const imports = new Map();
  for (const [space, specifier] of spaces)
    for (const m of body.matchAll(new RegExp(`\\b${space}\\.(\\w+)`, "g")))
      if (exports.has(m[1]))
        imports.set(specifier, (imports.get(specifier) ?? new Set()).add(m[1]));
  if (!imports.size) imports.set(packageOf(name), new Set([name]));
  const lines = [...imports]
    .sort(([a], [b]) =>
      a === ROOT_PACKAGE ? -1 : b === ROOT_PACKAGE ? 1 : a.localeCompare(b),
    )
    .map(
      ([specifier, names]) =>
        `import { ${[...names].sort().join(", ")} } from "${specifier}";`,
    );
  for (const space of spaces.keys())
    body = body.replace(new RegExp(`\\b${space}\\.`, "g"), "");
  return [...lines, "", body].join("\n");
}

/** Code view text for every catalogue component, keyed by export name. */
export function buildExamples(
  root,
  components,
  read = (file) => readFileSync(file, "utf8"),
) {
  const exports = new Set(components.map((c) => c.export));
  const packages = new Map(components.map((c) => [c.export, c.package]));
  const packageOf = (name) => packages.get(name) ?? ROOT_PACKAGE;
  const examples = {};
  const files = new Set();
  for (const c of components) {
    const previewFile = resolve(root, c.preview.source);
    files.add(previewFile);
    const { fixture, name } = previewTarget(read(previewFile), previewFile);
    let fixtureFile = previewFile;
    if (fixture) {
      const base = resolve(dirname(previewFile), fixture.replace(/\.js$/, ""));
      fixtureFile = base.endsWith(".tsx") ? base : `${base}.tsx`;
    }
    files.add(fixtureFile);
    examples[c.export] = exampleCode(
      c.export,
      read(fixtureFile),
      exports,
      fixtureFile,
      name ?? c.export,
      packageOf,
    );
  }
  return { examples, files: [...files] };
}

const ID = "virtual:mortar-examples";
/** Vite plugin serving `virtual:mortar-examples` (default export: name → code). */
export function examplesPlugin(root) {
  return {
    name: "mortar-examples",
    resolveId: (id) => (id === ID ? "\0" + ID : undefined),
    load(id) {
      if (id !== "\0" + ID) return;
      const catalogFile = resolve(root, "catalog.json");
      const { components } = JSON.parse(readFileSync(catalogFile, "utf8"));
      const { examples, files } = buildExamples(root, components);
      for (const file of [catalogFile, ...files]) this.addWatchFile(file);
      return `export default ${JSON.stringify(examples)};`;
    },
    handleHotUpdate({ file, server }) {
      if (!file.includes("/previews/") && !file.endsWith("/catalog.json"))
        return;
      const mod = server.moduleGraph.getModuleById("\0" + ID);
      if (mod) server.moduleGraph.invalidateModule(mod);
    },
  };
}
