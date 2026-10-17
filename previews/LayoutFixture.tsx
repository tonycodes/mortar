import { StateFixture } from "./StateFixture.js";
import { useState, type ReactNode } from "react";
import * as UI from "../src/index.js";

/** Fixtures for Divider, Card, DescriptionList, ButtonGroup and Calendar. Kept apart to keep the diff reviewable. */

const icon = (path: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d={path} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function LayoutCase({ name }: { name: string }) {
  const [last, setLast] = useState("none");
  const [date, setDate] = useState<string | null>("2026-01-12");
  const scenario = new URLSearchParams(location.search).get("state");
  if (scenario) return <StateFixture name={name} state={scenario} />;
  let example: ReactNode;
  switch (name) {
    case "Divider":
      example = (
        <UI.Stack gap="none">
          <UI.Text>Account details</UI.Text>
          <UI.Divider />
          <UI.Text>Notification preferences</UI.Text>
          <UI.Divider soft spacing="sm" />
          <UI.Text tone="secondary">
            A soft divider separates related rows.
          </UI.Text>
          <UI.Divider label="Or continue with" />
          <UI.Button variant="secondary">Single sign-on</UI.Button>
        </UI.Stack>
      );
      break;
    case "Card":
      example = (
        <UI.Stack gap="lg">
          <UI.Card
            as="section"
            title="Billing"
            description="Your plan renews on 1 November."
            actions={<UI.Button variant="secondary">Change plan</UI.Button>}
            footer="Invoices are emailed to billing@example.com"
          >
            <UI.Text>
              Team plan, 12 seats. Usage resets at the start of each billing
              period.
            </UI.Text>
          </UI.Card>
          <UI.Card tone="sunken" padding="compact">
            <UI.Text tone="secondary">
              A sunken, compact card works as a well for secondary content.
            </UI.Text>
          </UI.Card>
        </UI.Stack>
      );
      break;
    case "DescriptionList":
      example = (
        <UI.Stack gap="xl">
          <UI.DescriptionList
            title="Applicant information"
            description="Personal details and application."
            items={[
              { term: "Full name", details: "Margot Foster" },
              {
                term: "Application for",
                details: "Backend developer",
                action: (
                  <UI.ActionLink label="Update" href="#role" variant="ghost" />
                ),
              },
              { term: "Email address", details: "margot@example.com" },
              { term: "Salary expectation", details: "$120,000" },
              {
                term: "About",
                details:
                  "Fugiat ipsum ipsum deserunt culpa aute sint do nostrud anim incididunt cillum culpa consequat.",
              },
            ]}
          />
          <UI.Card title="Deployment" headingLevel={2}>
            <UI.DescriptionList
              layout="stacked"
              items={[
                { term: "Region", details: "eu-west-2" },
                {
                  term: "Status",
                  details: <UI.Badge tone="success">Live</UI.Badge>,
                },
              ]}
            />
          </UI.Card>
        </UI.Stack>
      );
      break;
    case "ButtonGroup":
      example = (
        <UI.Stack gap="lg">
          <UI.ButtonGroup
            label="Record actions"
            items={[
              { label: "Copy", onClick: () => setLast("Copy") },
              { label: "Duplicate", onClick: () => setLast("Duplicate") },
              { label: "Archive", disabled: true },
            ]}
          />
          <UI.ButtonGroup
            label="Paging"
            items={[
              {
                label: "Previous",
                iconOnly: true,
                icon: icon("M15 18l-6-6 6-6"),
                onClick: () => setLast("Previous"),
              },
              {
                label: "Next",
                iconOnly: true,
                icon: icon("M9 18l6-6-6-6"),
                onClick: () => setLast("Next"),
              },
            ]}
          />
          <UI.ButtonGroup
            label="Resources"
            items={[
              { label: "Docs", href: "#docs" },
              { label: "Changelog", href: "#changelog" },
            ]}
          />
          <output aria-label="Last action">{last}</output>
        </UI.Stack>
      );
      break;
    case "Calendar":
      example = (
        <UI.Stack gap="lg">
          <UI.Calendar
            label="Choose a date"
            locale="en-US"
            weekStartsOn={1}
            today="2026-01-12"
            value={date}
            onChange={setDate}
            min="2025-12-01"
            max="2026-03-31"
            disabledDates={["2026-01-15"]}
            events={[
              {
                id: "review",
                date: "2026-01-12",
                title: "Design review",
                time: "10:00",
              },
              {
                id: "sync",
                date: "2026-01-12",
                title: "Team sync",
                time: "14:00",
              },
              { id: "release", date: "2026-01-21", title: "Release planning" },
            ]}
          />
          <output aria-label="Selected date">{date ?? "none"}</output>
        </UI.Stack>
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
