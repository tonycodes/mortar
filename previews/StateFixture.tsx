import { useState } from "react";
import * as UI from "../src/index.js";

export function StateFixture({ name, state }: { name: string; state: string }) {
  const [count, setCount] = useState(0);
  const [appearance, setAppearance] = useState<"light" | "dark" | "system">(
    "light",
  );
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
    case "CommentComposer":
      content = (
        <UI.CommentComposer label={label} error={error} onSubmit={changed} />
      );
      break;
    case "OrderHistory":
      content = <UI.OrderHistory orders={[]} empty={{ title: "No records" }} />;
      break;
    case "ShoppingCart":
      content = (
        <UI.ShoppingCart
          items={[]}
          empty={{ title: "No records" }}
          onQuantityChange={changed}
          onRemove={changed}
        />
      );
      break;
    case "Fieldset":
      content = (
        <UI.Fieldset legend={label} disabled={disabled}>
          <UI.Input label="Street address" onChange={changed} />
        </UI.Fieldset>
      );
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
    case "CallToAction":
      content = (
        <UI.CallToAction
          title="Start your next project"
          description="Use one shared foundation."
          actions={[{ label: "Start", href: "#start" }]}
          tone={state === "inverse" ? "inverse" : "surface"}
        />
      );
      break;
    case "Pricing":
      content =
        state === "coming-soon" ? (
          <UI.Pricing
            title="Example plans"
            description="Illustrative pricing, not a purchase."
            plans={[
              {
                id: "basic",
                name: "Basic",
                description: "Personal projects",
                monthly: "$0",
                features: ["One project"],
                action: { label: "Choose", href: "#choose" },
                availability: "coming-soon",
                availabilityLabel: "Coming soon",
              },
            ]}
          />
        ) : (
          <UI.Pricing
            title="Example plans"
            description="Illustrative pricing, not a purchase."
            tone={state === "inverse" ? "inverse" : "surface"}
            plans={[
              {
                id: "team",
                name: "Team",
                description: "Small teams",
                monthly: "$20",
                annual: "$16",
                unit: "/month",
                annualUnit: "/year",
                features: ["Unlimited projects"],
                action: { label: "Choose", href: "#choose" },
                featured: true,
              },
            ]}
          />
        );
      break;
    case "MarketingHeader":
      content = (
        <UI.MarketingHeader
          brand="Northwind"
          links={[
            { label: "Pricing", href: "#pricing" },
            { label: "Plans", href: "#pricing" },
          ]}
        />
      );
      break;
    case "Footer":
      content = (
        <UI.Footer
          brand="Northwind"
          description="Example product"
          headingLevel={3}
          columns={[
            {
              title: "Product",
              links: [{ label: "Pricing", href: "#pricing" }],
            },
          ]}
          copyright="© Example company"
        />
      );
      break;
    case "ThemeProvider":
      content = (
        <UI.Stack direction="row">
          <UI.ThemeProvider scope="container" appearance="light">
            <UI.Text>Light</UI.Text>
          </UI.ThemeProvider>
          <UI.ThemeProvider scope="container" appearance="dark">
            <UI.Text>Dark</UI.Text>
          </UI.ThemeProvider>
        </UI.Stack>
      );
      break;
    case "AppearanceControl":
      content = (
        <UI.AppearanceControl value={appearance} onChange={setAppearance} />
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
