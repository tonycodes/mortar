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
  ActionLink: "link",
  Input: "input",
  TextArea: "textarea",
  Select: "select",
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
  AppShell: "navigation",
  DocsShell: "navigation",
  MarketingHeader: "navigation",
});
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
    t.states.some(
      (s) =>
        !["disabled", "loading", "error", "empty", "long", "success"].includes(
          s,
        ),
    ) ||
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
