/* Brand builder: design a brand against the 0.9.0 brand contract and see it
   live in light and dark, with contrast checks and copyable output. Every
   value lives in the URL, so a brand can be shared as a link. */
import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  Badge,
  Button,
  CallToAction,
  CodeBlock,
  DataTable,
  Dropdown,
  Fieldset,
  Input,
  Modal,
  Notice,
  PageHeading,
  Section,
  SegmentedControl,
  Table,
  Tabs,
  ThemeProvider,
} from "../src/index.js";
import {
  brandToCss,
  isBrandColour,
  isBrandFont,
  isBrandGradient,
  type BrandAppearanceTokens,
  type BrandDefinition,
  type BrandFonts,
} from "../src/brand.js";
import { Check, Close } from "../src/icons.js";
import { isBrandParam } from "./explorer.js";

type Key = keyof BrandAppearanceTokens;
type Mode = "light" | "dark";
type FontKey = keyof BrandFonts;
type Values = Record<Mode, Partial<Record<Key, string>>> & {
  fonts?: Partial<Record<FontKey, string>>;
};

interface Field {
  key: Key;
  /** Suffix of `--m-brand-l-*` / `--m-brand-d-*`, and of the URL parameter. */
  css: string;
  label: string;
  /** The live token the appearance resolves it into. */
  token: string;
  /** How the appearance derives it when the brand leaves it empty. */
  derived: Record<Mode, string>;
  /** core: the required pair. advanced: interaction, accent, focus, link and
      selected. surface: page, surface and sunken. gradient: the accent fill. */
  group: "core" | "advanced" | "surface" | "gradient";
}

const FIELDS: Field[] = [
  {
    key: "primary",
    css: "primary",
    label: "Primary",
    token: "--m-primary",
    derived: { light: "neutral black", dark: "neutral white" },
    group: "core",
  },
  {
    key: "onPrimary",
    css: "on-primary",
    label: "On primary",
    token: "--m-on-primary",
    derived: { light: "neutral white", dark: "neutral black" },
    group: "core",
  },
  {
    key: "primaryHover",
    css: "primary-hover",
    label: "Primary hover",
    token: "--m-primary-hover",
    derived: {
      light: "primary mixed 85% with ink",
      dark: "primary mixed 85% with ink",
    },
    group: "advanced",
  },
  {
    key: "primaryActive",
    css: "primary-active",
    label: "Primary active",
    token: "--m-primary-active",
    derived: {
      light: "primary mixed 72% with ink",
      dark: "primary mixed 72% with ink",
    },
    group: "advanced",
  },
  {
    key: "accent",
    css: "accent",
    label: "Accent",
    token: "--m-accent",
    derived: { light: "primary", dark: "primary" },
    group: "advanced",
  },
  {
    key: "onAccent",
    css: "on-accent",
    label: "On accent",
    token: "--m-on-accent",
    derived: { light: "on primary", dark: "on primary" },
    group: "advanced",
  },
  {
    key: "focus",
    css: "focus",
    label: "Focus ring",
    token: "--m-focus",
    derived: { light: "primary", dark: "primary" },
    group: "advanced",
  },
  {
    key: "link",
    css: "link",
    label: "Link",
    token: "--m-link",
    derived: { light: "primary", dark: "ink" },
    group: "advanced",
  },
  {
    key: "selected",
    css: "selected",
    label: "Selected",
    token: "--m-selected",
    derived: {
      light: "primary tinted 8% into the page",
      dark: "primary tinted 10% into the page",
    },
    group: "advanced",
  },
  {
    key: "paper",
    css: "paper",
    label: "Page",
    token: "--m-paper",
    derived: { light: "Mortar's white", dark: "Mortar's black" },
    group: "surface",
  },
  {
    key: "surface",
    css: "surface",
    label: "Surface",
    token: "--m-surface",
    derived: { light: "Mortar's white", dark: "Mortar's near-black" },
    group: "surface",
  },
  {
    key: "sunken",
    css: "sunken",
    label: "Sunken",
    token: "--m-sunken",
    derived: { light: "Mortar's light grey", dark: "Mortar's dark grey" },
    group: "surface",
  },
  {
    key: "accentGradient",
    css: "accent-gradient",
    label: "Accent gradient",
    token: "--m-accent-fill",
    derived: { light: "the flat accent", dark: "the flat accent" },
    group: "gradient",
  },
];
const FONT_FIELDS: { key: FontKey; css: string; label: string }[] = [
  { key: "heading", css: "font-heading", label: "Heading font" },
  { key: "body", css: "font", label: "Body font" },
];
const MODES: Mode[] = ["light", "dark"];
const PREFIX: Record<Mode, "l" | "d"> = { light: "l", dark: "d" };
const TITLE: Record<Mode, string> = { light: "Light", dark: "Dark" };
const OTHER: Record<Mode, Mode> = { light: "dark", dark: "light" };
/** Live colour tokens the contrast checks and derived hints read from each
    preview. The accent fill is an image, read separately. */
const PROBES = [
  ...new Set([
    ...FIELDS.filter((f) => f.group !== "gradient").map((f) => f.token),
    "--m-ink",
    "--m-muted",
  ]),
];

const PRESETS: { id: string; label: string; values: Values }[] = [
  {
    id: "neutral",
    label: "Neutral",
    values: {
      light: {
        primary: "#000000",
        onPrimary: "#ffffff",
        primaryHover: "#29292c",
        primaryActive: "#3a3a3c",
        selected: "#f2f2f4",
      },
      dark: {
        primary: "#ffffff",
        onPrimary: "#000000",
        primaryHover: "#e5e5ea",
        primaryActive: "#c7c7cc",
        selected: "#1c1c1e",
      },
    },
  },
  {
    id: "green",
    label: "Green",
    values: {
      light: {
        primary: "#047857",
        primaryHover: "#065f46",
        primaryActive: "#064e3b",
        onPrimary: "#ffffff",
        selected: "#e6f5ed",
      },
      dark: {
        primary: "#6ee7b7",
        primaryHover: "#a7f3d0",
        primaryActive: "#34d399",
        onPrimary: "#022c22",
        focus: "#6ee7b7",
        link: "#6ee7b7",
        selected: "#062d23",
      },
    },
  },
  {
    id: "blue",
    label: "Blue",
    values: {
      light: { primary: "#1d4ed8", onPrimary: "#ffffff" },
      dark: { primary: "#93c5fd", onPrimary: "#0b1f4d" },
    },
  },
  {
    id: "purple",
    label: "Purple",
    values: {
      light: { primary: "#6d28d9", onPrimary: "#ffffff" },
      dark: { primary: "#c4b5fd", onPrimary: "#2e1065" },
    },
  },
];
const DEFAULT_NAME = "custom";
const RESERVED = ["neutral", "green"];

const param = (mode: Mode, field: Field) => `${PREFIX[mode]}-${field.css}`;

function readUrl(): { name: string; values: Values } {
  const params = new URLSearchParams(location.search);
  const values: Values = { light: {}, dark: {} };
  let any = false;
  for (const mode of MODES)
    for (const field of FIELDS) {
      const value = params.get(param(mode, field));
      if (value !== null) {
        values[mode][field.key] = value;
        any = true;
      }
    }
  for (const font of FONT_FIELDS) {
    const value = params.get(font.css);
    if (value !== null) {
      (values.fonts ??= {})[font.key] = value;
      any = true;
    }
  }
  const name = params.get("name");
  // A first visit starts from the blue preset; a shared link keeps exactly what it lists.
  if (!any && name === null)
    return { name: DEFAULT_NAME, values: clone(PRESETS[2].values) };
  return { name: name ?? DEFAULT_NAME, values };
}
function writeUrl(name: string, values: Values) {
  const params = new URLSearchParams(location.search);
  for (const key of [...params.keys()])
    if (isBrandParam(key)) params.delete(key);
  params.set("name", name);
  for (const mode of MODES)
    for (const field of FIELDS) {
      const value = values[mode][field.key];
      if (value) params.set(param(mode, field), value);
    }
  for (const font of FONT_FIELDS) {
    const value = values.fonts?.[font.key];
    if (value) params.set(font.css, value);
  }
  const href = `?${params}`;
  if (href !== location.search) history.replaceState(null, "", href);
}
const clone = (values: Values): Values => ({
  light: { ...values.light },
  dark: { ...values.dark },
  fonts: { ...values.fonts },
});

/** Why a value is rejected, or undefined when it is usable. */
function fieldError(field: Field, value: string | undefined) {
  const text = value?.trim();
  if (!text) return undefined;
  const supports = (property: string) =>
    typeof CSS === "undefined" || CSS.supports(property, text);
  if (field.group === "gradient") {
    if (!isBrandGradient(text))
      return "Use linear-gradient(), radial-gradient() or conic-gradient() with at least two colour stops, each in colour syntax.";
    if (!supports("background-image"))
      return "This is not a gradient the browser recognises.";
    return undefined;
  }
  if (!isBrandColour(text))
    return "Use colour syntax only: hex, a colour name, rgb(), oklch(), color-mix() or var().";
  if (!supports("color")) return "This is not a colour the browser recognises.";
  return undefined;
}
function fontError(value: string | undefined) {
  const text = value?.trim();
  if (!text || isBrandFont(text)) return undefined;
  return 'Use font family names, quoted names and generic families, separated by commas, e.g. "Inter", sans-serif.';
}
function nameError(name: string) {
  if (!name.trim()) return "Enter a brand name.";
  try {
    brandToCss(name, {});
  } catch {
    return "Use letters, digits and hyphens, starting with a letter or digit.";
  }
  if (RESERVED.includes(name.toLowerCase()))
    return `“${name}” is a built-in brand. Choose another name.`;
  return undefined;
}

/* Colour maths. The browser resolves every token (including color-mix()
   derivations); a canvas turns whatever syntax it serialises into sRGB. */
let context: CanvasRenderingContext2D | null = null;
function toRgb(color: string): [number, number, number] | null {
  context ??= document
    .createElement("canvas")
    .getContext("2d", { willReadFrequently: true });
  if (!context || !color) return null;
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = "#000000";
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
  return a === 0 ? null : [r, g, b];
}
const hex = (rgb: [number, number, number]) =>
  `#${rgb.map((n) => n.toString(16).padStart(2, "0")).join("")}`;
function luminance(hexColour: string) {
  const [r, g, b] = (hexColour.slice(1).match(/../g) ?? []).map((d) => {
    const v = parseInt(d, 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a?: string, b?: string) {
  if (!a || !b) return 0;
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Resolved tokens as hex, keyed by token name. The accent fill is its colour
    stops as hex, separated by spaces. */
type Resolved = Record<string, string>;
type Measured = Record<Mode, { page: Resolved; inverse: Resolved }>;
const FILL = "--m-accent-fill";
const STOP =
  /(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^()]*\)|#[0-9a-f]{3,8}\b/gi;
function readProbes(scope: Element | null | undefined): Resolved {
  const out: Resolved = {};
  scope?.querySelectorAll<HTMLElement>("[data-token]").forEach((probe) => {
    const rgb = toRgb(getComputedStyle(probe).backgroundColor);
    if (rgb) out[probe.dataset.token!] = hex(rgb);
  });
  const fill = scope?.querySelector<HTMLElement>("[data-fill]");
  if (fill) {
    // The computed gradient serialises each stop as a colour function.
    const stops = (getComputedStyle(fill).backgroundImage.match(STOP) ?? [])
      .map(toRgb)
      .filter((rgb) => rgb !== null)
      .map(hex);
    if (stops.length) out[FILL] = stops.join(" ");
  }
  return out;
}
function Probes({ scope }: { scope: "page" | "inverse" }) {
  return (
    <div hidden data-probes={scope}>
      {PROBES.map((token) => (
        <span
          key={token}
          data-token={token}
          style={{ backgroundColor: `var(${token})` }}
        />
      ))}
      <span data-fill style={{ backgroundImage: `var(${FILL})` }} />
    </div>
  );
}

const rows = [
  { id: "atlas", name: "Atlas", status: "Live" },
  { id: "beacon", name: "Beacon", status: "Draft" },
  { id: "cobalt", name: "Cobalt", status: "Review" },
];

function Sample({
  mode,
  brand,
  tokens,
  measured,
}: {
  mode: Mode;
  brand: string;
  tokens: BrandDefinition;
  measured?: Resolved;
}) {
  const [tab, setTab] = useState("overview");
  const [selected, setSelected] = useState(["beacon"]);
  const [open, setOpen] = useState(false);
  const title = TITLE[mode];
  return (
    <ThemeProvider
      scope="container"
      brand={brand}
      brandTokens={tokens}
      appearance={mode}
      className="pg-brand-sample"
    >
      <div data-pg-sample={mode} className="pg-brand-sample-body">
        <h3>{title} appearance</h3>
        <Probes scope="page" />
        <ul className="pg-swatches" aria-label={`${title} brand tokens`}>
          {FIELDS.map((field) => (
            <li key={field.key}>
              <span
                className="pg-swatch"
                style={{ background: `var(${field.token})` }}
                aria-hidden="true"
              />
              <span>{field.label}</span>
              <code>
                {measured?.[field.token]?.split(" ").join(" → ") ?? "…"}
              </code>
            </li>
          ))}
        </ul>
        <div className="pg-brand-type">
          <h4>Heading font</h4>
          <p>Body text in the brand’s body font, with headings above it.</p>
        </div>
        <div className="pg-brand-row">
          <Button>Save</Button>
          <Button variant="accent">Upgrade</Button>
          <Button variant="secondary">Preview</Button>
          <Button variant="ghost">Cancel</Button>
          <span className="pg-focus-sample" aria-hidden="true">
            Focus ring
          </span>
        </div>
        <p>
          Links use the link token:{" "}
          <a href="https://github.com/tonycodes/mortar/blob/main/docs/theming.md">
            read the theming guide
          </a>
          .
        </p>
        <Tabs
          label={`${title} sample tabs`}
          value={tab}
          onChange={setTab}
          items={[
            { id: "overview", label: "Overview", content: null },
            { id: "activity", label: "Activity", count: 3, content: null },
            { id: "settings", label: "Settings", content: null },
          ]}
        />
        <div className="pg-brand-row">
          <Badge>Neutral</Badge>
          <Badge tone="info">Info</Badge>
          <Badge tone="success">Live</Badge>
        </div>
        <Notice title="Brand preview" tone="info">
          Status colours stay the same for every brand.
        </Notice>
        <Input
          label="Email"
          type="email"
          placeholder="name@example.com"
          hint="Focus the field to see the ring."
        />
        <DataTable
          caption={`${title} projects`}
          columns={[
            { key: "name", label: "Project", render: (row) => row.name },
            { key: "status", label: "Status", render: (row) => row.status },
          ]}
          rows={rows}
          rowLabel={(row) => row.name}
          selectedIds={selected}
          onSelectionChange={setSelected}
        />
        <div className="pg-brand-row">
          <Dropdown
            label="Actions"
            align="start"
            items={[
              { label: "Rename", onSelect: () => {} },
              { label: "Duplicate", onSelect: () => {} },
              { label: "Archive", onSelect: () => {}, danger: true },
            ]}
          />
          <Button variant="secondary" onClick={() => setOpen(true)}>
            Open dialog
          </Button>
        </div>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title={`Publish the ${title.toLowerCase()} brand?`}
          actions={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Publish</Button>
            </>
          }
        >
          <p>Dialogs opened inside the preview keep its brand.</p>
        </Modal>
        <div className="pg-brand-inverse">
          <Section
            tone="inverse"
            title={`Inverse band on ${title.toLowerCase()}`}
            headingLevel={4}
          >
            <Probes scope="inverse" />
            <div className="pg-brand-row">
              <Button>Get started</Button>
              <Button variant="secondary">Learn more</Button>
            </div>
            <p className="pg-brand-inverse-link">
              <a href="https://github.com/tonycodes/mortar">Mortar home</a>
            </p>
          </Section>
        </div>
        <div className="pg-brand-accent">
          <CallToAction
            tone="accent"
            title={`Accent band on ${title.toLowerCase()}`}
            description="The accent fill: the brand's gradient, or its flat accent, with on-accent text."
            actions={[
              {
                label: "Start building",
                href: "https://github.com/tonycodes/mortar",
              },
              {
                label: "Read the guide",
                href: "https://github.com/tonycodes/mortar/blob/main/docs/theming.md",
              },
            ]}
            headingLevel={4}
          />
        </div>
      </div>
    </ThemeProvider>
  );
}

const CHECKS = [
  {
    id: "primary",
    label: "On primary on primary",
    fg: "--m-on-primary",
    bg: "--m-primary",
    min: 4.5,
  },
  {
    id: "hover",
    label: "On primary on hover",
    fg: "--m-on-primary",
    bg: "--m-primary-hover",
    min: 4.5,
  },
  {
    id: "active",
    label: "On primary on active",
    fg: "--m-on-primary",
    bg: "--m-primary-active",
    min: 4.5,
  },
  {
    id: "accent",
    label: "On accent on accent",
    fg: "--m-on-accent",
    bg: "--m-accent",
    min: 4.5,
  },
  {
    id: "link",
    label: "Link on page",
    fg: "--m-link",
    bg: "--m-paper",
    min: 4.5,
  },
  {
    id: "link-surface",
    label: "Link on surface",
    fg: "--m-link",
    bg: "--m-surface",
    min: 4.5,
  },
  {
    id: "link-sunken",
    label: "Link on sunken",
    fg: "--m-link",
    bg: "--m-sunken",
    min: 4.5,
  },
  // Text and muted colours stay Mortar's; a tinted surface must keep them
  // readable. Muted text is the lowest-contrast text, so it is the floor.
  {
    id: "text-page",
    label: "Text on page",
    fg: "--m-ink",
    bg: "--m-paper",
    min: 4.5,
  },
  {
    id: "muted-page",
    label: "Muted text on page",
    fg: "--m-muted",
    bg: "--m-paper",
    min: 4.5,
  },
  {
    id: "muted-surface",
    label: "Muted text on surface",
    fg: "--m-muted",
    bg: "--m-surface",
    min: 4.5,
  },
  {
    id: "muted-sunken",
    label: "Muted text on sunken",
    fg: "--m-muted",
    bg: "--m-sunken",
    min: 4.5,
  },
  {
    id: "focus",
    label: "Focus ring on page",
    fg: "--m-focus",
    bg: "--m-paper",
    min: 3,
  },
];

interface Result {
  id: string;
  label: string;
  fg?: string;
  bg?: string;
  min: number;
  value: number;
  pass: boolean;
}

function Contrast({
  measured,
  gradients,
}: {
  measured: Measured | null;
  /** Which appearances define an accent gradient. */
  gradients: Record<Mode, boolean>;
}) {
  if (!measured) return <p>Measuring the preview…</p>;
  const groups = MODES.flatMap((mode) =>
    (["page", "inverse"] as const).map((scope) => {
      const values = measured[mode][scope];
      const result = (
        id: string,
        label: string,
        fg: string | undefined,
        bg: string | undefined,
        min: number,
      ): Result => {
        const value = ratio(fg, bg);
        return { id, label, fg, bg, min, value, pass: value >= min };
      };
      // Inverse bands use the other appearance's values, gradient included.
      const own = scope === "page" ? mode : OTHER[mode];
      const stops = gradients[own] ? (values[FILL]?.split(" ") ?? []) : [];
      return {
        mode,
        scope,
        label:
          scope === "page"
            ? `${TITLE[mode]} page`
            : `Inverse band on ${TITLE[mode].toLowerCase()}`,
        results: [
          ...CHECKS.map((check) =>
            result(
              check.id,
              check.label,
              values[check.fg],
              values[check.bg],
              check.min,
            ),
          ),
          ...stops.map((stop, index) =>
            result(
              `gradient-${index + 1}`,
              `On accent on gradient stop ${index + 1}`,
              values["--m-on-accent"],
              stop,
              4.5,
            ),
          ),
        ],
      };
    }),
  );
  const failures = groups.flatMap((g) =>
    g.results.filter((r) => !r.pass).map((r) => `${g.label}: ${r.label}`),
  );
  return (
    <>
      {failures.length ? (
        <Notice
          tone="warning"
          title={`${failures.length} ${failures.length === 1 ? "check fails" : "checks fail"}`}
        >
          {failures.join("; ")}.
        </Notice>
      ) : (
        <Notice tone="success" title="All contrast checks pass" />
      )}
      <Table
        caption="Contrast checks"
        columns={[
          { key: "check", label: "Check" },
          { key: "colours", label: "Colours" },
          { key: "ratio", label: "Ratio", align: "end" },
          { key: "result", label: "Result" },
        ]}
        groups={groups.map((group) => ({
          label: group.label,
          rows: group.results.map(
            ({ id, label, fg, bg, min, value, pass }) => ({
              check: label,
              colours: (
                <span className="pg-pair">
                  <span
                    className="pg-pair-chip"
                    style={{ background: bg, color: fg }}
                    aria-hidden="true"
                  >
                    Aa
                  </span>
                  <code>
                    {fg} on {bg}
                  </code>
                </span>
              ),
              ratio: (
                <span className="pg-ratio">
                  {value.toFixed(2)}:1
                  <small>needs {min}:1</small>
                </span>
              ),
              result: (
                <span data-check={`${group.mode}-${group.scope}-${id}`}>
                  <Badge tone={pass ? "success" : "danger"}>
                    <span className="pg-result">
                      {pass ? <Check /> : <Close />}
                      {pass ? "Pass" : "Fail"}
                    </span>
                  </Badge>
                </span>
              ),
            }),
          ),
        }))}
      />
    </>
  );
}

function CopyOutput({
  label,
  code,
  what,
  onCopied,
}: {
  label: string;
  code: string;
  what: string;
  onCopied: (message: string) => void;
}) {
  return (
    <div className="pg-brand-output">
      <CodeBlock label={label} code={code} />
      <div>
        <Button
          variant="secondary"
          onClick={() =>
            navigator.clipboard.writeText(code).then(
              () => onCopied(`${what} copied to the clipboard.`),
              () =>
                onCopied(
                  `Couldn't copy the ${what}. Select the code and copy it.`,
                ),
            )
          }
        >
          Copy {what}
        </Button>
      </div>
    </div>
  );
}

export function BrandBuilder() {
  const [initial] = useState(readUrl);
  const [name, setName] = useState(initial.name);
  const [values, setValues] = useState<Values>(initial.values);
  const [measured, setMeasured] = useState<Measured | null>(null);
  const [copied, setCopied] = useState("");
  const previews = useRef<HTMLDivElement>(null);

  const errors = Object.fromEntries([
    ...MODES.flatMap((mode) =>
      FIELDS.map((field) => [
        param(mode, field),
        fieldError(field, values[mode][field.key]),
      ]),
    ),
    ...FONT_FIELDS.map((font) => [
      font.css,
      fontError(values.fonts?.[font.key]),
    ]),
  ]) as Record<string, string | undefined>;
  const invalid = Object.values(errors).filter(Boolean).length;
  const tokens: BrandDefinition = {};
  for (const mode of MODES)
    for (const field of FIELDS) {
      const value = values[mode][field.key]?.trim();
      if (value && !errors[param(mode, field)])
        (tokens[mode] ??= {})[field.key] = value;
    }
  for (const font of FONT_FIELDS) {
    const value = values.fonts?.[font.key]?.trim();
    if (value && !errors[font.css]) (tokens.fonts ??= {})[font.key] = value;
  }
  const nameProblem = nameError(name);
  const brandName = nameProblem ? DEFAULT_NAME : name;
  const previewBrand = brandName;
  const css = brandToCss(brandName, tokens);
  const json = JSON.stringify(tokens, null, 2);
  const preset =
    PRESETS.find(
      (p) =>
        JSON.stringify(trimmed(p.values)) === JSON.stringify(trimmed(values)),
    )?.id ?? "";

  useLayoutEffect(() => {
    writeUrl(name, values);
  }, [name, values]);
  useLayoutEffect(() => {
    const root = previews.current;
    const next = Object.fromEntries(
      MODES.map((mode) => {
        const sample = root?.querySelector(`[data-pg-sample="${mode}"]`);
        return [
          mode,
          {
            page: readProbes(sample?.querySelector('[data-probes="page"]')),
            inverse: readProbes(
              sample?.querySelector('[data-probes="inverse"]'),
            ),
          },
        ];
      }),
    ) as Measured;
    setMeasured((previous) =>
      JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
    );
  }, [css, previewBrand]);

  const update = (mode: Mode, key: Key, value: string) =>
    setValues((current) => ({
      ...current,
      [mode]: { ...current[mode], [key]: value },
    }));
  const updateFont = (key: FontKey, value: string) =>
    setValues((current) => ({
      ...current,
      fonts: { ...current.fonts, [key]: value },
    }));
  const gradientField = (mode: Mode, f: Field) => {
    const id = param(mode, f);
    const value = values[mode][f.key] ?? "";
    const stops = measured?.[mode].page[f.token]?.split(" ").join(" → ");
    return (
      <Input
        key={id}
        label={`${TITLE[mode]} ${f.label.toLowerCase()}`}
        value={value}
        spellCheck={false}
        autoComplete="off"
        placeholder="linear-gradient(90deg, #c2410c, #9a3412)"
        error={errors[id]}
        hint={
          value.trim()
            ? `--m-brand-${PREFIX[mode]}-${f.css}. On accent text must reach 4.5:1 on every stop.`
            : `Empty: the accent fill is ${f.derived[mode]}${stops ? ` (${stops})` : ""}.`
        }
        onChange={(e) => update(mode, f.key, e.target.value)}
        action={
          <span
            className="pg-gradient-swatch"
            data-pg-gradient={mode}
            style={
              {
                // Each preview's own accent fill, as Mortar paints it.
                backgroundColor: measured?.[mode].page["--m-accent"],
                backgroundImage:
                  value.trim() && !errors[id]
                    ? value
                    : `linear-gradient(${measured?.[mode].page["--m-accent"] ?? "transparent"}, ${measured?.[mode].page["--m-accent"] ?? "transparent"})`,
              } as CSSProperties
            }
            aria-hidden="true"
          />
        }
      />
    );
  };
  const field = (mode: Mode, f: Field) => {
    if (f.group === "gradient") return gradientField(mode, f);
    const id = param(mode, f);
    const value = values[mode][f.key] ?? "";
    const resolved = measured?.[mode].page[f.token];
    const picker = /^#[0-9a-f]{6}$/i.test(value.trim())
      ? value.trim().toLowerCase()
      : /^#[0-9a-f]{3}$/i.test(value.trim())
        ? `#${[...value.trim().slice(1)].map((d) => d + d).join("")}`.toLowerCase()
        : (resolved ?? "#000000");
    return (
      <Input
        key={id}
        label={`${TITLE[mode]} ${f.label.toLowerCase()}`}
        value={value}
        spellCheck={false}
        autoComplete="off"
        placeholder={resolved ?? ""}
        error={errors[id]}
        hint={
          value.trim()
            ? `--m-brand-${PREFIX[mode]}-${f.css}`
            : `Empty: derived from ${f.derived[mode]}${resolved ? ` (${resolved})` : ""}.`
        }
        onChange={(e) => update(mode, f.key, e.target.value)}
        action={
          <input
            type="color"
            className="pg-color-picker"
            aria-label={`Pick ${TITLE[mode].toLowerCase()} ${f.label.toLowerCase()}`}
            value={picker}
            onChange={(e) => update(mode, f.key, e.target.value)}
          />
        }
      />
    );
  };

  return (
    <div className="pg-brand">
      <PageHeading
        title="Brand builder"
        description="Design a brand against Mortar's brand contract and check it in light, dark and inverse sections. Empty values derive from primary, exactly as the CSS does."
      />
      <section className="pg-brand-section" aria-labelledby="brand-define">
        <h2 id="brand-define">Define the brand</h2>
        <div className="pg-brand-start">
          <div className="pg-brand-preset">
            {/* Visible label to match the brand name field; the control
                already carries the same accessible name. */}
            <span className="pg-brand-preset-label" aria-hidden="true">
              Start from a preset
            </span>
            <SegmentedControl
              label="Start from a preset"
              value={preset}
              options={PRESETS.map(({ id, label }) => ({ value: id, label }))}
              onChange={(id) => {
                const next = PRESETS.find((p) => p.id === id);
                if (next) setValues(clone(next.values));
              }}
            />
          </div>
          <Input
            label="Brand name"
            value={name}
            spellCheck={false}
            autoComplete="off"
            error={nameProblem}
            hint="Used in data-mortar-brand and ThemeProvider's brand prop."
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="pg-brand-pair">
          {MODES.map((mode) => (
            <Fieldset
              key={mode}
              legend={TITLE[mode]}
              description={`Required pair for the ${mode} appearance.`}
            >
              {FIELDS.filter((f) => f.group === "core").map((f) =>
                field(mode, f),
              )}
            </Fieldset>
          ))}
        </div>
        <details className="pg-brand-advanced">
          <summary>
            Advanced: interaction, accent, focus, link, selected, surfaces and
            gradient
          </summary>
          <div className="pg-brand-pair">
            {MODES.map((mode) => (
              <Fieldset
                key={mode}
                legend={`${TITLE[mode]}, optional`}
                description="Leave empty to derive from primary."
              >
                {FIELDS.filter((f) => f.group === "advanced").map((f) =>
                  field(mode, f),
                )}
              </Fieldset>
            ))}
          </div>
          <div className="pg-brand-pair">
            {MODES.map((mode) => (
              <Fieldset
                key={mode}
                legend={`${TITLE[mode]} surfaces and gradient`}
                description="Leave empty to keep Mortar's surfaces. Text and status colours stay Mortar's, so check them against tinted surfaces below. The gradient paints accent buttons and accent bands."
              >
                {FIELDS.filter(
                  (f) => f.group === "surface" || f.group === "gradient",
                ).map((f) => field(mode, f))}
              </Fieldset>
            ))}
          </div>
        </details>
        <Fieldset
          legend="Fonts"
          description="The same in light and dark. Font-family lists only; load the font files in your app."
        >
          <div className="pg-brand-pair">
            {FONT_FIELDS.map((font) => (
              <Input
                key={font.css}
                label={font.label}
                value={values.fonts?.[font.key] ?? ""}
                spellCheck={false}
                autoComplete="off"
                placeholder={
                  font.key === "heading"
                    ? '"Fraunces", Georgia, serif'
                    : '"Inter", sans-serif'
                }
                error={errors[font.css]}
                hint={
                  values.fonts?.[font.key]?.trim()
                    ? `--m-brand-${font.css}`
                    : font.key === "heading"
                      ? "Empty: headings use the body font."
                      : "Empty: Mortar's system font stack."
                }
                onChange={(e) => updateFont(font.key, e.target.value)}
              />
            ))}
          </div>
        </Fieldset>
      </section>
      <section className="pg-brand-section" aria-labelledby="brand-preview">
        <h2 id="brand-preview">Preview</h2>
        <div className="pg-brand-pair pg-brand-previews" ref={previews}>
          {MODES.map((mode) => (
            <Sample
              key={mode}
              mode={mode}
              brand={previewBrand}
              tokens={tokens}
              measured={measured?.[mode].page}
            />
          ))}
        </div>
      </section>
      <section className="pg-brand-section" aria-labelledby="brand-contrast">
        <h2 id="brand-contrast">Contrast</h2>
        <p>
          WCAG ratios of the tokens as the browser resolves them in each
          preview, including derived values. Text needs 4.5:1; the focus ring
          needs 3:1. With an accent gradient, on-accent text is checked against
          every stop.
        </p>
        <Contrast
          measured={measured}
          gradients={{
            light: !!tokens.light?.accentGradient,
            dark: !!tokens.dark?.accentGradient,
          }}
        />
      </section>
      <section className="pg-brand-section" aria-labelledby="brand-export">
        <h2 id="brand-export">Export</h2>
        {invalid > 0 && (
          <Notice tone="warning" title="Some values are left out">
            Fix the {invalid === 1 ? "field" : `${invalid} fields`} marked
            above; invalid values are not exported.
          </Notice>
        )}
        <div className="pg-brand-pair">
          <CopyOutput label="CSS" what="CSS" code={css} onCopied={setCopied} />
          <CopyOutput
            label="brandTokens (JSON)"
            what="JSON"
            code={json}
            onCopied={setCopied}
          />
        </div>
        <p role="status" className="pg-brand-status">
          {copied}
        </p>
        <CodeBlock
          label="Usage"
          code={`import "./brand.css"; // the CSS above\n<ThemeProvider brand="${brandName}">…</ThemeProvider>\n\n// or at runtime, from data:\n<ThemeProvider brand="${brandName}" brandTokens={tokens}>…</ThemeProvider>`}
        />
      </section>
    </div>
  );
}

/** Values without empty strings, for comparing with presets. */
function trimmed(values: Values): Values {
  const out: Values = { light: {}, dark: {}, fonts: {} };
  for (const mode of MODES)
    for (const field of FIELDS) {
      const value = values[mode][field.key]?.trim();
      if (value) out[mode][field.key] = value;
    }
  for (const font of FONT_FIELDS) {
    const value = values.fonts?.[font.key]?.trim();
    if (value) out.fonts![font.key] = value;
  }
  return out;
}
