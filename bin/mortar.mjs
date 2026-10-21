#!/usr/bin/env node
// mortar: the open, local agent tooling for the Mortar UI kit. An MCP server
// (`mortar mcp`) and a CLI over the installed package's catalogue and docs.
// No network, no account, no runtime dependencies.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { loadData, GUIDES, PACKAGE_ROOT } from "../cli/data.mjs";
import { searchComponents } from "../cli/search.mjs";
import { componentDetail, buildPacket } from "../cli/packet.mjs";
import { auditApp, RULES } from "../cli/audit.mjs";

const HELP = `mortar — local agent tooling for the Mortar UI kit (@tony-ui/mortar)

Usage:
  mortar mcp                         Run the MCP server on stdio (for coding agents)
  mortar search <query> [--kit K] [--category C] [--limit N]
                                     Find components by purpose or name
  mortar component <Name>            A component's contract, props and example
  mortar packet <Name...> [--brief "text"]
                                     A build packet: components, dependencies,
                                     imports, CSS and theme setup, principles,
                                     page templates
  mortar audit [path]                Read-only audit of an app's Mortar usage
                                     (exits 1 when it finds errors)
  mortar guide <topic>               Print a guide: ${Object.keys(GUIDES).join(", ")}
  mortar kits                        Kits, categories and components
  mortar skill                       Print the agent skill (skills/mortar/SKILL.md)

Options:
  --json                             Machine-readable output
  -h, --help                         Show this help
  -v, --version                      Show the installed Mortar version

Add the MCP server to Claude Code:
  claude mcp add mortar -- npx -y @tony-ui/mortar mcp

Everything runs locally against the installed package. No account or network.`;

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") {
      positional.push(...argv.slice(i + 1));
      break;
    }
    if (a.startsWith("--")) {
      const [key, inline] = a.slice(2).split(/=(.*)/s);
      if (["json", "help", "version"].includes(key)) flags[key] = true;
      else flags[key] = inline ?? argv[++i];
    } else if (a === "-h") flags.help = true;
    else if (a === "-v") flags.version = true;
    else positional.push(a);
  }
  return { positional, flags };
}

const out = (text) => process.stdout.write(text + "\n");
const json = (value) => out(JSON.stringify(value, null, 2));
const fail = (message) => {
  process.stderr.write(`mortar: ${message}\n`);
  process.exitCode = 2;
};
const indent = (text, by = "  ") =>
  String(text)
    .split("\n")
    .map((l) => (l ? by + l : l))
    .join("\n");

function printComponent(c) {
  out(
    `${c.name} — ${c.kitTitle}${c.categoryTitle ? " › " + c.categoryTitle : ""}`,
  );
  out(c.description);
  out("");
  out(c.import);
  out(`Marker: ${c.marker}`);
  if (c.usage) out(`\nUsage: ${c.usage}`);
  if (c.avoid) out(`Avoid: ${c.avoid}`);
  if (c.accessibility) out(`Accessibility: ${c.accessibility}`);
  out("\nProps:");
  for (const p of c.props)
    out(
      `  ${p.name}${p.required ? "" : "?"}: ${p.type}${p.default !== undefined ? ` = ${p.default}` : ""}`,
    );
  if (c.acceptsHtmlAttributes)
    out("  …and the HTML attributes of its root element");
  if (c.dependencies.length) out(`\nRenders: ${c.dependencies.join(", ")}`);
  if (c.testing?.states?.length)
    out(`Tested states: ${c.testing.states.join(", ")}`);
  if (c.templates.length) out(`Page templates: ${c.templates.join(", ")}`);
  if (c.example) out(`\nExample:\n\n${indent(c.example)}`);
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const [command, ...rest] = positional;
  if (flags.version) {
    out(
      JSON.parse(readFileSync(join(PACKAGE_ROOT, "package.json"), "utf8"))
        .version,
    );
    return;
  }
  if (flags.help || !command || command === "help") {
    out(HELP);
    return;
  }
  if (command === "mcp") {
    const { serve } = await import("../cli/mcp.mjs");
    await serve();
    return;
  }
  const data = await loadData();
  switch (command) {
    case "search": {
      const query = rest.join(" ");
      if (!query)
        return fail("search needs a query, e.g. mortar search sign in");
      const results = searchComponents(data, {
        query,
        kit: flags.kit,
        category: flags.category,
        limit: flags.limit ? Number(flags.limit) : 10,
      }).map(({ matched, ...r }) => r);
      if (flags.json) return json(results);
      if (!results.length) return out(`No components match "${query}".`);
      const width = Math.max(...results.map((r) => r.name.length));
      for (const r of results)
        out(
          `${r.name.padEnd(width)}  ${r.kit}${r.category ? " › " + r.category : ""}\n${" ".repeat(width + 2)}${r.description}`,
        );
      return;
    }
    case "component": {
      if (!rest[0])
        return fail("component needs a name, e.g. mortar component Button");
      const c = data.find(rest[0]);
      if (!c) {
        const near = searchComponents(data, { query: rest[0], limit: 5 }).map(
          (r) => r.name,
        );
        return fail(
          `no component named "${rest[0]}".${near.length ? ` Try: ${near.join(", ")}` : ""}`,
        );
      }
      const detail = componentDetail(data, c);
      return flags.json ? json(detail) : printComponent(detail);
    }
    case "packet": {
      if (!rest.length && !flags.brief)
        return fail('packet needs component names or --brief "…"');
      const packet = buildPacket(data, {
        components: rest,
        brief: flags.brief,
      });
      if (flags.json) return json(packet);
      out(`Build packet — ${packet.package} ${packet.version}`);
      for (const u of packet.unknown ?? [])
        out(
          `Unknown component ${u.name}${u.suggestions.length ? ` (did you mean ${u.suggestions.join(", ")}?)` : ""}`,
        );
      out(`\nInstall:\n  ${packet.install}`);
      out(
        `\nCSS (${packet.css.where}):\n${indent(packet.css.code)}\n  ${packet.css.notes}`,
      );
      out(`\nTheme:\n${indent(packet.themeProvider.code)}`);
      out(`\nImport:\n  ${packet.import}`);
      out("\nComponents:");
      for (const c of packet.components) {
        out(`  ${c.name} — ${c.description}`);
        for (const why of c.why ?? []) out(`    why: ${why}`);
        const required = c.props.filter((p) => p.required).map((p) => p.name);
        if (required.length) out(`    required props: ${required.join(", ")}`);
      }
      if (packet.dependencies.components.length)
        out(
          `\nRendered inside them: ${packet.dependencies.components.map((d) => d.name).join(", ")}`,
        );
      if (packet.templates.length) {
        out("\nPage templates that compose them (playground):");
        for (const t of packet.templates)
          out(`  ${t.id} — ${t.title}: ${t.description}`);
      }
      out("\nPrinciples:");
      for (const p of packet.principles)
        out(`  ${p.number}. ${p.id} — ${p.instruction}`);
      out(
        `\nGuides: ${packet.guides.map((g) => `mortar guide ${g}`).join(", ")}`,
      );
      out(
        `Full contracts and examples: mortar packet ${packet.components.map((c) => c.name).join(" ")} --json`,
      );
      return;
    }
    case "audit": {
      let report;
      try {
        report = await auditApp(rest[0] ?? ".", { data });
      } catch (error) {
        return fail(error.message);
      }
      if (flags.json) json(report);
      else {
        out(
          `Mortar audit of ${report.root}\n${report.mortar.range ? `package.json: ${report.mortar.range}, ` : ""}installed: ${report.mortar.installed ?? "none"}, checked against ${report.mortar.checkedAgainst}\n`,
        );
        for (const f of report.findings) {
          out(
            `${f.file}${f.line ? ":" + f.line : ""}  ${f.severity}  ${f.rule}`,
          );
          out(`  ${f.message}`);
          if (f.fix) out(`  fix: ${f.fix}`);
        }
        const s = report.summary;
        out(
          `\n${s.error} error${s.error === 1 ? "" : "s"}, ${s.warning} warning${s.warning === 1 ? "" : "s"}, ${s.info} info in ${s.files} files.`,
        );
      }
      if (report.summary.error) process.exitCode = 1;
      return;
    }
    case "guide": {
      const topic = rest[0];
      if (!GUIDES[topic])
        return fail(`guide needs a topic: ${Object.keys(GUIDES).join(", ")}`);
      const text = data.guide(topic);
      return text ? out(text) : fail(`the ${topic} guide is not installed`);
    }
    case "kits": {
      if (flags.json) return json(data.agent.taxonomy.kits);
      for (const k of data.agent.taxonomy.kits) {
        out(`${k.title} (${k.id}) — ${k.description}`);
        for (const c of k.categories)
          out(`  ${c.title} (${c.id}): ${c.components.join(", ")}`);
      }
      return;
    }
    case "skill": {
      const file = join(PACKAGE_ROOT, "skills", "mortar", "SKILL.md");
      return existsSync(file)
        ? out(readFileSync(file, "utf8").trimEnd())
        : fail("skill not installed");
    }
    case "rules":
      for (const [id, text] of Object.entries(RULES))
        out(`${id.padEnd(24)} ${text}`);
      return;
    default:
      return fail(`unknown command "${command}". Run mortar --help.`);
  }
}

main().catch((error) => {
  process.stderr.write(`mortar: ${error?.stack ?? error}\n`);
  process.exitCode = 2;
});
