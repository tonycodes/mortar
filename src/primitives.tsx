import { KitLink } from "./navigation.js";
import {
  Fragment,
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
  MenuSection,
  MenuHeading,
  MenuSeparator,
} from "@headlessui/react";
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  /** Decorative icon; the text remains the accessible name. */
  icon?: ReactNode;
  iconPosition?: "start" | "end";
  /** Show only the icon; the children become screen-reader-only text. */
  iconOnly?: boolean;
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
      size = "md",
      icon,
      iconPosition = "start",
      iconOnly = false,
      ...props
    },
    ref,
  ) {
    const glyph = icon && (
      <span className="m-button-icon" aria-hidden="true">
        {icon}
      </span>
    );
    return (
      <button
        {...props}
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={`m-button m-button-${variant} ${className}`}
        data-size={size === "md" ? undefined : size}
        data-icon-only={iconOnly && icon ? true : undefined}
      >
        {loading && <span className="m-spinner" aria-hidden="true" />}
        {iconPosition === "start" && glyph}
        {iconOnly && icon ? (
          <span className="m-sr-only">{children}</span>
        ) : (
          children
        )}
        {iconPosition === "end" && glyph}
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
export type Tone = "neutral" | "info" | "success" | "warning" | "danger";
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
/** Label beside a control with a description line linked by aria-describedby. */
function DescribedChoice({
  input,
  id,
  label,
  description,
}: {
  input: (attrs: { id: string; "aria-describedby": string }) => ReactNode;
  id?: string;
  label: ReactNode;
  description: ReactNode;
}) {
  const generated = useId();
  const fieldId = id || generated;
  const descriptionId = `${fieldId}-description`;
  return (
    <div className="m-choice m-choice-described">
      {input({ id: fieldId, "aria-describedby": descriptionId })}
      <div className="m-choice-text">
        <label htmlFor={fieldId}>{label}</label>
        <p id={descriptionId}>{description}</p>
      </div>
    </div>
  );
}
export function Checkbox({
  label,
  description,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
  /** Secondary line under the label, announced as the description. */
  description?: ReactNode;
}) {
  if (description)
    return (
      <DescribedChoice
        id={props.id}
        label={label}
        description={description}
        input={(attrs) => <input {...props} {...attrs} type="checkbox" />}
      />
    );
  return (
    <label className="m-choice">
      <input {...props} type="checkbox" />
      {label}
    </label>
  );
}
export function Switch({
  label,
  description,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role"> & {
  label: string;
  /** Secondary line under the label, announced as the description. */
  description?: ReactNode;
}) {
  if (description)
    return (
      <DescribedChoice
        id={props.id}
        label={label}
        description={description}
        input={(attrs) => (
          <input
            {...props}
            {...attrs}
            type="checkbox"
            role="switch"
            className="m-switch"
          />
        )}
      />
    );
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
  layout = "list",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
    description?: string;
    /** CSS colour for the swatches layout; the label stays the accessible name. */
    swatch?: string;
    disabled?: boolean;
  }[];
  /** Stacked cards, a card grid, or colour swatches. */
  layout?: "list" | "grid" | "swatches";
}) {
  return (
    <fieldset
      className="m-radio-group"
      data-layout={layout === "list" ? undefined : layout}
    >
      <legend>{label}</legend>
      {options.map((o) => (
        <label className="m-radio-card" key={o.value}>
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            disabled={o.disabled}
            onChange={() => onChange(o.value)}
          />
          {layout === "swatches" ? (
            <>
              <span
                className="m-swatch"
                aria-hidden="true"
                style={{ background: o.swatch }}
              />
              <span className="m-sr-only">{o.label}</span>
            </>
          ) : (
            <span>
              <strong>{o.label}</strong>
              {o.description && <span>{o.description}</span>}
            </span>
          )}
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
  items: {
    id: string;
    label: string;
    content: ReactNode;
    /** Shown after the label, e.g. a number of items. */
    count?: number | string;
    icon?: ReactNode;
  }[];
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
            {item.icon && (
              <span className="m-tab-icon" aria-hidden="true">
                {item.icon}
              </span>
            )}
            {item.label}
            {item.count !== undefined && (
              <span className="m-tab-count">{item.count}</span>
            )}
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
export interface DropdownItem {
  label: string;
  /** Run an action. Use href instead for navigation. */
  onSelect?: () => void;
  href?: string;
  icon?: ReactNode;
  description?: string;
  /** Items sharing a section are grouped under that heading, separated by a divider. */
  section?: string;
  danger?: boolean;
  disabled?: boolean;
}
export function Dropdown({
  label,
  items,
  icon,
  iconOnly = false,
  variant = "secondary",
  align = "end",
  header,
}: {
  /** Trigger text, and its accessible name when iconOnly. */
  label: string;
  items: DropdownItem[];
  /** Trigger icon, e.g. a "more" ellipsis or an avatar. */
  icon?: ReactNode;
  iconOnly?: boolean;
  variant?: "secondary" | "ghost";
  align?: "start" | "end";
  /** Content above the items, e.g. "Signed in as …". */
  header?: ReactNode;
}) {
  const groups: { section?: string; items: DropdownItem[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.section === item.section) last.items.push(item);
    else groups.push({ section: item.section, items: [item] });
  }
  const entry = (item: DropdownItem) => {
    const content = (
      <>
        {item.icon && (
          <span className="m-menu-icon" aria-hidden="true">
            {item.icon}
          </span>
        )}
        {item.description ? (
          <span className="m-menu-text">
            <span>{item.label}</span>
            <small>{item.description}</small>
          </span>
        ) : (
          item.label
        )}
      </>
    );
    return (
      <MenuItem key={item.label} disabled={item.disabled}>
        {item.href ? (
          <KitLink href={item.href} className={item.danger ? "m-error" : ""}>
            {content}
          </KitLink>
        ) : (
          <button
            type="button"
            className={item.danger ? "m-error" : ""}
            onClick={item.onSelect}
          >
            {content}
          </button>
        )}
      </MenuItem>
    );
  };
  return (
    <Menu>
      <MenuButton
        className={`m-button m-button-${variant}`}
        aria-label={iconOnly && icon ? label : undefined}
        data-icon-only={iconOnly && icon ? true : undefined}
      >
        {icon && (
          <span className="m-button-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        {!(iconOnly && icon) && label}
        {!(iconOnly && icon) && <span aria-hidden="true">⌄</span>}
      </MenuButton>
      <MenuItems anchor={`bottom ${align}`} className="m-menu">
        {header && <div className="m-menu-header">{header}</div>}
        {groups.map((group, index) =>
          group.section ? (
            <Fragment key={`${group.section}:${index}`}>
              {index > 0 && <MenuSeparator className="m-menu-separator" />}
              <MenuSection>
                <MenuHeading className="m-menu-heading">
                  {group.section}
                </MenuHeading>
                {group.items.map(entry)}
              </MenuSection>
            </Fragment>
          ) : (
            <Fragment key={`items:${index}`}>
              {index > 0 && <MenuSeparator className="m-menu-separator" />}
              {group.items.map(entry)}
            </Fragment>
          ),
        )}
      </MenuItems>
    </Menu>
  );
}
export function Notice({
  title,
  children,
  tone = "neutral",
  announce = false,
  actions,
  onDismiss,
  dismissLabel,
}: {
  title: string;
  children?: ReactNode;
  tone?: Tone;
  announce?: boolean;
  /** Links or buttons such as "View details". */
  actions?: ReactNode;
  onDismiss?: () => void;
  /** Accessible name for the dismiss button; defaults to "Dismiss {title}". */
  dismissLabel?: string;
}) {
  return (
    <div
      className={`m-notice m-tone-${tone}`}
      role={announce ? (tone === "danger" ? "alert" : "status") : undefined}
      data-dismissible={onDismiss ? true : undefined}
    >
      <strong>{title}</strong>
      {children && <div>{children}</div>}
      {actions && <div className="m-notice-actions">{actions}</div>}
      {onDismiss && (
        <button
          type="button"
          className="m-notice-dismiss"
          aria-label={dismissLabel ?? `Dismiss ${title}`}
          onClick={onDismiss}
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="m5 5 10 10M15 5 5 15"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  /** Decorative illustration or icon above the title. */
  icon?: ReactNode;
}) {
  return (
    <div className="m-empty">
      {icon && (
        <span className="m-empty-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
