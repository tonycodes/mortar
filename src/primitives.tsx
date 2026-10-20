import { KitLink } from "./navigation.js";
import {
  Fragment,
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from "react";
import {
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
import { ChevronDown, Close } from "./icons.js";
import { headingTag, type HeadingLevel } from "./heading.js";
import {
  DialogFrame,
  FieldFeedback,
  LinkContent,
  RequiredMark,
  Swatch,
  cx,
  componentRoot,
  useComponentName,
  focusAway,
  rovingIndex,
  useField,
} from "./internal.js";
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  /**
   * Busy: shows a spinner, sets aria-busy and aria-disabled and ignores
   * activation. The button stays focusable, so focus is never lost.
   */
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
      className,
      type = "button",
      size = "md",
      icon,
      iconPosition = "start",
      iconOnly = false,
      onClick,
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
        {...componentRoot("Button")}
        {...props}
        ref={ref}
        type={type}
        disabled={disabled}
        aria-disabled={(loading && !disabled) || props["aria-disabled"]}
        aria-busy={loading || undefined}
        onClick={(event) => {
          // A busy button keeps focus but must not act or submit its form.
          if (loading) event.preventDefault();
          else onClick?.(event);
        }}
        className={cx("m-button", `m-button-${variant}`, className)}
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
  className,
}: LinkAction & { variant?: ButtonProps["variant"]; className?: string }) {
  return (
    <KitLink
      {...componentRoot("ActionLink")}
      className={cx("m-button", `m-button-${variant}`, className)}
      href={href}
    >
      {label}
    </KitLink>
  );
}
export interface ButtonGroupItem {
  label: string;
  /** Run the item's action. Use href instead for navigation. */
  onSelect?: () => void;
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
  className,
}: {
  label: string;
  items: ButtonGroupItem[];
  className?: string;
}) {
  return (
    <div
      {...componentRoot("ButtonGroup")}
      className={cx("m-button-group", className)}
      role="group"
      aria-label={label}
    >
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
            onClick={item.onSelect}
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
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      {...componentRoot("Badge")}
      className={cx("m-badge", className)}
      data-tone={tone === "neutral" ? undefined : tone}
    >
      {children}
    </span>
  );
}
interface FieldDescription {
  label: string;
  hint?: string;
  /** Marks the field invalid; the message is announced when it appears. */
  error?: string;
  /** On the field's root element. */
  className?: string;
}
/** The field label; a required field adds a decorative marker after the text. */
function FieldLabel({
  htmlFor,
  label,
  required,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor}>
      {label}
      {required && <RequiredMark />}
    </label>
  );
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
    className,
    ...props
  },
  ref,
) {
  const { fieldId, messageId, describedBy } = useField({
    id,
    hint,
    error,
    describedBy: props["aria-describedby"],
  });
  return (
    <div {...componentRoot("Input")} className={cx("m-field", className)}>
      <FieldLabel htmlFor={fieldId} label={label} required={props.required} />
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
          aria-invalid={!!error || props["aria-invalid"]}
          aria-describedby={describedBy}
        />
        {trailingIcon && (
          <span className="m-input-icon" aria-hidden="true">
            {trailingIcon}
          </span>
        )}
        {suffix && <span>{suffix}</span>}
        {action && <div className="m-input-action">{action}</div>}
      </div>
      <FieldFeedback id={messageId} hint={hint} error={error} />
    </div>
  );
});
export function Select({
  label,
  options,
  id,
  hint,
  error,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> &
  FieldDescription & { options: { value: string; label: string }[] }) {
  const { fieldId, messageId, describedBy } = useField({
    id,
    hint,
    error,
    describedBy: props["aria-describedby"],
  });
  const listbox = !!props.multiple || (props.size || 0) > 1;
  return (
    <div {...componentRoot("Select")} className={cx("m-field", className)}>
      <FieldLabel htmlFor={fieldId} label={label} required={props.required} />
      <div className="m-select-control" data-listbox={listbox || undefined}>
        <select
          {...props}
          id={fieldId}
          aria-invalid={!!error || props["aria-invalid"]}
          aria-describedby={describedBy}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {!listbox && <ChevronDown />}
      </div>
      <FieldFeedback id={messageId} hint={hint} error={error} />
    </div>
  );
}
/** Groups related fields under a legend; disabled disables every control inside. */
export function Fieldset({
  legend,
  description,
  disabled,
  children,
  className,
}: {
  legend: string;
  description?: string;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <fieldset
      {...componentRoot("Fieldset")}
      className={cx("m-fieldset", className)}
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
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldDescription) {
  const { fieldId, messageId, describedBy } = useField({
    id,
    hint,
    error,
    describedBy: props["aria-describedby"],
  });
  return (
    <div {...componentRoot("TextArea")} className={cx("m-field", className)}>
      <FieldLabel htmlFor={fieldId} label={label} required={props.required} />
      <textarea
        {...props}
        id={fieldId}
        aria-invalid={!!error || props["aria-invalid"]}
        aria-describedby={describedBy}
      />
      <FieldFeedback id={messageId} hint={hint} error={error} />
    </div>
  );
}
/** Label beside a control with a description line linked by aria-describedby. */
function DescribedChoice({
  component,
  input,
  id,
  label,
  description,
  className,
}: {
  component: string;
  input: (attrs: { id: string; "aria-describedby": string }) => ReactNode;
  id?: string;
  label: ReactNode;
  description: ReactNode;
  className?: string;
}) {
  const generated = useId();
  const fieldId = id || generated;
  const descriptionId = `${fieldId}-description`;
  return (
    <div
      {...componentRoot(component)}
      className={cx("m-choice", "m-choice-described", className)}
    >
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
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
  /** Secondary line under the label, announced as the description. */
  description?: ReactNode;
}) {
  if (description)
    return (
      <DescribedChoice
        component="Checkbox"
        id={props.id}
        label={label}
        description={description}
        className={className}
        input={(attrs) => <input {...props} {...attrs} type="checkbox" />}
      />
    );
  return (
    <label {...componentRoot("Checkbox")} className={cx("m-choice", className)}>
      <input {...props} type="checkbox" />
      {label}
    </label>
  );
}
export function Switch({
  label,
  description,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role"> & {
  label: string;
  /** Secondary line under the label, announced as the description. */
  description?: ReactNode;
}) {
  if (description)
    return (
      <DescribedChoice
        component="Switch"
        id={props.id}
        label={label}
        description={description}
        className={className}
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
    <label {...componentRoot("Switch")} className={cx("m-choice", className)}>
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
  className,
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
  className?: string;
}) {
  return (
    <fieldset
      {...componentRoot("RadioGroup")}
      className={cx("m-radio-group", className)}
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
            <Swatch color={o.swatch} label={o.label} />
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
/** Arrow keys follow reading direction: in right-to-left text ArrowLeft moves forward. */
function logicalKey(key: string, element: Element) {
  if (getComputedStyle(element).direction !== "rtl") return key;
  if (key === "ArrowLeft") return "ArrowRight";
  if (key === "ArrowRight") return "ArrowLeft";
  return key;
}
export function Tabs({
  label,
  value,
  onChange,
  items,
  variant = "underline",
  fullWidth = false,
  className,
}: {
  label: string;
  /** The selected tab's id. A value matching no tab leaves the first tab in the tab order. */
  value: string;
  onChange: (value: string) => void;
  /** Underlined tabs (default) or filled pills. */
  variant?: "underline" | "pills";
  /** Stretch the tabs to share the full width. */
  fullWidth?: boolean;
  items: {
    id: string;
    label: string;
    content: ReactNode;
    /** Shown after the label whenever it is defined, including 0. */
    count?: number | string;
    icon?: ReactNode;
  }[];
  className?: string;
}) {
  const base = useId();
  const tabId = (id: string) => `${base}-${id}-tab`;
  // The tab in the tab order: the selected one, or the first when none matches.
  const focusable = items.some((item) => item.id === value)
    ? value
    : items[0]?.id;
  return (
    <div {...componentRoot("Tabs")} className={className}>
      <div
        className="m-tabs"
        role="tablist"
        aria-label={label}
        data-variant={variant === "underline" ? undefined : variant}
        data-full-width={fullWidth || undefined}
        onKeyDown={(e) => {
          const focused = items.findIndex(
            (item) => tabId(item.id) === (e.target as Element).id,
          );
          const next = rovingIndex(
            logicalKey(e.key, e.currentTarget),
            focused >= 0
              ? focused
              : items.findIndex((item) => item.id === focusable),
            items.length,
          );
          if (next === null) return;
          e.preventDefault();
          onChange(items[next].id);
          document.getElementById(tabId(items[next].id))?.focus();
        }}
      >
        {items.map((item) => (
          <button
            key={item.id}
            id={tabId(item.id)}
            type="button"
            role="tab"
            aria-selected={item.id === value}
            aria-controls={`${base}-${item.id}-panel`}
            tabIndex={item.id === focusable ? 0 : -1}
            onClick={() => onChange(item.id)}
          >
            <LinkContent
              prefix="tab"
              icon={item.icon}
              label={item.label}
              count={item.count}
            />
          </button>
        ))}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          hidden={item.id !== value}
          role="tabpanel"
          id={`${base}-${item.id}-panel`}
          aria-labelledby={tabId(item.id)}
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
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  /** "lg" widens the panel for rich content such as a product quick view. */
  size?: "md" | "lg";
  /** On the dialog panel. */
  className?: string;
}) {
  const component = useComponentName("Modal");
  return (
    <DialogFrame open={open} onClose={onClose} component={component}>
      <div className="m-dialog-position">
        <DialogPanel
          className={cx("m-dialog-panel", className)}
          data-size={size === "md" ? undefined : size}
        >
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
    </DialogFrame>
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
  className,
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
  /** On the trigger button. */
  className?: string;
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
        {...componentRoot("Dropdown")}
        className={cx("m-button", `m-button-${variant}`, className)}
        aria-label={iconOnly && icon ? label : undefined}
        data-icon-only={iconOnly && icon ? true : undefined}
      >
        {icon && (
          <span className="m-button-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        {!(iconOnly && icon) && label}
        {!(iconOnly && icon) && (
          <span className="m-button-icon" aria-hidden="true">
            <ChevronDown />
          </span>
        )}
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
  id,
  className,
}: {
  title: string;
  children?: ReactNode;
  tone?: Tone;
  /**
   * Announce the notice to assistive technology when it appears and when its
   * title changes: politely, or assertively for the danger tone.
   */
  announce?: boolean;
  /** Links or buttons such as "View details". */
  actions?: ReactNode;
  /** Called by the dismiss button; focus moves to the next control on the page. */
  onDismiss?: () => void;
  /** Accessible name for the dismiss button; defaults to "Dismiss {title}". */
  dismissLabel?: string;
  id?: string;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  // A status region only announces changes made after it is in the document,
  // so a polite notice re-inserts its title once it has mounted; the region is
  // atomic, so the whole notice is read. An alert is announced on insertion.
  const polite = announce && tone !== "danger";
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (polite) setLive(true);
  }, [polite]);
  return (
    <div
      ref={root}
      id={id}
      {...componentRoot("Notice")}
      className={cx("m-notice", className)}
      data-tone={tone === "neutral" ? undefined : tone}
      role={announce ? (tone === "danger" ? "alert" : "status") : undefined}
      aria-atomic={polite || undefined}
      data-dismissible={onDismiss ? true : undefined}
    >
      <strong key={live ? "live" : "initial"}>{title}</strong>
      {children && <div>{children}</div>}
      {actions && <div className="m-notice-actions">{actions}</div>}
      {onDismiss && (
        <button
          type="button"
          className="m-notice-dismiss"
          aria-label={dismissLabel ?? `Dismiss ${title}`}
          onClick={() => {
            onDismiss();
            focusAway(root.current);
          }}
        >
          <Close />
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
  dashed,
  align = "center",
  headingLevel = 3,
  children,
  id,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  /** Decorative illustration or icon above the title. */
  icon?: ReactNode;
  /** Draws a dashed-border box, e.g. a "create your first" tile. */
  dashed?: boolean;
  /** `start` left-aligns the content for starting-point and template layouts. */
  align?: "center" | "start";
  /** Level of the title heading, so the page keeps a correct outline. */
  headingLevel?: HeadingLevel;
  /** Extra content after the action, e.g. starting points or recommendations. */
  children?: ReactNode;
  id?: string;
  className?: string;
}) {
  const Heading = headingTag(headingLevel);
  return (
    <div
      id={id}
      {...componentRoot("EmptyState")}
      className={cx("m-empty", className)}
      data-dashed={dashed || undefined}
      data-align={align === "start" ? "start" : undefined}
    >
      {icon && (
        <span className="m-empty-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <Heading>{title}</Heading>
      {description && <p>{description}</p>}
      {action}
      {children && <div className="m-empty-extra">{children}</div>}
    </div>
  );
}
