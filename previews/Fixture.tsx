import { StateFixture } from "./StateFixture.js";
import { useState, type ReactNode } from "react";
import * as UI from "../src/index.js";
import { icons } from "./CompositionFixture.js";
export function PreviewCase({ name }: { name: string }) {
  const [value, setValue] = useState("first"),
    [checked, setChecked] = useState(false),
    [open, setOpen] = useState(false),
    [page, setPage] = useState(1),
    [resultsPage, setResultsPage] = useState(6),
    [noticeShown, setNoticeShown] = useState(true),
    [menuChoice, setMenuChoice] = useState("none"),
    [extra, setExtra] = useState(false),
    [memory, setMemory] = useState("16"),
    [colour, setColour] = useState("slate"),
    [section, setSection] = useState("profile"),
    [period, setPeriod] = useState("monthly"),
    [selectedRows, setSelectedRows] = useState<string[]>([]),
    [selectedPeople, setSelectedPeople] = useState<string[]>([]);
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
          <div className="m-actions">
            <UI.Button onClick={() => setChecked(true)}>Save changes</UI.Button>
            <UI.Button variant="secondary">Cancel</UI.Button>
            <UI.Button variant="danger">Delete</UI.Button>
            <UI.Button loading>Saving</UI.Button>
          </div>
          <div className="m-actions">
            <UI.Button size="sm" variant="secondary">
              Small
            </UI.Button>
            <UI.Button size="lg">Large</UI.Button>
            <UI.Button variant="secondary" icon={icons.download}>
              Export CSV
            </UI.Button>
            <UI.Button variant="ghost" icon={icons.edit} iconOnly>
              Edit project
            </UI.Button>
          </div>
          <output aria-label="Action result">
            {checked ? "saved" : "idle"}
          </output>
        </>
      );
      break;
    case "ActionLink":
      example = (
        <div className="m-actions">
          <UI.ActionLink {...action} />
        </div>
      );
      break;
    case "Badge":
      example = (
        <>
          {(["neutral", "info", "success", "warning", "danger"] as const).map(
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
          <UI.Input
            label="Search candidates"
            type="search"
            leadingIcon={icons.search}
            action={
              <UI.Button
                variant="secondary"
                onClick={() => setChecked(!checked)}
                aria-pressed={checked}
              >
                Sort
              </UI.Button>
            }
          />
          <UI.Input label="Website" prefix="https://" suffix=".com" />
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
        <UI.Stack gap="sm">
          <UI.Checkbox
            label="Email notifications"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <UI.Checkbox
            label="Comments"
            description="Get notified when someone comments on your post."
            checked={extra}
            onChange={(e) => setExtra(e.target.checked)}
          />
        </UI.Stack>
      );
      break;
    case "Switch":
      example = (
        <UI.Stack gap="sm">
          <UI.Switch
            label="Automatic updates"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <UI.Switch
            label="Annual billing"
            description="Save 10% when you pay for a year up front."
            checked={extra}
            onChange={(e) => setExtra(e.target.checked)}
          />
        </UI.Stack>
      );
      break;
    case "RadioGroup":
      example = (
        <UI.Stack gap="xl">
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
          <UI.RadioGroup
            label="Memory"
            name="memory"
            layout="grid"
            value={memory}
            onChange={setMemory}
            options={[
              { value: "8", label: "8 GB", description: "£0" },
              { value: "16", label: "16 GB", description: "+ £200" },
              { value: "32", label: "32 GB", description: "+ £400" },
              {
                value: "64",
                label: "64 GB",
                description: "Out of stock",
                disabled: true,
              },
            ]}
          />
          <UI.RadioGroup
            label="Colour"
            name="colour"
            layout="swatches"
            value={colour}
            onChange={setColour}
            options={[
              { value: "rose", label: "Rose", swatch: "#e8a3b4" },
              { value: "sky", label: "Sky", swatch: "#8bbcdc" },
              { value: "slate", label: "Slate", swatch: "#475569" },
            ]}
          />
          <output aria-label="Chosen options">
            {memory} · {colour}
          </output>
        </UI.Stack>
      );
      break;
    case "Tabs":
      example = (
        <UI.Stack gap="xl">
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
                count: 12,
                icon: icons.clock,
                content: <p>Activity content</p>,
              },
            ]}
          />
          <UI.Tabs
            label="Account sections"
            variant="pills"
            value={section}
            onChange={setSection}
            items={[
              { id: "profile", label: "Profile", content: <p>Profile form</p> },
              { id: "billing", label: "Billing", content: <p>Invoices</p> },
              { id: "team", label: "Team", content: <p>Team members</p> },
            ]}
          />
          <UI.Tabs
            label="Billing period"
            fullWidth
            value={period}
            onChange={setPeriod}
            items={[
              {
                id: "monthly",
                label: "Monthly",
                content: <p>Billed monthly</p>,
              },
              { id: "yearly", label: "Yearly", content: <p>Billed yearly</p> },
            ]}
          />
        </UI.Stack>
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
        <div className="m-actions">
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
          <UI.Dropdown
            label="More options"
            icon={icons.more}
            iconOnly
            variant="ghost"
            header="Signed in as ana@example.com"
            items={[
              {
                section: "Project",
                label: "Edit",
                icon: icons.edit,
                description: "Rename or change details",
                onSelect: () => setMenuChoice("edit"),
              },
              {
                section: "Project",
                label: "Export",
                icon: icons.download,
                onSelect: () => setMenuChoice("export"),
              },
              {
                section: "Help",
                label: "Documentation",
                href: "#docs",
              },
            ]}
          />
          <output aria-label="Menu choice">{menuChoice}</output>
        </div>
      );
      break;
    case "Notice":
      example = (
        <UI.Stack gap="md">
          <UI.Notice title="Update available" tone="info">
            Your project can use the latest release.
          </UI.Notice>
          {noticeShown ? (
            <UI.Notice
              title="Payment failed"
              tone="danger"
              actions={<a href="#billing">Update billing</a>}
              onDismiss={() => setNoticeShown(false)}
            >
              We couldn't charge your card ending 4242.
            </UI.Notice>
          ) : (
            <UI.Button variant="secondary" onClick={() => setNoticeShown(true)}>
              Show payment notice
            </UI.Button>
          )}
        </UI.Stack>
      );
      break;
    case "EmptyState":
      example = (
        <UI.Stack gap="xl">
          <UI.EmptyState
            title="No projects yet"
            description="Create your first project to get started."
            icon={icons.inbox}
            action={<UI.Button>Create project</UI.Button>}
          />
          <UI.EmptyState
            dashed
            title="No databases"
            description="Connect a database to start syncing records."
            icon={icons.download}
            action={<UI.Button variant="secondary">Add database</UI.Button>}
          />
          <UI.EmptyState
            align="start"
            title="Projects"
            description="You haven’t created a project yet. Get started by selecting a template or start from an empty project."
          >
            <UI.Stack gap="md" align="start">
              <UI.StackedList
                label="Project templates"
                items={[
                  {
                    id: "list",
                    title: "Create a list",
                    description:
                      "Another to-do system you’ll try but eventually give up on.",
                    href: "#example",
                    leading: (
                      <span className="m-empty-icon" aria-hidden="true">
                        {icons.edit}
                      </span>
                    ),
                  },
                  {
                    id: "calendar",
                    title: "Create a calendar",
                    description: "Stay on top of your deadlines, or don’t.",
                    href: "#example",
                    leading: (
                      <span className="m-empty-icon" aria-hidden="true">
                        {icons.calendar}
                      </span>
                    ),
                  },
                  {
                    id: "timeline",
                    title: "Create a timeline",
                    description:
                      "Get a birds-eye view of your procrastination.",
                    href: "#example",
                    leading: (
                      <span className="m-empty-icon" aria-hidden="true">
                        {icons.clock}
                      </span>
                    ),
                  },
                ]}
              />
              <a href="#example">Or start from an empty project →</a>
            </UI.Stack>
          </UI.EmptyState>
          <UI.EmptyState
            title="Add team members"
            description="You haven’t added any team members to your project yet."
            icon={icons.mail}
          >
            <UI.StackedList
              label="Team members previously added to projects"
              items={["Lindsay Walton", "Courtney Henry", "Tom Cook"].map(
                (person) => ({
                  id: person,
                  title: person,
                  description: "Designer",
                  leading: <UI.Avatar name={person} size="sm" />,
                  trailing: (
                    <UI.Button
                      variant="secondary"
                      size="sm"
                      aria-label={`Invite ${person}`}
                    >
                      Invite
                    </UI.Button>
                  ),
                }),
              )}
            />
          </UI.EmptyState>
        </UI.Stack>
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
        <UI.Stack gap="xl">
          <UI.PageHeading
            title="Projects"
            description="Your team’s active projects."
            actions={<UI.Button>New project</UI.Button>}
          />
          <UI.PageHeading
            title="Back End Developer"
            headingLevel={2}
            avatar={<UI.Avatar name="Northwind" size="lg" shape="square" />}
            meta={[
              { label: "Full-time", icon: icons.clock },
              { label: "Remote", icon: icons.inbox },
              { label: "Closes 9 January 2027", icon: icons.calendar },
            ]}
            actions={
              <>
                <UI.Button variant="secondary">Edit</UI.Button>
                <UI.Button>Publish</UI.Button>
              </>
            }
          />
        </UI.Stack>
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
              icon: icons.inbox,
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
      example = (
        <UI.Stack gap="xl">
          {example}
          <UI.MetricGroup
            label="Last 30 days"
            variant="cards"
            items={[
              {
                label: "Total subscribers",
                value: "71,897",
                previous: "70,946",
                change: "12%",
                trend: "up",
                tone: "success",
              },
              {
                label: "Avg. open rate",
                value: "58.16%",
                previous: "56.14%",
                change: "2.02%",
                trend: "up",
                tone: "success",
              },
              {
                label: "Avg. click rate",
                value: "24.57%",
                previous: "28.62%",
                change: "4.05%",
                trend: "down",
                tone: "danger",
              },
            ]}
          />
        </UI.Stack>
      );
      break;
    case "DataTable":
      example = (
        <UI.Stack gap="xl">
          <UI.DataTable
            caption="Projects"
            rowLabel={(row) => row.name}
            rowHref={(row) => `#project-${row.id}`}
            defaultSort={{ key: "name", direction: "ascending" }}
            selectedIds={selectedRows}
            onSelectionChange={setSelectedRows}
            striped
            columns={[
              {
                key: "name",
                label: "Name",
                render: (row) => row.name,
                sortable: true,
              },
              {
                key: "status",
                label: "Status",
                render: (row) => <UI.Badge>{row.status}</UI.Badge>,
              },
              {
                key: "owner",
                label: "Owner",
                render: (row) => row.owner,
                truncate: true,
                width: "30%",
              },
              {
                key: "requests",
                label: "Requests",
                align: "right",
                render: (row) => row.requests.toLocaleString("en-GB"),
                sortable: true,
              },
              {
                key: "actions",
                label: "Actions",
                render: (row) => (
                  <UI.Button onClick={() => setPage(2)}>
                    Edit {row.name}
                  </UI.Button>
                ),
              },
            ]}
            rows={[
              {
                id: "northwind",
                name: "Northwind",
                status: "Active",
                owner: "Platform team with a deliberately long owner name",
                requests: 12840,
              },
              {
                id: "acme",
                name: "Acme",
                status: "Paused",
                owner: "Growth",
                requests: 920,
              },
              {
                id: "zephyr",
                name: "Zephyr",
                status: "Active",
                owner: "Data",
                requests: 4310,
              },
            ]}
            footer={
              <UI.Pagination page={page} pageCount={3} onChange={setPage} />
            }
          />
          <UI.DataTable
            caption="People by office"
            rowLabel={(row) => row.name}
            groupBy={(row) => row.office}
            defaultSort={{ key: "name", direction: "ascending" }}
            selectedIds={selectedPeople}
            onSelectionChange={setSelectedPeople}
            columns={[
              {
                key: "name",
                label: "Name",
                render: (row) => row.name,
                sortable: true,
              },
              { key: "title", label: "Title", render: (row) => row.title },
              { key: "email", label: "Email", render: (row) => row.email },
              { key: "role", label: "Role", render: (row) => row.role },
            ]}
            rows={[
              {
                id: "lindsay",
                name: "Lindsay Walton",
                title: "Front-end developer",
                email: "lindsay@example.com",
                role: "Member",
                office: "Edinburgh",
              },
              {
                id: "tom",
                name: "Tom Cook",
                title: "Director of product",
                email: "tom@example.com",
                role: "Admin",
                office: "London",
              },
              {
                id: "courtney",
                name: "Courtney Henry",
                title: "Designer",
                email: "courtney@example.com",
                role: "Admin",
                office: "Edinburgh",
              },
              {
                id: "whitney",
                name: "Whitney Francis",
                title: "Copywriter",
                email: "whitney@example.com",
                role: "Member",
                office: "London",
              },
              {
                id: "leonard",
                name: "Leonard Krasner",
                title: "Senior designer",
                email: "leonard@example.com",
                role: "Owner",
                office: "London",
              },
            ]}
          />
        </UI.Stack>
      );
      break;
    case "Table":
      example = (
        <UI.Stack gap="xl">
          <UI.Table
            caption="Plan limits"
            captionVisible
            columns={[
              { key: "plan", label: "Plan" },
              { key: "conversations", label: "Conversations", align: "right" },
              { key: "support", label: "Support" },
            ]}
            rows={[
              { plan: "Insider", conversations: "100", support: "Community" },
              { plan: "Starter", conversations: "500", support: "Email" },
              { plan: "Pro", conversations: "2,000", support: "Priority" },
            ]}
          />
          <UI.Table
            caption="People by office"
            columns={[
              { key: "name", label: "Name" },
              { key: "title", label: "Title" },
              { key: "role", label: "Role" },
            ]}
            groups={[
              {
                label: "Edinburgh",
                rows: [
                  {
                    name: "Lindsay Walton",
                    title: "Front-end developer",
                    role: "Member",
                  },
                  { name: "Courtney Henry", title: "Designer", role: "Admin" },
                ],
              },
              {
                label: "London",
                rows: [
                  {
                    name: "Tom Cook",
                    title: "Director of product",
                    role: "Admin",
                  },
                  {
                    name: "Whitney Francis",
                    title: "Copywriter",
                    role: "Member",
                  },
                ],
              },
            ]}
          />
        </UI.Stack>
      );
      break;
    case "Pagination":
      example = (
        <UI.Stack gap="xl">
          <UI.Pagination page={page} pageCount={5} onChange={setPage} />
          <UI.Pagination
            label="Results pages"
            numbered
            page={resultsPage}
            pageCount={12}
            onChange={setResultsPage}
            summary={{
              from: (resultsPage - 1) * 10 + 1,
              to: Math.min(resultsPage * 10, 114),
              total: 114,
            }}
          />
        </UI.Stack>
      );
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
            {
              id: "2",
              title: "Ana Kovač commented",
              time: "1 hour ago",
              actor: <UI.Avatar name="Ana Kovač" size="sm" />,
              body: "Can we move the release to Thursday? Support is short-staffed on Friday.",
            },
          ]}
        />
      );
      break;
    case "MarketingHeader":
      example = (
        <UI.MarketingHeader
          brand="Northwind"
          id="site-header"
          logo={
            <img
              alt=""
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' rx='3' fill='currentColor'/%3E%3C/svg%3E"
            />
          }
          links={[
            {
              label: "Product",
              items: [
                {
                  label: "Analytics",
                  href: "#analytics",
                  description: "See where your visitors come from.",
                  icon: icons.clock,
                },
                {
                  label: "Inbox",
                  href: "#inbox",
                  description: "Every conversation in one place.",
                  icon: icons.inbox,
                },
                {
                  label: "Scheduling",
                  href: "#scheduling",
                  description: "Let customers book time with you.",
                  icon: icons.calendar,
                },
              ],
              footer: [
                { label: "Watch demo", href: "#demo" },
                { label: "Contact sales", href: "#sales" },
              ],
            },
            { label: "Features", href: "#features" },
            { label: "Pricing", href: "#pricing" },
          ]}
          action={action}
        />
      );
      break;
    case "Hero":
      example = (
        <>
          <UI.Hero
            title="Build with confidence."
            description="One shared foundation for your next product."
            actions={[action]}
          />
          <UI.Hero
            headingLevel={2}
            eyebrow="New in spring"
            title="Plan trips the whole team can see."
            description="Itineraries, bookings and budgets stay in one shared place."
            actions={[action, { label: "Take the tour", href: "#tour" }]}
            background={
              <img
                alt=""
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 600' preserveAspectRatio='xMidYMid slice'%3E%3Cdefs%3E%3ClinearGradient id='s' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23f6d365'/%3E%3Cstop offset='1' stop-color='%23fda085'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='600' fill='url(%23s)'/%3E%3Ccircle cx='880' cy='190' r='90' fill='%23fff3c4'/%3E%3Cpath d='M0 420 L220 250 L420 400 L640 220 L900 430 L1200 280 L1200 600 L0 600Z' fill='%234b6cb7'/%3E%3Cpath d='M0 500 L300 380 L560 500 L820 360 L1200 520 L1200 600 L0 600Z' fill='%23243b55'/%3E%3C/svg%3E"
              />
            }
          />
        </>
      );
      break;
    case "FeatureGrid":
      example = (
        <>
          <UI.FeatureGrid
            title="Made to work together"
            items={items.map((item, i) => ({
              ...item,
              icon: [icons.calendar, icons.inbox][i],
            }))}
          />
          <UI.FeatureGrid
            title="Numbered for sequences"
            marker="number"
            tone="muted"
            items={items}
          />
        </>
      );
      break;
    case "FeatureSection":
      example = (
        <UI.FeatureSection
          eyebrow="Theming"
          title="Your brand, centrally managed"
          description="Choose a theme in one place."
          details={<UI.CheckList items={["Light and dark", "Brand colours"]} />}
        >
          {controls}
        </UI.FeatureSection>
      );
      break;
    case "Testimonial":
      example = (
        <>
          <UI.Testimonial
            quote="The example shows how a testimonial appears."
            name="Example customer"
            role="Illustrative content"
          />
          <UI.Testimonial
            quote="We answered twice as many customers in the first month."
            name="Lindsay Walton"
            role="Owner, Wheelhouse Bikes"
            logo={
              <img
                alt="Wheelhouse Bikes"
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 28'%3E%3Ccircle cx='14' cy='14' r='11' fill='none' stroke='%238e8e93' stroke-width='3'/%3E%3Crect x='32' y='10' width='80' height='8' rx='4' fill='%238e8e93'/%3E%3C/svg%3E"
              />
            }
            avatar={<UI.Avatar name="Lindsay Walton" />}
          />
        </>
      );
      break;
    case "LogoCloud":
      example = (
        <>
          <UI.LogoCloud
            label="Example companies"
            items={[
              { name: "Northwind" },
              { name: "Contoso" },
              { name: "Fabrikam" },
            ]}
          />
          <UI.LogoCloud
            label="Teams on the grid"
            layout="grid"
            items={[
              { name: "Tailspin" },
              { name: "Litware" },
              { name: "Proseware" },
              { name: "Adatum" },
            ]}
          />
          <UI.LogoCloud
            label="Customer logos"
            layout="split"
            title="Trusted by teams that ship every day"
            description="From two-person studios to global support desks."
            actions={[{ label: "Read case studies", href: "#cases" }]}
            items={[
              { name: "Woodgrove" },
              { name: "Wingtip" },
              { name: "Relecloud" },
              { name: "Lucerne" },
            ]}
          />
        </>
      );
      break;
    case "Pricing":
      example = (
        <>
          <UI.Pricing
            title="Example plans"
            description="Illustrative pricing, not a purchase."
            plans={[
              {
                id: "basic",
                name: "Basic",
                description: "Personal projects",
                monthly: "$0",
                annual: "$0",
                unit: "/month",
                annualUnit: "/year",
                features: ["One project"],
                action,
              },
              {
                id: "team",
                name: "Team",
                description: "Small teams",
                monthly: "$20",
                annual: "$16",
                unit: "/month",
                annualUnit: "/year",
                features: ["Unlimited projects"],
                action,
                featured: true,
              },
            ]}
          />
          <UI.Pricing
            title="One price, everything included"
            description="A single plan with no tiers to compare."
            layout="detailed"
            plans={[
              {
                id: "lifetime",
                name: "Lifetime membership",
                description: "Pay once and keep every update.",
                monthly: "$349",
                unit: "One-time payment, USD",
                features: [
                  "Private forum access",
                  "Member resources",
                  "Entry to annual conference",
                  "Official member t-shirt",
                ],
                action: { label: "Get access", href: "#access" },
              },
            ]}
          />
        </>
      );
      break;
    case "FAQ":
      example = (
        <>
          <UI.FAQ
            title="Questions"
            items={[
              {
                question: "Is the kit open source?",
                answer: "Yes. Mortar is MIT licensed.",
              },
            ]}
          />
          <UI.FAQ
            title="Everything else"
            description="Answers stay visible so they can be scanned."
            layout="grid"
            items={[
              {
                question: "Does it support dark mode?",
                answer: "Yes. Every component reads the semantic tokens.",
              },
              {
                question: "Can I change the brand colour?",
                answer: "Set the accent token once in your theme.",
              },
              {
                question: "Which frameworks are supported?",
                answer: "React 19 with Tailwind CSS 4.",
              },
            ]}
          />
        </>
      );
      break;
    case "CallToAction":
      example = (
        <>
          <UI.CallToAction
            title="Start your next project"
            description="Use one shared foundation."
            actions={[action]}
          />
          <UI.CallToAction
            title="See every conversation in one place"
            description="The inbox groups chats, bookings and follow-ups by customer."
            actions={[action, { label: "Book a demo", href: "#demo" }]}
            media={
              <UI.MockWindow label="Northwind inbox">
                <UI.MetricGroup
                  label="Today"
                  items={[
                    { label: "Open chats", value: "12", icon: icons.inbox },
                    { label: "Bookings", value: "5", icon: icons.calendar },
                  ]}
                />
              </UI.MockWindow>
            }
          />
        </>
      );
      break;
    case "Footer":
      example = (
        <UI.Footer
          brand="Northwind"
          description="Example product"
          note="Weekdays 9 to 5"
          columns={[{ label: "Product", items: [action] }]}
          copyright="© Example company"
          social={[
            { label: "Northwind website", href: "#website", icon: icons.globe },
            { label: "Northwind on GitHub", href: "#github", icon: icons.code },
            { label: "Email Northwind", href: "#email", icon: icons.mail },
          ]}
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
