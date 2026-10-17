import * as UI from "../src/index.js";
import { icons } from "../previews/CompositionFixture.js";

/** Whole-page recipes: how components compose into a page with rhythm, not one repeated section. */
export function SaasLandingRecipe() {
  const embed = `<script src="https://cdn.example.com/widget.js"
  data-key="pk_live_123" async></script>`;
  return (
    <>
      <UI.MarketingHeader
        brand="Northwind Chat"
        links={[
          { label: "Features", href: "#features" },
          { label: "Pricing", href: "#pricing" },
          { label: "Help", href: "#faq" },
        ]}
        action={{ label: "Start free", href: "#signin" }}
        controls={<UI.AppearanceControl />}
      />
      <main>
        <UI.Hero
          align="split"
          eyebrow="Open beta — free to join"
          title="AI chat and booking for your website"
          description="An assistant trained on your business that answers questions, books appointments and captures leads."
          actions={[
            { label: "Start free", href: "#signin" },
            { label: "See pricing", href: "#pricing" },
          ]}
        >
          <UI.ChatPreview
            title="Northwind Assistant"
            status="Typically replies instantly"
            messages={[
              {
                from: "assistant",
                content:
                  "Hi! I can answer questions or book you a consultation.",
              },
              {
                from: "user",
                content: "I'd like a consultation next week",
              },
              {
                from: "assistant",
                content: (
                  <>
                    These slots are free next week:
                    <ul>
                      <li>Mon 10:00</li>
                      <li>Tue 14:00</li>
                      <li>Wed 11:00</li>
                    </ul>
                  </>
                ),
              },
            ]}
            typing
            suggestions={["Mon 10:00", "Tue 14:00", "Wed 11:00"]}
          />
        </UI.Hero>
        <UI.LogoCloud
          label="Trusted by small teams"
          items={[
            { name: "Harbour Dental" },
            { name: "Oak & Ivy" },
            { name: "Brightside Legal" },
            { name: "Pine Studio" },
          ]}
        />
        <UI.FeatureGrid
          id="features"
          eyebrow="Tools"
          title="Everything the assistant needs"
          description="Configure once; the assistant handles the conversation."
          items={[
            {
              title: "Calendar booking",
              description:
                "Checks availability and books into Google or Apple Calendar.",
              icon: icons.calendar,
            },
            {
              title: "Lead capture",
              description: "Contact details and a summary sent to your inbox.",
              icon: icons.inbox,
            },
            {
              title: "Working hours",
              description: "Per-day schedules with breaks and buffers.",
              icon: icons.clock,
            },
          ]}
        />
        <UI.FeatureSection
          tone="muted"
          eyebrow="Booking"
          title="Appointments without the back-and-forth"
          description="The assistant reads live availability and confirms bookings directly."
          details={
            <UI.CheckList
              items={[
                "Syncs with Google Calendar and Apple iCloud",
                "Working hours with lunch breaks",
                "Confirmation emails with invites",
                "Buffer time between appointments",
              ]}
            />
          }
          framed={false}
        >
          <UI.MockWindow
            label="Calendar settings"
            address="app.northwind.example/calendar"
          >
            <UI.Stack gap="sm">
              <UI.Stack direction="row" justify="between">
                <UI.Text weight="semibold">Google Calendar</UI.Text>
                <UI.Badge tone="success">Connected</UI.Badge>
              </UI.Stack>
              <UI.StackedList
                label="Availability"
                items={[
                  {
                    id: "hours",
                    title: "Monday – Friday",
                    description: "09:00 – 17:00",
                  },
                  {
                    id: "lunch",
                    title: "Lunch break",
                    description: "12:00 – 13:00 · blocked",
                  },
                  {
                    id: "length",
                    title: "Appointment length",
                    description: "30 minutes + 15 minute buffer",
                  },
                ]}
              />
            </UI.Stack>
          </UI.MockWindow>
        </UI.FeatureSection>
        <UI.ProcessSteps
          title="Live in under five minutes"
          items={[
            { title: "Sign up", description: "Get the free plan instantly." },
            {
              title: "Create a widget",
              description: "Set greeting, tone and colours.",
            },
            {
              title: "Add knowledge",
              description: "Upload documents or index pages.",
            },
            {
              title: "Go live",
              description: "Paste one script tag into your site.",
            },
          ]}
        />
        <UI.FeatureSection
          reverse
          eyebrow="Install"
          title="One script tag"
          description="Works on any site builder. Keys are locked to your domains."
          framed={false}
        >
          <UI.CodeBlock label="index.html" code={embed} />
        </UI.FeatureSection>
        <section id="pricing">
          <UI.Pricing
            title="Free during the open beta"
            description="Every new account gets the Insider plan at no cost."
            plans={[
              {
                id: "insider",
                name: "Insider",
                description: "Open beta. No card required.",
                monthly: "Free",
                features: [
                  "100 conversations/month",
                  "Unlimited widgets",
                  "Calendar booking",
                ],
                action: { label: "Start free", href: "#signin" },
                featured: true,
              },
              {
                id: "pro",
                name: "Pro",
                description: "Coming after the beta.",
                monthly: "£39",
                unit: "/mo",
                features: ["2,000 conversations/month", "Priority support"],
                action: { label: "Join the waitlist", href: "#signin" },
              },
            ]}
          />
        </section>
        <UI.Section id="signin" tone="muted" align="center">
          <UI.SignInPanel
            headingLevel={2}
            title="Create your account"
            description="Free Insider plan, no card required."
            providers={[
              {
                id: "github",
                label: "Continue with GitHub",
                onSelect: () => undefined,
              },
            ]}
            email={{ onSubmit: () => undefined }}
            footer="By continuing you agree to the terms of service."
          />
        </UI.Section>
        <UI.CallToAction
          title="Put an assistant on your site today"
          description="100 free conversations a month during the beta."
          actions={[{ label: "Start free", href: "#signin" }]}
        />
      </main>
      <UI.Footer
        brand="Northwind Chat"
        description="AI chat and booking for small businesses."
        columns={[
          {
            title: "Product",
            links: [
              { label: "Features", href: "#features" },
              { label: "Pricing", href: "#pricing" },
            ],
          },
          {
            title: "Legal",
            links: [
              { label: "Terms", href: "#terms" },
              { label: "Privacy", href: "#privacy" },
            ],
          },
        ]}
        copyright="© Northwind Chat"
      />
    </>
  );
}

/** Multi-column application page: sidebar, main column and a secondary column. */
export function ProjectWorkspaceRecipe() {
  return (
    <UI.AppShell
      brand="Northwind"
      workspace="Billing redesign"
      navigation={[
        { label: "Overview", href: "#overview", current: true },
        { label: "Tasks", href: "#tasks", count: "12" },
        { label: "Files", href: "#files" },
      ]}
      asideLabel="Schedule and activity"
      aside={
        <UI.Stack gap="xl">
          <UI.Calendar
            today="2026-10-17"
            selected="2026-10-20"
            events={[
              {
                id: "1",
                date: "2026-10-20",
                title: "Customer call",
                time: "10:00",
              },
              {
                id: "2",
                date: "2026-10-29",
                title: "Board update",
                time: "11:00",
              },
            ]}
          />
          <UI.ActivityFeed
            label="Recent activity"
            items={[
              {
                id: "1",
                title: "Ana approved the copy",
                description: "Confirmation step, version 3.",
                time: "2 hours ago",
                tone: "success",
              },
              {
                id: "2",
                title: "Tom uploaded designs",
                description: "Checkout flow, mobile.",
                time: "Yesterday",
              },
            ]}
          />
        </UI.Stack>
      }
    >
      <UI.Stack gap="xl">
        <UI.PageHeading
          title="Billing redesign"
          description="Due 30 October · 12 open tasks"
          actions={<UI.Button>New task</UI.Button>}
        />
        <UI.SectionHeading title="Team" headingLevel={2} />
        <UI.GridList
          label="Project team"
          items={[
            {
              id: "ana",
              title: "Ana Kovač",
              description: "Engineering",
              media: <UI.Avatar name="Ana Kovač" />,
            },
            {
              id: "tom",
              title: "Tom Cook",
              description: "Design",
              media: <UI.Avatar name="Tom Cook" />,
            },
            {
              id: "lw",
              title: "Lindsay Walton",
              description: "Support",
              media: <UI.Avatar name="Lindsay Walton" />,
            },
          ]}
        />
        <UI.DescriptionList
          title="Details"
          items={[
            { term: "Owner", details: "Ana Kovač" },
            {
              term: "Status",
              details: <UI.Badge tone="warning">At risk</UI.Badge>,
            },
            { term: "Budget", details: "£18,000" },
          ]}
        />
      </UI.Stack>
    </UI.AppShell>
  );
}
