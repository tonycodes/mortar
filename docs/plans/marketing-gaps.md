# Marketing gaps — 0.2.0

Phase 1 records the failing contracts in `tests/marketing-gaps.test.mjs` and `tests/browser/marketing-gaps.spec.mjs`. This document is the implementation plan. It does not change component source.

Ship the work below as `@tony-ui/mortar` **0.2.0**. The minor bump is required because the default CallToAction and the featured Pricing card stop painting an inverse ink slab. The other public changes are additive. Do not publish 0.1.x with the visual change.

Components stay site-agnostic. Sample content is Northwind or Example. Colour comes from semantic tokens. Do not add product names, routes, or hex colours in component source.

## Release

1. Land the greens in this plan, including the no-red items, on `feat/marketing-gaps`.
2. Set `"version"` to `0.2.0` in `package.json` and in every `manifests/*.json`. `scripts/check.mjs` copies `package.json` only onto the catalogue root. Manifest `version` fields are embedded as written.
3. Update the README version sentence and the example tarball name from `0.1.0` to `0.2.0`.
4. Run `npm run catalog` so `catalog.json` picks up the version, the manifest props, the new `tokens` list, and fresh M007 fingerprints. Do not hand-edit `catalog.json`.
5. Run `npm run check`, `npm run test:browser`, and `npm run test:visual`. The default surface change invalidates CallToAction and featured Pricing screenshots. Regenerate those baselines in the same change and leave them for maintainer review (`TESTING.md`).
6. Releases stay operator-owned (`CONTRIBUTING.md`). After the merged commit is verified, the operator runs `npm run release:prepare` and publishes that exact archive to the registry in `publishConfig` (`https://git.tony.codes/api/packages/tony/npm/`). Never overwrite a published version. This plan does not publish.
7. Consumers pin `0.2.0`. A floating range is not the adoption step. Callers who want the old contrasting slab pass `tone="inverse"`.

## #10 — CallToAction and featured Pricing stay on the page surface

### API

```ts
type MarketingTone = "surface" | "inverse";

// CallToAction
tone?: MarketingTone;

// Pricing — applied only to articles with featured: true
tone?: MarketingTone;
```

`MarketingTone` is not `SectionTone`. Section tones stay `"default" | "muted" | "inverse"`.

When `tone` is passed, set `data-tone` on the CallToAction `<section>` and on each featured Pricing `<article>`. Omit the attribute when `tone` is omitted.

### Tokens and CSS

In `src/components.css`, the exact selectors `.m-cta` and `.m-pricing-grid article[data-featured="true"]` declare:

```css
background: var(--m-surface);
color: var(--m-ink);
```

`tone="inverse"` does not change those two declarations. A more specific rule, `.m-cta[data-tone="inverse"]` and `.m-pricing-grid article[data-featured="true"][data-tone="inverse"]`, reuses the inverse remap already used by `:is(.m-marketing-section, .m-feature-section)[data-tone="inverse"]` in `src/kits.css` (`--m-paper`, `--m-surface`, `--m-ink`, and the rest of the `--m-inv-*` set). The contrasting slab is the inverse token pair, not `background: var(--m-ink); color: var(--m-paper)`.

Delete the unconditional `.m-cta .m-button-primary` and `.m-cta .m-button-secondary` colour overrides. They swap paper and ink and, once the slab is a surface, paint a paper button on a paper slab in light mode. Primary and secondary buttons then follow `--m-primary` and `--m-on-primary`, which the inverse remap already flips.

The featured card background must stay `var(--m-surface)` so the style contract passes. A secondary button on that card also uses `--m-surface`. Give `.m-pricing-grid article[data-featured="true"] .m-button-secondary` a `--m-sunken` fill and a `--m-line` border so the action stays distinct. Do not move the card itself onto `--m-sunken`.

Bento inverse tiles use the same ink/paper slab (see #1). Do not restyle them inside the #10 selector change.

### Default behaviour

Omitting `tone` is the new default and paints the page surface in both appearances. That is the break. `tone="surface"` is the same paint plus `data-tone="surface"`. `tone="inverse"` is the explicit opt-in for the old contrasting band.

Existing `actions`, `title`, and `description` props are unchanged. Pricing plans that omit `tone` keep their featured flag; only the paint changes.

### Catalogue, policy, and DESIGN.md

- `manifests/mortar-call-to-action.json` and `manifests/mortar-pricing.json` `contract.props` gain `tone`.
- No new baseline rule. M005 already requires semantic colour tokens; the red style contract is the enforcement for these two selectors.
- DESIGN.md principle 5 (`semantic-themes`): state that CallToAction and a featured Pricing card use the page surface unless `tone="inverse"` opts into the inverse token remap.

### Playground

Neutral copy already in `previews/Fixture.tsx`: "Start your next project" / "Example plans". Keep a single `.m-cta` and a single `article[data-featured="true"]` in the default preview. The browser contract locator is strict.

Add example states `surface` and `inverse` (manifest `testing.states` plus `previews/StateFixture.tsx`) that replace the preview with one component. `state=inverse` passes `tone="inverse"`. Do not stack two CTAs or two featured cards in the default preview.

In `playground/recipes.tsx`, the marketing recipe CallToAction omits `tone`. Add one later band with `tone="inverse"` and the same neutral title, not a second product name.

### Semver

0.2.0. Default paint changes. `tone` is additive.

### Reds this green satisfies

- `dark surface tokens for CallToAction and featured pricing`
- `CallToAction and featured Pricing cards accept tone surface or inverse`
- `dark neutral CallToAction and featured pricing stay on surface tokens`
- `dark green CallToAction and featured pricing stay on surface tokens`

## #8 — Pricing availability, billing toggle, and unit

### API

On `PricingPlan`:

```ts
availability?: "available" | "coming-soon" | "unavailable"; // default "available"
availabilityLabel?: string;
annualUnit?: string;
```

On `Pricing`:

```ts
billingToggle?: boolean;
```

`availability` defaults to `"available"` when omitted. `availabilityLabel` is the visible status text for the other two states.

Show the billing group (`role="group"` `aria-label="Billing interval"`, the existing Annual / Monthly buttons) when:

- `billingToggle === true`, or
- `billingToggle` is omitted and every plan has an `annual` string.

Hide it when `billingToggle === false`, and when it is omitted and any plan lacks `annual`. One annual price is not enough.

Price text stays `annual && plan.annual ? plan.annual : plan.monthly`. Render a suffix only for the figure on screen:

- monthly figure: `plan.unit` when set
- annual figure: `plan.annualUnit` when set
- never invent `"/month"` and never reuse `unit` beside the annual figure

Initial toggle state stays Annual (`useState(true)`), which is why an annual figure with `unit: "/month"` is the failing case today.

### Unavailable plans

When `availability` is `"coming-soon"` or `"unavailable"`:

- do not render the plan `action` (no `<a href>` for that plan)
- set `data-availability` on the `<article>` to that value
- render `availabilityLabel` inside an element with `role="status"`

An available plan, including the default, still renders its action link. Do not use `aria-disabled` as a substitute for omitting the link. The contract requires the status role and the absent href.

### Tokens

No new tokens. Unavailable cards use the same surface, line, and ink tokens as an available card. Do not grey them out with a raw colour.

### Default behaviour

Existing plans with no `availability` keep the purchase link. Existing plans with no `unit` still render no suffix. A monthly-only plan with `unit: "/month"` still shows that suffix.

The toggle default changes for mixed plans. Today `plans.some(plan => plan.annual)` shows the toggle when a single plan has `annual`. After this change that page hides the toggle unless the caller sets `billingToggle` or adds `annual` on every plan. The Pricing preview is that mixed case (only Team has `annual`). Give Basic an annual price in the default preview so the toggle remains visible, or set `billingToggle` there on purpose.

`billingToggle={true}` with no annual prices still renders the toggle. Those plans show `monthly`.

### Catalogue, policy, and DESIGN.md

- `manifests/mortar-pricing.json` `contract.props` documents `billingToggle` and the plan fields `availability`, `availabilityLabel`, `annual`, `unit`, and `annualUnit`.
- No baseline-policy rule. The node contracts cover the behaviour.
- DESIGN.md principle 6: a plan that is not available exposes a status and does not offer a purchase link.

### Playground

Default Pricing preview: Northwind-neutral copy already there ("Example plans", "Basic", "Team"). Add `annual` on every plan (for example `"$0"` and `"$16"`) so the toggle stays. Add `unit: "/month"` on the monthly figure and `annualUnit: "/year"` on the annual figure.

Add an example state `coming-soon` with one plan `availability="coming-soon"` and `availabilityLabel="Coming soon"`, and no featured flag, so the default preview still has one featured card.

Recipe pricing in `playground/recipes.tsx` should use the same props and drop product-specific beta copy when that block is edited. Sample names stay Basic and Team.

### Semver

0.2.0. New props are additive. The mixed-plan toggle default is a behaviour change and ships in the same minor.

### Reds this green satisfies

- `Pricing availability hides the purchase link and exposes a status`
- `Pricing billing toggle is explicit or requires an annual price on every plan`
- `Pricing unit rendering does not fabricate /month`

## #7 — MarketingHeader slot, identity, and duplicate keys

### API

`logo?: ReactNode` already exists and is passed through `BrandMark`. Add:

```ts
className?: string;
id?: string;
```

Put `id` on the `<header>`. Merge `className` with the existing class: `m-marketing-header` plus the caller class. Do not replace `m-marketing-header`.

### Duplicate keys

These lists key by `href` alone, so two actions or links with the same href warn in the React development client:

- `MarketingHeader` links (`key={link.href}`)
- `Hero` actions (`key={action.href}`)
- `CallToAction` actions (`key={action.href}`)
- `Footer` column links and legal links (`key={link.href}`)

Key with label, href, and index (`${label}:${href}:${index}`) so both nodes render and React does not emit `Encountered two children with the same key`. The warning is a development-client `console.error`. Server markup and the production preview do not emit it. The red mounts a Vite dev server for that reason.

Apply the same key shape to the other `key={item.href}` lists in `src/marketing-sections.tsx` (`PostList`, `NotFound`), `src/docs.tsx`, and `src/application.tsx` in the same change. The red covers only the four marketing components above.

### Tokens

None.

### Default behaviour

Omitting `className` and `id` leaves the header as it is today, including the logo slot. Link order and hrefs are unchanged. Only the React key changes.

### Catalogue, policy, and DESIGN.md

- `manifests/mortar-marketing-header.json` `contract.props` gains `className` and `id`. `logo` is already public in the component and should be listed if it is missing from the manifest.
- No baseline-policy change.
- DESIGN.md principle 3 already requires product chrome in props and slots. Mention the header `logo` slot there if the principle text stays generic.

### Playground

Default MarketingHeader preview: `brand="Northwind"`, `id="site-header"`, `className` omitted or a layout class that does not fight `m-marketing-header`, and `logo` as an `<img alt="" src="...">` using an existing kit asset or a neutral inline mark. Do not add a wordmark image that names a product.

An example state `duplicate-links` renders two links that share `#pricing` with different labels ("Pricing" and "Plans") so the preview shows both.

### Semver

0.2.0. Additive props. Key changes are not a public API break.

### Reds this green satisfies

- `MarketingHeader forwards a logo slot, className and id` (logo already passes; `id` and `className` are the failing clauses)
- `duplicate href actions and links render without a same-key warning`

## #3 — Accent tokens

### API

No component prop. Utilities and components read the tokens. Do not hard-code an accent hex in a component.

### Tokens

Declare both custom properties in each of these exact selector bodies in `src/tokens.css`. The contract reads the body of the selector, so a value inherited from `:root` does not count.

| Selector                                                          | `--m-accent` | `--m-on-accent` |
| ----------------------------------------------------------------- | ------------ | --------------- |
| `:root`                                                           | `#000000`    | `#ffffff`       |
| `:root[data-mortar-appearance="dark"]`                            | `#ffffff`    | `#000000`       |
| `:root[data-mortar-brand="green"]`                                | `#047857`    | `#ffffff`       |
| `:root[data-mortar-brand="green"][data-mortar-appearance="dark"]` | `#6ee7b7`    | `#022c22`       |

Those values already exist in the palette (`--m-primary` / `--m-on-primary`, and the dark green focus and inverse on-primary). Neutral accent matches primary so the neutral brand stays monochrome. Green accent matches the green primary pair, with the lighter green on the dark appearance.

Also declare `--m-inv-accent` and `--m-inv-on-accent` beside the other inverse tokens, using the opposite appearance's accent pair, and remap them in the inverse section rule in `src/kits.css` the same way `--m-primary` is remapped. The accent red does not assert the inverse pair. Add it so `tone="inverse"` flips accent with the rest of the band.

In `styles.css` `@theme inline`:

```css
--color-accent: var(--m-accent);
--color-on-accent: var(--m-on-accent);
```

### Catalogue, policy, and DESIGN.md

- Extend `scripts/check.mjs` so the generated catalogue includes `tokens`: a sorted list of unique `--m-*` names declared in `src/tokens.css`. `npm run catalog` writes that list. M008 then fails if `catalog.json` drifts.
- Add baseline rule M009, "Accent tokens are declared for every brand and appearance", and bump `baseline-policy.json` `version` from `1.1.0` to `1.2.0`. The check fails when either name is missing from any of the four selectors above. Catalogue `policyVersion` updates through `npm run catalog`.
- DESIGN.md principle 5: accent is a brand token, separate from ink, surface, and the feedback colours. Every brand and appearance declares `--m-accent` and `--m-on-accent`.

Item #5 renames the three attribute selectors. Land the declarations on the current `:root[...]` selectors so this red passes, then move the declarations with the selectors and update the accent test in the #5 change. A container scope must still contain the declarations. The bare `:root` block stays the default light set.

### Playground

No new component. Brand and appearance controls already switch the selectors. Sample content is unchanged.

### Semver

0.2.0. Additive tokens. No caller break.

### Red this green satisfies

- `accent tokens exist for every brand and appearance and in the token catalogue`

## #9 — Footer heading level and plain-text note

### API

```ts
headingLevel?: 2 | 3 | 4; // default 2
note?: ReactNode;
```

Column titles render as that heading level. The default remains `<h2>`, which is what the component hard-codes today.

`note` renders as text in the footer, outside any link. `description` stays the existing paragraph and is not the new slot. Do not accept column items as raw strings in this change. The contract slot is `note`.

### Tokens

None. Note text uses the footer ink / muted tokens already on `.m-footer`.

### Default behaviour

Omitting `headingLevel` still renders `<h2>`. Omitting `note` adds no node. Columns, legal links, logo, and copyright are unchanged.

### Catalogue, policy, and DESIGN.md

- `manifests/mortar-footer.json` `contract.props` gains `headingLevel` and `note`.
- No baseline-policy change.
- DESIGN.md principle 6: column titles accept an explicit heading level so a page can keep a single `h1`.

### Playground

Default footer preview keeps `brand="Northwind"`, `description="Example product"`, and column title "Product" at the default level. Pass `note="Weekdays 9 to 5"`.

An example state `heading-3` passes `headingLevel={3}` and the same column, so the default preview still shows `h2`.

When `playground/recipes.tsx` footer is edited, replace the product-specific description with the Example copy. Keep the Northwind brand.

### Semver

0.2.0. Additive. Default heading level stays 2.

### Reds this green satisfies

- `Footer headingLevel sets the column title level and defaults to h2`
- `Footer note renders plain text that is not a link`

## #11 — `data-m-component` on marketing roots

### API

No prop. Each marketing-kit export sets `data-m-component="<ExportName>"` on the outermost element it returns. The value is the export name, not the file name or the manifest id.

The catalogue `kitId === "marketing"` exports, which the red renders, are:

`BentoGrid`, `CallToAction`, `ChatPreview`, `ContactSection`, `FAQ`, `FeatureGrid`, `FeatureSection`, `Footer`, `Hero`, `LogoCloud`, `MarketingHeader`, `MockWindow`, `Newsletter`, `NotFound`, `PlanComparison`, `PostList`, `Pricing`, `ProcessSteps`, `Section`, `StatGroup`, `TeamGrid`, `Testimonial`, `TestimonialGrid`.

`Steps` is a docs-kit export. It is out of this attribute set. #2 does not add it unless its manifest `kitId` changes.

The attribute goes on the first element the component returns (`header`, `section`, `footer`, `figure`, `dl`, and the other current roots). Do not wrap an extra element only to hold the attribute.

### Tokens

None.

### Default behaviour

DOM gains one data attribute. Classes, roles, and layout are unchanged. Callers that query `.m-cta` or `article[data-featured="true"]` keep working.

### Catalogue, policy, and DESIGN.md

- No manifest prop change. Mention the attribute in each marketing manifest `contract.accessibility` or `usage` line in one sentence so the catalogue describes the hook.
- No new baseline rule. The node contract compares factory roots with the marketing catalogue exports, so a new marketing export fails the test until it carries the attribute.
- DESIGN.md: one line under principle 3 or 6 that marketing roots expose `data-m-component` for tests and consumers. It is not a styling hook.

### Playground

No new demo. Existing previews pick up the attribute from the component.

### Semver

0.2.0. Additive DOM attribute.

### Red this green satisfies

- `marketing component roots expose data-m-component`

## #1 — BentoGrid (no red)

`BentoGrid` already exists in `src/marketing-sections.tsx`. Do not add a second grid.

Current API:

```ts
items: {
  title: string;
  description: string;
  visual?: ReactNode;
  span?: 1 | 2;
  inverse?: boolean;
}[];
```

The section title is a hard-coded `h2`. Item titles are hard-coded `h3`. Items are `<article>` elements inside `<div class="m-bento">`, keyed by `item.title`. `inverse` paints `background: var(--m-ink); color: var(--m-paper)` (the #10 slab).

Responsive layout already exists in `src/kits.css`: 3 columns, 2 columns at `max-width: 900px`, 1 column at `max-width: 540px`, and `span: 2` resets to auto at 540px. Keep those breakpoints.

Green, still without a new red:

- Add `headingLevel?: 2 | 3 | 4` (default 2) for the section title. Item titles render one level down, capped at `h4` when the section is `h2` or `h3`, and stay `h4` when the section is `h4`. Default markup stays `h2` + `h3`.
- Key items with title and index so duplicate titles do not collide.
- Keep the articles. Give the grid `role="list"` and each article `role="listitem"`, or wrap them in a `<ul>` / `<li>` without losing the article semantics. Prefer `<ul>` with `<li><article>`. The accessible name of the section remains the visible title.
- Replace the inverse ink/paper declarations with the same inverse token remap as #10, triggered by `data-inverse` or `data-tone="inverse"`. Default tiles stay `--m-sunken` on a surface page. `inverse` remains an opt-in, so this is not a default-paint break.
- Playground: one wide tile (`span: 2`) and one inverse tile, titles "Wide" and "Focus", descriptions that do not name a product. `visual` can be an empty muted block.

## #2 — Steps (no red)

Two ordered lists already exist. Do not rebuild either as a feature grid.

- `Steps` in `src/docs.tsx` renders `<ol class="m-steps">`. Numbers are `aria-hidden`. Item titles are hard-coded `h3`. This is the docs sequence.
- `ProcessSteps` in `src/marketing.tsx` renders `<ol class="m-process-steps">` inside a section. Numbers are `aria-hidden`. Item titles are hard-coded `h3`. The section title is a hard-coded `h2`. Columns follow `--m-steps` (the item count), drop to 2 at 900px, and to 1 at 540px. Connectors hide at 900px.

Green:

- Keep `<ol>` / `<li>` and `aria-hidden` numbers. The list position is the accessible order. Do not add a second visible numbering system that is exposed to assistive tech.
- `Steps`: `headingLevel?: 2 | 3 | 4` default 3, so current `h3` titles stay. Key by title and index.
- `ProcessSteps`: `headingLevel?: 2 | 3 | 4` default 2 for the section title. Item headings are the next level, with the same cap as BentoGrid. Default remains `h2` + `h3`.
- Playground copy stays "Sign up" / "Create an account." style Example steps. No new route names.

`data-m-component` on `ProcessSteps` is #11. `Steps` stays a docs component.

## #5 — Scoped ThemeProvider (no red)

`ThemeProvider` always writes `data-mortar`, `data-mortar-brand`, `data-mortar-density`, and `data-mortar-appearance` on `document.documentElement`.

### API

```ts
scope?: "document" | "container"; // default "document"
```

`scope="document"` keeps today's effects, including cleanup that restores the previous document attributes.

`scope="container"` does not touch `documentElement`. It renders one wrapper and sets the same attributes there:

```tsx
<div
  data-mortar=""
  data-mortar-brand={brand}
  data-mortar-density={density}
  data-mortar-appearance={resolvedAppearance}
>
  {children}
</div>
```

`resolvedAppearance` is `"light"` or `"dark"`. `appearance="system"` still follows `prefers-color-scheme` and updates the wrapper. Controlled `appearance` / `onAppearanceChange` (already on the provider) keep working for both scopes.

### Selectors

Token rules that start with `:root[data-mortar` move onto the attribute, so a wrapper matches. The bare `:root { ... }` light defaults stay, so a page with no provider still has tokens.

| Current                                                           | Replacement                                                  |
| ----------------------------------------------------------------- | ------------------------------------------------------------ |
| `:root[data-mortar]`                                              | `[data-mortar]`                                              |
| `:root[data-mortar-appearance="dark"]`                            | `[data-mortar-appearance="dark"]`                            |
| `:root[data-mortar-brand="green"]` (both blocks)                  | `[data-mortar-brand="green"]`                                |
| `:root[data-mortar-brand="green"][data-mortar-appearance="dark"]` | `[data-mortar-brand="green"][data-mortar-appearance="dark"]` |
| `:root[data-mortar-density="compact"]`                            | `[data-mortar-density="compact"]`                            |
| `:root[data-mortar-density="spacious"]`                           | `[data-mortar-density="spacious"]`                           |
| `@media (pointer: coarse) { :root[data-mortar] }`                 | `[data-mortar]` inside the same media query                  |

`styles.css` `@custom-variant mortar-dark` already uses `[data-mortar-appearance='dark']` without `:root`. Leave it.

Specificity drops by the `:root` pseudo-class. Brand and appearance rules stay tied with each other because both lose the same pseudo-class, and source order is unchanged, so green brand properties that currently win over the dark block still win. The combined green+dark selector still has higher specificity than either single attribute.

Document scope still matches, because `document.documentElement` is an element that carries the attributes.

In the same change, point the accent contract at the new selectors. The declarations from #3 move with the rules. `:root` remains in the accent test for the default light block.

### Default behaviour

`scope` omitted is `"document"`. Existing playground and browser contracts that read `html[data-mortar-appearance]` keep passing.

### Playground

No default change. An example state or a docs snippet shows two container scopes side by side only if it does not replace the document-level preview the theme specs use. Prefer a short comment in DESIGN.md plus one isolated preview state `scope-container` on `ThemeProvider` if that export has a fixture. Do not nest it inside the marketing previews the surface spec loads.

### Semver

0.2.0. Default scope is back-compatible. Selector specificity is an internal change called out in the release notes.

## #6 — Controlled AppearanceControl (no red)

`ThemeProvider` already accepts controlled `appearance` and `onAppearanceChange`. The playground passes them. Do not rename those props.

`AppearanceControl` currently takes no props, requires `ThemeProvider`, and calls `context.setAppearance`.

### API

```ts
function AppearanceControl(props?: {
  value?: Appearance;
  onChange?: (value: Appearance) => void;
}): JSX.Element;
```

- Neither prop: today's behaviour (`aria-pressed` from context, clicks call `context.setAppearance`).
- Both props: controlled. `aria-pressed` follows `value`. Clicks call `onChange` and do not also write context. Context is optional in this mode so a control can sit outside a provider when the parent owns the state.
- One of the two props: throw an error that names both props. A half-controlled control is not a supported state.

`ThemeProvider` controlled mode stays:

```ts
appearance?: Appearance;
onAppearanceChange?: (value: Appearance) => void;
```

When `appearance` is set, it wins over internal state. `onAppearanceChange` still runs after the internal update when the provider is uncontrolled, matching the current `setAppearance` implementation. Document that pairing `appearance` with `onAppearanceChange` is the controlled provider, and that `AppearanceControl` inside that provider needs no `value` of its own because it already reads context.

### Default behaviour

`<AppearanceControl />` inside `<ThemeProvider>` is unchanged.

### Playground

The existing appearance control keeps using context. Add no second control on the default chrome. A fixture state `controlled` is enough: `value` held in the fixture and `onChange` updating it, with sample labels Light, Dark, and System (the current labels).

### Semver

0.2.0. Additive optional props.

## Order

1. #10 CSS and `tone`, then the #8, #7, #9, and #11 prop and attribute changes. These turn the current reds green without moving selectors.
2. #3 accent tokens, `styles.css` theme aliases, `catalog.tokens`, M009, policy `1.2.0`, DESIGN.md.
3. #5 selector migration and the accent-test selector update, plus `scope`.
4. #1, #2, and #6.
5. Preview and recipe updates, `npm run catalog`, version bump, visual baselines, then the operator release.

## Red to green

| Red                                                                             | Green                                            |
| ------------------------------------------------------------------------------- | ------------------------------------------------ |
| `dark surface tokens for CallToAction and featured pricing`                     | #10 CSS declarations                             |
| `CallToAction and featured Pricing cards accept tone surface or inverse`        | #10 `tone` and `data-tone`                       |
| `dark neutral CallToAction and featured pricing stay on surface tokens`         | #10 CSS, checked in the browser                  |
| `dark green CallToAction and featured pricing stay on surface tokens`           | #10 CSS, checked in the browser                  |
| `Pricing availability hides the purchase link and exposes a status`             | #8 availability                                  |
| `Pricing billing toggle is explicit or requires an annual price on every plan`  | #8 `billingToggle`                               |
| `Pricing unit rendering does not fabricate /month`                              | #8 unit / `annualUnit`                           |
| `MarketingHeader forwards a logo slot, className and id`                        | #7 `id` and `className` (`logo` already renders) |
| `duplicate href actions and links render without a same-key warning`            | #7 unique keys                                   |
| `accent tokens exist for every brand and appearance and in the token catalogue` | #3 tokens, theme aliases, `catalog.tokens`       |
| `Footer headingLevel sets the column title level and defaults to h2`            | #9 `headingLevel`                                |
| `Footer note renders plain text that is not a link`                             | #9 `note`                                        |
| `marketing component roots expose data-m-component`                             | #11                                              |

#1, #2, #5, and #6 have no red in this phase. Their greens are the sections above. #5 updates the accent red's selectors in the same change that moves the CSS.
