import { StateFixture } from "./StateFixture.js";
import { useState, type ReactNode } from "react";
import * as UI from "../src/index.js";
import { icons } from "./CompositionFixture.js";

/** Inline SVG artwork, so previews never hit the network: a sky, hills and a sun in the given colours. */
const scene = (width: number, height: number, sky: string, land: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}' preserveAspectRatio='xMidYMid slice'><rect width='${width}' height='${height}' fill='#${sky}'/><circle cx='${width * 0.7}' cy='${height * 0.3}' r='${Math.min(width, height) * 0.12}' fill='#fff6d5'/><path d='M0 ${height * 0.7} Q${width * 0.3} ${height * 0.45} ${width * 0.6} ${height * 0.68} T${width} ${height * 0.6} V${height} H0Z' fill='#${land}'/></svg>`,
  )}`;
/** A placeholder portrait: head and shoulders on a coloured ground. */
const portrait = (ground: string, figure: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'><rect width='400' height='500' fill='#${ground}'/><circle cx='200' cy='200' r='80' fill='#${figure}'/><path d='M70 500c0-90 58-150 130-150s130 60 130 150z' fill='#${figure}'/></svg>`,
  )}`;

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
            Mortar puts those decisions in one place. Components ship with typed
            contracts, both themes and executable accessibility checks, so a fix
            lands everywhere at once.
          </p>
        </UI.ContentSection>
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
        </UI.Stack>
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
              tone: "inverse",
            },
          ]}
        />
      );
      break;
    case "StatGroup":
      example = (
        <>
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
        </>
      );
      break;
    case "TestimonialGrid":
      example = (
        <div>
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
          <UI.TestimonialGrid
            title="What support teams say"
            headingLevel={3}
            layout="grid"
            items={[
              {
                quote:
                  "We answered every booking request the same day for the first time. The shared inbox replaced three tools and a spreadsheet.",
                name: "Ana Kovač",
                role: "Owner, Harbour Bikes",
                featured: true,
              },
              {
                quote: "Setup took an afternoon.",
                name: "Ben Lee",
                role: "Office manager",
              },
              {
                quote: "Our clients notice how quickly we reply now.",
                name: "Cy Moreno",
                role: "Agency lead",
              },
              {
                quote: "Scheduling alone saves us hours a week.",
                name: "Di Novak",
                role: "Clinic director",
              },
              {
                quote: "The reports are clear enough to share with the board.",
                name: "Ed Okafor",
                role: "Operations",
              },
            ]}
          />
          <UI.TestimonialGrid
            title="Masonry with a featured quote"
            headingLevel={3}
            items={[
              {
                quote:
                  "Northwind is the first support tool the whole team actually opens every morning.",
                name: "Flo Park",
                role: "Head of support",
                featured: true,
              },
              {
                quote: "Short and to the point.",
                name: "Gil Ruiz",
                role: "Founder",
              },
              {
                quote:
                  "A longer quote shows how masonry columns keep their own heights instead of stretching to match the tallest card in the row.",
                name: "Hana Ito",
                role: "Product lead",
              },
              {
                quote: "Booking links changed how customers reach us.",
                name: "Ivo Petrov",
                role: "Studio owner",
              },
            ]}
          />
        </div>
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
        <div>
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
          <UI.PostList
            title="Latest stories"
            headingLevel={3}
            posts={[
              {
                href: "#featured-post",
                title: "How a bike shop answers every booking the same day",
                excerpt:
                  "Harbour Bikes moved phone, email and chat into one inbox. Here is what changed in their first month.",
                date: "2026-10-12",
                dateLabel: "12 Oct 2026",
                category: "Customers",
                featured: true,
                image: <img alt="" src={scene(800, 500, "bcd7f0", "4f7d5c")} />,
              },
              {
                href: "#post-2",
                title: "Designing a calmer notification inbox",
                excerpt: "Fewer pings, clearer priorities.",
                date: "2026-10-05",
                dateLabel: "5 Oct 2026",
                category: "Design",
                image: <img alt="" src={scene(800, 500, "f6d8c4", "b0654a")} />,
              },
              {
                href: "#post-3",
                title: "What we learned from 1,000 support teams",
                excerpt: "Patterns from a year of anonymised data.",
                date: "2026-09-28",
                dateLabel: "28 Sep 2026",
                category: "Research",
                image: <img alt="" src={scene(800, 500, "dcd3f2", "5a4c8f")} />,
              },
            ]}
          />
        </div>
      );
      break;
    case "TeamGrid":
      example = (
        <div>
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
          <UI.TeamGrid
            title="Leadership"
            headingLevel={3}
            layout="large"
            members={[
              {
                name: "Cy Moreno",
                role: "Chief executive",
                image: <img alt="" src={portrait("e9dccb", "8a6a4f")} />,
              },
              {
                name: "Di Novak",
                role: "Chief technology officer",
                image: <img alt="" src={portrait("cfe0e8", "3f6577")} />,
              },
              {
                name: "Ed Okafor",
                role: "Head of design",
                image: <img alt="" src={portrait("e3dcef", "5d4b85")} />,
              },
            ]}
          />
          <UI.TeamGrid
            title="Support leads"
            headingLevel={3}
            layout="list"
            members={[
              {
                name: "Flo Park",
                role: "Support, Europe",
                bio: "Leads a team of twelve across three time zones and writes most of our help centre.",
                image: <img alt="" src={portrait("d8e8d0", "4d7550")} />,
                links: [
                  {
                    label: "Flo Park on GitHub",
                    href: "#flo-gh",
                    icon: icons.code,
                  },
                ],
              },
              {
                name: "Gil Ruiz",
                role: "Support, Americas",
                bio: "Joined from a customer team and still answers tickets every Friday.",
                image: <img alt="" src={portrait("f2dcd6", "9a4f45")} />,
              },
            ]}
          />
        </div>
      );
      break;
    case "ContactSection":
      example = (
        <div>
          <UI.ContactSection
            title="Talk to sales"
            description="We reply within one business day."
            details={[{ label: "Email", value: "sales@example.com" }]}
          >
            <UI.Input label="Work email" type="email" />
            <UI.TextArea label="How can we help?" />
            <UI.Button type="submit">Send message</UI.Button>
          </UI.ContactSection>
          <UI.ContactSection
            title="Visit or write to us"
            headingLevel={3}
            description="Our support team is online on weekdays."
            details={[{ label: "Phone", value: "+44 20 7946 0000" }]}
            media={<img alt="" src={scene(600, 800, "c9dcef", "51785f")} />}
          >
            <UI.Input label="Your email" type="email" />
            <UI.TextArea label="Message" />
            <UI.Button type="submit">Send</UI.Button>
          </UI.ContactSection>
          <UI.ContactSection
            title="Our offices"
            headingLevel={3}
            description="Drop by any weekday between 9 and 5."
            offices={[
              {
                name: "London",
                address: (
                  <>
                    12 Example Street
                    <br />
                    London EC1A 1AA
                  </>
                ),
              },
              {
                name: "Lisbon",
                address: (
                  <>
                    Rua Exemplo 34
                    <br />
                    1200-001 Lisboa
                  </>
                ),
              },
              {
                name: "Toronto",
                address: (
                  <>
                    56 Sample Avenue
                    <br />
                    Toronto ON M5V 2T6
                  </>
                ),
              },
              {
                name: "Sydney",
                address: (
                  <>
                    78 Demo Road
                    <br />
                    Sydney NSW 2000
                  </>
                ),
              },
            ]}
          />
        </div>
      );
      break;
    case "Newsletter":
      example = (
        <div>
          <UI.Newsletter
            title="Product updates, monthly"
            description="No spam."
            onSubmit={() => setSelected(true)}
            status={selected ? "success" : "idle"}
            message="Thanks. Check your inbox to confirm."
          />
          <UI.Newsletter
            title="Get the support playbook"
            headingLevel={3}
            description="Five short lessons, one a day. Unsubscribe any time."
            layout="center"
            variant="panel"
            submitLabel="Send me the lessons"
            onSubmit={() => undefined}
          />
        </div>
      );
      break;
    case "NotFound":
      example = (
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
