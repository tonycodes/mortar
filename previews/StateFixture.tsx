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
