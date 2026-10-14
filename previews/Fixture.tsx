import { StateFixture } from "./StateFixture.js";
import { useState, type ReactNode } from "react";
import * as UI from "../src/index.js";
export function PreviewCase({ name }: { name: string }) {
  const [value, setValue] = useState("first"),
    [checked, setChecked] = useState(false),
    [open, setOpen] = useState(false),
    [page, setPage] = useState(1);
  const controls = (
    <UI.Input
      label="Project name"
      defaultValue="Northwind"
      hint="A name for your workspace"
    />
  );
  const scenario = new URLSearchParams(location.search).get("state");
  if (scenario) return <StateFixture name={name} state={scenario} />;
  const action = { label: "Explore", href: "#example" };
  const items = [
    {
      title: "Shared foundation",
      description: "One theme across every interface.",
    },
    {
      title: "Accessible controls",
      description: "Clear labels and keyboard operation.",
    },
  ];
  let example: ReactNode;
  switch (name) {
    case "ThemeProvider":
    case "AppearanceControl":
      example = (
        <>
          <UI.AppearanceControl />
          <UI.Button>Primary action</UI.Button>
          {controls}
        </>
      );
      break;
    case "Button":
      example = (
        <>
          <UI.Button onClick={() => setChecked(true)}>Save changes</UI.Button>
          <UI.Button variant="secondary">Cancel</UI.Button>
          <UI.Button variant="danger">Delete</UI.Button>
          <UI.Button loading>Saving</UI.Button>
          <output aria-label="Action result">
            {checked ? "saved" : "idle"}
          </output>
        </>
      );
      break;
    case "ActionLink":
      example = <UI.ActionLink {...action} />;
      break;
    case "Badge":
      example = (
        <>
          {(["neutral", "success", "warning", "danger"] as const).map(
            (tone) => (
              <UI.Badge key={tone} tone={tone}>
                {tone}
              </UI.Badge>
            ),
          )}
        </>
      );
      break;
    case "Input":
      example = (
        <>
          {controls}
          <UI.Input label="Email" error="Enter a valid email address" />
        </>
      );
      break;
    case "Select":
      example = (
        <>
          <UI.Select
            label="Environment"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            options={[
              { value: "first", label: "Production" },
              { value: "second", label: "Preview" },
            ]}
          />
          <UI.Select
            label="Unavailable environment"
            disabled
            defaultValue="production"
            hint="Your current environment is managed centrally."
            options={[{ value: "production", label: "Production" }]}
          />
          <UI.Select
            label="Required environment"
            defaultValue=""
            error="Choose an environment."
            options={[
              { value: "", label: "Choose an environment" },
              { value: "production", label: "Production" },
            ]}
          />
        </>
      );
      break;
    case "TextArea":
      example = (
        <UI.TextArea
          label="Description"
          defaultValue="Shared component preview"
        />
      );
      break;
    case "Checkbox":
      example = (
        <UI.Checkbox
          label="Email notifications"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
      );
      break;
    case "Switch":
      example = (
        <UI.Switch
          label="Automatic updates"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
      );
      break;
    case "RadioGroup":
      example = (
        <UI.RadioGroup
          label="Plan"
          name="plan"
          value={value}
          onChange={setValue}
          options={[
            {
              value: "first",
              label: "Standard",
              description: "For small teams",
            },
            {
              value: "second",
              label: "Advanced",
              description: "For growing teams",
            },
          ]}
        />
      );
      break;
    case "Tabs":
      example = (
        <UI.Tabs
          label="Example tabs"
          value={value}
          onChange={setValue}
          items={[
            {
              id: "first",
              label: "Overview",
              content: <p>Overview content</p>,
            },
            {
              id: "second",
              label: "Activity",
              content: <p>Activity content</p>,
            },
          ]}
        />
      );
      break;
    case "Modal":
      example = (
        <>
          <UI.Button onClick={() => setOpen(true)}>Open dialog</UI.Button>
          <UI.Modal
            open={open}
            onClose={() => setOpen(false)}
            title="Create project"
          >
            {controls}
            <UI.Button onClick={() => setOpen(false)}>Create project</UI.Button>
          </UI.Modal>
        </>
      );
      break;
    case "Dropdown":
      example = (
        <UI.Dropdown
          label="Actions"
          items={[
            { label: "Duplicate", onSelect: () => setChecked(true) },
            {
              label: "Delete",
              danger: true,
              onSelect: () => setChecked(false),
            },
          ]}
        />
      );
      break;
    case "Notice":
      example = (
        <UI.Notice title="Update available">
          Your project can use the latest release.
        </UI.Notice>
      );
      break;
    case "EmptyState":
      example = (
        <UI.EmptyState
          title="No projects yet"
          description="Create your first project to get started."
          action={<UI.Button>Create project</UI.Button>}
        />
      );
      break;
    case "AppShell":
      example = (
        <UI.AppShell
          brand="Northwind"
          workspace="Overview"
          navigation={[
            { label: "Overview", href: "#example", current: true },
            { label: "Settings", href: "#settings" },
          ]}
        >
          <div className="m-stack">
            <UI.PageHeading title="Workspace overview" />
            {controls}
          </div>
        </UI.AppShell>
      );
      break;
    case "PageHeading":
      example = (
        <UI.PageHeading
          title="Projects"
          description="Your team’s active projects."
          actions={<UI.Button>New project</UI.Button>}
        />
      );
      break;
    case "MetricGroup":
      example = (
        <UI.MetricGroup
          label="Summary"
          items={[
            {
              label: "Requests",
              value: "1.42M",
              change: "+12.4%",
              tone: "success",
            },
            {
              label: "Latency",
              value: "184ms",
              change: "−18ms",
              tone: "success",
            },
          ]}
        />
      );
      break;
    case "DataTable":
      example = (
        <UI.DataTable
          caption="Projects"
          rowLabel={(row) => row.name}
          columns={[
            { key: "name", label: "Name", render: (row) => row.name },
            {
              key: "status",
              label: "Status",
              render: (row) => <UI.Badge>{row.status}</UI.Badge>,
            },
          ]}
          rows={[{ id: "example", name: "Northwind", status: "Active" }]}
        />
      );
      break;
    case "Pagination":
      example = <UI.Pagination page={page} pageCount={5} onChange={setPage} />;
      break;
    case "SettingsSection":
      example = (
        <UI.SettingsSection
          title="General"
          description="Manage project details."
        >
          {controls}
          <UI.Button>Save changes</UI.Button>
        </UI.SettingsSection>
      );
      break;
    case "ActivityFeed":
      example = (
        <UI.ActivityFeed
          label="Recent activity"
          items={[
            {
              id: "1",
              title: "Deployment completed",
              description: "Production is up to date.",
              time: "2 minutes ago",
              tone: "success",
            },
          ]}
        />
      );
      break;
    case "MarketingHeader":
      example = (
        <UI.MarketingHeader
          brand="Northwind"
          links={[
            { label: "Features", href: "#features" },
            { label: "Pricing", href: "#pricing" },
          ]}
          action={action}
        />
      );
      break;
    case "Hero":
      example = (
        <UI.Hero
          title="Build with confidence."
          description="One shared foundation for your next product."
          actions={[action]}
        />
      );
      break;
    case "FeatureGrid":
      example = <UI.FeatureGrid title="Made to work together" items={items} />;
      break;
    case "FeatureSection":
      example = (
        <UI.FeatureSection
          title="Your brand, centrally managed"
          description="Choose a theme in one place."
        >
          {controls}
        </UI.FeatureSection>
      );
      break;
    case "Testimonial":
      example = (
        <UI.Testimonial
          quote="The example shows how a testimonial appears."
          name="Example customer"
          role="Illustrative content"
        />
      );
      break;
    case "LogoCloud":
      example = (
        <UI.LogoCloud
          label="Example companies"
          items={[
            { name: "Northwind" },
            { name: "Contoso" },
            { name: "Fabrikam" },
          ]}
        />
      );
      break;
    case "Pricing":
      example = (
        <UI.Pricing
          title="Example plans"
          description="Illustrative pricing, not a purchase."
          plans={[
            {
              id: "basic",
              name: "Basic",
              description: "Personal projects",
              monthly: "$0",
              features: ["One project"],
              action,
            },
            {
              id: "team",
              name: "Team",
              description: "Small teams",
              monthly: "$20",
              annual: "$16",
              features: ["Unlimited projects"],
              action,
              featured: true,
            },
          ]}
        />
      );
      break;
    case "FAQ":
      example = (
        <UI.FAQ
          title="Questions"
          items={[
            {
              question: "Is the kit open source?",
              answer: "Yes. Mortar is MIT licensed.",
            },
          ]}
        />
      );
      break;
    case "CallToAction":
      example = (
        <UI.CallToAction
          title="Start your next project"
          description="Use one shared foundation."
          actions={[action]}
        />
      );
      break;
    case "Footer":
      example = (
        <UI.Footer
          brand="Northwind"
          description="Example product"
          columns={[{ title: "Product", links: [action] }]}
          copyright="© Example company"
        />
      );
      break;
    case "SegmentedControl":
      example = (
        <UI.SegmentedControl
          label="View"
          value={value}
          onChange={setValue}
          options={[
            { value: "first", label: "Overview" },
            { value: "second", label: "Activity" },
          ]}
        />
      );
      break;
    case "CodeBlock":
      example = (
        <UI.CodeBlock
          label="Usage"
          code="import { Button } from '@tony-ui/mortar';"
        />
      );
      break;
    case "PreviewFrame":
      example = <UI.PreviewFrame title="Isolated example" src="about:blank" />;
      break;
    default:
      example = (
        <UI.Notice title="Unknown fixture">
          This component is not registered.
        </UI.Notice>
      );
  }
  return <div className="m-stack">{example}</div>;
}
