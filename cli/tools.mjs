// The MCP tools. Each handler takes validated arguments and returns a plain
// object (serialised as JSON text) or a string (returned as text).
import { GUIDES } from "./data.mjs";
import { searchComponents } from "./search.mjs";
import { componentDetail, buildPacket } from "./packet.mjs";
import { auditApp, RULES } from "./audit.mjs";

export class ToolError extends Error {}

const componentNotFound = (data, name) =>
  new ToolError(
    `No component named "${name}" in ${data.packageName} ${data.version}.` +
      ` Closest matches: ${
        searchComponents(data, { query: name, limit: 5 })
          .map((r) => r.name)
          .join(", ") || "none"
      }. Use search_components or list_kits to find one.`,
  );

export const TOOLS = [
  {
    name: "search_components",
    title: "Search Mortar components",
    description:
      'Search the installed Mortar UI kit (@tony-ui/mortar, React 19 + Tailwind 4) for components by purpose, e.g. "sign in", "data table with sorting", "pricing". Returns ranked matches with name, kit, category, a one-line description and capabilities. Use it before writing any UI so you reuse the kit instead of building your own; then call get_component or get_build_packet with the names you pick. Works offline against the installed version.',
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "What the UI needs to do, or a component name. Plain words work best.",
        },
        kit: {
          type: "string",
          description:
            "Only this kit: foundation, application, marketing, docs or ecommerce.",
        },
        category: {
          type: "string",
          description:
            'Only this category id or title from list_kits, e.g. "auth" or "Lists and tables".',
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 50,
          default: 10,
          description: "Maximum number of results.",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: (data, args) => ({
      package: data.packageName,
      version: data.version,
      results: searchComponents(data, args).map(({ matched, ...r }) => r),
    }),
  },
  {
    name: "get_component",
    title: "Get a Mortar component contract",
    description:
      "The full contract of one Mortar component: description, import line, every prop with type, required flag and default, usage / avoid / accessibility notes, the components it renders (dependencies), its data-m-component marker, tested states, kit and category, page templates that use it, and a runnable JSX example from the playground. Use the exact prop names and union values it lists; do not guess props.",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: 'Component export name, e.g. "DataTable" (any case).',
        },
      },
      required: ["name"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: (data, { name }) => {
      const c = data.find(name);
      if (!c) throw componentNotFound(data, name);
      return componentDetail(data, c);
    },
  },
  {
    name: "get_build_packet",
    title: "Get a Mortar build packet",
    description:
      'Everything needed to build a screen with Mortar in one response. Pass `components` (export names), a free-text `brief` ("an admin screen listing invoices with filters"), or both; at least one is required. Returns: the chosen components with full contracts and examples (for a brief, why each was chosen, starting from the purpose shell: AppShell, MarketingHeader, DocsShell or AuthLayout), the dependency closure they render, the import line, install command, Tailwind CSS setup, ThemeProvider setup, the design principles and API conventions, and the playground page templates that compose the same components. Start composing from this packet.',
    inputSchema: {
      type: "object",
      properties: {
        components: {
          type: "array",
          items: { type: "string" },
          description:
            'Component export names, e.g. ["AppShell", "DataTable"].',
        },
        brief: {
          type: "string",
          description:
            "What you are building, in plain words. Components are chosen by search and purpose.",
        },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: (data, args) => {
      if (!args.components?.length && !args.brief?.trim())
        throw new ToolError("Pass components (a non-empty list) or a brief.");
      return buildPacket(data, args);
    },
  },
  {
    name: "get_guide",
    title: "Read a Mortar guide",
    description: `Read one of Mortar's guides as markdown, from the installed package. Topics: ${Object.entries(
      GUIDES,
    )
      .map(([k, g]) => `${k} (${g.summary.replace(/\.$/, "")})`)
      .join("; ")}.`,
    inputSchema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          enum: Object.keys(GUIDES),
          description: "The guide to read.",
        },
      },
      required: ["topic"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: (data, { topic }) => {
      const text = data.guide(topic);
      if (!text)
        throw new ToolError(
          `The guide "${topic}" is not in this installation of ${data.packageName}.`,
        );
      return text;
    },
  },
  {
    name: "list_kits",
    title: "List Mortar kits",
    description:
      "The whole Mortar catalogue as kits → categories → components (Foundation, Application UI, Marketing UI, Docs UI, Ecommerce), plus the playground page templates. Use it to browse when you do not know what to search for.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: (data) => ({
      package: data.packageName,
      version: data.version,
      kits: data.agent.taxonomy.kits.map((k) => ({
        id: k.id,
        title: k.title,
        description: k.description,
        categories: k.categories.map((c) => ({
          id: c.id,
          title: c.title,
          components: c.components,
        })),
      })),
      templates: data.agent.templates.map((t) => ({
        id: t.id,
        title: t.title,
        kind: t.kind,
        description: t.description,
      })),
    }),
  },
  {
    name: "audit_app",
    title: "Audit an app's Mortar usage",
    description: `Static, read-only audit of an application directory that uses Mortar; it never modifies files. Reports findings with file, line, rule, message and a suggested fix. Rules: ${Object.entries(
      RULES,
    )
      .map(([k, v]) => `${k} (${v.replace(/\.$/, "")})`)
      .join(
        "; ",
      )}. Props and imports are checked against the installed version's contracts, with 0.6 rename suggestions. A lightweight scanner, not a type checker: props passed by spread and wrapped components are not checked, so also run the app's own typecheck and build.`,
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description:
            "The application directory (where its package.json is). Relative paths resolve from the server's working directory. Defaults to it.",
        },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: (data, { path = "." }) => auditApp(path, { data }),
  },
];

const typeOf = (v) =>
  Array.isArray(v) ? "array" : Number.isInteger(v) ? "integer" : typeof v;

/** Validate arguments against a tool's (flat) input schema. Returns an error message or undefined. */
export function validateArguments(tool, args) {
  if (args === undefined) args = {};
  if (typeOf(args) !== "object" || args === null)
    return "arguments must be an object";
  const { properties = {}, required = [] } = tool.inputSchema;
  for (const key of required)
    if (args[key] === undefined) return `missing required argument "${key}"`;
  for (const [key, value] of Object.entries(args)) {
    const schema = properties[key];
    if (!schema) return `unknown argument "${key}"`;
    const t = typeOf(value);
    if (schema.type === "integer" ? t !== "integer" : t !== schema.type)
      return `"${key}" must be ${schema.type === "integer" ? "an integer" : `a ${schema.type}`}`;
    if (schema.enum && !schema.enum.includes(value))
      return `"${key}" must be one of ${schema.enum.join(", ")}`;
    if (schema.items && value.some((v) => typeOf(v) !== schema.items.type))
      return `"${key}" must contain only ${schema.items.type}s`;
    if (schema.minimum !== undefined && value < schema.minimum)
      return `"${key}" must be at least ${schema.minimum}`;
    if (schema.maximum !== undefined && value > schema.maximum)
      return `"${key}" must be at most ${schema.maximum}`;
  }
  return undefined;
}
