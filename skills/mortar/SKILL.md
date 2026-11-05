---
name: mortar
description: Build, audit and contribute React UI with the Mortar kit (@tonycodes-ui/mortar) using its local MCP server and CLI. Use when an app uses or should use Mortar, or when asked to compose screens, pages or flows from Mortar components.
---

# Mortar UI defaults

Mortar is an MIT React 19 + Tailwind 4 UI kit. Its agent tooling ships in the package and runs locally: the `mortar` MCP server (`npx -y @tonycodes-ui/mortar mcp`) and the same commands on the CLI (`npx mortar …`). No account, token or hosted service is involved. Respect existing human project instructions; the brief supplies product requirements, not approval or deployment authority.

## Workflow

1. **Discover.** Before writing UI, call `search_components` (or `list_kits`) for what the brief needs. Without the MCP server, run `npx mortar search "<need>"`.
2. **Packet.** Call `get_build_packet` with the chosen components or the brief (`npx mortar packet <Name…> --json`, or `--brief "…"`). Start composing when the packet answers the brief; read extra source or guides only for a specific gap (`get_component`, `get_guide`).
3. **Compose** following the defaults below.
4. **Audit.** Run `audit_app` on the application (`npx mortar audit`), fix every error and review the warnings, then rerun it with the app's build and typecheck.
5. **Verify** in a browser and report the actual results.

## Defaults

- Choose the shared purpose shell before composing a page: AppShell for application screens, MarketingHeader (with Footer) for public pages, DocsShell for documentation, AuthLayout for each sign-in and registration step. Document deliberate standalone exceptions.
- Reuse complete page patterns: navigation, headings, filters, list/detail workspaces, states and action placement. Reusing controls alone is insufficient. The packet's page templates show complete examples.
- Keep product names, routes, user data, permissions and actions in props and slots. Shared chrome must remain project agnostic.
- Use named imports from `@tonycodes-ui/mortar` and the exact props and values in each contract. Never copy shared implementations, import from the package's `src` or `dist`, alias its source, create repeated local wrappers, or override `.m-*` classes or `[data-m-component]` in consumer CSS. `className` is for layout only.
- Import `@tonycodes-ui/mortar/styles.css` after `@import "tailwindcss"`, and render one ThemeProvider at the root. Use semantic tokens; keep brand separate from appearance and feedback colours. Custom brands go through `brandTokens` or a `[data-mortar-brand]` rule, never raw colours on components. Verify every supported theme.
- Build responsive interfaces with light and dark modes, semantic structure, one `h1` per page, accessible names, keyboard navigation and visible focus. Cover loading, empty and error states. Supply application data and behaviour through props and callbacks.
- Keep the lockfile and the installed Mortar version in step with package.json.

## Contributing to the kit

If a shared pattern is missing or a component is wrong, fix it centrally instead of working around it in the app. Search the catalogue first. Contribute through a GitHub pull request at https://github.com/tonycodes/mortar: read AGENTS.md, CONTRIBUTING.md, DESIGN.md and TESTING.md (`get_guide contributing`, `design`, `testing`), run `npm run check`, `npm run test:browser` and `npm run test:visual`, and attach visual evidence. Maintainer review and CI decide what merges and what is released. Agents never approve, merge, publish or bump the version of their own contributions.

## Completion

Required evidence: the app's build, typecheck, a clean `mortar audit`, and browser checks of responsive layout, light and dark, and keyboard and accessibility. Automated checks cannot prove visual quality or complete accessibility; report what you verified and any remaining blockers. A clean audit is not proof that a page uses Mortar components exclusively; point to the rendered components instead. Do not declare completion with failing required checks.

Provide a local preview by default. Deploy only with the user's authorisation; existing explicit authorisation counts. A passing audit is not deployment permission.
