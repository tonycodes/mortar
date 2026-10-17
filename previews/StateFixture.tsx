import { useState } from "react";
import * as UI from "../src/index.js";

export function StateFixture({ name, state }: { name: string; state: string }) {
  const [count, setCount] = useState(0);
  const disabled = state === "disabled";
  const error = state === "error" ? "Check this value" : undefined;
  const label =
    state === "long"
      ? "A long descriptive field label that must wrap comfortably on a narrow mobile screen"
      : "Example field";
  const changed = () => setCount((n) => n + 1);
  let content;
  switch (name) {
    case "SignInPanel":
      content = (
        <UI.SignInPanel
          title="Sign in"
          headingLevel={2}
          email={{
            onSubmit: changed,
            status:
              state === "loading"
                ? "submitting"
                : state === "error"
                  ? "error"
                  : "success",
            message:
              state === "error" ? "Check this value" : "Check your inbox",
          }}
        />
      );
      break;
    case "Button":
      content = (
        <UI.Button
          disabled={disabled}
          loading={state === "loading"}
          onClick={changed}
        >
          Save
        </UI.Button>
      );
      break;
    case "Input":
      content = (
        <UI.Input
          label={label}
          disabled={disabled}
          error={error}
          onChange={changed}
        />
      );
      break;
    case "TextArea":
      content = (
        <UI.TextArea
          label={label}
          disabled={disabled}
          error={error}
          onChange={changed}
        />
      );
      break;
    case "Select":
      content = (
        <UI.Select
          label={label}
          disabled={disabled}
          error={error}
          onChange={changed}
          options={[
            { value: "a", label: "First" },
            { value: "b", label: "Second" },
          ]}
        />
      );
      break;
    case "Checkbox":
      content = (
        <UI.Checkbox label={label} disabled={disabled} onChange={changed} />
      );
      break;
    case "Switch":
      content = (
        <UI.Switch label={label} disabled={disabled} onChange={changed} />
      );
      break;
    case "DataTable":
      content = (
        <UI.DataTable
          caption="State example"
          columns={[
            {
              key: "name",
              label: "Name",
              render: (row: { id: string; name: string }) => row.name,
            },
          ]}
          rows={[]}
          rowLabel={(row) => row.name}
          loading={state === "loading"}
          error={error}
        />
      );
      break;
    case "Listbox":
    case "Combobox": {
      const Control = name === "Listbox" ? UI.Listbox : UI.Combobox;
      content = (
        <Control
          label={label}
          disabled={disabled}
          error={error}
          value={null}
          onChange={changed}
          options={[
            { value: "a", label: "First" },
            { value: "b", label: "Second" },
          ]}
        />
      );
      break;
    }
    case "Fieldset":
      content = (
        <UI.Fieldset legend={label} disabled={disabled}>
          <UI.Input label="Street address" onChange={changed} />
        </UI.Fieldset>
      );
      break;
    case "Calendar":
      content = <CalendarState state={state} changed={changed} />;
      break;
    case "DescriptionList":
      content = (
        <UI.DescriptionList
          title={label}
          items={[
            { term: label, details: "x".repeat(120) },
            {
              term: "Contact",
              details:
                "a-very-long-unbroken-address@an-extremely-long-example-domain.example",
              action: (
                <UI.ActionLink label="Update" href="#contact" variant="ghost" />
              ),
            },
          ]}
        />
      );
      break;
    case "ConfirmDialog":
      content = (
        <UI.ConfirmDialog
          open
          onClose={() => {}}
          onConfirm={changed}
          title="Confirm change"
          description={
            state === "long"
              ? Array(20)
                  .fill("A meaningful explanation of this irreversible action.")
                  .join(" ")
              : "Please confirm."
          }
          confirmLabel="Confirm"
          loading={state === "loading"}
        />
      );
      break;
    default:
      throw new Error(`Unsupported state fixture ${name}/${state}`);
  }
  return (
    <div data-state={state}>
      {content}
      <output aria-label="Callback count">{count}</output>
    </div>
  );
}

// Calendar states plus the `unbounded` and `controlled` browser scenarios
// described in docs/plans/calendar.md.
function CalendarState({
  state,
  changed,
}: {
  state: string;
  changed: () => void;
}) {
  const [value, setValue] = useState<string | null>(
    state === "unbounded" ? "2026-01-31" : "2026-01-12",
  );
  const [month, setMonth] = useState("2026-01");
  const [requested, setRequested] = useState<string | null>(null);
  const [requests, setRequests] = useState(0);
  const january = {
    label: "Choose a date",
    locale: "en-US",
    weekStartsOn: 1 as const,
    today: "2026-01-12",
  };
  const events: UI.CalendarEvent[] = [
    { id: "review", date: "2026-01-12", title: "Design review", time: "10:00" },
    { id: "sync", date: "2026-01-12", title: "Team sync", time: "14:00" },
    { id: "release", date: "2026-01-21", title: "Release planning" },
  ];
  const selected = (
    <output aria-label="Selected date">{value ?? "none"}</output>
  );
  switch (state) {
    case "unbounded":
      return (
        <>
          <UI.Calendar
            {...january}
            weekStartsOn={0}
            value={value}
            onChange={setValue}
          />
          {selected}
        </>
      );
    case "controlled":
      return (
        <>
          <UI.Calendar
            {...january}
            value={value}
            onChange={setValue}
            month={month}
            onMonthChange={(next) => {
              setRequested(next);
              setRequests((n) => n + 1);
            }}
          />
          <output aria-label="Requested month">{requested ?? "none"}</output>
          <output aria-label="Month request count">{requests}</output>
          <UI.Button
            variant="secondary"
            onClick={() => requested && setMonth(requested)}
          >
            Show requested month
          </UI.Button>
          {selected}
        </>
      );
    case "long":
      return (
        <UI.Calendar
          {...january}
          value="2026-03-09"
          onChange={changed}
          events={[
            {
              id: "long",
              date: "2026-03-09",
              time: "09:30",
              title:
                "A long descriptive event title that must wrap comfortably on a narrow mobile screen without overflowing",
            },
            {
              id: "unbroken",
              date: "2026-03-09",
              title:
                "an-extremely-long-unbroken-event-reference-that-has-to-wrap.example",
            },
          ]}
        />
      );
    case "empty":
      return (
        <UI.Calendar
          {...january}
          value={value}
          onChange={changed}
          events={[]}
          emptyEventsLabel="No records"
        />
      );
    default:
      return (
        <UI.Calendar
          {...january}
          value={value}
          onChange={changed}
          disabled={state === "disabled"}
          min="2025-12-01"
          max="2026-03-31"
          disabledDates={["2026-01-15"]}
          events={events}
        />
      );
  }
}
