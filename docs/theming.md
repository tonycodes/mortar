# Theming

Mortar's look comes from tokens in [`src/tokens.css`](../src/tokens.css), in three layers:

1. **Brand contract.** A brand declares `--m-brand-l-*` (light) and `--m-brand-d-*` (dark), and nothing else. Every value is optional.
2. **Appearance.** Light and dark resolve the contract into the live tokens (`--m-primary`, `--m-link`, …) and into the `--m-inv-*` tokens that inverse sections use. So dark mode and `tone="inverse"` never need brand-specific CSS.
3. **Scales.** Type, space, radius, sizing, density and stacking. These are appearance-independent.

Components only read the live `--m-*` tokens. Never style components directly; change tokens.

## Choosing a brand, appearance and density

```tsx
<ThemeProvider brand="green" initialAppearance="system" density="compact">
  <App />
</ThemeProvider>
```

ThemeProvider writes `data-mortar-brand`, `data-mortar-appearance` and `data-mortar-density` on the document root, or on a wrapper with `scope="container"`. Menus, listboxes and dialogs opened inside a container keep its theme.

## Adding a brand

### In CSS

A brand is one rule. This is enough; everything else derives from it:

```css
[data-mortar-brand="acme"] {
  --m-brand-l-primary: #1d4ed8;
  --m-brand-l-on-primary: #ffffff;
  --m-brand-d-primary: #93c5fd;
  --m-brand-d-on-primary: #0b1f4d;
}
```

```tsx
<ThemeProvider brand="acme">…</ThemeProvider>
```

The full contract, for each of `l` (light) and `d` (dark):

| Token                               | Default when omitted                                |
| ----------------------------------- | --------------------------------------------------- |
| `--m-brand-*-primary`               | Neutral (black in light, white in dark)             |
| `--m-brand-*-primary-hover`         | `primary` mixed 85% with ink                        |
| `--m-brand-*-primary-active`        | `primary` mixed 72% with ink                        |
| `--m-brand-*-on-primary`            | Neutral (white in light, black in dark)             |
| `--m-brand-*-accent` / `-on-accent` | `primary` / `on-primary`                            |
| `--m-brand-*-focus`                 | `primary`                                           |
| `--m-brand-*-link`                  | `primary` in light, ink in dark                     |
| `--m-brand-*-selected`              | `primary` tinted into the page (8% light, 10% dark) |

Hover and active mix towards **ink** (darker in light, lighter in dark), so text on them keeps at least the contrast it has on `primary`. Check `on-primary` against `primary` yourself (4.5:1 or more); Mortar's own brands are tested in `tests/tone-contrast.test.mjs`.

A brand never inherits values from an outer brand: every `[data-mortar-brand]` starts from an empty contract.

### At runtime, from data

For tenant-specific colours from a database or CMS, pass `brandTokens`:

```tsx
<ThemeProvider brand={tenant.slug} brandTokens={tenant.theme}>
```

```ts
tenant.theme = {
  light: { primary: "#1d4ed8", onPrimary: "#ffffff" },
  dark: { primary: "#93c5fd", onPrimary: "#0b1f4d" },
};
```

ThemeProvider renders the brand as a `<style>` element. React 19 hoists it into the document head and includes it in server-rendered HTML, so there is no unstyled flash, and overlays opened inside the provider share it. Brand names may contain only letters, digits and hyphens. Values must be colour syntax: hex, named colours, `rgb()`, `oklch()`, `color-mix()` or `var()`. Anything else, including `;`, `{` or comments, throws, so tenant data cannot inject CSS.

Outside ThemeProvider, `@tony-ui/mortar/brand` has the same building blocks:

```ts
import { brandToCss, brandToStyle, registerBrand } from "@tony-ui/mortar/brand";

brandToCss("acme", theme); // a CSS rule, e.g. for a build step
const dispose = registerBrand("acme", theme); // adds a <style>; reference-counted
brandToStyle(theme); // inline custom properties for one element
```

Inline custom properties apply only to that element's subtree. Menus and dialogs portal outside it, so prefer `brandTokens` or `registerBrand` for anything with overlays.

## Appearance before JavaScript runs

Until ThemeProvider sets `data-mortar-appearance` (during server rendering, or with JavaScript off), Mortar follows the operating system's colour scheme, so dark-mode users don't see a light flash. To always start light, render `data-mortar-appearance="light"` on `<html>`.

## Scales

Override these on `:root` or on any container to retheme shape and rhythm:

- **Type:** `--m-font`, `--m-mono`, `--m-weight-regular|medium|semibold|bold`, `--m-tracking-display|heading|body|caps`, `--m-leading-display|heading|body`.
- **Space:** `--m-space-1|2|3|4|6|8|10|12` (4px to 48px).
- **Radius:** `--m-radius-xs|sm`, `--m-radius`, `--m-radius-lg|xl|full`.
- **Sizing and density:** `--m-control`, `--m-pad`, `--m-font-size`, `--m-row-pad`, `--m-icon`. `data-mortar-density="compact" | "spacious"` adjusts these.
- **Stacking:** `--m-z-sticky|overlay|popover|toast|skip`.

Component styles do not all read the type and space scales yet. Repointing them, for example `font-weight: 600` to `var(--m-weight-semibold)`, is a follow-up, verified against the visual baselines.

## Tailwind utilities

`@tony-ui/mortar/styles.css` maps tokens into Tailwind's theme, so utilities follow a retheme:

- **Colours:** `paper`, `surface`, `sunken`, `ink`, `secondary`, `muted`, `line`, `primary`, `on-primary`, `accent`, `on-accent`, `focus`, `link`, `selected`, `success`, `warning`, `danger`, `info`. For example `bg-primary` or `text-muted`.
- **Radius:** `rounded-m-xs`, `rounded-m-sm`, `rounded-m`, `rounded-m-lg`, `rounded-m-xl`, `rounded-m-full`. Tailwind's own `rounded-sm/md/lg` keep their usual sizes.
- **Shadow:** `shadow-float`.
- **Tracking:** `tracking-display`, `tracking-heading`, `tracking-caps`.
- **Weights:** `font-medium`, `font-semibold` and `font-bold` follow `--m-weight-*`.
