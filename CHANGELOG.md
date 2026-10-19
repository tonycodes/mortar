# Changelog

Mortar follows [semantic versioning](https://semver.org/). Before 1.0, a minor release may contain breaking changes, and it says so. Each release is published from its `v<version>` tag to `https://git.tony.codes/api/packages/tony/npm/`. Its GitHub release carries the exact archive and a `provenance.json` with the commit and SHA-512 integrity.

## Unreleased

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

- The stylesheet is split into one file per family (foundation, overlays, application, data, calendar, marketing, docs, ecommerce), with one section per component. Rendering is unchanged. `@tony-ui/mortar/styles.css` is still the only entry point.

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
