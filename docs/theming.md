# Theming

Mortar's look comes from tokens in [`src/tokens.css`](../src/tokens.css), in three layers:

1. **Brand contract.** A brand declares `--m-brand-l-*` (light), `--m-brand-d-*` (dark) and the brand fonts (`--m-brand-font`, `--m-brand-font-heading`), and nothing else. Every value is optional.
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
| `--m-brand-*-paper`                 | `#ffffff` in light, `#000000` in dark               |
| `--m-brand-*-surface`               | `#ffffff` in light, `#0e0e10` in dark               |
| `--m-brand-*-sunken`                | `#f5f5f7` in light, `#1c1c1e` in dark               |
| `--m-brand-*-accent-gradient`       | None: accent fills are the flat `accent`            |

And once for both appearances:

| Token                    | Default when omitted                   |
| ------------------------ | -------------------------------------- |
| `--m-brand-font`         | `--m-font` (the system stack)          |
| `--m-brand-font-heading` | `--m-font-heading`, else the body font |

Hover and active mix towards **ink** (darker in light, lighter in dark), so text on them keeps at least the contrast it has on `primary`. Check `on-primary` against `primary` yourself (4.5:1 or more); Mortar's own brands are tested in `tests/tone-contrast.test.mjs`.

A brand never inherits values from an outer brand: every `[data-mortar-brand]` starts from an empty contract.

### Surfaces

`paper` is the page, `surface` is cards, panels and raised controls, and `sunken` is wells, muted bands and hover fills. Inverse bands use the other appearance's surfaces: a brand with a navy dark page (`--m-brand-d-paper: #0b1f3a`) gets navy inverse bands on light pages too. Without a brand surface, an inverse band on a light page keeps `#000000` / `#1c1c1e` / `#1c1c1e`, and on a dark page `#f5f5f7` / `#ffffff` / `#ffffff`. `selected` is tinted into the brand's page.

Text, line and status colours stay Mortar's, so a tinted surface is the brand's contrast responsibility. Muted text and danger are the lowest: on a navy dark page, `#0b1f3a` (paper), `#102a4c` (surface) and `#143156` (sunken) keep every text and status colour at 4.5:1, but a lighter sunken such as `#16365f` drops muted text to 4.2:1. The brand builder's contrast table checks text, muted text and links on all three surfaces.

### Accent gradients

`accentGradient` (`--m-brand-*-accent-gradient`) is an optional fill for components that opt in: Button and ActionLink `variant="accent"`, and `tone="accent"` on CallToAction, Hero and Banner. Everything else, including the derived hover, active and selected colours, keeps reading the flat `accent`, which should be a colour close to the gradient.

```css
[data-mortar-brand="sunset"] {
  --m-brand-l-accent: #c2410c;
  --m-brand-l-on-accent: #ffffff;
  --m-brand-l-accent-gradient: linear-gradient(90deg, #c2410c, #9a3412);
}
```

- The value is a `linear-gradient()`, `radial-gradient()` or `conic-gradient()`, or a `repeating-` form, with at least two colour stops. Angles, positions, percentages and keywords such as `to right` are allowed; `url()` and other images are not.
- The appearance exposes it as `--m-accent-fill`, an image. Without a gradient it is a flat gradient of `--m-accent`, so paint it as `background-image: var(--m-accent-fill)` over `background-color: var(--m-accent)`. It is not a colour and cannot be used where one is expected. Inverse bands use `--m-inv-accent-fill`, from the other appearance.
- Text on it is `on-accent`, which must reach 4.5:1 against **every** stop. `tests/tone-contrast.test.mjs` checks a sample gradient brand, and the brand builder checks yours stop by stop.
- In an accent band, copy and links use `on-accent`, primary actions invert (an `on-accent` button with accent text, the same pair) and secondary actions are outlined. Media and Hero previews keep the page's colours.

### Fonts

`fonts: { body, heading }` (`--m-brand-font`, `--m-brand-font-heading`) are font-family lists, the same in light and dark. They apply wherever the brand does, including a container-scoped ThemeProvider. Headings (`h1`–`h6` inside Mortar) and component titles use the heading font; without one they keep the body font. Mortar loads no font files: load them in your app (for example with `@font-face` or your framework's font loader) and name them here.

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

ThemeProvider renders the brand as a `<style>` element beside its content. It is included in server-rendered HTML, so there is no unstyled flash; it updates when the tokens change and is removed with the provider. Overlays opened inside the provider share it, because the rule matches the brand attribute they carry. Brand names may contain only letters, digits and hyphens. Every value is checked, and anything else throws an error that names the key (such as `dark.accent`), so tenant data cannot inject CSS and a value of the wrong kind cannot fail silently:

- **Colours** are hex, a colour name (including `transparent` and `currentcolor`), or `rgb()`, `rgba()`, `hsl()`, `hsla()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, `color()`, `color-mix()`, `light-dark()` or `var(--name)`. Arguments may nest those functions and `calc()`, `min()`, `max()` or `clamp()`. A gradient, `url()`, top-level `calc()`, `attr()` or `image-set()` is rejected.
- **`accentGradient`** is a gradient whose stops follow the colour rules (see [Accent gradients](#accent-gradients)).
- **Fonts** are family names, quoted names and generic families separated by commas, such as `"Inter", sans-serif`. Functions and `url()` are rejected.
- `;`, `{`, `}`, `<`, `>`, comments and, outside font names, quotes are always rejected.

`isBrandColour`, `isBrandGradient` and `isBrandFont` from `@tony-ui/mortar/brand` run the same checks, for validating a form before you save a tenant's theme.

Outside ThemeProvider, `@tony-ui/mortar/brand` has the same building blocks:

```ts
import { brandToCss, brandToStyle, registerBrand } from "@tony-ui/mortar/brand";

brandToCss("acme", theme); // a CSS rule, e.g. for a build step
const dispose = registerBrand("acme", theme); // adds a <style>; reference-counted
brandToStyle(theme); // inline custom properties for one element
```

Inline custom properties apply only to that element's subtree. Menus and dialogs portal outside it, so prefer `brandTokens` or `registerBrand` for anything with overlays.

### With the brand builder

The playground's [brand builder](https://mortar.tony.codes/playground/?page=brand) (`/playground/?page=brand`) designs a brand against this contract. Start from a preset, set the light and dark primary pairs, and open Advanced for the optional tokens, surfaces and accent gradient; empty fields show the value they derive. Set heading and body fonts below. Light and dark previews, each with an inverse band, an accent band, an accent button, a heading sample and overlays, update as you type, and a table checks contrast: 4.5:1 for text on primary, hover, active and accent, for links, text and muted text on page, surface and sunken, and for on-accent text on every gradient stop; 3:1 for the focus ring. Copy the result as the CSS rule (from `brandToCss`) or as the `brandTokens` object. The brand is kept in the URL, so a link shares it.

## Appearance before JavaScript runs

Until ThemeProvider sets `data-mortar-appearance` (during server rendering, or with JavaScript off), Mortar follows the operating system's colour scheme, so dark-mode users don't see a light flash. To always start light, render `data-mortar-appearance="light"` on `<html>`.

## Scales

Override these on `:root` or on any container to retheme shape and rhythm:

- **Type:** `--m-font`, `--m-font-heading` (headings and component titles; unset by default, so they keep the body font), `--m-mono`, `--m-weight-regular|medium|semibold|bold`, `--m-tracking-display|heading|body|caps`, `--m-leading-display|heading|body`.
- **Space:** `--m-space-1|2|3|4|6|8|10|12` (4px to 48px).
- **Radius:** `--m-radius-xs|sm`, `--m-radius`, `--m-radius-lg|xl|full`.
- **Sizing and density:** `--m-control`, `--m-pad`, `--m-font-size`, `--m-row-pad`, `--m-icon`. `data-mortar-density="compact" | "spacious"` adjusts these.
- **Stacking:** `--m-z-sticky|overlay|popover|toast|skip`.

What follows the scales, and what does not:

- **Weight:** every component font weight reads `--m-weight-*`.
- **Radius:** every component corner that is 2, 4, 8, 12, 16 or 999px reads the matching `--m-radius-*` token. Circles (`50%`) and a few in-between sizes (5, 6, 7, 10 and 44px, and `0.5rem` in CodeBlock and PreviewFrame) stay fixed.
- **Tracking:** display titles and big numbers read `--m-tracking-display`, headings `--m-tracking-heading`, uppercase labels `--m-tracking-caps`, and text that resets to normal reads `--m-tracking-body`. Titles tuned to other values, such as the hero's `-0.045em` or section titles' `-0.035em`, stay fixed.
- **Leading:** display titles read `--m-leading-display`, testimonial quotes `--m-leading-heading`, and long-form text `--m-leading-body`. Other line heights stay fixed, including compact table and calendar text at 1.3, which does not follow `--m-leading-heading`.
- **Space:** component padding, gaps and margins do not read `--m-space-*` yet. Use the space scale in your own layouts.

## Tailwind utilities

`@tony-ui/mortar/styles.css` maps tokens into Tailwind's theme, so utilities follow a retheme:

- **Colours:** `paper`, `surface`, `sunken`, `ink`, `secondary`, `muted`, `line`, `primary`, `on-primary`, `accent`, `on-accent`, `focus`, `link`, `selected`, `success`, `warning`, `danger`, `info`. For example `bg-primary` or `text-muted`.
- **Radius:** `rounded-m-xs`, `rounded-m-sm`, `rounded-m`, `rounded-m-lg`, `rounded-m-xl`, `rounded-m-full`. Tailwind's own `rounded-sm/md/lg` keep their usual sizes.
- **Shadow:** `shadow-float`.
- **Tracking:** `tracking-display`, `tracking-heading`, `tracking-caps`.
- **Fonts:** `font-sans` (a brand's body font, else `--m-font`), `font-heading` (the brand's heading font, else `--m-font-heading`, else the body font) and `font-mono`.
- **Weights:** `font-medium`, `font-semibold` and `font-bold` follow `--m-weight-*`.
