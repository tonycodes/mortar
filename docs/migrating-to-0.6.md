# Migrating to 0.6

Mortar 0.6.0 applies one set of API conventions across every component. The rules are in [DESIGN.md](../DESIGN.md#api-conventions). Old names were removed rather than aliased, so TypeScript reports every call site that needs a change. Work through the compiler errors with the tables below.

## Patterns that apply everywhere

| Before                                                                        | After                                            |
| ----------------------------------------------------------------------------- | ------------------------------------------------ |
| Busy props: `saving`, `submitting`, `adding`                                  | `loading`                                        |
| `emptyTitle`, `emptyDescription`, `emptyAction`, `emptyMessage`, `emptyLabel` | `empty={{ title, description?, action? }}`       |
| Item or action callbacks: `onClick`                                           | `onSelect`                                       |
| Column `align: "left" \| "right"`                                             | `align: "start" \| "end"`                        |
| `headingLevel` that set item headings (GridList, ProductList, Steps, Footer)  | `itemHeadingLevel`                               |
| Visible heading props named `heading`                                         | `title`                                          |
| Group shapes `{ title, items }` or `{ title, links }`                         | `{ label, items }` (`ItemGroup`)                 |
| Single-word values `centered`, `card`                                         | `center`, `cards`                                |
| Section tone `surface`                                                        | `default`                                        |
| `className` on an inner control (Input, Select, TextArea, Checkbox, Switch)   | `className` goes on the component's root element |

New everywhere, with no change needed:

- every component accepts `className` on its root;
- section-level components accept `id`;
- headings accept `headingLevel` (`1`–`6`).

## By component

### Controls and feedback

| Component            | Before                                            | After                                                                                                                        |
| -------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Button               | `loading` sets native `disabled`                  | `loading` sets `aria-disabled` and `aria-busy`, and the button keeps focus. Don't rely on `:disabled` styling while loading. |
| ButtonGroup          | item `onClick`                                    | item `onSelect`                                                                                                              |
| Toast                | `action` / `secondaryAction` `{ label, onClick }` | `{ label, onSelect }` (`ToastAction`)                                                                                        |
| SaveBar              | `saving`                                          | `loading`                                                                                                                    |
| CommentComposer      | `submitting`, `onValueChange`                     | `loading`, `onChange`                                                                                                        |
| ConfirmDialog        | `destructive` (boolean, default `true`)           | `tone: "default" \| "danger"` (default `"danger"`)                                                                           |
| Combobox             | `emptyLabel`                                      | `empty={{ title }}`                                                                                                          |
| Banner               | `tone="neutral"`                                  | `tone="default"`                                                                                                             |
| PreviewFrame         | `title`                                           | `label`                                                                                                                      |
| Badge, Notice, Toast | `m-tone-*` classes                                | `data-tone`, omitted for neutral                                                                                             |
| Modal                | `data-size="md"`                                  | omitted for the default size                                                                                                 |

### Application

| Component            | Before                                                              | After                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AppShell             | `user`, `secondaryNavigation`                                       | `footer`, `sections`                                                                                                                                   |
| AppShell             | main element `id="m-content"`                                       | a generated id; use the skip link instead of a hard-coded `#m-content`                                                                                 |
| AppShell, DocsShell  | Menu button `aria-label="Open navigation"`                          | named by its visible text "Menu", with `aria-haspopup="dialog"` and `aria-expanded`                                                                    |
| StackedList          | `heading`                                                           | `title`, plus `headingLevel`. Group headings sit one level below the title; without a title they use `headingLevel`. `items` and `groups` both render. |
| DataTable            | `emptyTitle`, `emptyDescription`; column `align: "left" \| "right"` | `empty`; `align: "start" \| "end"`                                                                                                                     |
| Table                | column `align: "left" \| "right"`                                   | `align: "start" \| "end"`                                                                                                                              |
| GridList             | `headingLevel` (item headings)                                      | `itemHeadingLevel`                                                                                                                                     |
| Card                 | `tone="sunken"`                                                     | `tone="muted"`                                                                                                                                         |
| Text                 | `tone`                                                              | `color` (`data-color`)                                                                                                                                 |
| ProgressBar          | `tone: "primary" \| "warning" \| "danger"`                          | `tone: Tone`; omit it for the accent colour                                                                                                            |
| CommandPalette       | `emptyMessage`                                                      | `empty={{ title, description? }}`                                                                                                                      |
| Navbar, StackedShell | `NavigationItem[]` (children silently dropped)                      | `LinkItem[]`                                                                                                                                           |
| Sidebar              | group labels are `<h2>`                                             | `<p class="m-nav-group-title">` in a labelled group; a parent with children lists its own page as the first link                                       |

### Marketing and docs

| Component             | Before                                             | After                                                                                                                                          |
| --------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero                  | `align="center" \| "split"`                        | `layout="center" \| "split"`                                                                                                                   |
| FAQ                   | `layout="centered"`                                | `layout="center"`                                                                                                                              |
| CallToAction, Pricing | `tone: MarketingTone` (`surface \| inverse`)       | `tone: SectionTone` (`default \| muted \| inverse`); `MarketingTone` is removed                                                                |
| BentoGrid             | item `inverse: boolean`                            | item `tone: SectionTone`                                                                                                                       |
| Footer                | `columns: { title, links }[]`; `headingLevel`      | `columns: { label, items }[]`; `itemHeadingLevel`                                                                                              |
| Steps                 | `headingLevel`                                     | `itemHeadingLevel`                                                                                                                             |
| DocsShell             | `navigation: { title, items }[]`                   | `navigation: { label, items }[]`; icons, counts and nested items now render                                                                    |
| Callout               | `type: "note" \| "tip" \| "warning" \| "breaking"` | `tone: Tone`: `tip` becomes `success`, and `breaking` becomes `tone="danger" title="Breaking"`. It renders `role="note"` instead of `<aside>`. |
| LinkCards             | item `title`                                       | item `label`                                                                                                                                   |
| PagerLinks            | landmark named "Pagination"                        | `label`, default "Previous and next page"                                                                                                      |
| Pricing               | availability text in `role="status"`               | plain text with class `m-pricing-availability`                                                                                                 |

### Ecommerce and calendar

| Component                         | Before                                                | After                                                                               |
| --------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------- |
| ProductList                       | `headingLevel` (item headings); `variant="card"`      | `itemHeadingLevel`; `variant="cards"`                                               |
| ProductOverview, ProductQuickView | `adding`; the add button was `type="button"`          | `loading`; the add button submits the form, so `onAdd` fires once on submit         |
| ProductFilters                    | `onChange(facet, values)`                             | `onChange(selected)` with the complete next selection                               |
| ShoppingCart                      | `emptyTitle`, `emptyDescription`, `emptyAction`       | `empty`, plus `headingLevel`                                                        |
| OrderHistory                      | `emptyTitle`, `emptyDescription`                      | `empty`                                                                             |
| Calendar                          | `onDateChange` fired only from the week and day views | it fires from every view, and so does `onMonthChange`; a new controlled `date` prop |

## Markup and styling

Read this section if your own CSS or tests select on Mortar markup.

- **Data attributes follow one rule.** A boolean attribute is present only when true (`data-x="true"`). An enum attribute is omitted for its default value. Selectors such as `[data-divider="false"]` or `[data-variant="compact"]` no longer match. Use `:not([data-divider])` or the component's own props instead.
- **Section and component titles carry classes** such as `m-section-title`, `m-card-title` and `m-product-name`. Styles no longer depend on the title being an `h2`.
