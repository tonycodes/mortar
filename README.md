# Mortar

A shared design foundation and purpose-built Application UI, Marketing UI, Docs UI and Ecommerce kits for React 19 and Tailwind CSS 4. MIT licensed. No account, token, registry connection or subscription is required to use the kit, including use by coding agents.

The package is [`@tonycodes-ui/mortar` on npmjs.com](https://www.npmjs.com/package/@tonycodes-ui/mortar). Releases are immutable, publicly installable without any account or token, and published with npm provenance that links each version to the GitHub Actions run that built it. Publishing is automatic: every merge to `main` auto-releases the next version, worked out from conventional commits, once the required checks pass ([release workflow](.github/workflows/release.yml), [process](CONTRIBUTING.md)). The current version is listed on the [GitHub releases](https://github.com/tonycodes/mortar/releases) page. Source, issues and contributions live at [github.com/tonycodes/mortar](https://github.com/tonycodes/mortar).

[Explore the live playground](https://mortar.tony.codes/playground/) · [Contribute](CONTRIBUTING.md) · [Free and open](#free-and-open)

## See the kit

These screenshots show the kit running in the public playground. All product names,
plans, prices and support labels inside the examples are demonstration content,
not Mortar offers. The playground follows `main`; screenshots may show components
that are not yet in the latest npm release.

**Marketing UI — a composed landing page in light mode.**

[![Mortar marketing components composing a landing page with navigation, hero, actions and a chat preview](docs/images/marketing-light.jpg)](https://mortar.tony.codes/playground/?recipe=saas-landing&theme=light)

**Application UI — a semantic table in dark mode, inside the shared explorer.**

[![Mortar dark-mode playground showing the Table component and preview controls](docs/images/application-dark.jpg)](https://mortar.tony.codes/playground/?component=Table&theme=dark)

**Docs UI — navigation, search and an article outline using the shared DocsShell.**

[![Mortar light-mode DocsShell preview with grouped navigation, search and a table of contents](docs/images/documentation-light.jpg)](https://mortar.tony.codes/playground/?component=DocsShell&theme=light)

Open any screenshot to try its live example. Switch appearance, brand, density and
example states in the playground.

## Install

```sh
npm install @tonycodes-ui/mortar react react-dom tailwindcss
```

No account, token or registry configuration is needed: the package is public on npmjs.com. Versions 0.11 and earlier were published only to the previous owner-hosted registry; if a project pins one of them, or still has that registry's scope override in its `.npmrc`, see the [CHANGELOG](CHANGELOG.md) migration note.

## Agents and MCP

The package includes a free, local MCP server and CLI for coding agents. They read the installed version's catalogue, contracts, examples and guides, work offline and need no account:

```sh
claude mcp add mortar -- npx -y @tonycodes-ui/mortar mcp
npx mortar search "sign in"
npx mortar audit .
```

Tools: `search_components`, `get_component`, `get_build_packet`, `get_guide`, `list_kits` and `audit_app`. See [Mortar for coding agents](docs/agents.md) for other MCP clients, the workflow and the audit rules, and [skills/mortar/SKILL.md](skills/mortar/SKILL.md) for a ready-made agent skill.

## Changes and upgrades

See [CHANGELOG.md](CHANGELOG.md) for every release. [Theming](docs/theming.md) explains brands, appearance, density and the token scales. [Sign-in and registration flows](docs/auth-flows.md) maps each auth step to components, autocomplete values and security notes. Upgrading from 0.5 or earlier? [Migrating to 0.6](docs/migrating-to-0.6.md) lists every renamed prop.

## Local install

Pack from this workspace (`npm pack` builds `dist` first):

```sh
npm pack
```

Install the resulting `tonycodes-ui-mortar-<version>.tgz` in the consuming app, with React 19, React DOM 19 and Tailwind 4. Public releases come from npmjs.com.

In the app's Tailwind CSS entry:

```css
@import "tailwindcss";
@import "@tonycodes-ui/mortar/styles.css";
```

The package ships its component styles. No source scanning or account is required.

```tsx
import { ThemeProvider, AppShell, Button } from "@tonycodes-ui/mortar";

<ThemeProvider brand="neutral" density="comfortable" initialAppearance="system">
  <AppShell
    brand="Example"
    navigation={[{ label: "Overview", href: "/", current: true }]}
  >
    <Button onClick={save}>Save changes</Button>
  </AppShell>
</ThemeProvider>;
```

`brand` (`neutral | green`) and `density` (`compact | comfortable | spacious`) are controlled provider props. Appearance (`light | dark | system`) is changed using `AppearanceControl`; system changes are observed. Use one root provider. It restores document attributes on unmount. The provider uses effects: SSR applications should set matching initial document attributes to prevent a first-paint theme flash.

## Purpose kits

The catalogue assigns each export to one purpose. Foundation primitives serve all purpose kits. Application UI provides shells, page headings, metrics, selectable tables, settings and activity. Marketing UI provides headers, heroes, features, social proof, pricing, FAQs, calls to action and footers. Docs UI provides a shared documentation shell, search, code examples, API references and article navigation. Ecommerce provides product lists, product overviews with option pickers, shopping carts and order summaries; prices arrive preformatted so currency and locale stay with the consumer. Product content and callbacks remain in the consumer. Sample names and prices belong only in the catalogue demonstrations.

Controls use native HTML and Headless UI. Tabs support arrow/Home/End navigation; dialogs and menus use Headless UI focus management. Density has a 44px control floor on coarse pointers. Feedback colours remain separate from the brand.

## Free and open

Everything is free and lives in this repository under the MIT licence: the kit,
its documentation, the playground and the agent tooling. Use, customise and
contribute to it, including in commercial projects and agent-assisted development.
There are no accounts, licence checks, telemetry, paid plans or hosted service;
the kit makes no network calls of its own.

- **Packages** are published to [npmjs.com](https://www.npmjs.com/package/@tonycodes-ui/mortar)
  from GitHub Actions with provenance.
- **The playground** is hosted on [GitHub Pages](https://mortar.tony.codes/playground/).
- **Bugs and contributions** go through [GitHub issues](https://github.com/tonycodes/mortar/issues)
  and [pull requests](CONTRIBUTING.md); GitHub maintainer review is the only review
  gate. This is community maintenance, not a paid support entitlement. Do not put
  credentials or private project details in issues.

## Run the playground locally

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:4340`. The playground is this repository's standalone Vite
application, built directly from `src`, `previews` and the component catalogue.
It is the local visual development surface for new and updated components.
No service account or backend is required.

In production it is deployed to GitHub Pages at
[mortar.tony.codes/playground/](https://mortar.tony.codes/playground/).
Merges to `main` deploy it after checks pass; the Pages site root
(`site/index.html`) links the playground, GitHub, npm and the docs. Package
releases have their own workflow (see [CONTRIBUTING.md](CONTRIBUTING.md)).

## Client-side routing

Connect your application's router once at the provider. All kit-owned links
(including AppShell, DocsShell, MarketingHeader, breadcrumbs, tables and action
links) use this adapter for ordinary same-origin navigation:

```tsx
<ThemeProvider
  navigate={(href) => {
    router.push(href);
  }}
>
  <App />
</ThemeProvider>
```

For React Router, pass its `useNavigate()` function through a void-returning
callback. The router must render the destination and manage route focus/scroll.
Return `false` for routes your router does not handle. Without an adapter, links
retain native browser navigation. External links, downloads, same-page fragments,
modified clicks and new-tab links remain native. Consumer-authored anchors still
belong to the consumer's router; this does not intercept the whole document.

Theme selection can also be controlled with `appearance` and
`onAppearanceChange`; `initialAppearance` remains the uncontrolled starting value.
Brand and density already update through their provider props. None of these
settings requires reloading the page. Existing apps must install a release
containing this API, wire their router, and rebuild to adopt it.
