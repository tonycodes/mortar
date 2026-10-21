// The stdio MCP server (`mortar mcp`): JSON-RPC 2.0 framing, the MCP lifecycle,
// tools, errors, and nothing but protocol messages on stdout. A second test
// drives it with the official MCP SDK client when that devDependency is installed.
import test from "node:test";
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { readFileSync } from "node:fs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const BIN = join(ROOT, "bin/mortar.mjs");
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));

/** Send raw lines to a fresh server, close stdin, and collect every stdout line. */
function session(lines) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [BIN, "mcp"], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", reject);
    child.on("close", (code) =>
      resolve({ code, stderr, lines: stdout.split("\n").filter(Boolean) }),
    );
    for (const line of lines)
      child.stdin.write(
        (typeof line === "string" ? line : JSON.stringify(line)) + "\n",
      );
    child.stdin.end();
  });
}

const initialize = (id = 1, protocolVersion = "2025-06-18") => ({
  jsonrpc: "2.0",
  id,
  method: "initialize",
  params: {
    protocolVersion,
    capabilities: {},
    clientInfo: { name: "test", version: "1.0.0" },
  },
});

test("the server speaks newline-delimited JSON-RPC over stdio", async () => {
  const { code, lines } = await session([
    initialize(),
    { jsonrpc: "2.0", method: "notifications/initialized" },
    { jsonrpc: "2.0", id: 2, method: "tools/list" },
    {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "search_components", arguments: { query: "sign in" } },
    },
    {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: { name: "get_component", arguments: { name: "Button" } },
    },
    {
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: { name: "get_component", arguments: { name: "NoSuchThing" } },
    },
    {
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: { name: "get_component", arguments: {} },
    },
    {
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: { name: "no_such_tool", arguments: {} },
    },
    { jsonrpc: "2.0", id: 8, method: "resources/list" },
    { jsonrpc: "2.0", id: 9, method: "ping" },
    "{not json",
    { jsonrpc: "1.0", id: 10, method: "ping" },
    {
      jsonrpc: "2.0",
      id: "g",
      method: "tools/call",
      params: { name: "get_guide", arguments: { topic: "theming" } },
    },
  ]);
  assert.equal(code, 0);
  // Every stdout line is a JSON-RPC response; notifications get none.
  const messages = lines.map((l) => JSON.parse(l));
  for (const m of messages) assert.equal(m.jsonrpc, "2.0");
  assert.deepEqual(
    messages.map((m) => m.id),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 10, "g"],
  );
  const byId = (id) => messages.find((m) => m.id === id);

  const init = byId(1).result;
  assert.equal(init.protocolVersion, "2025-06-18");
  assert.deepEqual(Object.keys(init.capabilities), ["tools"]);
  assert.equal(init.serverInfo.name, "mortar");
  assert.equal(init.serverInfo.version, pkg.version);

  const tools = byId(2).result.tools;
  assert.deepEqual(
    tools.map((t) => t.name),
    [
      "search_components",
      "get_component",
      "get_build_packet",
      "get_guide",
      "list_kits",
      "audit_app",
    ],
  );
  for (const t of tools) {
    assert.equal(t.inputSchema.type, "object");
    assert.equal(t.run, undefined);
  }

  const search = JSON.parse(byId(3).result.content[0].text);
  assert.deepEqual(
    search.results
      .slice(0, 2)
      .map((r) => r.name)
      .sort(),
    ["AuthLayout", "SignInPanel"],
  );
  const button = JSON.parse(byId(4).result.content[0].text);
  assert.equal(button.name, "Button");
  assert.ok(button.props.some((p) => p.name === "variant"));
  assert.ok(button.example);

  assert.equal(byId(5).result.isError, true);
  assert.match(byId(5).result.content[0].text, /No component named/);
  assert.equal(byId(6).result.isError, true);
  assert.match(
    byId(6).result.content[0].text,
    /missing required argument "name"/,
  );
  assert.equal(byId(7).error.code, -32602);
  assert.equal(byId(8).error.code, -32601);
  assert.deepEqual(byId(9).result, {});
  assert.equal(messages[9].error.code, -32700);
  assert.equal(messages[10].error.code, -32600);
  assert.match(byId("g").result.content[0].text, /^# Theming/);
});

test("the server negotiates the protocol version", async () => {
  const { lines } = await session([
    initialize(1, "2024-11-05"),
    initialize(2, "1999-01-01"),
    { jsonrpc: "2.0", id: 3, method: "initialize", params: {} },
  ]);
  const [older, unknown, missing] = lines.map((l) => JSON.parse(l));
  assert.equal(older.result.protocolVersion, "2024-11-05");
  // An unsupported request gets the newest version the server supports.
  assert.match(unknown.result.protocolVersion, /^\d{4}-\d{2}-\d{2}$/);
  assert.notEqual(unknown.result.protocolVersion, "1999-01-01");
  assert.equal(missing.error.code, -32602);
});

test("audit_app runs over MCP and never writes outside JSON-RPC", async () => {
  const fixture = join(ROOT, "tests/fixtures/audit-app");
  const { lines } = await session([
    initialize(),
    {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: "audit_app", arguments: { path: fixture } },
    },
  ]);
  assert.equal(lines.length, 2);
  const report = JSON.parse(JSON.parse(lines[1]).result.content[0].text);
  assert.ok(report.findings.some((f) => f.rule === "css-override"));
});

test("the official MCP SDK client can use the server", async (t) => {
  let Client, StdioClientTransport;
  try {
    ({ Client } = await import("@modelcontextprotocol/sdk/client/index.js"));
    ({ StdioClientTransport } =
      await import("@modelcontextprotocol/sdk/client/stdio.js"));
  } catch {
    t.skip("@modelcontextprotocol/sdk is not installed (npm ci installs it)");
    return;
  }
  const client = new Client({ name: "mortar-test", version: "1.0.0" });
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [BIN, "mcp"],
      stderr: "pipe",
    }),
  );
  try {
    assert.equal(client.getServerVersion().name, "mortar");
    assert.ok(client.getServerCapabilities().tools);
    const { tools } = await client.listTools();
    assert.equal(tools.length, 6);
    const result = await client.callTool({
      name: "get_build_packet",
      arguments: { components: ["SignInPanel"] },
    });
    assert.ok(!result.isError);
    const packet = JSON.parse(result.content[0].text);
    assert.ok(
      packet.dependencies.components.some((d) => d.name === "ProviderButtons"),
    );
    await client.ping();
  } finally {
    await client.close();
  }
});

test("npm pack ships the CLI, its data and the docs it reads", () => {
  const [packed] = JSON.parse(
    execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }),
  );
  const files = new Set(packed.files.map((f) => f.path));
  for (const file of [
    "bin/mortar.mjs",
    "cli/mcp.mjs",
    "cli/tools.mjs",
    "cli/data.mjs",
    "cli/search.mjs",
    "cli/packet.mjs",
    "cli/audit.mjs",
    "cli/migrations.mjs",
    "dist/agent-data.json",
    "catalog.json",
    "design-principles.json",
    "DESIGN.md",
    "AGENTS.md",
    "CONTRIBUTING.md",
    "TESTING.md",
    "docs/agents.md",
    "docs/theming.md",
    "docs/auth-flows.md",
    "docs/migrating-to-0.6.md",
    "skills/mortar/SKILL.md",
  ])
    assert.ok(files.has(file), `${file} is not packed`);
  for (const file of files)
    assert.doesNotMatch(file, /^(tests|scripts|playground|docs\/images)\//);
  assert.equal(pkg.bin.mortar, "./bin/mortar.mjs");
  assert.match(
    readFileSync(join(ROOT, pkg.bin.mortar), "utf8"),
    /^#!\/usr\/bin\/env node\n/,
  );
  // The CLI adds no runtime dependencies.
  assert.deepEqual(Object.keys(pkg.dependencies), ["@headlessui/react"]);
});
