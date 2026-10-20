// Closed vocabulary: contributors cannot satisfy these obligations with prose.
export const profiles = Object.freeze({
  display: ["render", "accessibility"],
  control: ["render", "accessibility", "interaction"],
  overlay: [
    "render",
    "accessibility",
    "interaction",
    "open-accessibility",
    "focus-return",
  ],
  composite: ["render", "accessibility", "responsive"],
});
export const probes = Object.freeze({
  Button: "button",
  Notice: "notice",
  CommentComposer: "composer",
  ButtonGroup: "button-group",
  ActionLink: "link",
  Input: "input",
  TextArea: "textarea",
  Select: "select",
  Listbox: "listbox",
  Combobox: "combobox",
  Checkbox: "checkbox",
  Switch: "switch",
  RadioGroup: "radio",
  Tabs: "tabs",
  SegmentedControl: "segmented",
  AppearanceControl: "appearance",
  ThemeProvider: "appearance",
  Dropdown: "menu",
  Modal: "dialog",
  ConfirmDialog: "dialog",
  SlideOver: "dialog",
  CommandPalette: "dialog",
  SearchDialog: "dialog",
  SearchTrigger: "dialog",
  FilterChip: "chip",
  PageFeedback: "feedback",
  CodeTabs: "code-tabs",
  SaveBar: "save",
  Toast: "toast",
  Toaster: "toast",
  Pagination: "pagination",
  DataTable: "table-sort",
  FAQ: "faq",
  Pricing: "pricing",
  Newsletter: "newsletter",
  SignInPanel: "sign-in",
  ProviderButtons: "providers",
  PasswordInput: "password",
  CodeInput: "code",
  AppShell: "navigation",
  DocsShell: "navigation",
  MarketingHeader: "navigation",
  Navbar: "navbar",
  Sidebar: "sidebar",
  StackedShell: "navbar",
  Calendar: "calendar",
  ProductOverview: "product",
  ShoppingCart: "cart",
  ProductQuickView: "dialog",
  ProductFilters: "filters",
  Banner: "banner",
});
/** Scenarios a manifest may declare in `testing.states`. */
export const states = Object.freeze([
  "disabled",
  "loading",
  "error",
  "empty",
  "long",
  "success",
  "surface",
  "inverse",
  "coming-soon",
  "duplicate-links",
  "heading-3",
  "scope-container",
  "controlled",
]);
export const kits = Object.freeze([
  "foundation",
  "application",
  "marketing",
  "docs",
  "ecommerce",
]);
/**
 * Capabilities a manifest may declare. The catalogue adds the derived ones:
 * `theme` (every component), its kit, `keyboard` (a registered interaction
 * probe) and `responsive` (the composite profile's overflow checks). Declaring
 * a derived capability is an error, so a manifest records only what is not
 * already established elsewhere.
 */
export const capabilities = Object.freeze([
  "action",
  "input",
  "validation",
  "form",
  "navigation",
  "status",
  "summary",
  "table",
  "keyboard",
  "responsive",
]);
function derivedCapabilities(component) {
  const derived = ["theme", component.kitId];
  if (probes[component.export]) derived.push("keyboard");
  if (component.testing?.profile === "composite") derived.push("responsive");
  return derived;
}
/** The full, ordered capability list the catalogue publishes. */
export function catalogCapabilities(component) {
  const all = new Set([
    ...derivedCapabilities(component),
    ...(component.capabilities || []),
  ]);
  return ["theme", component.kitId, ...capabilities.filter((c) => all.has(c))];
}
export function capabilityErrors(component) {
  const errors = [];
  if (!kits.includes(component.kitId))
    errors.push(`kitId must be one of ${kits.join(", ")}.`);
  const declared = component.capabilities ?? [];
  if (!Array.isArray(declared) || new Set(declared).size !== declared.length)
    return [...errors, "Capabilities must be a list of unique values."];
  const derived = derivedCapabilities(component);
  for (const c of declared)
    if (derived.includes(c))
      errors.push(
        `Capability "${c}" is derived for this component; remove it from the manifest.`,
      );
    else if (!capabilities.includes(c))
      errors.push(
        `Unknown capability "${c}"; use one of ${capabilities.join(", ")}.`,
      );
  return errors;
}
export function contractErrors(component) {
  const t = component.testing;
  if (!t || !Object.hasOwn(profiles, t.profile))
    return ["Choose a known testing profile."];
  const errors = [];
  if (!/^\.[a-z][a-z0-9-]*(?: [a-z]+)?$/.test(t.target || ""))
    errors.push(
      "Provide a component CSS target inside its preview, not the playground or a wildcard.",
    );
  const expected = probes[component.export];
  if (expected ? t.probe !== expected : t.probe !== undefined)
    errors.push("Register a supported executable probe for this export.");
  if (["control", "overlay"].includes(t.profile) && !expected)
    errors.push(
      "Interactive profiles require a registered probe implementation.",
    );
  if (expected && !["control", "overlay", "composite"].includes(t.profile))
    errors.push("Interactive components cannot use the display profile.");
  if (
    !Array.isArray(t.states) ||
    t.states.some((s) => !states.includes(s)) ||
    new Set(t.states).size !== t.states.length
  )
    errors.push("States must be unique supported scenarios.");
  return errors;
}
export function obligations(component) {
  const t = component.testing;
  return [
    ...profiles[t.profile],
    ...(t.probe && t.profile === "composite" ? ["interaction"] : []),
    ...t.states.map((s) => `state:${s}`),
  ];
}
