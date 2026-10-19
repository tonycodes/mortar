// API conventions and accessibility fixes for the foundation controls:
// className on the root, data-tone, loading, announced errors and status
// regions. Browser behaviour (focus, portals, live updates) is in
// tests/browser/controls.spec.mjs.
import test from "node:test";
import assert from "node:assert/strict";
import { renderToString } from "react-dom/server";
import {
  h,
  html,
  Badge,
  Banner,
  Button,
  ButtonGroup,
  Checkbox,
  CodeBlock,
  Combobox,
  CommentComposer,
  Dropdown,
  EmptyState,
  Input,
  Listbox,
  Notice,
  PreviewFrame,
  SaveBar,
  Select,
  Switch,
  Tabs,
  TextArea,
  ThemeProvider,
  Toast,
  Toaster,
} from "./support/render.mjs";

const options = [
  { value: "a", label: "First" },
  { value: "b", label: "Second" },
];

test("Button loading stays focusable: aria-disabled and aria-busy, never native disabled", () => {
  const markup = html(Button, { loading: true, className: "wide" }, "Save");
  assert.doesNotMatch(markup, /\sdisabled=""/);
  assert.match(markup, /aria-disabled="true"/);
  assert.match(markup, /aria-busy="true"/);
  assert.match(markup, /class="m-button m-button-primary wide"/);
  // An explicitly disabled button is natively disabled, loading or not.
  const off = html(Button, { loading: true, disabled: true }, "Save");
  assert.match(off, /disabled=""/);
  assert.doesNotMatch(off, /aria-disabled/);
});

test("className lands on each control's root element", () => {
  const input = html(Input, { label: "Name", className: "span-2" });
  assert.match(input, /^<div data-m-component="Input" class="m-field span-2">/);
  assert.doesNotMatch(input, /<input[^>]*class=/);
  assert.match(
    html(Select, { label: "Plan", options, className: "span-2" }),
    /^<div data-m-component="Select" class="m-field span-2">/,
  );
  assert.match(
    html(TextArea, { label: "Notes", className: "span-2" }),
    /^<div data-m-component="TextArea" class="m-field span-2">/,
  );
  assert.match(
    html(Checkbox, { label: "Agree", className: "mt" }),
    /^<label data-m-component="Checkbox" class="m-choice mt"><input type="checkbox"\/>/,
  );
  assert.match(
    html(Switch, { label: "On", className: "mt" }),
    /^<label data-m-component="Switch" class="m-choice mt"><input type="checkbox" role="switch" class="m-switch"\/>/,
  );
  assert.match(
    html(ButtonGroup, { label: "Actions", items: [], className: "mt" }),
    /^<div data-m-component="ButtonGroup" class="m-button-group mt"/,
  );
  assert.match(
    html(Badge, { className: "ml" }, "New"),
    /^<span data-m-component="Badge" class="m-badge ml">/,
  );
  assert.match(
    html(Listbox, {
      label: "Owner",
      options,
      value: null,
      onChange() {},
      className: "mt",
    }),
    /^<div[^>]*class="m-field mt"/,
  );
});

test("required fields mark the control and add a decorative marker to the label", () => {
  const input = html(Input, { label: "Email", required: true });
  assert.match(
    input,
    /<label for="[^"]+">Email<span class="m-required" aria-hidden="true">\*<\/span><\/label>/,
  );
  assert.match(input, /<input required=""/);
  assert.match(
    html(Combobox, {
      label: "Region",
      options,
      value: null,
      onChange() {},
      required: true,
    }),
    /aria-required="true"/,
  );
  // A listbox button cannot carry aria-required, so its label says it.
  assert.match(
    html(Listbox, {
      label: "Owner",
      options,
      value: null,
      onChange() {},
      required: true,
    }),
    /Owner<span class="m-required" aria-hidden="true">\*<\/span><span class="m-sr-only"> \(required\)<\/span>/,
  );
});

test("field errors are alerts, so they are announced when they appear", () => {
  for (const [Component, props] of [
    [Input, { label: "Name" }],
    [Select, { label: "Plan", options }],
    [TextArea, { label: "Notes" }],
  ]) {
    const markup = html(Component, { ...props, error: "Required" });
    assert.match(markup, /<p id="[^"]+" class="m-error" role="alert">Required/);
    const hint = html(Component, { ...props, hint: "Optional" });
    assert.doesNotMatch(hint, /role="alert"/);
  }
  for (const Component of [Listbox, Combobox])
    assert.match(
      html(Component, {
        label: "Owner",
        options,
        value: null,
        onChange() {},
        error: "Choose one",
      }),
      /<p[^>]*class="m-error"[^>]*role="alert"[^>]*>Choose one/,
    );
});

test("Badge, Notice and Toast tone through data-tone, omitted for neutral", () => {
  assert.equal(
    html(Badge, {}, "Draft"),
    '<span data-m-component="Badge" class="m-badge">Draft</span>',
  );
  assert.equal(
    html(Badge, { tone: "success" }, "Live"),
    '<span data-m-component="Badge" class="m-badge" data-tone="success">Live</span>',
  );
  assert.match(
    html(Notice, { title: "Failed", tone: "danger" }),
    /^<div data-m-component="Notice" class="m-notice" data-tone="danger">/,
  );
  assert.doesNotMatch(html(Toast, { title: "Saved" }), /data-tone/);
  assert.match(
    html(Toast, { title: "Saved", tone: "warning" }),
    /class="m-toast" data-tone="warning"/,
  );
  for (const markup of [
    html(Badge, { tone: "info" }, "x"),
    html(Notice, { title: "x", tone: "info" }),
  ])
    assert.doesNotMatch(markup, /m-tone-/);
});

test("Toast uses shared icons and onSelect actions", () => {
  const markup = html(Toast, {
    title: "Deployed",
    tone: "success",
    action: { label: "View", onSelect() {} },
    onDismiss() {},
  });
  assert.doesNotMatch(markup, /[✕✓]/);
  assert.match(
    markup,
    /<span class="m-toast-icon" aria-hidden="true"><svg[^>]*aria-hidden="true"/,
  );
  assert.match(
    markup,
    /<span class="m-button-icon" aria-hidden="true"><svg[^>]*>.*?<\/svg><\/span><span class="m-sr-only">Dismiss Deployed<\/span>/,
  );
  assert.match(markup, />View<\/button>/);
});

test("Toaster announces through persistent live regions, never a nested alert", () => {
  const markup = html(Toaster, {
    items: [{ id: "1", title: "Failed", tone: "danger" }],
    onDismiss() {},
  });
  assert.doesNotMatch(markup, /aria-live/);
  assert.doesNotMatch(markup, /<li[^>]*role=/);
  assert.match(markup, /<div class="m-sr-only" role="status"><\/div>/);
  assert.match(markup, /<div class="m-sr-only" role="alert"><\/div>/);
  assert.match(
    markup,
    /<section data-m-component="Toaster" class="m-toaster" aria-label="Notifications" tabindex="-1">/,
  );
});

test("SaveBar keeps its status region mounted while closed", () => {
  const closed = html(SaveBar, {
    open: false,
    onSave() {},
    onDiscard() {},
  });
  assert.match(
    closed,
    /^<span data-m-component="SaveBar" id="[^"]+" role="status" class="m-sr-only"><\/span>$/,
  );
  const open = html(SaveBar, {
    open: true,
    loading: true,
    onSave() {},
    onDiscard() {},
  });
  const id = open.match(
    /<span data-m-component="SaveBar" id="([^"]+)" role="status"/,
  )?.[1];
  assert.ok(id);
  assert.match(
    open,
    /role="status" class="m-sr-only">You have unsaved changes.<\/span>/,
  );
  assert.match(open, new RegExp(`role="region" aria-labelledby="${id}"`));
  assert.match(
    open,
    /<span aria-hidden="true">You have unsaved changes.<\/span>/,
  );
  // Saving: Save keeps focus (aria-disabled), Discard is disabled.
  assert.match(
    open,
    /<button data-m-component="Button" type="button" aria-disabled="true" aria-busy="true"/,
  );
  assert.match(
    open,
    /<button data-m-component="Button" type="button" disabled=""[^>]*>Discard<\/button>/,
  );
});

test("Notice announce makes an atomic status region; danger is an alert", () => {
  assert.match(
    html(Notice, { title: "Saved", announce: true }),
    /^<div data-m-component="Notice" class="m-notice" role="status" aria-atomic="true">/,
  );
  assert.match(
    html(Notice, { title: "Failed", tone: "danger", announce: true }),
    /^<div data-m-component="Notice" class="m-notice" data-tone="danger" role="alert">/,
  );
});

test("Tabs keep a tab in the tab order when the value matches no tab", () => {
  const markup = html(Tabs, {
    label: "Sections",
    value: "missing",
    onChange() {},
    items: [
      { id: "one", label: "One", content: "1", count: 0 },
      { id: "two", label: "Two", content: "2" },
    ],
  });
  assert.match(markup, /aria-selected="false"[^>]*tabindex="0"[^>]*>One/);
  assert.match(markup, /tabindex="-1"[^>]*>Two/);
  // A count of 0 is shown: counts follow `count !== undefined`.
  assert.match(markup, /<span class="m-tab-count">0<\/span>/);
});

test("Dropdown marks its trigger with the shared chevron icon", () => {
  const markup = html(Dropdown, {
    label: "Actions",
    items: [{ label: "Edit" }],
    className: "ml",
  });
  assert.doesNotMatch(markup, /⌄/);
  assert.match(markup, /class="m-button m-button-secondary ml"/);
  assert.match(
    markup,
    /Actions<span class="m-button-icon" aria-hidden="true"><svg/,
  );
});

test("EmptyState takes any heading level and an optional description", () => {
  const markup = html(EmptyState, {
    title: "No results",
    headingLevel: 5,
    id: "empty",
    className: "mt",
  });
  assert.equal(
    markup,
    '<div id="empty" data-m-component="EmptyState" class="m-empty mt"><h5>No results</h5></div>',
  );
});

test("Combobox empty uses the shared empty shape", () => {
  // No query on the server: the status region is mounted and empty.
  const markup = html(Combobox, {
    label: "Region",
    options,
    value: null,
    onChange() {},
    empty: { title: "No regions" },
  });
  assert.match(markup, /<p role="status" class="m-sr-only"><\/p>/);
});

test("Banner omits data-tone for the default surface", () => {
  assert.doesNotMatch(html(Banner, { tone: "default" }, "Hello"), /data-tone/);
  assert.match(html(Banner, {}, "Hello"), /data-tone="inverse"/);
});

test("CodeBlock names its figure with the caption, not a prohibited pre label", () => {
  const markup = html(CodeBlock, { code: "npm i", label: "Install" });
  assert.doesNotMatch(markup, /aria-labelledby/);
  assert.match(markup, /<figcaption>Install<\/figcaption><pre tabindex="0">/);
});

test("PreviewFrame names its section and frame with label", () => {
  const markup = html(PreviewFrame, { label: "Example", src: "about:blank" });
  assert.match(
    markup,
    /<section data-m-component="PreviewFrame" class="m-preview-frame" aria-label="Example">/,
  );
  assert.match(markup, /<iframe title="Example"/);
});

test("CommentComposer announces the remaining characters only near the limit", () => {
  const status = (value) =>
    html(CommentComposer, {
      onSubmit() {},
      value,
      onChange() {},
      maxLength: 100,
    }).match(/<span class="m-sr-only" role="status">(.*?)<\/span>/)?.[1];
  assert.equal(status("x".repeat(50)), "");
  assert.equal(status("x".repeat(95)), "5 characters left");
  assert.equal(status("x".repeat(99)), "1 character left");
  assert.equal(status("x".repeat(100)), "Character limit reached");
});

test("CommentComposer loading keeps the submit button focusable", () => {
  const markup = html(CommentComposer, {
    onSubmit() {},
    value: "Hi",
    onChange() {},
    loading: true,
  });
  assert.match(
    markup,
    /<button data-m-component="Button" type="submit" aria-disabled="true" aria-busy="true"[^>]*>/,
  );
});

test("container ThemeProvider renders a light system appearance on the server", () => {
  // The client hydrates with the same server snapshot, then follows the system.
  const markup = renderToString(
    h(ThemeProvider, { scope: "container", className: "frame" }, "Hi"),
  );
  assert.match(
    markup,
    /^<div data-m-component="ThemeProvider" data-mortar="" data-mortar-brand="neutral" data-mortar-density="comfortable" data-mortar-appearance="light" class="frame">Hi<\/div>$/,
  );
});
