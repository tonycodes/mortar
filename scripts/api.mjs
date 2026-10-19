// Derives each component's public API from the TypeScript checker: its own props
// (type, required, default) and the catalogue components it composes. The
// catalogue carries the result; manifests keep the hand-written descriptions.
import { resolve, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// Type declarations always resolve from this checkout's node_modules, so a copy
// of the kit in a temporary directory produces the same API.
const MODULES = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../node_modules",
);

const FORMAT = ts.TypeFormatFlags.NoTruncation;

function program(root) {
  return ts.createProgram([resolve(root, "src/index.ts")], {
    target: ts.ScriptTarget.ES2022,
    lib: ["lib.es2022.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    jsx: ts.JsxEmit.ReactJSX,
    strict: true,
    skipLibCheck: true,
    noEmit: true,
    typeRoots: [resolve(MODULES, "@types")],
    baseUrl: root,
    paths: { "*": [`${MODULES}/*`, `${MODULES}/@types/*`] },
  });
}

const literal = (type) =>
  type.isStringLiteral() ||
  type.isNumberLiteral() ||
  !!(type.flags & ts.TypeFlags.BooleanLiteral);

/**
 * A readable, alias-free description of a prop type. Unions of literals are
 * expanded (an opaque alias such as `Tone` becomes its members) and sorted so
 * that unrelated source edits do not reorder them; `undefined` from optional
 * props is dropped.
 */
export function describeType(checker, type) {
  let members = (type.isUnion() ? type.types : [type]).filter(
    (t) => !(t.flags & ts.TypeFlags.Undefined),
  );
  const isNull = (t) => !!(t.flags & ts.TypeFlags.Null);
  if (members.some(literal) && members.every((t) => literal(t) || isNull(t))) {
    // e.g. "danger" | "info" | "neutral", 2 | 3 | 4, or "yes" | "no" | null
    const nullable = members.some(isNull);
    members = members.filter((t) => !isNull(t));
    const booleans = members.filter(
      (t) => t.flags & ts.TypeFlags.BooleanLiteral,
    );
    const rest = members
      .filter((t) => !(t.flags & ts.TypeFlags.BooleanLiteral))
      .map((t) =>
        t.isStringLiteral() ? JSON.stringify(t.value) : String(t.value),
      )
      .sort();
    if (booleans.length === 2) rest.push("boolean");
    else for (const b of booleans) rest.push(checker.typeToString(b));
    if (nullable) rest.push("null");
    return rest.join(" | ");
  }
  if (type.aliasSymbol) return checker.typeToString(type, undefined, FORMAT);
  const parts = members.map((t) => checker.typeToString(t, undefined, FORMAT));
  // `true | false` inside a wider union reads as boolean.
  const t = parts.indexOf("true");
  const f = parts.indexOf("false");
  if (t >= 0 && f >= 0) {
    parts.splice(Math.max(t, f), 1);
    parts.splice(Math.min(t, f), 1, "boolean");
  }
  // Nullable types read as `T | null`, whatever order the checker created them in.
  return [
    ...parts.filter((p) => p !== "null"),
    ...parts.filter((p) => p === "null"),
  ].join(" | ");
}

/** The function implementing a component declaration (unwrapping forwardRef/memo). */
function implementation(declaration) {
  if (ts.isFunctionDeclaration(declaration)) return declaration;
  if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
    let init = declaration.initializer;
    while (ts.isCallExpression(init)) {
      const fn = init.arguments.find(
        (a) =>
          ts.isFunctionExpression(a) ||
          ts.isArrowFunction(a) ||
          ts.isCallExpression(a),
      );
      if (!fn) break;
      init = fn;
    }
    if (ts.isFunctionExpression(init) || ts.isArrowFunction(init)) return init;
  }
  return undefined;
}

function defaults(fn) {
  const out = new Map();
  const first = fn?.parameters[0];
  if (first && ts.isObjectBindingPattern(first.name))
    for (const element of first.name.elements)
      if (!element.dotDotDotToken && element.initializer)
        out.set(
          (element.propertyName || element.name).getText(),
          element.initializer.getText(),
        );
  return out;
}

/**
 * For each manifest, `{ file, props, dependencies, accepts }` where props maps every prop the
 * kit itself declares (inherited DOM/React attributes are excluded) to
 * `{ type, required, default? }`, and dependencies lists the catalogue IDs the
 * component renders or calls, following non-catalogue local helpers, plus the
 * catalogue component that provides a context it requires (a context created
 * with a `null` default).
 */
export function componentApi(root, manifests) {
  const prog = program(root);
  const checker = prog.getTypeChecker();
  const src = resolve(root, "src") + "/";
  const index = prog.getSourceFile(resolve(root, "src/index.ts"));
  const exported = new Map(
    checker
      .getExportsOfModule(checker.getSymbolAtLocation(index))
      .map((s) => [s.name, s]),
  );
  const resolveSymbol = (symbol) =>
    symbol && symbol.flags & ts.SymbolFlags.Alias
      ? checker.getAliasedSymbol(symbol)
      : symbol;
  const inKit = (node) => node.getSourceFile().fileName.startsWith(src);
  const idByDeclaration = new Map();
  const declarations = new Map();
  for (const m of manifests) {
    const symbol = resolveSymbol(exported.get(m.export));
    const declaration = symbol?.declarations?.[0];
    if (!declaration) continue;
    declarations.set(m.id, declaration);
    idByDeclaration.set(declaration, m.id);
  }
  // Contexts that must be provided (null default) -> the components providing them.
  const providers = new Map();
  for (const [id, declaration] of declarations) {
    const visit = (node) => {
      if (
        (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
        ts.isPropertyAccessExpression(node.tagName) &&
        node.tagName.name.text === "Provider"
      ) {
        const ctx = resolveSymbol(
          checker.getSymbolAtLocation(node.tagName.expression),
        );
        if (ctx) providers.set(ctx, id);
      }
      ts.forEachChild(node, visit);
    };
    visit(declaration);
  }
  const requiredContext = (symbol) => {
    const d = symbol?.declarations?.[0];
    const init = d && ts.isVariableDeclaration(d) ? d.initializer : undefined;
    return (
      init &&
      ts.isCallExpression(init) &&
      init.expression.getText() === "createContext" &&
      init.arguments[0]?.kind === ts.SyntaxKind.NullKeyword
    );
  };

  function dependencies(id) {
    const found = new Set();
    const seen = new Set([declarations.get(id)]);
    const queue = [declarations.get(id)];
    while (queue.length) {
      const node = queue.pop();
      const visit = (n) => {
        let target;
        if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n))
          target = n.tagName;
        else if (ts.isCallExpression(n)) {
          target = n.expression;
          if (
            ts.isIdentifier(target) &&
            target.text === "useContext" &&
            n.arguments[0]
          ) {
            const ctx = resolveSymbol(
              checker.getSymbolAtLocation(n.arguments[0]),
            );
            if (requiredContext(ctx) && providers.has(ctx))
              found.add(providers.get(ctx));
          }
        }
        if (target && ts.isIdentifier(target)) {
          const symbol = resolveSymbol(checker.getSymbolAtLocation(target));
          for (const d of symbol?.declarations || []) {
            if (!inKit(d)) continue;
            const dep = idByDeclaration.get(d);
            if (dep) {
              if (dep !== id) found.add(dep);
            } else if (!seen.has(d)) {
              seen.add(d);
              queue.push(d);
            }
          }
        }
        ts.forEachChild(n, visit);
      };
      visit(node);
    }
    return [...found].sort();
  }

  const api = new Map();
  for (const m of manifests) {
    const declaration = declarations.get(m.id);
    if (!declaration) continue;
    const type = checker.getTypeOfSymbolAtLocation(
      resolveSymbol(exported.get(m.export)),
      declaration,
    );
    const signature = type.getCallSignatures()[0];
    const parameter = signature?.parameters[0];
    const props = {};
    const accepts = new Set();
    if (parameter) {
      const defaultValues = defaults(implementation(declaration));
      const propsType = checker.getTypeOfSymbolAtLocation(
        parameter,
        declaration,
      );
      for (const prop of propsType.getProperties()) {
        accepts.add(prop.name);
        const d = prop.declarations?.[0];
        if (!d || !inKit(d)) continue;
        const entry = {
          // The declared type node keeps aliases such as ReactNode and ElementType
          // readable; literal unions are expanded either way.
          type: describeType(
            checker,
            d.type
              ? checker.getTypeFromTypeNode(d.type)
              : checker.getTypeOfSymbolAtLocation(prop, declaration),
          ),
          required: !(prop.flags & ts.SymbolFlags.Optional),
        };
        if (defaultValues.has(prop.name))
          entry.default = defaultValues.get(prop.name);
        props[prop.name] = entry;
      }
    }
    api.set(m.id, {
      file: relative(root, declaration.getSourceFile().fileName),
      props: Object.fromEntries(
        Object.entries(props).sort(([a], [b]) => a.localeCompare(b)),
      ),
      dependencies: dependencies(m.id),
      // Every prop name the component accepts, including inherited DOM attributes.
      accepts,
    });
  }
  return api;
}
