import { useState, type ReactNode } from "react";
import {
  Field,
  Label,
  Description,
  Listbox as HeadlessListbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Combobox as HeadlessCombobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
} from "@headlessui/react";
import { Check, ChevronDown } from "./icons.js";

export interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
  /** Avatar, icon or status dot shown before the label. */
  leading?: ReactNode;
  disabled?: boolean;
}

interface ChoiceProps {
  label: string;
  options: ChoiceOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
}

function OptionContent({ option }: { option: ChoiceOption }) {
  return (
    <>
      {option.leading && (
        <span className="m-choice-leading" aria-hidden="true">
          {option.leading}
        </span>
      )}
      <span className="m-choice-text">
        <span>{option.label}</span>
        {option.description && <small>{option.description}</small>}
      </span>
      <Check className="m-choice-check" />
    </>
  );
}

function Message({ hint, error }: { hint?: string; error?: string }) {
  return error || hint ? (
    <Description className={error ? "m-error" : ""}>
      {error || hint}
    </Description>
  ) : null;
}

/** Styled single select for rich options (avatars, descriptions). Use Select for plain native choices. */
export function Listbox({
  label,
  options,
  value,
  onChange,
  placeholder = "Select…",
  hint,
  error,
  disabled = false,
}: ChoiceProps) {
  const selected = options.find((o) => o.value === value);
  return (
    <Field className="m-field" disabled={disabled}>
      <Label>{label}</Label>
      <HeadlessListbox value={value} onChange={onChange}>
        <ListboxButton
          className="m-choice-control"
          aria-invalid={error ? true : undefined}
        >
          {selected ? (
            <span className="m-choice-value">
              {selected.leading && (
                <span className="m-choice-leading" aria-hidden="true">
                  {selected.leading}
                </span>
              )}
              <span>{selected.label}</span>
            </span>
          ) : (
            <span className="m-placeholder">{placeholder}</span>
          )}
          <ChevronDown />
        </ListboxButton>
        <ListboxOptions anchor="bottom start" className="m-choice-options">
          {options.map((option) => (
            <ListboxOption
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className="m-choice-option"
            >
              <OptionContent option={option} />
            </ListboxOption>
          ))}
        </ListboxOptions>
      </HeadlessListbox>
      <Message hint={hint} error={error} />
    </Field>
  );
}

/** Searchable single select; filters options by label as the person types. */
export function Combobox({
  label,
  options,
  value,
  onChange,
  placeholder,
  hint,
  error,
  disabled = false,
  emptyLabel = "No matches",
}: ChoiceProps & { emptyLabel?: string }) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? options.filter((o) => o.label.toLowerCase().includes(needle))
    : options;
  const leading = query
    ? undefined
    : options.find((o) => o.value === value)?.leading;
  return (
    <Field className="m-field" disabled={disabled}>
      <Label>{label}</Label>
      <HeadlessCombobox
        value={value}
        onChange={onChange}
        onClose={() => setQuery("")}
      >
        <div className="m-combobox" data-leading={leading ? true : undefined}>
          {leading && (
            <span className="m-choice-leading" aria-hidden="true">
              {leading}
            </span>
          )}
          <ComboboxInput
            className="m-choice-control"
            placeholder={placeholder}
            aria-invalid={error ? true : undefined}
            displayValue={(v: string | null) =>
              options.find((o) => o.value === v)?.label ?? ""
            }
            onChange={(event) => setQuery(event.target.value)}
          />
          <ComboboxButton
            className="m-combobox-toggle"
            aria-label={`Show ${label} options`}
          >
            <ChevronDown />
          </ComboboxButton>
        </div>
        {filtered.length > 0 && (
          <ComboboxOptions
            anchor="bottom start"
            className="m-choice-options m-combobox-options"
          >
            {filtered.map((option) => (
              <ComboboxOption
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="m-choice-option"
              >
                <OptionContent option={option} />
              </ComboboxOption>
            ))}
          </ComboboxOptions>
        )}
      </HeadlessCombobox>
      <p
        role="status"
        className={needle && !filtered.length ? "" : "m-sr-only"}
      >
        {needle && !filtered.length ? emptyLabel : ""}
      </p>
      <Message hint={hint} error={error} />
    </Field>
  );
}
