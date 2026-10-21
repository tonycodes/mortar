# Mortar for coding agents

Mortar ships its own agent tooling: an MCP server and a `mortar` command-line tool inside the `@tony-ui/mortar` package. Both read the installed package's catalogue (`catalog.json`), contracts, examples and guides. They run locally and work offline. They need no account, token or hosted service, and they never send anything anywhere. Everything is MIT licensed, like the kit.

The tooling needs Node 22 or newer. It adds no runtime dependencies to your app.

## Install

In the application:

```sh
npm install @tony-ui/mortar react react-dom tailwindcss
```

In the app's Tailwind CSS entry, after Tailwind:

```css
@import "tailwindcss";
@import "@tony-ui/mortar/styles.css";
```

Render one `ThemeProvider` at the root:

```tsx
import { ThemeProvider } from "@tony-ui/mortar";

<ThemeProvider brand="neutral" density="comfortable" initialAppearance="system">
  <App />
</ThemeProvider>;
```

## Connect the MCP server

The server speaks the Model Context Protocol over stdio. Inside an app that has Mortar installed, `npx` runs the installed version, so the tools always describe the components you actually import.

**Claude Code:**

```sh
claude mcp add mortar -- npx -y @tony-ui/mortar mcp
```

Add `--scope project` to share it with the repository through `.mcp.json`.

**Cursor, Windsurf, VS Code and other clients** that read an `mcpServers` JSON file (for example `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "mortar": {
      "command": "npx",
      "args": ["-y", "@tony-ui/mortar", "mcp"]
    }
  }
}
```

In a project without Mortar installed, `npx -y @tony-ui/mortar mcp` downloads the latest release first. To run a checkout of this repository instead, use `node /path/to/mortar/bin/mortar.mjs mcp` after `npm run build`.

## Tools

| Tool                | Arguments                                    | Returns                                                                                                                                                                                                                                                  |
| ------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search_components` | `query`, optional `kit`, `category`, `limit` | Ranked components: name, kit, category, description, capabilities.                                                                                                                                                                                       |
| `get_component`     | `name`                                       | The full contract: props with types, required flags and defaults; usage, avoid and accessibility notes; the components it renders; its `data-m-component` marker; tested states; page templates; a JSX example; the import line.                         |
| `get_build_packet`  | `components` and/or `brief`                  | The chosen components (for a brief, with the reason for each, starting from the purpose shell), their dependency closure, install, CSS and ThemeProvider setup, the import line, the design principles and API conventions, and matching page templates. |
| `get_guide`         | `topic`                                      | A guide as markdown: `design`, `conventions`, `theming`, `auth-flows`, `migrating-0.6`, `contributing`, `testing` or `agents`.                                                                                                                           |
| `list_kits`         | none                                         | Kits → categories → components, and the page templates.                                                                                                                                                                                                  |
| `audit_app`         | `path`                                       | A read-only audit of an application: findings with file, line, rule, message and a suggested fix.                                                                                                                                                        |

## Command line

The same data is available without an MCP client:

```sh
npx mortar search "sign in"
npx mortar component DataTable
npx mortar packet AppShell DataTable
npx mortar packet --brief "an admin screen listing invoices with filters"
npx mortar audit .
npx mortar guide theming
```

Add `--json` for machine-readable output. `mortar audit` exits with status 1 when it finds errors, so it can run in CI. `mortar --help` lists every command.

## Workflow

1. **Search.** Before writing UI, find what the kit already has: `search_components`, or `list_kits` to browse. Start from the purpose shell: `AppShell` for application screens, `MarketingHeader` (with `Footer`) for public pages, `DocsShell` for documentation and `AuthLayout` for sign-in and registration.
2. **Packet.** Call `get_build_packet` with the components you picked, or with the brief. Compose from it: the contracts list every prop, and the page templates show complete page patterns to follow.
3. **Compose.** Use named imports from `@tony-ui/mortar` and the exact props and values in each contract. Keep product names, data, routes, permissions and actions in props and slots. Theme with `ThemeProvider` and tokens (`get_guide theming`). Never copy a component's source, wrap it repeatedly, or override `.m-*` classes or `[data-m-component]` in your CSS.
4. **Audit.** Run `audit_app` (or `npx mortar audit`) and fix what it finds, then run the app's own typecheck and build. Verify in a browser: mobile and desktop, light and dark, keyboard and focus, and loading, empty and error states.
5. **Contribute.** If a shared pattern is missing or a component is wrong, fix it in the kit, not in the app. Open a pull request at [github.com/tonycodes/mortar](https://github.com/tonycodes/mortar) following [CONTRIBUTING.md](../CONTRIBUTING.md) and [AGENTS.md](../AGENTS.md) (`get_guide contributing`). Maintainer review and CI decide what merges; agents never approve, merge or publish their own changes.

## The audit

`audit_app` reads the application's files and never changes them. It checks against the contracts of the Mortar version installed in the app (or, for releases older than this tooling, against the tool's own catalogue, and says so).

| Rule                     | Severity | Finds                                                                                                                                                                                                                                                       |
| ------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `not-declared`           | error    | Mortar imported but missing from package.json                                                                                                                                                                                                               |
| `not-installed`          | error    | Mortar imported but not in node_modules                                                                                                                                                                                                                     |
| `version-mismatch`       | error    | The installed version does not satisfy the package.json range                                                                                                                                                                                               |
| `unknown-export`         | error    | A named import the installed version does not export, with the replacement for names removed in 0.6                                                                                                                                                         |
| `deep-import`            | error    | Imports or aliases into the package's `src` or `dist`                                                                                                                                                                                                       |
| `unknown-prop`           | error    | A prop the component's contract does not declare, with the 0.6 rename where there is one                                                                                                                                                                    |
| `invalid-value`          | error    | A literal outside the prop's declared union, such as `layout="centered"` (now `center`)                                                                                                                                                                     |
| `css-override`           | error    | Consumer CSS selecting Mortar's `.m-*` classes or `[data-m-component]`                                                                                                                                                                                      |
| `class-override`         | error    | A Tailwind arbitrary variant that targets `.m-*` classes, such as `[&_.m-button]:rounded-none`                                                                                                                                                              |
| `local-copy`             | error    | A copy of a Mortar source file, or code rendering Mortar's component marker                                                                                                                                                                                 |
| `missing-styles`         | error    | No import of `@tony-ui/mortar/styles.css`                                                                                                                                                                                                                   |
| `styles-order`           | warning  | Mortar's styles imported before Tailwind                                                                                                                                                                                                                    |
| `missing-theme-provider` | warning  | Mortar components rendered without a `ThemeProvider`                                                                                                                                                                                                        |
| `kit-class`              | warning  | Mortar-internal class names on the app's own markup                                                                                                                                                                                                         |
| `raw-colour`             | warning  | Hex, `rgb()`/`oklch()` colours or Tailwind palette classes in files that render Mortar components, except where they define a brand (`brandTokens`, `brandToCss`/`brandToStyle`/`registerBrand` arguments, `BrandDefinition` objects, `--m-brand-*` values) |
| `limited-data`           | info     | The installed release has no agent data, so a newer catalogue was used                                                                                                                                                                                      |

The audit is a fast scanner, not a type checker. It does not see props passed through a spread (`{...props}`), components re-exported or wrapped under another name, class names built at runtime, or markup in `.vue`, `.svelte`, `.astro` or `.html` files. Run the app's typecheck and build as well.

## Agent skill

[`skills/mortar/SKILL.md`](../skills/mortar/SKILL.md) is a ready-made skill with these workflow defaults. For Claude Code, install it once:

```sh
mkdir -p ~/.claude/skills/mortar
npx mortar skill > ~/.claude/skills/mortar/SKILL.md
```

Or put it in a project's `.claude/skills/mortar/` to share it with everyone working there.
