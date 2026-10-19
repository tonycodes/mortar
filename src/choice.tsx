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
import { RequiredMark, cx } from "./internal.js";

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
  /** Marks the field invalid; the message is announced when it appears. */
  error?: string;
  disabled?: boolean;
  /** Marks the field required and adds a decorative marker to the label. */
  required?: boolean;
  /** On the field's root element. */
  className?: string;
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

/** Label with the required marker; `spoken` adds "required" for controls that cannot carry aria-required. */
function ChoiceLabel({
  label,
  required,
  spoken = false,
}: {
  label: string;
  required?: boolean;
  spoken?: boolean;
}) {
  return (
    <Label>
      {label}
      {required && <RequiredMark />}
      {required && spoken && <span className="m-sr-only"> (required)</span>}
    </Label>
  );
}

/** The hint or error; the error is a separate alert so it is announced when it appears. */
function Message({ hint, error }: { hint?: string; error?: string }) {
  if (error)
    return (
      <Description key="error" className="m-error" role="alert">
        {error}
      </Description>
    );
  return hint ? <Description key="hint">{hint}</Description> : null;
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
  required,
  className,
}: ChoiceProps) {
  const selected = options.find((o) => o.value === value);
  return (
    <Field className={cx("m-field", className)} disabled={disabled}>
      <ChoiceLabel label={label} required={required} spoken />
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
  required,
  className,
  empty = { title: "No matches" },
}: ChoiceProps & {
  /** Shown and announced when the typed text matches no option. */
  empty?: { title: string; description?: string; action?: ReactNode };
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? options.filter((o) => o.label.toLowerCase().includes(needle))
    : options;
  const leading = query
    ? undefined
    : options.find((o) => o.value === value)?.leading;
  const nothing = !!needle && !filtered.length;
  return (
    <Field className={cx("m-field", className)} disabled={disabled}>
      <ChoiceLabel label={label} required={required} />
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
            aria-required={required || undefined}
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
      <p role="status" className={nothing ? undefined : "m-sr-only"}>
        {nothing && (
          <>
            {empty.title}
            {empty.description && <span> {empty.description}</span>}
          </>
        )}
      </p>
      {nothing && empty.action}
      <Message hint={hint} error={error} />
    </Field>
  );
}
