import { KitLink } from "./navigation.js";
import {
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from "react";
import {
  Dialog as HeadlessDialog,
  DialogPanel,
  DialogTitle,
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
} from "@headlessui/react";
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      loading = false,
      disabled,
      children,
      className = "",
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        {...props}
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={`m-button m-button-${variant} ${className}`}
      >
        {loading && <span className="m-spinner" aria-hidden="true" />}
        {children}
      </button>
    );
  },
);
export interface LinkAction {
  label: string;
  href: string;
}
export function ActionLink({
  label,
  href,
  variant = "primary",
}: LinkAction & { variant?: ButtonProps["variant"] }) {
  return (
    <KitLink className={`m-button m-button-${variant}`} href={href}>
      {label}
    </KitLink>
  );
}
export interface ButtonGroupItem {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: ReactNode;
  /** Show only the icon; the label remains the accessible name. */
  iconOnly?: boolean;
  disabled?: boolean;
}
/** Joined row of related secondary actions. Use SegmentedControl to choose one value. */
export function ButtonGroup({
  label,
  items,
}: {
  label: string;
  items: ButtonGroupItem[];
}) {
  return (
    <div className="m-button-group" role="group" aria-label={label}>
      {items.map((item) => {
        const content = (
          <>
            {item.icon && (
              <span aria-hidden="true" className="m-button-group-icon">
                {item.icon}
              </span>
            )}
            {!(item.iconOnly && item.icon) && item.label}
          </>
        );
        const name = item.iconOnly && item.icon ? item.label : undefined;
        return item.href && !item.disabled ? (
          <KitLink key={item.label} href={item.href} aria-label={name}>
            {content}
          </KitLink>
        ) : (
          <button
            key={item.label}
            type="button"
            aria-label={name}
            disabled={item.disabled}
            onClick={item.onClick}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
export type Tone = "neutral" | "success" | "warning" | "danger";
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return <span className={`m-badge m-tone-${tone}`}>{children}</span>;
}
interface FieldDescription {
  label: string;
  hint?: string;
  error?: string;
}
export interface InputProps
  extends InputHTMLAttributes<HTMLInputElement>, FieldDescription {
  prefix?: string;
  suffix?: string;
  /** Decorative icon inside the field, before the text. */
  leadingIcon?: ReactNode;
  /** Decorative icon inside the field, after the text. */
  trailingIcon?: ReactNode;
  /** Button or menu attached to the end of the field, e.g. "Sort" or "Copy". */
  action?: ReactNode;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    id,
    prefix,
    suffix,
    leadingIcon,
    trailingIcon,
    action,
    className = "",
    ...props
  },
  ref,
) {
  const generated = useId(),
    fieldId = id || generated,
    messageId = fieldId + "-message";
  return (
    <div className="m-field">
      <label htmlFor={fieldId}>{label}</label>
      <div
        className="m-input-group"
        data-invalid={!!error || undefined}
        data-leading={leadingIcon ? true : undefined}
        data-trailing={trailingIcon ? true : undefined}
      >
        {prefix && <span>{prefix}</span>}
        {leadingIcon && (
          <span className="m-input-icon" aria-hidden="true">
            {leadingIcon}
          </span>
        )}
        <input
          {...props}
          ref={ref}
          id={fieldId}
          className={className}
          aria-invalid={!!error || props["aria-invalid"]}
          aria-describedby={
            [props["aria-describedby"], (error || hint) && messageId]
              .filter(Boolean)
              .join(" ") || undefined
          }
        />
        {trailingIcon && (
          <span className="m-input-icon" aria-hidden="true">
            {trailingIcon}
          </span>
        )}
        {suffix && <span>{suffix}</span>}
        {action && <div className="m-input-action">{action}</div>}
      </div>
      {(error || hint) && (
        <p id={messageId} className={error ? "m-error" : ""}>
          {error || hint}
        </p>
      )}
    </div>
  );
});
export function Select({
  label,
  options,
  id,
  hint,
  error,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> &
  FieldDescription & { options: { value: string; label: string }[] }) {
  const generated = useId(),
    fieldId = id || generated,
    listbox = !!props.multiple || (props.size || 0) > 1;
  return (
    <div className="m-field">
      <label htmlFor={fieldId}>{label}</label>
      <div className="m-select-control" data-listbox={listbox || undefined}>
        <select
          {...props}
          id={fieldId}
          aria-invalid={!!error || props["aria-invalid"]}
          aria-describedby={
            [props["aria-describedby"], (hint || error) && fieldId + "-message"]
              .filter(Boolean)
              .join(" ") || undefined
          }
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {!listbox && (
          <svg
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="m6 8 4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      {(hint || error) && (
        <p id={fieldId + "-message"} className={error ? "m-error" : ""}>
          {error || hint}
        </p>
      )}
    </div>
  );
}
/** Groups related fields under a legend; disabled disables every control inside. */
export function Fieldset({
  legend,
  description,
  disabled,
  children,
}: {
  legend: string;
  description?: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <fieldset
      className="m-fieldset"
      disabled={disabled}
      aria-describedby={description ? id : undefined}
    >
      <legend>{legend}</legend>
      {description && <p id={id}>{description}</p>}
      <div className="m-fieldset-fields">{children}</div>
    </fieldset>
  );
}
export function TextArea({
  label,
  id,
  hint,
  error,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldDescription) {
  const generated = useId(),
    fieldId = id || generated;
  return (
    <div className="m-field">
      <label htmlFor={fieldId}>{label}</label>
      <textarea
        {...props}
        id={fieldId}
        aria-invalid={!!error || props["aria-invalid"]}
        aria-describedby={
          [props["aria-describedby"], (hint || error) && fieldId + "-message"]
            .filter(Boolean)
            .join(" ") || undefined
        }
      />
      {(hint || error) && (
        <p id={fieldId + "-message"} className={error ? "m-error" : ""}>
          {error || hint}
        </p>
      )}
    </div>
  );
}
export function Checkbox({
  label,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: ReactNode }) {
  return (
    <label className="m-choice">
      <input {...props} type="checkbox" />
      {label}
    </label>
  );
}
export function Switch({
  label,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role"> & {
  label: string;
}) {
  return (
    <label className="m-choice">
      <input {...props} type="checkbox" role="switch" className="m-switch" />
      {label}
    </label>
  );
}
export function RadioGroup({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; description?: string }[];
}) {
  return (
    <fieldset className="m-radio-group">
      <legend>{label}</legend>
      {options.map((o) => (
        <label className="m-radio-card" key={o.value}>
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
          />
          <span>
            <strong>{o.label}</strong>
            {o.description && <span>{o.description}</span>}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
export function Tabs({
  label,
  value,
  onChange,
  items,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: { id: string; label: string; content: ReactNode }[];
}) {
  const base = useId();
  return (
    <div>
      <div
        className="m-tabs"
        role="tablist"
        aria-label={label}
        onKeyDown={(e) => {
          const i = items.findIndex((item) => item.id === value);
          let next = i;
          if (e.key === "ArrowRight") next = (i + 1) % items.length;
          else if (e.key === "ArrowLeft")
            next = (i - 1 + items.length) % items.length;
          else if (e.key === "Home") next = 0;
          else if (e.key === "End") next = items.length - 1;
          else return;
          e.preventDefault();
          onChange(items[next].id);
          document.getElementById(`${base}-${items[next].id}-tab`)?.focus();
        }}
      >
        {items.map((item) => (
          <button
            key={item.id}
            id={`${base}-${item.id}-tab`}
            type="button"
            role="tab"
            aria-selected={item.id === value}
            aria-controls={`${base}-${item.id}-panel`}
            tabIndex={item.id === value ? 0 : -1}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          hidden={item.id !== value}
          role="tabpanel"
          id={`${base}-${item.id}-panel`}
          aria-labelledby={`${base}-${item.id}-tab`}
          tabIndex={0}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
export function Modal({
  open,
  onClose,
  title,
  children,
  actions,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  /** "lg" widens the panel for rich content such as a product quick view. */
  size?: "md" | "lg";
}) {
  return (
    <HeadlessDialog open={open} onClose={onClose} className="m-dialog">
      <div className="m-backdrop" aria-hidden="true" />
      <div className="m-dialog-position">
        <DialogPanel className="m-dialog-panel" data-size={size}>
          <div className="m-dialog-heading">
            <DialogTitle>{title}</DialogTitle>
            <Button variant="ghost" onClick={onClose} aria-label="Close dialog">
              Close
            </Button>
          </div>
          {children}
          {actions && <div className="m-actions">{actions}</div>}
        </DialogPanel>
      </div>
    </HeadlessDialog>
  );
}
export function Dropdown({
  label,
  items,
}: {
  label: string;
  items: {
    label: string;
    onSelect: () => void;
    danger?: boolean;
    disabled?: boolean;
  }[];
}) {
  return (
    <Menu>
      <MenuButton className="m-button m-button-secondary">
        {label}
        <span aria-hidden="true">⌄</span>
      </MenuButton>
      <MenuItems anchor="bottom end" className="m-menu">
        {items.map((item) => (
          <MenuItem key={item.label} disabled={item.disabled}>
            <button
              type="button"
              className={item.danger ? "m-error" : ""}
              onClick={item.onSelect}
            >
              {item.label}
            </button>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
}
export function Notice({
  title,
  children,
  tone = "neutral",
  announce = false,
}: {
  title: string;
  children?: ReactNode;
  tone?: Tone;
  announce?: boolean;
}) {
  return (
    <div
      className={`m-notice m-tone-${tone}`}
      role={announce ? (tone === "danger" ? "alert" : "status") : undefined}
    >
      <strong>{title}</strong>
      {children && <div>{children}</div>}
    </div>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="m-empty">
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
