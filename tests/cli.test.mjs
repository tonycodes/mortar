// The `mortar` CLI and MCP tools against the real catalogue (cli/, bin/mortar.mjs).
import test from "node:test";
import assert from "node:assert/strict";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadData, GUIDES } from "../cli/data.mjs";
import { searchComponents } from "../cli/search.mjs";
import { componentDetail, buildPacket } from "../cli/packet.mjs";
import {
  auditApp,
  blankStrings,
  satisfies,
  jsxAttributes,
  RULES,
} from "../cli/audit.mjs";
import { TOOLS, validateArguments } from "../cli/tools.mjs";
import {
  REMOVED_EXPORTS,
  RENAMED_PROPS,
  GENERAL_PROPS,
} from "../cli/migrations.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const BIN = join(ROOT, "bin/mortar.mjs");
const data = await loadData();
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const names = (results) => results.map((r) => r.name);

test("the data describes the installed package version", () => {
  assert.equal(data.version, pkg.version);
  assert.equal(data.agent.version, pkg.version);
  assert.equal(data.components.length, data.catalog.components.length);
  assert.ok(
    !data.agent.missing,
    "run npm run build to generate dist/agent-data.json",
  );
});

test("search ranks the components a request needs first", () => {
  assert.deepEqual(
    names(searchComponents(data, { query: "sign in", limit: 2 })).sort(),
    ["AuthLayout", "SignInPanel"],
  );
  assert.deepEqual(
    names(searchComponents(data, { query: "login", limit: 2 })).sort(),
    ["AuthLayout", "SignInPanel"],
  );
  assert.equal(
    searchComponents(data, { query: "DataTable" })[0].name,
    "DataTable",
  );
  assert.equal(searchComponents(data, { query: "pricing" })[0].name, "Pricing");
  assert.ok(
    names(searchComponents(data, { query: "table", limit: 3 })).includes(
      "DataTable",
    ),
  );
  const marketing = searchComponents(data, {
    query: "testimonial",
    kit: "marketing",
  });
  assert.ok(marketing.length);
  assert.ok(marketing.every((r) => r.kit === "marketing"));
  const auth = searchComponents(data, {
    query: "",
    category: "auth",
    limit: 50,
  });
  assert.ok(names(auth).includes("PasswordInput"));
  assert.ok(auth.every((r) => r.category === "Sign-in and registration"));
  const [first] = searchComponents(data, { query: "sign in" });
  assert.deepEqual(Object.keys(first).sort(), [
    "capabilities",
    "category",
    "description",
    "kit",
    "matched",
    "name",
    "score",
  ]);
});

test("get_component returns the contract with prop types and an example", () => {
  const c = componentDetail(data, data.find("datatable"));
  assert.equal(c.name, "DataTable");
  assert.equal(c.import, 'import { DataTable } from "@tonycodes-ui/mortar";');
  assert.equal(c.marker, 'data-m-component="DataTable"');
  assert.equal(c.kit, "application");
  assert.ok(c.categoryTitle);
  const columns = c.props.find((p) => p.name === "columns");
  assert.equal(columns.required, true);
  assert.ok(columns.type);
  assert.ok(c.props.some((p) => p.default !== undefined));
  assert.ok(c.dependencies.length);
  assert.match(
    c.example,
    /^import \{[^}]*\bDataTable\b[^}]*\} from "@tonycodes-ui\/mortar";/,
  );
  assert.match(c.example, /<DataTable\b/);
  for (const component of data.components)
    assert.ok(
      data.agent.examples[component.export]?.includes(`<${component.export}`) ||
        component.export === "ThemeProvider",
      `example for ${component.export}`,
    );
  const auth = componentDetail(data, data.find("AuthLayout"));
  assert.ok(auth.templates.includes("sign-in"));
  assert.match(auth.usage, /AuthLayout/);
});

test("a build packet includes the dependency closure and setup", () => {
  const packet = buildPacket(data, { components: ["SignInPanel"] });
  const deps = packet.dependencies.components.map((d) => d.name);
  // SignInPanel renders ProviderButtons, which renders Button.
  for (const name of ["Button", "Divider", "Input", "ProviderButtons"])
    assert.ok(deps.includes(name), name);
  assert.deepEqual(
    packet.dependencies.components.find((d) => d.name === "ProviderButtons")
      .requiredBy,
    ["SignInPanel"],
  );
  assert.equal(
    packet.import,
    'import { SignInPanel, ThemeProvider } from "@tonycodes-ui/mortar";',
  );
  assert.match(
    packet.css.code,
    /@import "tailwindcss";\n@import "@tonycodes-ui\/mortar\/styles\.css";/,
  );
  assert.match(packet.themeProvider.code, /<ThemeProvider/);
  assert.equal(packet.principles.length, 6);
  assert.equal(packet.principles[0].id, "shell-first");
  assert.match(packet.conventions, /^## API conventions/);
  assert.ok(packet.guides.includes("auth-flows"));
  assert.ok(packet.templates.length);

  const closure = buildPacket(data, { components: ["AppShell", "Nope"] });
  assert.equal(closure.unknown[0].name, "Nope");
  // Every transitive dependency is present.
  const all = new Set([
    "AppShell",
    ...closure.dependencies.components.map((d) => d.name),
  ]);
  for (const name of all)
    for (const id of data.find(name).contract.dependencies)
      assert.ok(all.has(data.byId(id).export), `${name} → ${id}`);
});

test("a build packet for a brief starts from the purpose shell and explains choices", () => {
  const app = buildPacket(data, {
    brief: "An admin dashboard listing invoices in a table with filters",
  });
  const chosen = app.components.map((c) => c.name);
  assert.equal(chosen[0], "AppShell");
  assert.ok(chosen.includes("DataTable"));
  assert.ok(app.components.every((c) => c.why?.length));
  const auth = buildPacket(data, {
    brief: "sign up flow with email verification and two-factor",
  });
  assert.equal(auth.components[0].name, "AuthLayout");
  assert.ok(auth.components.some((c) => c.name === "CodeInput"));
  assert.ok(auth.templates.some((t) => t.id === "two-factor"));
  const site = buildPacket(data, {
    brief: "a landing page with pricing and a FAQ",
  });
  assert.ok(
    ["MarketingHeader", "Footer", "Pricing", "FAQ"].every((n) =>
      site.components.some((c) => c.name === n),
    ),
  );
  assert.equal(site.templates[0].id, "saas-landing");
});

test("every guide topic loads from the package", () => {
  for (const topic of Object.keys(GUIDES)) {
    const text = data.guide(topic);
    assert.ok(text && text.length > 200, topic);
  }
  assert.match(data.guide("conventions"), /^## API conventions/);
  assert.doesNotMatch(data.guide("conventions"), /## Composing flows/);
  assert.match(data.guide("auth-flows"), /AuthLayout/);
  assert.match(data.guide("contributing"), /# Agent instructions/);
});

test("list_kits covers every component once", () => {
  const kits = TOOLS.find((t) => t.name === "list_kits").run(data, {});
  const listed = kits.kits.flatMap((k) =>
    k.categories.flatMap((c) => c.components),
  );
  assert.equal(listed.length, new Set(listed).size);
  assert.deepEqual(
    [...listed].sort(),
    data.components.map((c) => c.export).sort(),
  );
  assert.ok(kits.templates.some((t) => t.id === "settings"));
});

test("tool definitions are valid for MCP clients", () => {
  for (const tool of TOOLS) {
    assert.match(tool.name, /^[a-z_]+$/);
    assert.ok(tool.description.length > 80, tool.name);
    assert.equal(tool.inputSchema.type, "object");
    // Some clients reject combinators at the top level of a tool schema.
    for (const key of ["anyOf", "oneOf", "allOf"])
      assert.equal(tool.inputSchema[key], undefined);
  }
  const search = TOOLS.find((t) => t.name === "search_components");
  assert.equal(validateArguments(search, { query: "x" }), undefined);
  assert.match(validateArguments(search, {}), /query/);
  assert.match(
    validateArguments(search, { query: "x", limit: "3" }),
    /integer/,
  );
  assert.match(validateArguments(search, { query: "x", other: 1 }), /unknown/);
  const guide = TOOLS.find((t) => t.name === "get_guide");
  assert.match(validateArguments(guide, { topic: "nope" }), /one of/);
});

test("migration hints point at props and exports that exist", () => {
  const exports = new Set([
    ...data.agent.exports.values,
    ...data.agent.exports.types,
  ]);
  for (const [name, { replacement }] of Object.entries(REMOVED_EXPORTS)) {
    assert.ok(!exports.has(name), name);
    assert.ok(exports.has(replacement), replacement);
  }
  for (const [component, props] of Object.entries(RENAMED_PROPS)) {
    const c = data.find(component);
    assert.ok(c, component);
    for (const [from, { to }] of Object.entries(props)) {
      assert.ok(
        !data.accepts(c).has(from),
        `${component}.${from} still exists`,
      );
      assert.ok(c.contract.propTypes[to], `${component}.${to}`);
    }
  }
  for (const to of new Set(Object.values(GENERAL_PROPS)))
    assert.ok(
      data.components.some((c) => c.contract.propTypes[to]),
      to,
    );
});

test("version ranges", () => {
  assert.equal(satisfies("0.11.0", "^0.11.0"), true);
  assert.equal(satisfies("0.12.0", "^0.11.0"), false);
  assert.equal(satisfies("0.11.3", "~0.11.1"), true);
  assert.equal(satisfies("0.5.9", "^0.5.0"), true);
  assert.equal(satisfies("0.11.0", ">=0.6.0"), true);
  assert.equal(satisfies("0.11.0", ">=0.6.0 <0.11.0"), false);
  assert.equal(satisfies("1.2.0", "1.x"), true);
  assert.equal(satisfies("1.2.0", "0.x || 1"), true);
  assert.equal(satisfies("1.0.0-rc.1", "^1.0.0"), false);
  assert.equal(satisfies("1.0.0-rc.2", "^1.0.0-rc.1"), true);
  assert.equal(satisfies("0.11.0", "*"), true);
  assert.equal(satisfies("0.11.0", "0.9.0 - 0.11.0"), true);
  assert.equal(satisfies("0.11.0", "latest"), undefined);
  assert.equal(satisfies("0.11.0", "file:../mortar"), undefined);
});

test("the JSX scanner reads attributes across lines, braces and strings", () => {
  const src = `<Button\n  variant="primary"\n  onClick={() => { go("}"); }}\n  {...rest}\n  label={'x'}\n  disabled\n  aria-label="a > b"\n>`;
  const attrs = jsxAttributes(src, "<Button".length);
  assert.deepEqual(
    attrs.map((a) => [a.name, a.value]),
    [
      ["variant", "primary"],
      ["onClick", undefined],
      ["label", "x"],
      ["disabled", undefined],
      ["aria-label", "a > b"],
    ],
  );
});

/** A copy of a fixture app with this package "installed" in node_modules. */
function fixture(name, { version = pkg.version, files = {} } = {}) {
  const dir = mkdtempSync(join(tmpdir(), `mortar-${name}-`));
  cpSync(join(ROOT, "tests/fixtures", name), dir, { recursive: true });
  if (version) {
    const installed = join(dir, "node_modules/@tonycodes-ui/mortar");
    mkdirSync(installed, { recursive: true });
    writeFileSync(
      join(installed, "package.json"),
      JSON.stringify({ name: "@tonycodes-ui/mortar", version }),
    );
  }
  for (const [file, text] of Object.entries(files)) {
    mkdirSync(join(dir, file, ".."), { recursive: true });
    writeFileSync(join(dir, file), text);
  }
  return dir;
}

const has = (report, rule, file, pattern) =>
  report.findings.some(
    (f) =>
      f.rule === rule &&
      (!file || f.file === file) &&
      (!pattern || pattern.test(`${f.message} ${f.fix ?? ""}`)),
  );

test("the audit finds the seeded problems, with locations and fixes", async (t) => {
  const dir = fixture("audit-app");
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const before = readFileSync(join(dir, "src/App.tsx"), "utf8");
  const report = await auditApp(dir);
  const app = "src/App.tsx";
  assert.ok(has(report, "version-mismatch", "package.json", /\^0\.5\.0/));
  assert.ok(
    has(report, "unknown-export", app, /MarketingTone[\s\S]*SectionTone/),
  );
  assert.ok(has(report, "deep-import", app, /mortar\/src/));
  assert.ok(has(report, "unknown-prop", app, /"align"[\s\S]*`layout`/));
  assert.ok(has(report, "unknown-prop", app, /"heading"[\s\S]*`title`/));
  assert.ok(has(report, "unknown-prop", app, /<Button> has no prop "colour"/));
  assert.ok(
    has(report, "invalid-value", app, /centered[\s\S]*layout="center"/),
  );
  assert.ok(has(report, "css-override", "src/index.css", /\.m-button/));
  assert.ok(has(report, "raw-colour", app, /#ff3366/));
  assert.ok(has(report, "missing-styles", "src/index.css"));
  assert.ok(has(report, "missing-theme-provider", app));
  // Inherited DOM props are not reported.
  assert.ok(!has(report, "unknown-prop", app, /"onClick"/));
  const align = report.findings.find((f) => /"align"/.test(f.message));
  assert.equal(
    align.line,
    before.split("\n").findIndex((l) => l.includes(`align="center"`)) + 1,
  );
  assert.equal(report.findings.find((f) => f.rule === "css-override").line, 4);
  for (const f of report.findings) {
    assert.ok(RULES[f.rule], f.rule);
    assert.ok(["error", "warning", "info"].includes(f.severity));
  }
  assert.equal(
    report.summary.error,
    report.findings.filter((f) => f.severity === "error").length,
  );
  // Read-only.
  assert.equal(readFileSync(join(dir, "src/App.tsx"), "utf8"), before);
});

test("the audit does not flag colours that define a brand", async (t) => {
  const dir = fixture("clean-app", {
    files: {
      "src/Brand.tsx": readFileSync(
        join(ROOT, "tests/fixtures/brand-colours/Brand.tsx"),
        "utf8",
      ),
    },
  });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const report = await auditApp(dir);
  const brand = report.findings.filter(
    (f) => f.file === "src/Brand.tsx" && f.rule === "raw-colour",
  );
  // brandTokens objects (inline and a const), brandToCss arguments, a
  // BrandDefinition-typed and a satisfies object, and --m-brand-* values are
  // exempt; the stray colour in the same file is still reported.
  assert.deepEqual(
    brand.map((f) => [f.line, f.message]),
    [[31, "Raw colour #ff00aa in a file that renders Mortar components."]],
  );
});

test("the audit finds nothing in a clean app", async (t) => {
  const dir = fixture("clean-app");
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const report = await auditApp(dir);
  assert.deepEqual(report.findings, []);
  assert.equal(report.mortar.installed, pkg.version);
});

test("the audit detects copies, class overrides and palette classes", async (t) => {
  const dir = fixture("clean-app", {
    files: {
      "src/vendor/primitives.tsx": readFileSync(
        join(ROOT, "src/primitives.tsx"),
        "utf8",
      ),
      "src/Extra.tsx": [
        'import { Button } from "@tonycodes-ui/mortar";',
        "export const Extra = () => (",
        '  <div className="m-card [&_.m-button]:rounded-none bg-blue-500 dark:text-white">',
        "    <Button>Go</Button>",
        "  </div>",
        ");",
      ].join("\n"),
      "src/late.css":
        '@import "@tonycodes-ui/mortar/styles.css";\n@import "tailwindcss";\n[data-m-component="Button"] { color: red; }\n',
    },
  });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const report = await auditApp(dir);
  assert.ok(
    has(
      report,
      "local-copy",
      "src/vendor/primitives.tsx",
      /src\/primitives\.tsx/,
    ),
  );
  assert.ok(has(report, "class-override", "src/Extra.tsx", /m-button/));
  assert.ok(has(report, "kit-class", "src/Extra.tsx", /m-card/));
  assert.ok(has(report, "raw-colour", "src/Extra.tsx", /bg-blue-500/));
  assert.ok(has(report, "raw-colour", "src/Extra.tsx", /dark:text-white/));
  assert.ok(has(report, "styles-order", "src/late.css"));
  assert.ok(has(report, "css-override", "src/late.css", /data-m-component/));
});

test("the audit flags raw elements that a Mortar component replaces", async (t) => {
  // #76: Hive's API keys panel shipped a raw <table> and the audit was clean.
  const keys = [
    "export const Keys = ({ rows }: { rows: string[] }) => (",
    "  <table>",
    "    <tbody>{rows.map((r) => <tr key={r}><td>{r}</td></tr>)}</tbody>",
    "  </table>",
    ");",
  ].join("\n");
  const form = [
    'import { Button } from "@tonycodes-ui/mortar";',
    'const email = "<table><tr><td>Hi</td></tr></table>";',
    "export const Form = ({ kind }: { kind: string }) => (",
    "  <form>",
    '    <p>Don\'t <select name="plan" /></p>',
    '    <input type="checkbox" />',
    '    <input type={"email"} name="e" />',
    "    <input type={kind} />",
    '    <input type="hidden" name="csrf" />',
    '    <input type="file" />',
    "    <textarea />",
    "    <button>Raw</button>",
    "    <Button>Kit</Button>",
    "  </form>",
    ");",
  ].join("\n");
  const dir = fixture("clean-app", {
    files: { "src/Keys.tsx": keys, "src/Form.tsx": form },
  });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const report = await auditApp(dir);
  const raw = report.findings
    .filter((f) => f.rule === "raw-element")
    .map((f) => [f.file, f.line, f.severity, f.message, f.fix]);
  const use = (names, id) =>
    `Use ${names} from "@tonycodes-ui/mortar" (mortar component ${id}).`;
  assert.deepEqual(raw, [
    [
      "src/Form.tsx",
      5,
      "error",
      "Raw <select> in an app that uses Mortar.",
      use("<Select>", "Select"),
    ],
    [
      "src/Form.tsx",
      6,
      "error",
      'Raw <input type="checkbox"> in an app that uses Mortar.',
      use("<Checkbox> or <Switch>", "Checkbox"),
    ],
    [
      "src/Form.tsx",
      7,
      "error",
      "Raw <input> in an app that uses Mortar.",
      use("<Input>", "Input"),
    ],
    [
      "src/Form.tsx",
      8,
      "error",
      "Raw <input> in an app that uses Mortar.",
      use("<Input>", "Input"),
    ],
    [
      "src/Form.tsx",
      11,
      "error",
      "Raw <textarea> in an app that uses Mortar.",
      use("<TextArea>", "TextArea"),
    ],
    // A file that imports nothing from Mortar is still part of the app.
    [
      "src/Keys.tsx",
      2,
      "error",
      "Raw <table> in an app that uses Mortar.",
      use("<DataTable> or <Table>", "DataTable"),
    ],
    [
      "src/Form.tsx",
      12,
      "warning",
      "Raw <button> in an app that uses Mortar.",
      use("<Button>", "Button"),
    ],
  ]);
});

test("a passing fixture that uses DataTable stays clean", async (t) => {
  // #76: the failing raw <table> fixture has a pair that renders DataTable.
  const dir = fixture("data-table-app");
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const source = readFileSync(join(dir, "src/App.tsx"), "utf8");
  assert.match(source, /<DataTable\b/);
  assert.match(
    source,
    /import\s*\{[^}]*\bDataTable\b[^}]*\}\s*from\s*"@tonycodes-ui\/mortar"/,
  );
  const report = await auditApp(dir);
  assert.deepEqual(
    report.findings.filter((f) => f.rule === "raw-element"),
    [],
  );
  assert.deepEqual(report.findings, []);
});

/** Raw tags still visible after string and template contents are blanked. */
function rawTags(src) {
  return [
    ...blankStrings(src).matchAll(
      /<(table|select|textarea|dialog|progress)\b/g,
    ),
  ].map((m) => m[1]);
}

test("blankStrings blanks HTML in arrows, case, throw and nested templates", () => {
  assert.deepEqual(
    {
      arrow: rawTags(
        'const markup = () => "<table><tr><td>Hi</td></tr></table>";',
      ),
      bare: rawTags(
        "const select = r => '<select><option>A</option></select>';",
      ),
      case: rawTags(
        'switch (code) {\n  case "<textarea></textarea>":\n    break;\n}',
      ),
      throw: rawTags('throw "<dialog open></dialog>";'),
      nested: rawTags(
        'const nested = `<div>${ok ? `<table><tr></tr></table>` : ""}</div>`;',
      ),
      // A backtick quoted inside ${} must not swallow the next line.
      quoted: rawTags('const label = `Count ${n ?? "`"}`;\nreturn <table />;'),
      // JSX inside an interpolation is code, not template text.
      jsx: rawTags("const view = `${<table />}`;"),
      returned: rawTags('return "<table></table>";'),
      apostrophe: rawTags(
        "export const View = () => (\n  <p>Don't <select /></p>\n);",
      ),
    },
    {
      arrow: [],
      bare: [],
      case: [],
      throw: [],
      nested: [],
      quoted: ["table"],
      jsx: ["table"],
      returned: [],
      apostrophe: ["select"],
    },
  );
});

test("string and nested-template HTML is not reported as a raw element", async (t) => {
  const file = [
    'import { Button } from "@tonycodes-ui/mortar";',
    'const arrow = () => "<table><tr><td>Hi</td></tr></table>";',
    "const bare = r => '<select><option>A</option></select>';",
    "export function status(code) {",
    "  switch (code) {",
    '    case "<textarea>note</textarea>":',
    "      break;",
    "    default:",
    '      throw "<dialog>no</dialog>";',
    "  }",
    "}",
    'const nested = `<div>${ok ? `<table><tr></tr></table>` : ""}</div>`;',
    "export const Screen = () => <Button>Go</Button>;",
  ].join("\n");
  const dir = fixture("clean-app", { files: { "src/Strings.tsx": file } });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const report = await auditApp(dir);
  assert.deepEqual(
    report.findings.filter((f) => f.rule === "raw-element"),
    [],
  );
});

test("a quoted backtick inside a template does not hide a later raw element", async (t) => {
  const file = [
    'import { Button } from "@tonycodes-ui/mortar";',
    'const label = `Count ${n ?? "`"}`;',
    "export const View = () => (",
    "  <table>",
    "    <tbody />",
    "  </table>",
    ");",
  ].join("\n");
  const dir = fixture("clean-app", { files: { "src/Quoted.tsx": file } });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const report = await auditApp(dir);
  const raw = report.findings
    .filter((f) => f.rule === "raw-element")
    .map((f) => [f.file, f.line, f.severity, f.message]);
  assert.deepEqual(raw, [
    ["src/Quoted.tsx", 4, "error", "Raw <table> in an app that uses Mortar."],
  ]);
});

test("raw elements are not reported in an app that does not use Mortar", async (t) => {
  const dir = fixture("clean-app", { version: null });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  rmSync(join(dir, "src/App.tsx"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "x" }));
  writeFileSync(
    join(dir, "src/Plain.tsx"),
    "export const Plain = () => <table />;\n",
  );
  const report = await auditApp(dir);
  assert.ok(!has(report, "raw-element"));
});

test("the audit reports a missing install and declaration", async (t) => {
  const dir = fixture("clean-app", { version: null });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "x" }));
  const report = await auditApp(dir);
  assert.ok(has(report, "not-installed"));
  assert.ok(has(report, "not-declared", "package.json"));
});

test("the audit says when it checks an older release against this catalogue", async (t) => {
  const dir = fixture("clean-app", { version: "0.6.0" });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const report = await auditApp(dir);
  assert.deepEqual(
    report.findings.map((f) => [f.rule, f.severity]),
    [["limited-data", "info"]],
  );
  assert.equal(report.mortar.installed, "0.6.0");
});

test("the CLI prints help, version, search, packets and audits", (t) => {
  const run = (...args) =>
    execFileSync(process.execPath, [BIN, ...args], { encoding: "utf8" });
  assert.match(run("--help"), /mortar mcp/);
  assert.equal(run("--version").trim(), pkg.version);
  assert.match(run("search", "sign", "in"), /SignInPanel/);
  assert.equal(
    JSON.parse(run("search", "pricing", "--json"))[0].name,
    "Pricing",
  );
  assert.match(
    run("component", "Button"),
    /variant\?: "accent" \| "danger" \| "ghost"/,
  );
  const packet = JSON.parse(run("packet", "AppShell", "--json"));
  assert.equal(packet.components[0].name, "AppShell");
  assert.match(run("guide", "theming"), /# Theming/);
  assert.match(run("skill"), /^---\nname: mortar\n/);
  const dir = fixture("audit-app");
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  let failed;
  try {
    run("audit", dir, "--json");
  } catch (error) {
    failed = error;
  }
  assert.equal(failed?.status, 1);
  assert.ok(JSON.parse(failed.stdout).summary.error > 0);
  const clean = fixture("clean-app");
  t.after(() => rmSync(clean, { recursive: true, force: true }));
  assert.match(run("audit", clean), /0 errors, 0 warnings/);
});
