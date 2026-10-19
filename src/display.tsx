import { useId, type ReactNode } from "react";
import { KitLink } from "./navigation.js";
import type { Tone } from "./primitives.js";
import { Check, Close, Paperclip, Person } from "./icons.js";
import { headingTag, type HeadingLevel } from "./heading.js";
import {
  TermList,
  cx,
  focusAfterRemoval,
  classedIntroSlots,
} from "./internal.js";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export interface AvatarProps {
  name: string;
  src?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  shape?: "circle" | "square";
  status?: "online" | "offline";
  /** Corner of the status dot; `top` suits notification indicators. */
  statusPosition?: "bottom" | "top";
  /** Shown when there is no `src`: the name's initials or a generic person icon. */
  placeholder?: "initials" | "icon";
  /** Hide the avatar from assistive technology when the name is already visible beside it. */
  decorative?: boolean;
  className?: string;
}
export function Avatar({
  name,
  src,
  size = "md",
  shape = "circle",
  status,
  statusPosition = "bottom",
  placeholder = "initials",
  decorative = false,
  className,
}: AvatarProps) {
  return (
    <span
      className={cx(`m-avatar m-avatar-${size}`, className)}
      data-shape={shape === "circle" ? undefined : shape}
      {...(decorative
        ? { "aria-hidden": true }
        : {
            role: "img",
            "aria-label": status ? `${name}, ${status}` : name,
          })}
    >
      {src ? (
        <img src={src} alt="" />
      ) : placeholder === "icon" ? (
        <Person className="m-avatar-placeholder" />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
      {status && (
        <span
          className="m-avatar-status"
          data-status={status}
          data-position={statusPosition === "top" ? "top" : undefined}
          aria-hidden="true"
        />
      )}
    </span>
  );
}

export interface AvatarGroupProps {
  label: string;
  people: { name: string; src?: string }[];
  max?: number;
  className?: string;
}
export function AvatarGroup({
  label,
  people,
  max = 4,
  className,
}: AvatarGroupProps) {
  const shown = people.slice(0, max),
    rest = people.length - shown.length;
  return (
    <ul className={cx("m-avatar-group", className)} aria-label={label}>
      {shown.map((person) => (
        <li key={person.name}>
          <Avatar name={person.name} src={person.src} size="sm" />
        </li>
      ))}
      {rest > 0 && (
        <li>
          <span
            className="m-avatar m-avatar-sm m-avatar-more"
            role="img"
            aria-label={`${rest} more`}
          >
            +{rest}
          </span>
        </li>
      )}
    </ul>
  );
}

export interface KbdProps {
  keys: string[];
  className?: string;
}
export function Kbd({ keys, className }: KbdProps) {
  return (
    <span className={cx("m-kbd-group", className)}>
      {keys.map((key, i) => (
        <kbd key={i} className="m-kbd">
          {key}
        </kbd>
      ))}
    </span>
  );
}

export interface ProgressBarProps {
  label: string;
  value: number;
  max?: number;
  valueLabel?: string;
  /** Status colour for the bar; omit for the accent colour. */
  tone?: Tone;
  className?: string;
}
export function ProgressBar({
  label,
  value,
  max = 100,
  valueLabel,
  tone,
  className,
}: ProgressBarProps) {
  const labelId = useId();
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cx("m-progress", className)} data-tone={tone}>
      <div className="m-progress-label">
        <span id={labelId}>{label}</span>
        {valueLabel && <span aria-hidden="true">{valueLabel}</span>}
      </div>
      <div
        className="m-progress-track"
        role="progressbar"
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={valueLabel}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export interface FilterChipProps {
  label: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  /** Shows a remove button; focus moves to the next chip once the chip is gone. */
  onRemove?: () => void;
  className?: string;
}
export function FilterChip({
  label,
  selected = false,
  onClick,
  onRemove,
  className,
}: FilterChipProps) {
  if (onRemove)
    return (
      <span className={cx("m-chip", className)} data-selected="true">
        {label}
        <button
          type="button"
          onClick={(event) => {
            const chip = event.currentTarget.parentElement;
            if (chip) focusAfterRemoval(chip);
            onRemove();
          }}
          aria-label={`Remove ${typeof label === "string" ? label : "filter"}`}
        >
          <Close />
        </button>
      </span>
    );
  return (
    <button
      type="button"
      className={cx("m-chip", className)}
      aria-pressed={selected}
      data-selected={selected || undefined}
      onClick={onClick}
    >
      {!selected && <span aria-hidden="true">+</span>}
      {label}
    </button>
  );
}

export interface CheckListProps {
  items: ReactNode[];
  label?: string;
  columns?: 1 | 2;
  size?: "sm" | "md";
  className?: string;
}
/** Feature or inclusion list with a check marker; replaces ad-hoc list-disc styling. */
export function CheckList({
  items,
  label,
  columns = 1,
  size = "md",
  className,
}: CheckListProps) {
  return (
    <ul
      className={cx("m-check-list", className)}
      aria-label={label}
      data-columns={columns === 1 ? undefined : columns}
      data-size={size === "md" ? undefined : size}
    >
      {items.map((item, i) => (
        <li key={i}>
          <Check variant="list" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export interface DescriptionListProps {
  title?: string;
  description?: string;
  headingLevel?: HeadingLevel;
  items: { term: string; details: ReactNode; action?: ReactNode }[];
  layout?: "columns" | "stacked";
  id?: string;
  className?: string;
}
/** Label/value pairs for detail screens, stacked on narrow screens and in columns when wide. */
export function DescriptionList({
  title,
  description,
  headingLevel = 2,
  items,
  layout = "columns",
  id,
  className,
}: DescriptionListProps) {
  return (
    <div
      id={id}
      className={cx("m-description-list", className)}
      data-layout={layout === "columns" ? undefined : layout}
    >
      {title && (
        <div className="m-description-heading">
          {...classedIntroSlots(
            {
              title,
              description,
              headingLevel,
              descriptionClassName: null,
            },
            "m-description-title",
          )}
        </div>
      )}
      <TermList
        items={items.map((item) => ({
          term: item.term,
          details: item.details,
          attributes: { "data-action": item.action ? true : undefined },
          after: item.action && (
            <dd className="m-description-action">{item.action}</dd>
          ),
        }))}
      />
    </div>
  );
}

export interface GridListItem {
  id: string;
  title: string;
  description?: string;
  /** Destination for the card; its title link covers the whole card. */
  href?: string;
  /** Avatar or icon shown beside the title. */
  media?: ReactNode;
  /** Image across the top of the card. Use alt="" when the title already describes it. */
  cover?: { src: string; alt: string };
  /** Badges, dates or counts under the description. */
  meta?: ReactNode;
  /** Term/value pairs under the body, e.g. a client card's last invoice and amount. */
  details?: { term: string; details: ReactNode }[];
  actions?: ReactNode;
}
export interface GridListProps {
  label: string;
  items: GridListItem[];
  columns?: 2 | 3 | 4;
  /** Level of each card's title. */
  itemHeadingLevel?: HeadingLevel;
  /** `split` gives each action an equal cell divided by shared borders, e.g. Email | Call. */
  actionsLayout?: "inline" | "split";
  className?: string;
}
/**
 * Responsive grid of cards for people, projects or files. A card's title link
 * covers the card; links and buttons in `media`, `meta`, `details` and
 * `actions` sit above it and stay clickable.
 */
export function GridList({
  label,
  items,
  columns = 3,
  itemHeadingLevel = 3,
  actionsLayout = "inline",
  className,
}: GridListProps) {
  const Heading = headingTag(itemHeadingLevel);
  return (
    <ul
      className={cx("m-grid-list", className)}
      aria-label={label}
      data-columns={columns === 3 ? undefined : columns}
      data-actions={actionsLayout === "split" ? "split" : undefined}
    >
      {items.map((item) => (
        <li key={item.id}>
          {item.cover && (
            <div className="m-grid-list-cover">
              <img src={item.cover.src} alt={item.cover.alt} loading="lazy" />
            </div>
          )}
          <div className="m-grid-list-body">
            {item.media && (
              <span className="m-grid-list-media">{item.media}</span>
            )}
            <div className="m-grid-list-text">
              <Heading className="m-grid-list-title">
                {item.href ? (
                  <KitLink href={item.href}>{item.title}</KitLink>
                ) : (
                  item.title
                )}
              </Heading>
              {item.description && <p>{item.description}</p>}
              {item.meta && <div className="m-grid-list-meta">{item.meta}</div>}
            </div>
          </div>
          {item.details && item.details.length > 0 && (
            <TermList className="m-grid-list-details" items={item.details} />
          )}
          {item.actions && (
            <div className="m-grid-list-actions">{item.actions}</div>
          )}
        </li>
      ))}
    </ul>
  );
}

export interface Attachment {
  id: string;
  name: string;
  href: string;
  /** Preformatted size, e.g. "2.4 MB". */
  size?: string;
  /** Link text; the file name is appended for screen readers. Defaults to "Download". */
  actionLabel?: string;
  icon?: ReactNode;
}
export interface AttachmentListProps {
  files: Attachment[];
  label?: string;
  className?: string;
}
/** Files attached to a record, each with a size and a named download link. */
export function AttachmentList({
  files,
  label = "Attachments",
  className,
}: AttachmentListProps) {
  return (
    <ul className={cx("m-attachments", className)} aria-label={label}>
      {files.map((file) => (
        <li key={file.id}>
          <span className="m-attachment-icon" aria-hidden="true">
            {file.icon ?? <Paperclip />}
          </span>
          <span className="m-attachment-text">
            <span className="m-attachment-name">{file.name}</span>
            {file.size && (
              <span className="m-attachment-size">{file.size}</span>
            )}
          </span>
          <KitLink href={file.href}>
            {file.actionLabel ?? "Download"}
            <span className="m-sr-only"> {file.name}</span>
          </KitLink>
        </li>
      ))}
    </ul>
  );
}
