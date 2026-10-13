# Mortar design principles

1. **shell-first** — Choose the shared purpose shell before composing a page. Use AppShell for application screens and MarketingHeader for public pages. Document deliberate standalone exceptions.

2. **page-pattern-reuse** — Reuse complete page patterns: navigation, headings, filters, list/detail workspaces, states and action placement. Reusing controls alone is insufficient.

3. **project-agnostic-chrome** — Keep product names, routes, user data, permissions and actions in props and slots. Shared chrome must remain project agnostic.

4. **central-fixes** — Contribute missing patterns centrally. Do not duplicate source, create repeated local wrappers or apply consumer CSS overrides.

5. **semantic-themes** — Use semantic tokens; keep brand separate from appearance and feedback colours. Verify every supported theme.

6. **interaction-quality** — Verify responsive layout, accessible names, keyboard operation, focus and loading/empty/error states. Automated checks alone cannot prove visual quality.

The machine-readable contract is design-principles.json. Both the local contribution workflow and hosted MCP should expose these principles. Detection is split between structural checks and visual maintainer review.
