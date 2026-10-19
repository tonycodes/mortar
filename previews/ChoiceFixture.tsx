import { StateFixture } from "./StateFixture.js";
import { useState, type ReactNode } from "react";
import * as UI from "../src/index.js";

/** Fixtures for Listbox and Combobox. Kept apart to keep the diff reviewable. */

const people: UI.ChoiceOption[] = [
  { value: "wade", label: "Wade Cooper", description: "Engineering" },
  { value: "arlene", label: "Arlene Mccoy", description: "Design" },
  {
    value: "devon",
    label: "Devon Webb",
    description: "Support",
    disabled: true,
  },
  { value: "tom", label: "Tom Cook", description: "Engineering" },
  { value: "tanya", label: "Tanya Fox", description: "Marketing" },
  { value: "lindsay", label: "Lindsay Walton", description: "Product" },
].map((person) => ({
  ...person,
  leading: <UI.Avatar name={person.label} size="sm" />,
}));

export function ChoiceCase({ name }: { name: string }) {
  const [value, setValue] = useState<string | null>("wade");
  const [plain, setPlain] = useState<string | null>(null);
  const scenario = new URLSearchParams(location.search).get("state");
  if (scenario) return <StateFixture name={name} state={scenario} />;
  let example: ReactNode;
  switch (name) {
    case "Listbox":
      example = (
        <UI.Stack gap="lg">
          <UI.Listbox
            label="Assigned to"
            options={people}
            value={value}
            onChange={setValue}
            hint="Only people on this project are listed."
          />
          <UI.Listbox
            label="Region"
            placeholder="Choose a region"
            options={[
              { value: "eu", label: "Europe (London)" },
              { value: "us", label: "United States (Virginia)" },
              { value: "ap", label: "Asia Pacific (Sydney)" },
            ]}
            value={plain}
            onChange={setPlain}
          />
          <output aria-label="Selected value">{value ?? "none"}</output>
        </UI.Stack>
      );
      break;
    case "Combobox":
      example = (
        <UI.Stack gap="lg">
          <UI.Combobox
            label="Assigned to"
            options={people}
            value={value}
            onChange={setValue}
            hint="Only people on this project are listed."
          />
          <UI.Combobox
            label="Region"
            placeholder="Choose a region"
            options={[
              { value: "eu", label: "Europe (London)" },
              { value: "us", label: "United States (Virginia)" },
              { value: "ap", label: "Asia Pacific (Sydney)" },
            ]}
            value={plain}
            onChange={setPlain}
          />
          <output aria-label="Selected value">{value ?? "none"}</output>
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
  return <div className="max-w-sm">{example}</div>;
}
