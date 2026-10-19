import { StateFixture } from "./StateFixture.js";
import { useState, type ReactNode } from "react";
import * as UI from "../src/index.js";

/** Fixtures for composition, showcase and sign-in components. Kept apart to keep the diff reviewable. */

const icon = (path: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d={path} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const icons = {
  calendar: icon("M7 3v3M17 3v3M4 9h16M5 5h14v15H5z"),
  inbox: icon("M4 13h4l2 3h4l2-3h4M5 5h14l1 8v6H4v-6z"),
  clock: icon("M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"),
  search: icon("M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4"),
  more: icon("M5 12h.01M12 12h.01M19 12h.01"),
  edit: icon("M4 20h4L19 9l-4-4L4 16zM14 6l4 4"),
  download: icon("M12 4v11M7 10l5 5 5-5M5 20h14"),
  globe: icon(
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18",
  ),
  code: icon("M8 8l-4 4 4 4M16 8l4 4-4 4"),
  mail: icon("M4 6h16v12H4zM4 7l8 6 8-6"),
};

export function CompositionCase({ name }: { name: string }) {
  const [selected, setSelected] = useState(false),
    [submitted, setSubmitted] = useState("");
  const scenario = new URLSearchParams(location.search).get("state");
  if (scenario) return <StateFixture name={name} state={scenario} />;
  const chat = (
    <UI.ChatPreview
      title="Northwind Assistant"
      status="Typically replies instantly"
      messages={[
        {
          from: "assistant",
          content: "Hi! I can answer questions or book a consultation.",
        },
        { from: "user", content: "Can I book something next week?" },
        {
          from: "assistant",
          content: (
            <>
              These slots are free:
              <ul>
                <li>Mon 10:00</li>
                <li>Tue 14:00</li>
              </ul>
            </>
          ),
        },
      ]}
      typing
      suggestions={["Mon 10:00", "Tue 14:00", "Something else"]}
    />
  );
  let example: ReactNode;
  switch (name) {
    case "Stack":
      example = (
        <UI.Stack gap="lg">
          <UI.Stack direction="row" gap="sm" wrap>
            <UI.Button>Primary</UI.Button>
            <UI.Button variant="secondary">Secondary</UI.Button>
          </UI.Stack>
          <UI.Stack gap="xs">
            <UI.Text weight="semibold">Compact group</UI.Text>
            <UI.Text color="muted">Related lines sit close together.</UI.Text>
          </UI.Stack>
        </UI.Stack>
      );
      break;
    case "Container":
      example = (
        <UI.Container size="md">
          <UI.Text color="secondary">
            A medium container keeps reading width comfortable on wide screens.
          </UI.Text>
        </UI.Container>
      );
      break;
    case "Text":
      example = (
        <UI.Stack gap="sm">
          <UI.Text size="lg" weight="semibold">
            Large semibold
          </UI.Text>
          <UI.Text>Default body copy.</UI.Text>
          <UI.Text color="secondary">Secondary supporting copy.</UI.Text>
          <UI.Text color="muted" size="sm">
            Muted small print.
          </UI.Text>
        </UI.Stack>
      );
      break;
    case "Section":
      example = (
        <>
          <UI.Section
            eyebrow="Muted band"
            title="Sections alternate rhythm"
            description="Use tones to separate consecutive sections."
            tone="muted"
          >
            <UI.CheckList items={["No wrapper markup", "No page overflow"]} />
          </UI.Section>
          <UI.Section
            title="Inverse band"
            description="Tokens flip locally, so components stay legible."
            tone="inverse"
            align="center"
          >
            <UI.Stack direction="row" justify="center">
              <UI.ActionLink label="Explore" href="#example" />
              <UI.CheckList items={["Included feature"]} />
            </UI.Stack>
          </UI.Section>
        </>
      );
      break;
    case "CheckList":
      example = (
        <UI.CheckList
          label="Included features"
          columns={2}
          items={[
            "Unlimited widgets",
            "Calendar booking",
            "Knowledge base training",
            "Email summaries",
          ]}
        />
      );
      break;
    case "MockWindow":
      example = (
        <UI.MockWindow label="Calendar settings" address="app.example.com">
          <UI.Stack gap="sm">
            <UI.Text weight="semibold">Working hours</UI.Text>
            <UI.Text color="muted">Monday – Friday · 09:00 – 17:00</UI.Text>
          </UI.Stack>
        </UI.MockWindow>
      );
      break;
    case "ChatPreview":
      example = chat;
      break;
    case "ProcessSteps":
      example = (
        <UI.ProcessSteps
          title="How it works"
          description="Live in under five minutes."
          items={[
            { title: "Sign up", description: "Create an account." },
            { title: "Configure", description: "Set tone and colours." },
            { title: "Train", description: "Add documents and pages." },
            { title: "Go live", description: "Paste one script tag." },
          ]}
        />
      );
      break;
    case "SignInPanel":
      example = (
        <UI.SignInPanel
          title="Sign in"
          description="Use your work account to continue."
          providers={[
            {
              id: "github",
              label: "Continue with GitHub",
              onSelect: () => setSelected(true),
            },
          ]}
          email={{ onSubmit: setSubmitted }}
          footer="By continuing you agree to the terms of service."
          aside={
            <UI.Stack gap="md">
              <UI.Text size="lg" weight="medium">
                “We answered twice as many customers in the first month.”
              </UI.Text>
              <UI.Text color="muted" size="sm">
                Lindsay Walton, Wheelhouse Bikes
              </UI.Text>
            </UI.Stack>
          }
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
      {name === "SignInPanel" && (
        <output aria-label="Submitted email">{submitted || "none"}</output>
      )}
    </div>
  );
}
