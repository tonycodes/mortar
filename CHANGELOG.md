# Changelog

Mortar follows [semantic versioning](https://semver.org/). Before 1.0, a minor release may contain breaking changes, and it says so. Each release is published from its `v<version>` tag to [npmjs.com](https://www.npmjs.com/package/@tonycodes-ui/mortar) with npm provenance. Its GitHub release carries the exact archive and a `provenance.json` with the commit and SHA-512 integrity.

## Unreleased

### Added

- **Surfaces in the brand contract.** A brand can set `paper`, `surface` and `sunken` for each appearance (`--m-brand-l-paper|surface|sunken`, `--m-brand-d-paper|surface|sunken`), for example a navy dark page. Omitted, they keep today's values, and inverse bands take them from the other appearance. Mortar's text and status colours stay fixed, so check them against tinted surfaces: the brand builder's contrast table now does ([#59](https://github.com/tonycodes/mortar/issues/59)).
- **Accent gradients.** `accentGradient` per appearance (`--m-brand-{l,d}-accent-gradient`) takes a `linear-`, `radial-` or `conic-gradient()` (or a `repeating-` form) whose stops are colours. It is painted only where a component opts in: Button and ActionLink `variant="accent"`, and `tone="accent"` on CallToAction, Hero and Banner, all with `onAccent` text. Without a gradient these paint the flat accent. The appearance exposes the fill as `--m-accent-fill` (an image, painted over `background-color: var(--m-accent)`) and `--m-inv-accent-fill` for inverse bands. On hover and active the fill takes a white or black wash chosen from the on-accent text (`--m-accent-wash`), so contrast rises instead of falling; browsers without relative colours keep the plain fill. The brand builder checks on-accent text against every stop at rest, hover and active.
- **Heading font.** Headings and component titles (page, section, hero, card, settings, sign-in, auth, post, calendar and stacked-list titles, and prose headings) read `--m-font-heading`. It is unset by default, so headings keep the font they inherit; nothing changes until you set it. A brand can set `fonts: { body, heading }` (`--m-brand-font`, `--m-brand-font-heading`), which apply wherever the brand does, including a container-scoped ThemeProvider. Tailwind gains a `font-heading` utility, and `font-sans` follows a brand's body font.
- `isBrandColour`, `isBrandGradient` and `isBrandFont` in `@tonycodes-ui/mortar/brand` check a value before you save it. Fonts accept bare `var(--name)` entries, as framework font loaders such as `next/font` hand out.
- The brand builder checks strong lines (`--m-line-strong`, control borders) at 3:1 on page, surface and sunken.
- **Landing-page composition** ([#68](https://github.com/tonycodes/mortar/issues/68)). All additions are optional, and default markup is unchanged.
  - **MarketingPage** frames a public page: a header, a `<main>` that grows to fill the viewport, and a footer. `align="center"` centres a single hero between them. The page is at least the viewport's height, and longer content scrolls rather than clipping.
  - **Hero** `emphasis` marks a phrase of the title as `<em class="m-emphasis">` inside the one heading, in the brand's link colour. The title stays a string, and a phrase that isn't in it is ignored. `note` adds supporting content below the actions, such as a note or a Notice. `wide="copy" | "preview"` gives one split column three fifths of the width.
  - **MarketingHeader** `tagline` shows a short descriptor beside the wordmark, outside the home link. It is hidden at 560px and narrower.
  - **Footer** `layout="inline"` is one compact row of brand, notes, links, copyright and legal links. It wraps without changing reading order. `description` and `columns` are now optional.
- **NetworkIllustration** ([#68](https://github.com/tonycodes/mortar/issues/68)) draws nodes and straight connections supplied as data, in a viewBox that scales to its container. Signals travel along connections that carry one, with a duration per illustration or per connection and an even stagger by default. It is decorative by default (`aria-hidden`). Given a `label`, it is one named image with an optional `description`. Colours are tokens: surface nodes with a strong-line outline, accent nodes and signals, and secondary labels. While signals move, a visible "Pause animation" button controls them, and `paused` with `onPausedChange` makes that choice controlled or shared. Signals stop automatically under `prefers-reduced-motion`, which shows the static drawing with no control, even before scripts run. They also stop while the document is hidden or the drawing is off screen. Returning never overrides the user's pause. `motion="static"` draws the same thing without motion. The animation is illustrative and never announced as live activity. It adds no dependency.
- **Split landing template** (`?recipe=split-landing`, [#68](https://github.com/tonycodes/mortar/issues/68)). A one-screen landing page composed only from public components: MarketingPage, a MarketingHeader with a tagline and the consumer's logo in the logo slot, a split Hero with an emphasised title, a Notice as supporting feedback, a NetworkIllustration, and an inline Footer. The CLI and MCP list it with the components it composes. Its browser test checks 320px reflow, 200% zoom, long text, keyboard order and visible focus in both themes. It also has a visual baseline.
- **Docs: marketing surfaces and illustrations** ([theming](docs/theming.md#marketing-surfaces-and-illustrations)). Shows which existing tokens a branded landing page and its SVG read (canvas, text, borders, emphasis, accent and focus), and lists the supported extension points and what is not supported. No new tokens: every role already had one. [Mortar for coding agents](docs/agents.md#the-audit) and the agent skill now say that a clean audit is not proof that a page uses only Mortar components.

### Fixed

- **Brand values are checked as colour syntax.** `brandToStyle`, `brandToCss`, `registerBrand` and `brandTokens` accepted any value made of letters, digits and brackets, so `accent: "linear-gradient(…)"` or `url(…)` passed and then failed silently in the browser. A colour is now hex, a colour name (including `transparent` and `currentcolor`), or `rgb()`, `rgba()`, `hsl()`, `hsla()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, `color()`, `color-mix()`, `light-dark()` or `var()`, with nested functions checked the same way. Anything else throws an error that names the key, such as `dark.accent`.
- **The audit no longer flags brand colours as `raw-colour`.** Colours inside a `brandTokens={…}` value (and a `const` it references in the same file), the arguments of `brandToCss`, `brandToStyle` and `registerBrand`, objects typed as or satisfying `BrandDefinition`, and `--m-brand-*` values are where colours belong. Other colours in the same file are still reported.

### Changed

- **`--m-line-strong` in light is `#8b8b90`** (was `#8e8e93`), and `--m-inv-line-strong` in dark with it. The old value was 2.99:1 on the default sunken surface, just under the 3:1 that control borders need.

- **Packages are published to npmjs.com.** Install with a plain `npm install @tonycodes-ui/mortar`; no registry configuration, account or token is needed. Releases are published from GitHub Actions with npm trusted publishing (OIDC, no long-lived token) and `--provenance`, so each version on npmjs.com links to the workflow run and commit that built it.
- **The playground moved to GitHub Pages**, at https://mortar.tony.codes/playground/. The site root links the playground, GitHub, npm and the docs. The package `homepage` points there.
- **Everything is free and in this repository.** The hosted Mortar Cloud preview (agent identities, OAuth MCP connections, hosted audits and planned paid plans) is retired. The kit, docs, playground and agent tooling are MIT licensed here, with no accounts, licence checks, telemetry or hosted service. GitHub maintainer review is the only review gate.

### Migration

Versions up to 0.11 of the private-registry package `@tony-ui/mortar` were published only to the previous owner-hosted registry, `https://git.tony.codes/api/packages/tony/npm/`, which will be retired. New versions are on npmjs.com only. To upgrade, remove the scope override and install from npmjs.com:

```sh
npm config delete @tony-ui:registry --location=project
npm install @tonycodes-ui/mortar@latest
```

A project that must stay on 0.11 or earlier keeps its scope override (`@tony-ui:registry=https://git.tony.codes/api/packages/tony/npm/` in `.npmrc`) while that registry remains available, or installs the archive attached to the version's [GitHub release](https://github.com/tonycodes/mortar/releases).

## Unreleased

### Added

- **Open agent tooling in the package: an MCP server and the `mortar` CLI.** They read the installed version's catalogue, contracts, examples and guides, run locally, work offline and need no account. They add no runtime dependencies. See [Mortar for coding agents](https://github.com/tonycodes/mortar/blob/main/docs/agents.md).
  - `mortar mcp` is a stdio MCP server (`claude mcp add mortar -- npx -y @tonycodes-ui/mortar mcp`) with six tools: `search_components`, `get_component` (props with types and defaults, usage notes, dependencies, marker, tested states and a JSX example), `get_build_packet` (for component names or a free-text brief: the dependency closure, imports, CSS and ThemeProvider setup, design principles, API conventions and matching page templates), `get_guide`, `list_kits` and `audit_app`.
  - `mortar search`, `component`, `packet`, `audit`, `guide` and `kits` give the same answers on the command line, with `--json`.
  - `mortar audit [path]` is a read-only static audit of an application: version range, imports and props that the installed version does not have (with 0.6 rename suggestions), invalid prop values, CSS overriding `.m-*` classes or `[data-m-component]`, raw colours beside Mortar components, a missing `styles.css` import or ThemeProvider, deep imports and local copies of Mortar source. It exits 1 when it finds errors.
  - An agent skill, `skills/mortar/SKILL.md` (`npx mortar skill`), with the workflow defaults: search, packet, compose, audit, and contribute by pull request.
- The package now also ships `AGENTS.md`, `CONTRIBUTING.md`, `TESTING.md` and the guides in `docs/`, which the tools read.

## Unreleased

### Added

- **`ErrorSummary`** (Foundation › Form controls): the problems that stopped a form submitting, listed above the form with a link to each field. Props: `errors` (`{ message; href?; target? }[]`; renders nothing when empty), `title` (default "There is a problem"), `headingLevel` (default 2), `autoFocus` (default true), `submitCount`, `id` and `className`. It is a `role="alert"` region named by its heading with `tabIndex={-1}`: it takes focus when it appears and whenever `submitCount` changes, but not while a fixed field's error clears. A link focuses its field without changing the URL hash; for a group such as a RadioGroup the checked or first radio takes focus, and the label or legend scrolls into view.
- **Checkbox `error`**: the message is announced when it appears (`role="alert"`), the box is `aria-invalid` and `aria-describedby` links the description and the error. `required` adds the decorative `*` after the label, as on Input and Select. Without these props the markup is unchanged.
- **RadioGroup `error`, `hint`, `required` and `id`**: the hint or error sits under the legend and describes the fieldset; with an error each radio is `aria-invalid`, and `required` marks every radio and adds `*` to the legend. Without these props the markup is unchanged.

### Changed

- The sign-up and other auth page templates use `ErrorSummary` and `Checkbox error` instead of a local summary and a hand-wired terms error. The terms checkbox is now `required`.

## 0.11.0 (2026-10-20)

### Added

- **Sign-in and registration building blocks** (Application UI › Sign-in and registration). See [Sign-in and registration flows](https://github.com/tonycodes/mortar/blob/main/docs/auth-flows.md).
  - `AuthLayout`: the page shell for auth screens. It renders the page's `main` and `h1` (`headingLevel`, default 1), with `logo`, `description`, `footer` and `layout="center" | "cards" | "split"`. With `split`, the `aside` sits beside the form; on narrow screens a text aside follows the form and a lone image or video is hidden.
  - `PasswordInput`: a password field with a show/hide toggle (`aria-pressed`, keeps focus), `purpose="current" | "new"` for `current-password`/`new-password` autocomplete, an optional `requirements` checklist (each item met or not met, announced only when the whole set changes) and a `strength` meter.
  - `CodeInput`: a one-time code field. It is one `autocomplete="one-time-code"` input drawn as `length` cells (default 6), so typing, Backspace, paste and autofill behave as in a text field. Digits only, or `alphanumeric`. `onChange(value)` gets the cleaned code; the optional `onComplete(code)` fires when it is full.
  - `ProviderButtons`: one secondary button per sign-in provider, as a `list` or a `grid`, optionally a named group.
- **Page templates** for sign in (card and split screen), sign up, forgot password, check your email, reset password, verify email and two-factor, with validation, error summaries, loading and success states, and resend cooldowns.

### Changed

- **SignInPanel** renders its providers with `ProviderButtons` and its divider with `Divider`. Its props are unchanged. The markup differs in three places: the providers wrapper is `div.m-provider-buttons` (was `div.m-sign-in-providers`); a provider icon is Button's `span.m-button-icon` (was `span.m-sign-in-icon`); the divider is `<div class="m-divider" role="separator" aria-label="or">` (was `<p class="m-sign-in-divider">`); it looks the same.
- The playground's "Forms and settings" category no longer lists SignInPanel; it is in the new "Sign-in and registration" category.

## 0.10.0 (2026-10-20)

### Added

- **Playground brand builder** (`?page=brand`, [open it](https://mortar.tony.codes/playground/?page=brand)): edit a brand's light and dark values, including the optional tokens, and see them live in light, dark and inverse previews with overlays. It reports WCAG contrast for on-primary, hover, active, accent, link and focus as the browser resolves them, exports the CSS rule and the `brandTokens` object, and keeps the brand in the URL so it can be shared. Playground only; the package is unchanged.

### Changed

- **Scale tokens drive component styles:** component font weights now read `--m-weight-*`, and corner radii, letter spacing and line heights that equal a scale value read `--m-radius-*`, `--m-tracking-*` and `--m-leading-*`. At the default token values nothing renders differently. Overriding a token on `:root` or a container now restyles the components inside it. Padding, gaps and margins do not read `--m-space-*` yet. See [Scales](https://github.com/tonycodes/mortar/blob/main/docs/theming.md#scales).

### Fixed

- **Runtime brands that change:** ThemeProvider renders `brandTokens` as an ordinary `<style>` beside its content instead of a hoisted stylesheet. React 19 never removes hoisted styles, so switching back to an earlier set of tokens could show the wrong brand. The stylesheet now updates in place and is removed on unmount. It is still server-rendered.

## 0.9.0 (2026-10-20)

Theming. See [Theming](https://github.com/tonycodes/mortar/blob/main/docs/theming.md).

### Added

- **Brand contract:** a brand declares only `--m-brand-l-*` and `--m-brand-d-*`. Light, dark and inverse sections resolve from it. Hover, active, selected, accent, focus and link derive from `primary` when omitted, so a complete brand can be four values.
- **Runtime brands:** `ThemeProvider` accepts `brandTokens` and any brand name. The brand renders as a hoisted, server-rendered stylesheet that overlays share, and its values are validated so tenant data cannot inject CSS. `@tonycodes-ui/mortar/brand` exports `brandToCss`, `brandToStyle` and `registerBrand`.
- **Scale tokens:** `--m-weight-*`, `--m-tracking-*`, `--m-leading-*`, `--m-space-*`, `--m-radius-xs` and `--m-radius-xl`.
- **Tailwind:** `info`, `secondary`, `selected` and `link` colours, `rounded-m*`, `shadow-float`, `tracking-display|heading|caps`, and font weights that follow the tokens.

### Changed

- **No dark flash:** before `data-mortar-appearance` is set (server rendering, or no JavaScript), Mortar follows the operating system's colour scheme. Set `data-mortar-appearance="light"` on `<html>` to keep the old always-light start.
- **Green in dark mode:** primary buttons use mint `#6ee7b7` with dark text, as green's inverse sections already did, instead of dark green `#047857`. Each brand now has one dark-side primary, and mint has 3:1 or more contrast against the black page where dark green had 2.7:1. Everything else in neutral and green is unchanged.
- **Baseline policy 1.4.0:** M009 now requires brands to declare only the brand contract and each appearance to resolve the accent pair and its inverse.

### Fixed

- **Branded element in a dark page:** a `data-mortar-brand` element inside a dark page without its own `data-mortar-appearance` now resolves dark. Before, it got light-mode accent, focus and link colours.
- **Density in nested containers:** a container nested in a compact or spacious one keeps that density unless it sets its own. `density="comfortable"` now sets the comfortable sizes explicitly, instead of relying on the light appearance to reset them.

## 0.8.0 (2026-10-20)

- **Component marker:** the root element of every exported component now carries `data-m-component="<ExportName>"`, not only the marketing sections. It is a hook for tests and consumers, not for styles. Dialogs mark their dialog root. No other markup changes.
- **Prose:** prose styles now stop at nested component roots (`[data-m-component]`) instead of at any element with an `m-` class, so a utility class such as `m-4` inside prose no longer opts that element out.

### Internal

- **Playground:** page templates load on demand, and React and Headless UI get their own chunks, so the main chunk drops from 821 kB to 320 kB. The published package is unchanged.

## 0.7.0 (2026-10-19)

Additive: no exports removed, no prop types narrowed, and every default renders unchanged.

### Marketing

- **Hero:** a phone mockup (new `MockWindow variant="phone"`), image tiles (`images`) and an angled image (`layout="angled"`).
- **FeatureSection:** an `offset` screenshot. A code example is a composition with `CodeBlock`.
- **BentoGrid:** a section `tone` and tall tiles through the item `rowSpan`.
- **StatGroup:** a `background` image band, and `layout="timeline" | "stepped"`.
- **Pricing:** four tiers, and an `extra` full-width tier band (new `PricingExtra` type).
- **ContentSection:** `stats` and a `testimonial`.
- **NotFound:** a `background` image.
- **MarketingHeader:** `layout="center"`, and `mobileMenu="panel"` for a full-screen menu dialog.
- **Flyout:** `layout="columns" | "full"`.
- **Footer:** `layout="center"` and a `newsletter` row.
- **Banner:** `variant="floating"`, and `placement="bottom"`, which can always be dismissed.
- **Newsletter:** `layout="center"` and `variant="panel"`.
- **ContactSection:** a `media` image and `offices`. The form is optional.
- **TeamGrid:** `layout="large" | "list"`.
- **PostList:** a `featured` post.
- **TestimonialGrid:** `layout="grid"` and a `featured` testimonial.

### Ecommerce and application

- **Calendar:** `agenda`, a small calendar with the selected day's meetings, and `CalendarEvent.media`.
- **ProgressSteps:** `variant="bar"`, and `navigation={false}` for status trackers.
- **OrderHistory:** `Order.progress`.
- **ShoppingCart:** a `summary` slot and `related` products.
- **OrderSummary:** line `hint`.
- **ProductReviews:** `avatars`.
- **ProductList:** `variant="overlay"`.
- **DescriptionList:** `variant="striped"`.
- **StackedList:** an item `meta` column and `chevrons`.

### Fixed

- Dismissing a component no longer drops focus to the page body when the next focusable element is inside a closed `<details>`.

### Internal

- The stylesheet is split into one file per family (foundation, overlays, application, data, calendar, marketing, docs, ecommerce), with one section per component. Rendering is unchanged. `@tonycodes-ui/mortar/styles.css` is still the only entry point.

## 0.6.0 (2026-10-19)

**Breaking.** Every component now follows one set of API conventions ([DESIGN.md](https://github.com/tonycodes/mortar/blob/main/DESIGN.md#api-conventions)). Old prop names were removed rather than aliased. **See [Migrating to 0.6](https://github.com/tonycodes/mortar/blob/main/docs/migrating-to-0.6.md)** for every old → new change.

### Added

- **TabNav:** tabs that are page links.
- **SectionHeading:** a `tabs` row.
- **EmptyState:** `dashed`, `align`, `headingLevel` and starting-point `children`. `description` is optional.
- **Avatar:** an icon `placeholder`, `statusPosition` and `decorative`.
- **Grouping:** Table `groups` and DataTable `groupBy` (sorting stays within each group).
- **MetricGroup:** `trend`, `previous` and `variant="cards"`.
- **GridList:** `details` and split actions.
- **Hero:** `background`.
- **FAQ:** `center` and `grid` layouts.
- **Pricing:** `layout="detailed"`.
- **StatGroup:** descriptions.
- **LogoCloud:** `grid` and `split` layouts.
- **ProductList:** cards with swatches and actions.
- **ProductOverview:** `gallery="grid"`.
- **OrderHistory:** quick actions.
- **Everywhere:** `className` on every component root, `id` on every section-level component, and `headingLevel` (1–6) wherever a heading was hard-coded.
- **Exported types:** `XProps` for each component, plus `HeadingLevel`, `LinkItem` and `ItemGroup`.

### Fixed

- **Themes:** menus, listboxes, popovers and dialogs inside `ThemeProvider scope="container"` keep the container's theme and focus ring. A light container inside a dark page stays light.
- **ThemeProvider:** a nested provider keeps the router adapter, and server rendering no longer causes a hydration mismatch.
- **Focus no longer drops to the page body:**
  - on loading buttons
  - at either end of Pagination
  - when dismissing a Toast, Notice or Banner
  - when removing a FilterChip, cart line or filter
- **Screen readers:**
  - errors on Input, Select, TextArea, Listbox and Combobox are announced
  - status messages use persistent live regions
  - a toast is announced once
  - the composer announces its count only near the limit
- **Tabs:** stay reachable when the value matches no tab, and follow right-to-left arrow keys. CodeTabs supports Home/End.
- **DataTable:** select-all keeps selections made on other pages.
- **Calendar:** switching view shows the current date, it follows a changed `selected` prop, and week event names are spaced.
- **ProductFilters:** Clear all clears every facet.
- **ProductOverview:** the gallery resets when its images change, and the add button submits the form.
- **Pricing:** no longer mixes annual and monthly prices.
- **Accessibility:**
  - PlanComparison reads "Included"/"Not included".
  - MarketingHeader no longer creates duplicate ids.
  - Menu buttons pass label-in-name.
  - Sidebar and DocsShell group labels are no longer headings.
- **CSS:**
  - link colour no longer leaks under the green brand
  - stripes no longer hide selected rows
  - selected states are visible in forced-colours mode
  - component styles no longer leak into slot content
  - tab-panel padding is scoped to Mortar's tabs

### Internal

- **Manifests:** they hold only the hand-written contract. `npm run catalog` generates each entry's version, fingerprints and `contract.propTypes` from TypeScript into `catalog.json`.
- **Baseline policy 1.3.0:** adds M010, which requires manifest dependencies to match what each component renders.
- **Releases:** a merged version bump publishes automatically ([CONTRIBUTING.md](https://github.com/tonycodes/mortar/blob/main/CONTRIBUTING.md)).

## 0.5.0 (2026-10-18)

- **AttachmentList:** file rows with an accessible download link.
- **CallToAction:** `media`.
- **NotFound:** illustration.
- **SignInPanel:** `aside`.
- **MetricGroup:** icons.
- **Toast:** `secondaryAction`.
- **PageHeading:** `meta` and `avatar`.
- **CommandPalette:** item icons.

## 0.4.0

- **Info tone:** `Tone` gains `info`, backed by `--m-info` tokens. Every status tone meets 4.5:1 on every background.
- **Toast:** leading avatars.
- **ActivityFeed:** actors and comments.
- **StackedList:** groups with sticky headings.
- **SlideOver:** `lg` and `xl` sizes.
- **Testimonial:** logo and avatar.
- **TeamGrid:** bios and profile links.
- **Footer:** social links.
- **Fixed:** restored contract docs for Input and AppShell props that were missing from the 0.2.0 and 0.3.0 catalogues.

## 0.3.0

- **Calendar:** week, day and year views, with events gaining start and end times.
- **CommentComposer:** a new component.
- **Dropdown:** icons, descriptions and sections.
- **Button:** sizes and icons.
- **Notice:** actions and dismiss.
- **Tabs:** counts and icons.
- **Pagination:** numbered pages.
- **EmptyState:** icons.
- **Checkbox and Switch:** descriptions.
- **RadioGroup:** cards and swatches.
- **Navigation:** expandable groups.
- **Avatar:** `xs` and `xl` sizes.

## 0.2.0

- **Components:** 107 components across five kits, up from 80. Ecommerce is a new kit.
- **Marketing:** inverse tones, accent tokens, flyouts, and HeaderSection, ContentSection and Banner.
- **Foundation:** Divider, Card, ButtonGroup, MediaObject, Fieldset, Listbox and Combobox.
- **Application:** DescriptionList, GridList, SectionHeading, Breadcrumbs, Sidebar, Navbar, ActionPanel, Calendar and StackedShell.
- **Playground:** browse by kit and category, a Preview/Code switch, and ten page templates.

## 0.1.0

- First release.
