import { StateFixture } from "./StateFixture.js";
import { useState, type ReactNode } from "react";
import * as UI from "../src/index.js";

/** Fixtures for navigation and form-structure components. Kept apart to keep the diff reviewable. */

const icon = (path: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d={path} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const icons = {
  home: icon("M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"),
  team: icon("M16 19v-1a4 4 0 0 0-8 0v1M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"),
  folder: icon(
    "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  ),
  calendar: icon("M7 3v3M17 3v3M4 9h16M5 5h14v15H5z"),
};

const meetings: UI.CalendarEvent[] = [
  { id: "1", date: "2026-10-05", title: "Sprint planning", time: "09:30" },
  { id: "2", date: "2026-10-14", title: "Design review", time: "14:00" },
  { id: "3", date: "2026-10-20", title: "Customer call", time: "10:00" },
  { id: "4", date: "2026-10-20", title: "Team retro", time: "15:00" },
  { id: "5", date: "2026-10-20", title: "Release notes" },
  { id: "6", date: "2026-10-29", title: "Board update", time: "11:00" },
];

export function StructureCase({ name }: { name: string }) {
  const [dismissed, setDismissed] = useState(false);
  const [day, setDay] = useState("2026-10-20");
  const scenario = new URLSearchParams(location.search).get("state");
  if (scenario) return <StateFixture name={name} state={scenario} />;
  let example: ReactNode;
  switch (name) {
    case "Breadcrumbs":
      example = (
        <UI.Stack gap="lg">
          <UI.Breadcrumbs
            items={[
              { label: "Projects", href: "#projects" },
              { label: "Northwind", href: "#northwind" },
              { label: "Settings" },
            ]}
          />
          <UI.Breadcrumbs
            label="Folder path"
            separator="chevron"
            items={[
              { label: "Documents", href: "#documents" },
              { label: "Contracts", href: "#contracts" },
              { label: "2026" },
            ]}
          />
        </UI.Stack>
      );
      break;
    case "Navbar":
      example = (
        <UI.Navbar
          brand="Northwind"
          homeHref="#home"
          items={[
            { label: "Dashboard", href: "#dashboard", current: true },
            { label: "Team", href: "#team" },
            { label: "Projects", href: "#projects" },
            { label: "Calendar", href: "#calendar" },
          ]}
          actions={
            <>
              <UI.Button variant="secondary">Invite</UI.Button>
              <UI.Avatar name="Ana Kovač" size="sm" />
            </>
          }
        />
      );
      break;
    case "Sidebar":
      example = (
        <div className="max-w-xs">
          <UI.Sidebar
            brand="Northwind"
            workspace="Acme workspace"
            homeHref="#home"
            navigation={[
              {
                label: "Dashboard",
                href: "#dashboard",
                current: true,
                icon: icons.home,
              },
              { label: "Team", href: "#team", icon: icons.team },
              {
                label: "Projects",
                href: "#projects",
                count: "12",
                icon: icons.folder,
              },
              { label: "Calendar", href: "#calendar", icon: icons.calendar },
            ]}
            sections={[
              {
                label: "Your teams",
                items: [
                  { label: "Engineering", href: "#engineering" },
                  { label: "Design", href: "#design" },
                ],
              },
            ]}
            footer={<UI.Avatar name="Ana Kovač" size="sm" />}
          />
        </div>
      );
      break;
    case "Fieldset":
      example = (
        <div className="max-w-md">
          <UI.Fieldset
            legend="Shipping address"
            description="We only ship to the countries listed."
          >
            <UI.Input label="Street address" />
            <UI.Input label="City" />
            <UI.Select
              label="Country"
              options={[
                { value: "gb", label: "United Kingdom" },
                { value: "ie", label: "Ireland" },
              ]}
            />
          </UI.Fieldset>
        </div>
      );
      break;
    case "ActionPanel":
      example = (
        <UI.Stack gap="lg">
          <UI.ActionPanel
            title="Manage subscription"
            description="Change your plan, update billing details or download invoices."
            action={<UI.Button variant="secondary">Change plan</UI.Button>}
          />
          <UI.ActionPanel
            title="Delete account"
            description="Permanently remove your account and all of its data. This cannot be undone."
            tone="danger"
            action={<UI.Button variant="danger">Delete account</UI.Button>}
          />
        </UI.Stack>
      );
      break;
    case "Banner":
      example = (
        <UI.Stack gap="lg">
          {dismissed ? (
            <UI.Button variant="secondary" onClick={() => setDismissed(false)}>
              Show announcement
            </UI.Button>
          ) : (
            <UI.Banner
              action={{ label: "Read the release notes", href: "#release" }}
              onDismiss={() => setDismissed(true)}
            >
              Mortar 1.0 is out with 92 components.
            </UI.Banner>
          )}
          <UI.Banner label="Maintenance notice" tone="neutral">
            Scheduled maintenance on Sunday from 02:00 to 03:00 UTC.
          </UI.Banner>
          <output aria-label="Banner state">
            {dismissed ? "dismissed" : "shown"}
          </output>
        </UI.Stack>
      );
      break;
    case "Calendar":
      example = (
        <UI.Stack gap="xl">
          <div className="max-w-sm">
            <UI.Calendar
              today="2026-10-17"
              selected={day}
              onSelect={setDay}
              events={meetings}
            />
            <output aria-label="Selected date">{day}</output>
          </div>
          <UI.Calendar
            today="2026-10-17"
            variant="full"
            month="2026-10"
            events={meetings}
          />
        </UI.Stack>
      );
      break;
    case "StackedShell":
      example = (
        <UI.StackedShell
          brand="Northwind"
          homeHref="#home"
          navigation={[
            { label: "Dashboard", href: "#dashboard", current: true },
            { label: "Team", href: "#team" },
            { label: "Projects", href: "#projects" },
            { label: "Calendar", href: "#calendar" },
          ]}
          actions={<UI.Avatar name="Ana Kovač" size="sm" />}
          header={
            <UI.PageHeading
              title="Dashboard"
              description="What changed across your projects this week."
            />
          }
        >
          <UI.MetricGroup
            label="This week"
            items={[
              { label: "Deploys", value: "48", change: "+6", tone: "success" },
              { label: "Incidents", value: "1", change: "−2", tone: "success" },
            ]}
          />
        </UI.StackedShell>
      );
      break;
    default:
      example = (
        <UI.Notice title="Unknown fixture">
          This component is not registered.
        </UI.Notice>
      );
  }
  return <>{example}</>;
}
