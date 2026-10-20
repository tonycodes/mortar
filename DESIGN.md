# Mortar design principles

1. **shell-first** — Choose the shared purpose shell before composing a page. Use AppShell for application screens and MarketingHeader for public pages. Document deliberate standalone exceptions.

2. **page-pattern-reuse** — Reuse complete page patterns: navigation, headings, filters, list/detail workspaces, states and action placement. Reusing controls alone is insufficient.

3. **project-agnostic-chrome** — Keep product names, routes, user data, permissions and actions in props and slots. Shared chrome must remain project agnostic. The marketing header logo is a slot. Every component root exposes `data-m-component` with the component's name for tests and consumers. It is not a styling hook.

4. **central-fixes** — Contribute missing patterns centrally. Do not duplicate source, create repeated local wrappers or apply consumer CSS overrides.

5. **semantic-themes** — Use semantic tokens; keep brand separate from appearance and feedback colours. Verify every supported theme. Accent is a brand token, separate from ink, surface, and the feedback colours. Every brand and appearance declares `--m-accent` and `--m-on-accent`. CallToAction and a featured Pricing card use the page surface unless `tone="inverse"` opts into the inverse token remap. `ThemeProvider` `scope="container"` paints those tokens on a wrapper and leaves the document unchanged. The default scope is `document`.

6. **interaction-quality** — Verify responsive layout, accessible names, keyboard operation, focus and loading/empty/error states. Automated checks alone cannot prove visual quality. A plan that is not available exposes a status and does not offer a purchase link. Column titles accept an explicit heading level so a page can keep a single `h1`.

The machine-readable contract is design-principles.json. Both the local contribution workflow and hosted MCP should expose these principles. Detection is split between structural checks and visual maintainer review.

## API conventions

Every component follows these rules. New props must fit them, and the code review checks them.

- **Headings.** `headingLevel` sets the component's outermost heading (`1`–`6`, using the shared `HeadingLevel` type). Nested headings derive from it (`level + 1`). `itemHeadingLevel` is added only where items need their own level. No component hard-codes a heading that sits inside a page section. `h1` belongs to the page, so only components that open a page default to it: PageHeading, NotFound, Hero, HeaderSection and ProductOverview. Use a lower level when one of them sits below another page heading.
- **Layout, variant and align.**
  - `layout` chooses the structural arrangement, for example `"split" | "grid" | "center"`.
  - `variant` chooses the visual treatment, for example `"underline" | "pills"` or `"plain" | "cards"`.
  - `align` only ever takes `"start" | "center" | "end"`.
  - Values are single words in the same form everywhere: `center`, never `centered`; `cards`, never `card`.
  - Tables align columns with `start | end`, not `left | right`.
- **Tone.**
  - Status uses `Tone` (`neutral | info | success | warning | danger`).
  - Section surfaces use `tone: "default" | "muted" | "inverse"`.
  - A destructive action is `tone="danger"`, and a destructive item in a list is `danger: true`.
  - Tone renders as `data-tone`.
- **State.** Busy work is `loading`. Empty content is `empty?: { title; description?; action? }`. Errors are `error` (string).
  - A loading button stays focusable: it sets `aria-busy` and `aria-disabled` and ignores activation instead of becoming natively disabled.
  - A field `error` is announced when it appears (`role="alert"`). `required` marks the control (native `required` or `aria-required`) and adds a decorative `*` after the label.
  - Status and alert regions stay mounted, and their content changes, so each message is announced once.
  - Dismissing or removing an element that holds focus moves focus to the next control, never to the page body.
- **Callbacks.** Value changes use `onChange(value)`. Choosing an item or action uses `onSelect`. Dismissal uses `onDismiss` and closing uses `onClose`.
- **Items.**
  - Links share `LinkItem` (`label`, `href`, `current?`, `icon?`, `count?`, `description?`), and grouped items share `{ label; items }`.
  - A visible heading prop is `title`, and an accessible name prop is `label`.
- **Identity.** Every section-level component accepts `id` so in-page links can target it. Generated ids come from `useId`; ids are never hard-coded.
- **className.** Every component accepts `className` on its root element, merged with the kit's classes. It is for layout such as margins or grid placement. Colour and type come from tokens and props, never consumer overrides (principle 4).
- **Component marker.** The root element of every exported component carries `data-m-component="<ExportName>"`, set through `componentRoot()` in `src/internal.tsx`. The root is the outermost element the component renders. A dialog marks its dialog root, which is portalled to the document body and exists only while open. A component that renders sibling elements marks the first one it always renders (SaveBar's status message). When one component renders another as its root, the root carries the outer name (SearchDialog, not CommandPalette). ThemeProvider marks its wrapper only with `scope="container"`; with the default document scope it renders no element of its own. Nested components keep their own markers. The marker is for tests and consumers to find components, never for consumer styles. Its one selector in the kit is internal: Prose styles stop at a nested component root, so a utility class such as `m-4` inside prose keeps its prose styles.
- **Data attributes.** A boolean attribute appears only when true (`data-x="true"`). An enum attribute is omitted for the default value. Styles select on these attributes, never on text or `aria-label`.
- **Icons and decoration.** Shared icons come from `src/icons.tsx` and are `aria-hidden`. Decorative glyphs such as arrows are hidden from assistive technology, and their meaning is carried by text.
