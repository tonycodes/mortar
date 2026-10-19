import { StateFixture } from "./StateFixture.js";
import { useState, type ReactNode } from "react";
import * as UI from "../src/index.js";
import { icons } from "./CompositionFixture.js";
import { art, scenes } from "./MarketingArt.js";

/** Fixtures for components added in the v2 kits PR. Kept apart from Fixture.tsx to keep the diff reviewable. */
export function ExtendedCase({ name }: { name: string }) {
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState("cache"),
    [selected, setSelected] = useState(false),
    [filters, setFilters] = useState(["Branch: main", "Owner: Ana"]),
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
          <UI.Avatar name="Ana Kovač" size="xs" />
          <UI.Avatar name="Ana Kovač" status="online" />
          <UI.Avatar name="Example Person" size="lg" shape="square" />
          <UI.Avatar name="Tom Cook" size="xl" />
          <UI.Avatar name="Unknown member" placeholder="icon" />
          <UI.Avatar
            name="Lindsay Walton"
            placeholder="icon"
            shape="square"
            size="lg"
          />
          <UI.Avatar name="Tom Cook" status="online" statusPosition="top" />
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
        <UI.Stack gap="lg">
          <UI.ProgressBar
            label="Build minutes"
            value={4120}
            max={6000}
            valueLabel="4,120 / 6,000"
          />
          <UI.ProgressBar
            label="Storage"
            value={92}
            valueLabel="92%"
            tone="warning"
          />
        </UI.Stack>
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
          {filters.map((filter) => (
            <UI.FilterChip
              key={filter}
              label={filter}
              onRemove={() =>
                setFilters((current) => current.filter((f) => f !== filter))
              }
            />
          ))}
        </div>
      );
      break;
    case "Toast":
      example = (
        <UI.Stack gap="md">
          <UI.Toast
            title="Payment method expired"
            description="Update it to keep builds running."
            tone="danger"
            action={{ label: "Update", onSelect: () => setSelected(true) }}
          />
          <UI.Toast
            title="Ana Kovač replied"
            description="“Looks good — ship it on Friday.”"
            leading={<UI.Avatar name="Ana Kovač" size="sm" />}
            action={{ label: "Reply", onSelect: () => {} }}
            secondaryAction={{ label: "Mark as read", onSelect: () => {} }}
          />
        </UI.Stack>
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
            size="lg"
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
                    icon: icons.download,
                    shortcut: ["↵"],
                    onSelect: () => {},
                  },
                  {
                    id: "re",
                    label: "Redeploy latest",
                    icon: icons.clock,
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
    case "GridList":
      example = (
        <UI.Stack gap="xl">
          <UI.GridList
            label="Team members"
            items={[
              {
                id: "ana",
                title: "Ana Kovač",
                description: "Engineering lead",
                href: "#ana",
                media: <UI.Avatar name="Ana Kovač" decorative />,
                meta: (
                  <>
                    <UI.Badge tone="success">Admin</UI.Badge>
                    <a href="#team-platform">Platform team</a>
                  </>
                ),
                actions: (
                  <UI.ActionLink
                    label="Email Ana"
                    href="#email-ana"
                    variant="secondary"
                  />
                ),
              },
              {
                id: "tom",
                title: "Tom Cook",
                description: "Product designer",
                href: "#tom",
                media: <UI.Avatar name="Tom Cook" decorative />,
              },
              {
                id: "lindsay",
                title: "Lindsay Walton",
                description: "Support",
                href: "#lindsay",
                media: <UI.Avatar name="Lindsay Walton" decorative />,
              },
            ]}
          />
          <UI.GridList
            label="Projects"
            columns={2}
            items={[
              {
                id: "billing",
                title: "Billing redesign",
                description: "12 open tasks · due 30 October",
                meta: <UI.Badge tone="warning">At risk</UI.Badge>,
              },
              {
                id: "search",
                title: "Search relevance",
                description: "4 open tasks · due 14 November",
                meta: <UI.Badge>On track</UI.Badge>,
              },
            ]}
          />
          <UI.GridList
            label="Contacts"
            actionsLayout="split"
            items={[
              { id: "jane", name: "Jane Cooper", role: "Regional paradigm" },
              { id: "cody", name: "Cody Fisher", role: "Product directives" },
              { id: "esther", name: "Esther Howard", role: "Forward response" },
            ].map((person) => ({
              id: person.id,
              title: person.name,
              description: person.role,
              media: <UI.Avatar name={person.name} decorative />,
              actions: (
                <>
                  <a href={`#email-${person.id}`}>
                    {icons.mail}Email
                    <span className="m-sr-only"> {person.name}</span>
                  </a>
                  <a href={`#meet-${person.id}`}>
                    {icons.calendar}Schedule
                    <span className="m-sr-only"> with {person.name}</span>
                  </a>
                </>
              ),
            }))}
          />
          <UI.GridList
            label="Clients"
            columns={2}
            items={[
              {
                id: "tuple",
                title: "Tuple",
                href: "#client-tuple",
                media: <UI.Avatar name="Tuple" shape="square" decorative />,
                details: [
                  { term: "Last invoice", details: "14 October 2026" },
                  {
                    term: "Amount",
                    details: (
                      <>
                        £2,000.00 <UI.Badge tone="danger">Overdue</UI.Badge>
                      </>
                    ),
                  },
                ],
              },
              {
                id: "savvycal",
                title: "SavvyCal",
                href: "#client-savvycal",
                media: <UI.Avatar name="SavvyCal" shape="square" decorative />,
                details: [
                  { term: "Last invoice", details: "2 October 2026" },
                  {
                    term: "Amount",
                    details: (
                      <>
                        £14,000.00 <UI.Badge tone="success">Paid</UI.Badge>
                      </>
                    ),
                  },
                ],
              },
            ]}
          />
        </UI.Stack>
      );
      break;
    case "HeaderSection":
      example = (
        <>
          <UI.HeaderSection
            eyebrow="About us"
            title="We build the foundations other teams ship on"
            description="Mortar started as one team's design system. Now it powers product, marketing and documentation sites."
            links={[
              { label: "Open roles", href: "#roles" },
              { label: "Our values", href: "#values" },
            ]}
            stats={[
              { label: "Components", value: "100" },
              { label: "Teams using Mortar", value: "40+" },
              { label: "Accessibility checks per release", value: "300" },
            ]}
          />
          <UI.HeaderSection
            title="Simple, transparent pricing"
            description="One plan per team size. No per-seat surprises."
            tone="inverse"
            align="center"
            headingLevel={2}
          />
        </>
      );
      break;
    case "ContentSection":
      example = (
        <>
          <UI.ContentSection
            eyebrow="Our story"
            title="Why Mortar exists"
            description="Every product we worked on rebuilt the same buttons, forms and page shells."
            media={
              <UI.MockWindow label="Northwind dashboard">
                <UI.MetricGroup
                  label="This week"
                  items={[
                    { label: "Deploys", value: "48" },
                    { label: "Incidents", value: "1" },
                  ]}
                />
              </UI.MockWindow>
            }
          >
            <p>
              Each rebuild drifted: different focus rings, different dark modes,
              different accessibility bugs. Fixing one product never fixed the
              others.
            </p>
            <p>
              Mortar puts those decisions in one place. Components ship with
              typed contracts, both themes and executable accessibility checks,
              so a fix lands everywhere at once.
            </p>
          </UI.ContentSection>
          <UI.ContentSection
            eyebrow="Our mission"
            title="On a mission to make shipping boring"
            description="We want every release to feel like a non-event."
            media={<img alt="" src={scenes[3]} />}
            mediaPosition="start"
            stats={[
              { label: "Founded", value: "2021" },
              { label: "Employees", value: "37" },
              { label: "Countries", value: "12" },
              { label: "Raised", value: "$25M" },
            ]}
          >
            <p>
              Releases used to take a war room. Now a typed contract and a
              shared test suite catch the regressions before anyone has to.
            </p>
          </UI.ContentSection>
          <UI.ContentSection
            eyebrow="Case study"
            title="How Wheelhouse halved its support queue"
            description="One inbox for chats, bookings and follow-ups."
            tone="muted"
            testimonial={{
              quote:
                "We answered twice as many customers in the first month, without hiring.",
              name: "Lindsay Walton",
              role: "Owner, Wheelhouse Bikes",
              avatar: <UI.Avatar name="Lindsay Walton" decorative />,
            }}
          >
            <p>
              Wheelhouse moved three channels into one shared queue and set up
              saved replies for the questions they hear every day.
            </p>
          </UI.ContentSection>
        </>
      );
      break;
    case "StackedList":
      example = (
        <UI.Stack gap="xl">
          <UI.StackedList
            title="Members"
            action={<a href="#manage">Manage</a>}
            items={[
              {
                id: "1",
                title: "Ana Kovač",
                description: "ana@example.com",
                leading: <UI.Avatar name="Ana Kovač" decorative />,
                trailing: <UI.Badge>Owner</UI.Badge>,
              },
            ]}
          />
          <UI.StackedList
            label="Recent files"
            action={<a href="#files">View all files</a>}
            items={[
              {
                id: "brief",
                title: "Launch brief.pdf",
                description: "Updated 2 hours ago",
                href: "#brief",
              },
            ]}
          />
          <UI.StackedList
            label="Directory"
            groups={[
              {
                label: "A",
                items: [
                  {
                    id: "ana",
                    title: "Ana Kovač",
                    description: "Engineering",
                    leading: (
                      <UI.Avatar name="Ana Kovač" size="sm" decorative />
                    ),
                  },
                  {
                    id: "arlene",
                    title: "Arlene Mccoy",
                    description: "Design",
                    leading: (
                      <UI.Avatar name="Arlene Mccoy" size="sm" decorative />
                    ),
                  },
                ],
              },
              {
                label: "T",
                items: [
                  {
                    id: "tom",
                    title: "Tom Cook",
                    description: "Design",
                    leading: <UI.Avatar name="Tom Cook" size="sm" decorative />,
                  },
                  {
                    id: "tanya",
                    title: "Tanya Fox",
                    description: "Marketing",
                    leading: (
                      <UI.Avatar name="Tanya Fox" size="sm" decorative />
                    ),
                  },
                ],
              },
            ]}
          />
          <UI.StackedList
            title="People"
            chevrons
            items={[
              {
                id: "leslie",
                title: "Leslie Alexander",
                description: "leslie.alexander@example.com",
                leading: <UI.Avatar name="Leslie Alexander" decorative />,
                meta: (
                  <>
                    <span>Co-founder / CEO</span>
                    <span>Last seen 3h ago</span>
                  </>
                ),
                href: "#leslie",
              },
              {
                id: "michael",
                title: "Michael Foster",
                description: "michael.foster@example.com",
                leading: <UI.Avatar name="Michael Foster" decorative />,
                meta: (
                  <>
                    <span>Co-founder / CTO</span>
                    <span>Online</span>
                  </>
                ),
                href: "#michael",
              },
            ]}
          />
        </UI.Stack>
      );
      break;
    case "BentoGrid":
      example = (
        <>
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
                tone: "inverse",
              },
            ]}
          />
          <UI.BentoGrid
            eyebrow="Platform"
            title="Everything you need to ship"
            description="Three columns, with tall tiles at both ends."
            tone="inverse"
            items={[
              {
                title: "Mobile friendly",
                description: "Every screen adapts from phone to desktop.",
                rowSpan: 2,
                visual: <img alt="" src={scenes[1]} style={art} />,
              },
              {
                title: "Performance",
                description: "Pages render on the server and stream in.",
              },
              {
                title: "Powerful APIs",
                description: "Typed clients for every endpoint.",
                rowSpan: 2,
                visual: <img alt="" src={scenes[2]} style={art} />,
              },
              {
                title: "Security",
                description: "Single sign-on and audit logs on every plan.",
              },
            ]}
          />
        </>
      );
      break;
    case "StatGroup":
      example = (
        <UI.Stack gap="xl">
          <UI.StatGroup
            label="Platform numbers"
            items={[
              { value: "99.99%", label: "Uptime" },
              { value: "41s", label: "Median build" },
            ]}
          />
          <UI.StatGroup
            label="Support numbers"
            items={[
              {
                value: "4 min",
                label: "First response",
                description: "Median across every channel last quarter.",
              },
              {
                value: "92%",
                label: "Solved on first reply",
                description: "Customers rarely need to ask twice.",
              },
              {
                value: "24/7",
                label: "Coverage",
                description: "Follow-the-sun teams in three time zones.",
              },
            ]}
          />
          <UI.StatGroup
            label="Company numbers"
            background={<img alt="" src={scenes[0]} />}
            items={[
              { value: "8,000+", label: "Creators on the platform" },
              { value: "3%", label: "Flat platform fee" },
              { value: "99.9%", label: "Uptime guarantee" },
              { value: "$70M", label: "Paid out to creators" },
            ]}
          />
          <UI.StatGroup
            label="Company milestones"
            layout="timeline"
            items={[
              {
                value: "Aug 2021",
                label: "Founded company",
                description: "Two engineers and a shared design system.",
              },
              {
                value: "Dec 2021",
                label: "Secured funding",
                description: "A seed round to grow the team.",
              },
              {
                value: "Feb 2022",
                label: "Released beta",
                description: "Forty teams joined in the first month.",
              },
              {
                value: "Dec 2022",
                label: "Global launch",
                description: "Available in every region.",
              },
            ]}
          />
          <UI.StatGroup
            label="Growth"
            layout="stepped"
            items={[
              {
                value: "250k",
                label: "Users on the platform",
                description: "Across 40 countries.",
              },
              {
                value: "$8.9B",
                label: "Processed every quarter",
                description: "With no downtime last year.",
              },
              {
                value: "401k",
                label: "Projects created",
                description: "Most in their first week.",
              },
            ]}
          />
        </UI.Stack>
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
            {
              name: "Ana Kovač",
              role: "Founder",
              bio: "Ran support for a bike shop before building Northwind.",
              links: [
                {
                  label: "Ana Kovač's website",
                  href: "#ana-web",
                  icon: icons.globe,
                },
                {
                  label: "Ana Kovač on GitHub",
                  href: "#ana-gh",
                  icon: icons.code,
                },
              ],
            },
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
          status={selected ? "success" : "idle"}
          message="Thanks. Check your inbox to confirm."
        />
      );
      break;
    case "NotFound":
      example = (
        <>
          <UI.NotFound
            title="This page isn't deployed."
            description="Check the URL or head back home."
            actions={[{ label: "Go home", href: "/" }, action]}
            illustration={
              <svg
                viewBox="0 0 120 80"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              >
                <path d="M20 60h80M30 60V30l30-18 30 18v30M50 60V42h20v18" />
                <path d="M88 14l14 14M102 14L88 28" />
              </svg>
            }
          />
          <UI.NotFound
            headingLevel={2}
            title="This trail doesn't go anywhere."
            description="The page you're looking for has moved or never existed."
            actions={[{ label: "Back to home", href: "/" }]}
            background={<img alt="" src={scenes[1]} />}
          />
        </>
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
              label: "Getting started",
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
          <UI.Callout tone="warning">
            Changing the output directory invalidates the cache.
          </UI.Callout>
          <UI.Callout tone="danger" title="Breaking">
            This flag is removed in v4.
          </UI.Callout>
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
              label: "Environment variables",
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
