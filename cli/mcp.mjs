// A Model Context Protocol server over stdio: newline-delimited JSON-RPC 2.0 on
// stdin/stdout, implemented without dependencies. Only JSON-RPC messages are
// written to stdout; diagnostics go to stderr.
import { createInterface } from "node:readline";
import { loadData } from "./data.mjs";
import { TOOLS, ToolError, validateArguments } from "./tools.mjs";

/** Protocol revisions this server speaks, newest first. */
export const PROTOCOL_VERSIONS = [
  "2025-11-25",
  "2025-06-18",
  "2025-03-26",
  "2024-11-05",
];

export const ERRORS = {
  PARSE: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL: -32603,
};

class RpcError extends Error {
  constructor(code, message, data) {
    super(message);
    this.code = code;
    this.data = data;
  }
}

const INSTRUCTIONS =
  "Mortar is an MIT React 19 + Tailwind 4 UI kit (@tony-ui/mortar). Before writing UI, search_components (or list_kits) to find what to reuse, then get_build_packet for the components or the brief and compose from it: start from the purpose shell (AppShell, MarketingHeader, DocsShell, AuthLayout), use named imports and the exact props in each contract, theme through ThemeProvider and tokens, never copy components or override .m-* classes. Run audit_app on the application when done and fix its findings. Missing shared patterns are contributed to the kit by GitHub pull request (get_guide contributing).";

/**
 * Handle one parsed JSON-RPC message. Returns the response object, or
 * undefined for notifications.
 */
export async function handleMessage(message, context) {
  const isObject =
    message && typeof message === "object" && !Array.isArray(message);
  const id = isObject && "id" in message ? message.id : undefined;
  const respond = (result) => ({ jsonrpc: "2.0", id, result });
  const fail = (code, msg, data) => ({
    jsonrpc: "2.0",
    id: id === undefined ? null : id,
    error: { code, message: msg, ...(data !== undefined ? { data } : {}) },
  });
  if (
    !isObject ||
    message.jsonrpc !== "2.0" ||
    typeof message.method !== "string" ||
    (id !== undefined &&
      id !== null &&
      typeof id !== "string" &&
      typeof id !== "number")
  ) {
    // A response from the client (we never send requests) needs no answer.
    if (
      isObject &&
      message.jsonrpc === "2.0" &&
      ("result" in message || "error" in message)
    )
      return undefined;
    return fail(ERRORS.INVALID_REQUEST, "Invalid Request");
  }
  const notification = id === undefined;
  try {
    const result = await dispatch(message.method, message.params, context);
    return notification ? undefined : respond(result);
  } catch (error) {
    if (notification) return undefined;
    if (error instanceof RpcError)
      return fail(error.code, error.message, error.data);
    context.log(`mortar mcp: ${error?.stack ?? error}`);
    return fail(ERRORS.INTERNAL, "Internal error");
  }
}

async function dispatch(method, params = {}, context) {
  if (params === null || typeof params !== "object")
    throw new RpcError(ERRORS.INVALID_PARAMS, "params must be an object");
  switch (method) {
    case "initialize": {
      const requested = params.protocolVersion;
      if (typeof requested !== "string")
        throw new RpcError(
          ERRORS.INVALID_PARAMS,
          "protocolVersion is required",
        );
      const data = await context.data();
      context.initialized = true;
      return {
        protocolVersion: PROTOCOL_VERSIONS.includes(requested)
          ? requested
          : PROTOCOL_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: {
          name: "mortar",
          title: "Mortar UI kit",
          version: data.version,
        },
        instructions: INSTRUCTIONS,
      };
    }
    case "notifications/initialized":
    case "notifications/cancelled":
    case "notifications/progress":
    case "notifications/roots/list_changed":
      return {};
    case "ping":
      return {};
    case "tools/list":
      return {
        tools: TOOLS.map(({ run, ...tool }) => tool),
      };
    case "tools/call": {
      const tool = TOOLS.find((t) => t.name === params.name);
      if (!tool)
        throw new RpcError(
          ERRORS.INVALID_PARAMS,
          `Unknown tool: ${params.name}`,
        );
      const args = params.arguments ?? {};
      const invalid = validateArguments(tool, args);
      if (invalid)
        return {
          content: [{ type: "text", text: `Invalid arguments: ${invalid}.` }],
          isError: true,
        };
      try {
        const result = await tool.run(await context.data(), args);
        return {
          content: [
            {
              type: "text",
              text:
                typeof result === "string"
                  ? result
                  : JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        if (!(error instanceof ToolError))
          context.log(`mortar mcp: ${error?.stack ?? error}`);
        return {
          content: [{ type: "text", text: String(error?.message ?? error) }],
          isError: true,
        };
      }
    }
    default:
      throw new RpcError(
        ERRORS.METHOD_NOT_FOUND,
        `Method not found: ${method}`,
      );
  }
}

/** Run the server on stdin/stdout until stdin closes. */
export function serve({
  input = process.stdin,
  output = process.stdout,
  log = (line) => process.stderr.write(line + "\n"),
} = {}) {
  // Nothing but protocol messages may reach stdout.
  console.log = console.info = console.debug = (...args) => log(args.join(" "));
  let dataPromise;
  const context = {
    data: () => (dataPromise ??= loadData()),
    log,
    initialized: false,
  };
  const write = (message) => output.write(JSON.stringify(message) + "\n");
  // Messages are handled one at a time, in order, so responses keep the
  // order of their requests.
  let queue = Promise.resolve();
  const lines = createInterface({ input, crlfDelay: Infinity });
  lines.on("line", (line) => {
    if (!line.trim()) return;
    queue = queue.then(async () => {
      let message;
      try {
        message = JSON.parse(line);
      } catch {
        write({
          jsonrpc: "2.0",
          id: null,
          error: { code: ERRORS.PARSE, message: "Parse error" },
        });
        return;
      }
      if (Array.isArray(message)) {
        if (!message.length) {
          write({
            jsonrpc: "2.0",
            id: null,
            error: { code: ERRORS.INVALID_REQUEST, message: "Invalid Request" },
          });
          return;
        }
        const responses = (
          await Promise.all(message.map((m) => handleMessage(m, context)))
        ).filter(Boolean);
        if (responses.length) write(responses);
        return;
      }
      const response = await handleMessage(message, context);
      if (response) write(response);
    });
  });
  return new Promise((resolveDone) => {
    lines.on("close", () => queue.then(resolveDone));
  });
}
