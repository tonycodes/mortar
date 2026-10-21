// Removed names and their replacements, from docs/migrating-to-0.6.md and the
// CHANGELOG. The audit uses them to suggest the current name for an import, a
// prop or a value. tests/cli.test.mjs checks every replacement exists in the
// catalogue and every removed prop is gone.

export const REMOVED_EXPORTS = {
  MarketingTone: {
    replacement: "SectionTone",
    note: "MarketingTone (surface | inverse) was merged into SectionTone (default | muted | inverse) in 0.6.",
  },
};

/** Component → removed prop → { to, note }. */
export const RENAMED_PROPS = {
  AppShell: {
    user: { to: "footer", note: "AppShell `user` became `footer` in 0.6." },
    secondaryNavigation: {
      to: "sections",
      note: "AppShell `secondaryNavigation` became `sections` in 0.6.",
    },
  },
  Hero: {
    align: {
      to: "layout",
      note: 'Hero `align="center" | "split"` became `layout` in 0.6.',
    },
  },
  StackedList: {
    heading: { to: "title", note: "StackedList `heading` became `title`." },
  },
  DataTable: {
    emptyTitle: { to: "empty", note: "Use `empty={{ title, description? }}`." },
    emptyDescription: {
      to: "empty",
      note: "Use `empty={{ title, description? }}`.",
    },
  },
  Text: { tone: { to: "color", note: "Text `tone` became `color` in 0.6." } },
  CommandPalette: {
    emptyMessage: {
      to: "empty",
      note: "Use `empty={{ title, description? }}`.",
    },
  },
  Callout: {
    type: {
      to: "tone",
      note: 'Callout `type` became `tone: Tone`: `tip` → `success`, `breaking` → `tone="danger" title="Breaking"`.',
    },
  },
  SaveBar: { saving: { to: "loading", note: "Busy props are `loading`." } },
  CommentComposer: {
    submitting: { to: "loading", note: "Busy props are `loading`." },
    onValueChange: { to: "onChange", note: "Value changes use `onChange`." },
  },
  ConfirmDialog: {
    destructive: {
      to: "tone",
      note: 'ConfirmDialog `destructive` became `tone: "default" | "danger"` (default "danger").',
    },
  },
  Combobox: {
    emptyLabel: { to: "empty", note: "Use `empty={{ title }}`." },
  },
  PreviewFrame: {
    title: {
      to: "label",
      note: "PreviewFrame `title` became `label` (an accessible name).",
    },
  },
  ProductOverview: {
    adding: { to: "loading", note: "Busy props are `loading`." },
  },
  ProductQuickView: {
    adding: { to: "loading", note: "Busy props are `loading`." },
  },
  ShoppingCart: {
    emptyTitle: {
      to: "empty",
      note: "Use `empty={{ title, description?, action? }}`.",
    },
    emptyDescription: {
      to: "empty",
      note: "Use `empty={{ title, description?, action? }}`.",
    },
    emptyAction: {
      to: "empty",
      note: "Use `empty={{ title, description?, action? }}`.",
    },
  },
  OrderHistory: {
    emptyTitle: { to: "empty", note: "Use `empty={{ title, description? }}`." },
    emptyDescription: {
      to: "empty",
      note: "Use `empty={{ title, description? }}`.",
    },
  },
};

/** Renames that apply to any component (DESIGN.md API conventions). */
export const GENERAL_PROPS = {
  saving: "loading",
  submitting: "loading",
  adding: "loading",
  busy: "loading",
  isLoading: "loading",
  emptyTitle: "empty",
  emptyDescription: "empty",
  emptyAction: "empty",
  emptyMessage: "empty",
  emptyLabel: "empty",
  heading: "title",
  onValueChange: "onChange",
  onClick: "onSelect",
};

/** Values renamed by the 0.6 conventions. */
export const RENAMED_VALUES = {
  centered: "center",
  card: "cards",
  surface: "default",
  sunken: "muted",
  left: "start",
  right: "end",
  tip: "success",
  note: "info",
  breaking: "danger",
};
