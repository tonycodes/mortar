import test from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";
import { readFileSync, readdirSync } from "node:fs";

const root = new URL("../", import.meta.url);
const sources = new Map();
const source = (file) => {
  if (!sources.has(file))
    sources.set(
      file,
      ts.createSourceFile(
        file,
        readFileSync(new URL(file, root), "utf8"),
        ts.ScriptTarget.Latest,
        true,
      ),
    );
  return sources.get(file);
};

/** Names destructured from a component's props, or null if it takes props another way. */
function destructured(file, name) {
  let found;
  const visit = (node) => {
    if (found !== undefined) return;
    let fn;
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) fn = node;
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText() === name &&
      node.initializer &&
      ts.isCallExpression(node.initializer)
    )
      // forwardRef(function Name({ ... }, ref) { ... })
      fn = node.initializer.arguments.find(
        (a) => ts.isFunctionExpression(a) || ts.isArrowFunction(a),
      );
    if (fn) {
      const first = fn.parameters[0];
      found =
        first && ts.isObjectBindingPattern(first.name)
          ? first.name.elements
              .filter((e) => !e.dotDotDotToken)
              .map((e) => (e.propertyName || e.name).getText())
          : null;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(source(file));
  return found;
}

test("every prop a component destructures is documented in its manifest", () => {
  const undocumented = [];
  for (const file of readdirSync(new URL("manifests/", root))) {
    const manifest = JSON.parse(
      readFileSync(new URL(`manifests/${file}`, root), "utf8"),
    );
    const names = destructured(manifest.source, manifest.export);
    if (!names) continue;
    const documented = Object.keys(manifest.contract.props);
    const missing = names.filter((n) => !documented.includes(n));
    if (missing.length)
      undocumented.push(`${manifest.export}: ${missing.join(", ")}`);
  }
  assert.deepEqual(undocumented, []);
});
