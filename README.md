# Mortar

A shared design foundation and purpose-built Application UI and Marketing UI kits for React 19 and Tailwind CSS 4. MIT licensed. No account, token, registry connection or subscription is required to use the kit, including use by coding agents.

The package is `@tony-ui/mortar`, distributed from owner-hosted infrastructure. Releases are immutable and publicly downloadable without a service account. Version 0.1.0 is available. Source, issues and contributions live at [github.com/tonycodes/mortar](https://github.com/tonycodes/mortar).

## Install

```sh
npm config set @tony-ui:registry https://git.tony.codes/api/packages/tony/npm/ --location=project
npm install @tony-ui/mortar react react-dom tailwindcss
```

No UI service credential is needed.

## Local install

Build and pack from this workspace:

```sh
npm run build
npm pack
```

Install the resulting `tony-ui-mortar-0.1.0.tgz` in the consuming app, with React 19, React DOM 19 and Tailwind 4. Public releases use https://git.tony.codes/api/packages/tony/npm/.

In the app's Tailwind CSS entry:

```css
@import "tailwindcss";
@import "@tony-ui/mortar/styles.css";
```

The package ships its component styles. Standalone use requires no source scanning or hosted account. The separately governed hosted workflow currently also requires `@source '../node_modules/@tony-ui/mortar/src';` in the CSS entry; generated agent starters include that policy declaration.

```tsx
import { ThemeProvider, AppShell, Button } from "@tony-ui/mortar";

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

The catalogue assigns each export to one purpose. Foundation primitives serve both purpose kits. Application UI provides shells, page headings, metrics, selectable tables, settings and activity. Marketing UI provides headers, heroes, features, social proof, pricing, FAQs, calls to action and footers. Product content and callbacks remain in the consumer. Sample names and prices belong only in the catalogue demonstrations.

Controls use native HTML and Headless UI. Tabs support arrow/Home/End navigation; dialogs and menus use Headless UI focus management. Density has a 44px control floor on coarse pointers. Feedback colours remain separate from the brand.

## Hosted services

Mortar Cloud's registry, agent discovery, approvals, audit and managed release workflow are separate proprietary hosted services. Payment buys service access, not permission to use the MIT components. The kit performs no network requests and contains no licence check or telemetry.

This licence covers this package only. The private governance service and its history are not part of this public repository.
