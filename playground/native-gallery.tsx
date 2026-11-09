/* Native gallery: each core component on the web, beside the SwiftUI and
   Jetpack Compose snapshot references that CI compares against. The images
   are the committed references, so the page shows exactly what the native
   tests check. */
import { useState, type ReactNode } from "react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Divider,
  EmptyState,
  Input,
  Notice,
  PageHeading,
  ProgressBar,
  RadioGroup,
  SegmentedControl,
  Select,
  StackedList,
  Switch,
} from "../src/index.js";

const apple = import.meta.glob<string>(
  "../native/apple/Tests/MortarTests/__Snapshots__/MortarSnapshotTests/*.png",
  { eager: true, query: "?url", import: "default" },
);
const android = import.meta.glob<string>(
  "../native/android/mortar/src/test/snapshots/images/*.png",
  { eager: true, query: "?url", import: "default" },
);

type Variant = "light" | "dark" | "large-text";

interface Entry {
  id: string;
  label: string;
  /** Snapshot test names: SwiftUI's testX, Compose's x. */
  swift: string;
  compose: string;
  devices: [string, string];
  variants: Variant[];
  /** For a single shot whose files are named by device, not variant. */
  shot?: { swift: string; compose: string };
  web: () => ReactNode;
}

const tones = ["neutral", "info", "success", "warning", "danger"] as const;
const title = (word: string) => word[0].toUpperCase() + word.slice(1);

const ENTRIES: Entry[] = [
  {
    id: "button",
    label: "Button",
    swift: "testButton",
    compose: "button",
    devices: ["iPhone 13", "Pixel 5"],
    variants: ["light", "dark", "large-text"],
    web: () => (
      <div className="m-stack items-start">
        {(["primary", "secondary", "ghost", "danger", "accent"] as const).map(
          (variant) => (
            <Button key={variant} variant={variant}>
              {title(variant)} action
            </Button>
          ),
        )}
        <div className="flex gap-2">
          <Button variant="primary" size="sm">
            Small
          </Button>
          <Button variant="primary" size="lg">
            Large
          </Button>
        </div>
        <Button variant="primary" loading>
          Saving
        </Button>
        <Button variant="primary" disabled>
          Disabled
        </Button>
      </div>
    ),
  },
  {
    id: "badge",
    label: "Badge",
    swift: "testBadge",
    compose: "badge",
    devices: ["iPhone 13", "Pixel 5"],
    variants: ["light", "dark", "large-text"],
    web: () => (
      <div className="m-stack items-start">
        {tones.map((tone) => (
          <Badge key={tone} tone={tone}>
            {title(tone)}
          </Badge>
        ))}
      </div>
    ),
  },
  {
    id: "card",
    label: "Card",
    swift: "testCard",
    compose: "card",
    devices: ["iPhone 13", "Pixel 5"],
    variants: ["light", "dark", "large-text"],
    web: () => (
      <div className="m-stack">
        <Card
          title="Billing"
          description="Your plan renews on 1 December."
          actions={<Button size="sm">Change</Button>}
          footer="Invoices go to billing@example.com"
        >
          Team plan, 12 seats
        </Card>
        <Card padding="compact" tone="muted">
          A compact, muted card without a header.
        </Card>
      </div>
    ),
  },
  {
    id: "text-field",
    label: "Text field",
    swift: "testTextField",
    compose: "textField",
    devices: ["iPhone 13", "Pixel 5"],
    variants: ["light", "dark", "large-text"],
    web: () => (
      <div className="m-stack">
        <Input
          label="Email"
          placeholder="you@example.com"
          hint="We'll send a confirmation link."
          required
        />
        <Input
          label="Workspace name"
          defaultValue="Hive"
          error="That name is taken. Try another."
        />
        <Input label="Password" type="password" defaultValue="hunter22" />
        <Input label="Invite code" defaultValue="MORTAR" disabled />
      </div>
    ),
  },
  {
    id: "switch",
    label: "Switch",
    swift: "testSwitch",
    compose: "switch",
    devices: ["iPhone 13", "Pixel 5"],
    variants: ["light", "dark", "large-text"],
    web: () => (
      <div className="m-stack">
        <Switch
          label="Email notifications"
          description="A summary of activity each morning."
          defaultChecked
        />
        <Switch label="Product updates" />
        <Switch label="Two-step sign-in" defaultChecked disabled />
      </div>
    ),
  },
  {
    id: "avatar",
    label: "Avatar",
    swift: "testAvatar",
    compose: "avatar",
    devices: ["iPhone 13", "Pixel 5"],
    variants: ["light", "dark", "large-text"],
    web: () => (
      <div className="m-stack items-start">
        <div className="flex items-center gap-3">
          {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
            <Avatar key={size} name="Ada Lovelace" size={size} />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Avatar name="Grace Hopper" size="lg" status="online" />
          <Avatar
            name="Alan Turing"
            size="lg"
            shape="square"
            status="offline"
          />
        </div>
      </div>
    ),
  },
  {
    id: "notice",
    label: "Notice",
    swift: "testNotice",
    compose: "notice",
    devices: ["iPhone 13", "Pixel 5"],
    variants: ["light", "dark", "large-text"],
    web: () => (
      <div className="m-stack">
        {tones.map((tone) => (
          <Notice key={tone} title={`${title(tone)} notice`} tone={tone}>
            Something happened that you should know about.
          </Notice>
        ))}
      </div>
    ),
  },
  {
    id: "empty-state",
    label: "Empty state",
    swift: "testEmptyState",
    compose: "emptyState",
    devices: ["iPhone 13", "Pixel 5"],
    variants: ["light", "dark", "large-text"],
    web: () => (
      <div className="m-stack">
        <EmptyState
          title="No projects yet"
          description="Projects you create or join appear here."
          action={<Button variant="primary">New project</Button>}
        />
        <EmptyState
          title="No results"
          description="Try a different search."
          dashed
        />
      </div>
    ),
  },
  {
    id: "checkbox",
    label: "Checkbox",
    swift: "testCheckbox",
    compose: "checkbox",
    devices: ["iPhone 13", "Pixel 5"],
    variants: ["light", "dark", "large-text"],
    web: () => (
      <div className="m-stack">
        <Checkbox
          label="Email me a weekly summary"
          description="Every Monday morning."
          defaultChecked
        />
        <Checkbox
          label="I agree to the terms"
          error="Agree to the terms to continue."
          required
        />
        <Checkbox label="Beta features" disabled />
      </div>
    ),
  },
  {
    id: "radio-group",
    label: "Radio group",
    swift: "testRadioGroup",
    compose: "radioGroup",
    devices: ["iPhone 13", "Pixel 5"],
    variants: ["light", "dark", "large-text"],
    web: () => (
      <RadioGroup
        label="Plan"
        name="gallery-plan"
        value="team"
        onChange={() => {}}
        hint="You can change plan at any time."
        options={[
          { value: "personal", label: "Personal", description: "One seat." },
          { value: "team", label: "Team", description: "Up to 20 seats." },
          { value: "enterprise", label: "Enterprise", disabled: true },
        ]}
      />
    ),
  },
  {
    id: "segmented-control",
    label: "Segmented control",
    swift: "testSegmentedControl",
    compose: "segmentedControl",
    devices: ["iPhone 13", "Pixel 5"],
    variants: ["light", "dark", "large-text"],
    web: () => (
      <div className="m-stack items-start">
        <SegmentedControl
          label="Range"
          value="week"
          onChange={() => {}}
          options={[
            { value: "day", label: "Day" },
            { value: "week", label: "Week" },
            { value: "month", label: "Month" },
          ]}
        />
        <SegmentedControl
          label="View"
          value="list"
          onChange={() => {}}
          options={[
            { value: "list", label: "List" },
            { value: "board", label: "Board" },
          ]}
        />
      </div>
    ),
  },
  {
    id: "progress-bar",
    label: "Progress bar",
    swift: "testProgressBar",
    compose: "progressBar",
    devices: ["iPhone 13", "Pixel 5"],
    variants: ["light", "dark", "large-text"],
    web: () => (
      <div className="m-stack">
        <ProgressBar label="Storage" value={62} />
        <ProgressBar
          label="Onboarding"
          value={3}
          max={5}
          valueLabel="3 of 5 steps"
          tone="success"
        />
        <ProgressBar label="Quota" value={96} tone="danger" />
      </div>
    ),
  },
  {
    id: "divider",
    label: "Divider",
    swift: "testDivider",
    compose: "divider",
    devices: ["iPhone 13", "Pixel 5"],
    variants: ["light", "dark", "large-text"],
    web: () => (
      <div>
        <p>Above</p>
        <Divider />
        <p>Between</p>
        <Divider label="or" />
        <p>Below</p>
        <Divider soft spacing="sm" />
      </div>
    ),
  },
  {
    id: "stacked-list",
    label: "Stacked list",
    swift: "testStackedList",
    compose: "stackedList",
    devices: ["iPhone 13", "Pixel 5"],
    variants: ["light", "dark", "large-text"],
    web: () => (
      <StackedList
        title="Team"
        chevrons
        groups={[
          {
            label: "Owners",
            items: [
              {
                id: "1",
                title: "Ada Lovelace",
                description: "ada@example.com",
                leading: <Avatar name="Ada Lovelace" decorative />,
                trailing: "Owner",
                href: "#ada",
              },
            ],
          },
          {
            label: "Files",
            items: [
              {
                id: "2",
                title: "Quarterly report.pdf",
                description: "2.4 MB",
                trailing: "Today",
                href: "#report",
              },
              {
                id: "3",
                title: "Roadmap.key",
                description: "18 MB",
                trailing: "Monday",
              },
            ],
          },
        ]}
      />
    ),
  },
  {
    id: "app-shell-phone",
    label: "App shell, phone",
    swift: "testAppShell",
    compose: "appShell",
    devices: ["iPhone 13", "Pixel 5"],
    variants: ["light"],
    shot: { swift: "iphone", compose: "phone" },
    web: () => null,
  },
  {
    id: "app-shell-tablet",
    label: "App shell, tablet",
    swift: "testAppShell",
    compose: "appShell",
    devices: ["iPad Pro 11", "Pixel C"],
    variants: ["light"],
    shot: { swift: "ipad", compose: "tablet" },
    web: () => null,
  },
  {
    id: "tablet",
    label: "Branded tablet screen",
    swift: "testBrandOnIPad",
    compose: "brandOnTablet",
    devices: ["iPad Pro 11", "Pixel C"],
    variants: ["light", "dark"],
    web: () => null,
  },
];

/** A committed reference image, or undefined when it has not been recorded. */
function reference(platform: "swift" | "compose", entry: Entry, v: Variant) {
  const images = platform === "swift" ? apple : android;
  const file =
    platform === "swift"
      ? `/${entry.swift}.${entry.shot?.swift ?? v}.png`
      : `/codes.tony.mortar_MortarSnapshotTest_${entry.compose}_${entry.shot?.compose ?? v}.png`;
  return Object.entries(images).find(([path]) => path.endsWith(file))?.[1];
}

function Shot({
  label,
  device,
  src,
  variant,
}: {
  label: string;
  device: string;
  src?: string;
  variant: Variant;
}) {
  return (
    <figure className="pg-native-shot" data-platform={label}>
      <figcaption>
        <strong>{label}</strong> <span>{device}</span>
      </figcaption>
      {src ? (
        <img
          src={src}
          alt={`${label} snapshot on ${device}, ${variant.replace("-", " ")}`}
          loading="lazy"
        />
      ) : (
        <p>No reference recorded yet.</p>
      )}
    </figure>
  );
}

export function NativeGallery() {
  const read = () => new URLSearchParams(location.search);
  const [id, setId] = useState(
    () => ENTRIES.find((e) => e.id === read().get("native"))?.id ?? "button",
  );
  const [variant, setVariant] = useState<Variant>(
    () =>
      (["light", "dark", "large-text"] as const).find(
        (v) => v === read().get("variant"),
      ) ?? "light",
  );
  const entry = ENTRIES.find((e) => e.id === id) ?? ENTRIES[0];
  const shown = entry.variants.includes(variant) ? variant : "light";
  const choose = (next: { native?: string; variant?: string }) => {
    const params = read();
    for (const [key, value] of Object.entries(next))
      if (value) params.set(key, value);
    history.replaceState(null, "", `?${params}`);
    if (next.native) setId(next.native);
    if (next.variant) setVariant(next.variant as Variant);
  };
  const web = entry.web();
  return (
    <>
      <PageHeading
        title="Native gallery"
        description="Each core component on the web, in SwiftUI and in Jetpack Compose. The native images are the snapshot references CI checks the Swift package and the Compose library against."
      />
      <section
        className="pg-example-toolbar pg-tool-toolbar"
        aria-label="Gallery settings"
      >
        <Select
          label="Component"
          value={entry.id}
          options={ENTRIES.map((e) => ({ value: e.id, label: e.label }))}
          onChange={(e) => choose({ native: e.target.value })}
        />
        <SegmentedControl
          label="Variant"
          value={shown}
          options={entry.variants.map((v) => ({
            value: v,
            label: v === "large-text" ? "Large text" : title(v),
          }))}
          onChange={(value) => choose({ variant: value })}
        />
      </section>
      <div className="pg-native-grid">
        {web && (
          <figure className="pg-native-shot" data-platform="Web">
            <figcaption>
              <strong>Web</strong> <span>React, live</span>
            </figcaption>
            <div
              className="pg-native-web"
              data-mortar
              data-mortar-appearance={shown === "dark" ? "dark" : "light"}
              data-large-text={shown === "large-text" ? "" : undefined}
            >
              {web}
            </div>
          </figure>
        )}
        <Shot
          label="SwiftUI"
          device={entry.devices[0]}
          src={reference("swift", entry, shown)}
          variant={shown}
        />
        <Shot
          label="Compose"
          device={entry.devices[1]}
          src={reference("compose", entry, shown)}
          variant={shown}
        />
      </div>
    </>
  );
}
