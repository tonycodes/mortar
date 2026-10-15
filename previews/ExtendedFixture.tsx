import { StateFixture } from "./StateFixture.js";
import { useState, type ReactNode } from "react";
import * as UI from "../src/index.js";

/** Fixtures for components added in the v2 kits PR. Kept apart from Fixture.tsx to keep the diff reviewable. */
export function ExtendedCase({ name }: { name: string }) {
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState("cache"),
    [selected, setSelected] = useState(false),
    [dirty, setDirty] = useState(true),
    [helpful, setHelpful] = useState<"yes" | "no" | null>(null),
    [toasts, setToasts] = useState<UI.ToastItem[]>([
      {
        id: "1",
        title: "Deployed to production",
        description: "Build 4f2a91c is live.",
        tone: "success",
      },
    ]);
  const scenario = new URLSearchParams(location.search).get("state");
  if (scenario) return <StateFixture name={name} state={scenario} />;
  const action = { label: "Explore", href: "#example" };
  const trigger = (label: string) => (
    <UI.Button onClick={() => setOpen(true)}>{label}</UI.Button>
  );
  const groups = [
    {
      label: "Guides",
      items: [
        {
          id: "a",
          label: "Build cache",
          match: [6, 11] as [number, number],
          description: "Guides / Builds",
          onSelect: () => setQuery(""),
        },
        {
          id: "b",
          label: "Clearing the cache",
          match: [13, 18] as [number, number],
          description: "Guides / Builds",
          onSelect: () => setQuery(""),
        },
      ].filter((i) => i.label.toLowerCase().includes(query.toLowerCase())),
    },
  ];
  let example: ReactNode;
  switch (name) {
    case "Avatar":
      example = (
        <div className="m-actions">
          <UI.Avatar name="Ana Kovač" status="online" />
          <UI.Avatar name="Example Person" size="lg" shape="square" />
        </div>
      );
      break;
    case "AvatarGroup":
      example = (
        <UI.AvatarGroup
          label="Project members"
          people={["Ana K", "Ben L", "Cy M", "Di N", "Ed O", "Flo P"].map(
            (name) => ({ name }),
          )}
        />
      );
      break;
    case "Kbd":
      example = (
        <p>
          Press <UI.Kbd keys={["⌘", "K"]} /> to search.
        </p>
      );
      break;
    case "ProgressBar":
      example = (
        <UI.ProgressBar
          label="Build minutes"
          value={4120}
          max={6000}
          valueLabel="4,120 / 6,000"
        />
      );
      break;
    case "FilterChip":
      example = (
        <div className="m-actions">
          <UI.FilterChip
            label="Status"
            selected={selected}
            onClick={() => setSelected(!selected)}
          />
          <UI.FilterChip
            label="Branch: main"
            onRemove={() => setSelected(false)}
          />
        </div>
      );
      break;
    case "Toast":
      example = (
        <UI.Toast
          title="Payment method expired"
          description="Update it to keep builds running."
          tone="danger"
          action={{ label: "Update", onClick: () => setSelected(true) }}
        />
      );
      break;
    case "Toaster":
      example = (
        <>
          <UI.Button
            onClick={() =>
              setToasts((t) => [
                ...t,
                {
                  id: String(Date.now()),
                  title: "Copied URL",
                  tone: "neutral",
                },
              ])
            }
          >
            Show toast
          </UI.Button>
          <UI.Toaster
            items={toasts}
            onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))}
          />
        </>
      );
      break;
    case "ConfirmDialog":
      example = (
        <>
          {trigger("Delete project")}
          <UI.ConfirmDialog
            open={open}
            onClose={() => setOpen(false)}
            onConfirm={() => setOpen(false)}
            title="Delete project?"
            description="This removes the project, its deployments and environment variables."
            confirmLabel="Delete project"
            confirmationText="Northwind"
          />
        </>
      );
      break;
    case "SaveBar":
      example = (
        <UI.SaveBar
          open={dirty}
          onSave={() => setDirty(false)}
          onDiscard={() => setDirty(false)}
        />
      );
      break;
    case "SlideOver":
      example = (
        <>
          {trigger("Add variable")}
          <UI.SlideOver
            open={open}
            onClose={() => setOpen(false)}
            title="Add environment variable"
            description="Applies to the next deployment."
            actions={
              <>
                <UI.Button variant="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </UI.Button>
                <UI.Button onClick={() => setOpen(false)}>
                  Save variable
                </UI.Button>
              </>
            }
          >
            <UI.Input label="Key" defaultValue="API_KEY" />
          </UI.SlideOver>
        </>
      );
      break;
    case "CommandPalette":
      example = (
        <>
          {trigger("Open command menu")}
          <UI.CommandPalette
            open={open}
            onClose={() => setOpen(false)}
            query={query}
            onQueryChange={setQuery}
            groups={[
              {
                label: "Actions",
                items: [
                  {
                    id: "new",
                    label: "New deployment",
                    shortcut: ["↵"],
                    onSelect: () => {},
                  },
                  {
                    id: "re",
                    label: "Redeploy latest",
                    shortcut: ["⌘", "R"],
                    onSelect: () => {},
                  },
                ],
              },
            ]}
          />
        </>
      );
      break;
    case "StackedList":
      example = (
        <UI.StackedList
          label="Members"
          heading="Members"
          action={<a href="#manage">Manage</a>}
          items={[
            {
              id: "1",
              title: "Ana Kovač",
              description: "ana@example.com",
              leading: <UI.Avatar name="Ana Kovač" />,
              trailing: <UI.Badge>Owner</UI.Badge>,
            },
          ]}
        />
      );
      break;
    case "BentoGrid":
      example = (
        <UI.BentoGrid
          title="Layout"
          items={[
            {
              title: "Wide",
              description: "Spans two columns.",
              span: 2,
              visual: (
                <div
                  style={{
                    background: "var(--m-line)",
                    minHeight: 72,
                    borderRadius: 8,
                  }}
                />
              ),
            },
            {
              title: "Focus",
              description: "An inverse tile.",
              inverse: true,
            },
          ]}
        />
      );
      break;
    case "StatGroup":
      example = (
        <UI.StatGroup
          label="Platform numbers"
          items={[
            { value: "99.99%", label: "Uptime" },
            { value: "41s", label: "Median build" },
          ]}
        />
      );
      break;
    case "TestimonialGrid":
      example = (
        <UI.TestimonialGrid
          title="Teams ship faster"
          items={[
            {
              quote: "Illustrative quote for the preview.",
              name: "Example customer",
              role: "Example role",
            },
          ]}
        />
      );
      break;
    case "PlanComparison":
      example = (
        <UI.PlanComparison
          title="Compare plans"
          plans={["Hobby", "Team", "Enterprise"]}
          featuredPlan="Team"
          groups={[
            {
              label: "Builds",
              rows: [
                { feature: "Concurrent builds", values: ["1", "4", "Custom"] },
                { feature: "Preview comments", values: [false, true, true] },
              ],
            },
          ]}
        />
      );
      break;
    case "PostList":
      example = (
        <UI.PostList
          title="From the blog"
          action={action}
          posts={[
            {
              href: "#post",
              title: "Example post title",
              excerpt: "Illustrative excerpt.",
              date: "2026-10-02",
              dateLabel: "2 Oct 2026",
              category: "Engineering",
            },
          ]}
        />
      );
      break;
    case "TeamGrid":
      example = (
        <UI.TeamGrid
          title="The people behind the product"
          members={[
            { name: "Ana Kovač", role: "Founder" },
            { name: "Ben Lee", role: "Engineering" },
          ]}
        />
      );
      break;
    case "ContactSection":
      example = (
        <UI.ContactSection
          title="Talk to sales"
          description="We reply within one business day."
          details={[{ label: "Email", value: "sales@example.com" }]}
        >
          <UI.Input label="Work email" type="email" />
          <UI.TextArea label="How can we help?" />
          <UI.Button type="submit">Send message</UI.Button>
        </UI.ContactSection>
      );
      break;
    case "Newsletter":
      example = (
        <UI.Newsletter
          title="Product updates, monthly"
          description="No spam."
          onSubmit={() => setSelected(true)}
        />
      );
      break;
    case "NotFound":
      example = (
        <UI.NotFound
          title="This page isn't deployed."
          description="Check the URL or head back home."
          actions={[{ label: "Go home", href: "/" }, action]}
        />
      );
      break;
    case "DocsShell":
      example = (
        <UI.DocsShell
          brand="Example Docs"
          version="v3.2"
          sections={[
            { label: "Guides", href: "#guides", current: true },
            { label: "API", href: "#api" },
          ]}
          navigation={[
            {
              title: "Getting started",
              items: [
                { label: "Quickstart", href: "#quickstart", current: true },
                { label: "Project structure", href: "#structure" },
              ],
            },
          ]}
          toc={[{ id: "install", label: "Install the CLI", current: true }]}
          search={<UI.SearchTrigger onOpen={() => setOpen(true)} />}
        >
          <h1>Quickstart</h1>
        </UI.DocsShell>
      );
      break;
    case "SearchTrigger":
    case "SearchDialog":
      example = (
        <>
          <UI.SearchTrigger onOpen={() => setOpen(true)} />
          <UI.SearchDialog
            open={open}
            onClose={() => setOpen(false)}
            query={query}
            onQueryChange={setQuery}
            groups={groups}
          />
        </>
      );
      break;
    case "Steps":
      example = (
        <UI.Steps
          items={[
            { title: "Sign up", description: "Create an account." },
            { title: "Configure", description: "Choose a theme." },
          ]}
        />
      );
      break;
    case "Callout":
      example = (
        <>
          <UI.Callout>Builds time out after 45 minutes.</UI.Callout>
          <UI.Callout type="warning">
            Changing the output directory invalidates the cache.
          </UI.Callout>
          <UI.Callout type="breaking">This flag is removed in v4.</UI.Callout>
        </>
      );
      break;
    case "FileTree":
      example = (
        <UI.FileTree
          label="Project files"
          items={[
            {
              name: "app",
              children: [
                { name: "page.tsx", highlighted: true, note: "entry" },
              ],
            },
            { name: "package.json" },
          ]}
        />
      );
      break;
    case "Prose":
      example = (
        <UI.Prose>
          <h2>Build cache</h2>
          <p>
            Caches <code>node_modules</code> between builds.
          </p>
        </UI.Prose>
      );
      break;
    case "CodeTabs":
      example = (
        <UI.CodeTabs
          prompt="$"
          tabs={[
            { id: "npm", label: "npm", code: "npm i -g example" },
            { id: "pnpm", label: "pnpm", code: "pnpm add -g example" },
          ]}
        />
      );
      break;
    case "Release":
      example = (
        <UI.Release
          version="v3.2.0"
          date="2026-10-02"
          dateLabel="2 Oct 2026"
          changes={[
            { type: "added", items: ["Password-protected previews."] },
            { type: "deprecated", items: ["The --prod flag."] },
          ]}
        />
      );
      break;
    case "ApiEndpoint":
      example = (
        <UI.ApiEndpoint
          method="POST"
          path="/v3/deployments"
          title="Create a deployment"
          description="Starts a build from a git ref."
          params={[
            {
              name: "project",
              type: "string",
              required: true,
              description: "Project ID or slug.",
            },
          ]}
          examples={
            <UI.CodeTabs
              filename="Response"
              language="201"
              tabs={[
                { id: "r", label: "Response", code: '{ "state": "queued" }' },
              ]}
            />
          }
        />
      );
      break;
    case "PageFeedback":
      example = (
        <UI.PageFeedback
          value={helpful}
          onChange={setHelpful}
          updated="Updated 2 Oct 2026"
        />
      );
      break;
    case "PagerLinks":
      example = (
        <UI.PagerLinks
          previous={{ label: "Introduction", href: "#intro" }}
          next={{ label: "Project structure", href: "#structure" }}
        />
      );
      break;
    case "LinkCards":
      example = (
        <UI.LinkCards
          items={[
            {
              href: "#env",
              title: "Environment variables",
              description: "Add secrets per environment.",
            },
          ]}
        />
      );
      break;
    default:
      example = (
        <UI.Notice title="Unknown fixture">
          This component is not registered.
        </UI.Notice>
      );
  }
  return (
    <div className="m-stack">
      {example}
      <output aria-label="Action result">
        {selected ? "completed" : "idle"}
      </output>
    </div>
  );
}
