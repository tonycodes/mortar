import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { KitLink } from "./navigation.js";
import { Button } from "./primitives.js";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function Avatar({
  name,
  src,
  size = "md",
  shape = "circle",
  status,
}: {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  shape?: "circle" | "square";
  status?: "online" | "offline";
}) {
  return (
    <span
      className={`m-avatar m-avatar-${size}`}
      data-shape={shape}
      role="img"
      aria-label={status ? `${name}, ${status}` : name}
    >
      {src ? (
        <img src={src} alt="" />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
      {status && (
        <span
          className="m-avatar-status"
          data-status={status}
          aria-hidden="true"
        />
      )}
    </span>
  );
}

export function AvatarGroup({
  label,
  people,
  max = 4,
}: {
  label: string;
  people: { name: string; src?: string }[];
  max?: number;
}) {
  const shown = people.slice(0, max),
    rest = people.length - shown.length;
  return (
    <ul className="m-avatar-group" aria-label={label}>
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

export function Kbd({ keys }: { keys: string[] }) {
  return (
    <span className="m-kbd-group">
      {keys.map((key, i) => (
        <kbd key={i} className="m-kbd">
          {key}
        </kbd>
      ))}
    </span>
  );
}

export function ProgressBar({
  label,
  value,
  max = 100,
  valueLabel,
  tone = "primary",
}: {
  label: string;
  value: number;
  max?: number;
  valueLabel?: string;
  tone?: "primary" | "warning" | "danger";
}) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="m-progress" data-tone={tone}>
      <div className="m-progress-label">
        <span>{label}</span>
        {valueLabel && <span>{valueLabel}</span>}
      </div>
      <div
        className="m-progress-track"
        role="progressbar"
        aria-label={label}
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

export function FilterChip({
  label,
  selected = false,
  onClick,
  onRemove,
}: {
  label: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}) {
  if (onRemove)
    return (
      <span className="m-chip" data-selected>
        {label}
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${typeof label === "string" ? label : "filter"}`}
        >
          <span aria-hidden="true">✕</span>
        </button>
      </span>
    );
  return (
    <button
      type="button"
      className="m-chip"
      aria-pressed={selected}
      data-selected={selected || undefined}
      onClick={onClick}
    >
      {!selected && <span aria-hidden="true">+</span>}
      {label}
    </button>
  );
}

/** Feature or inclusion list with a check marker; replaces ad-hoc list-disc styling. */
export function CheckList({
  items,
  label,
  columns = 1,
  size = "md",
}: {
  items: ReactNode[];
  label?: string;
  columns?: 1 | 2;
  size?: "sm" | "md";
}) {
  return (
    <ul
      className="m-check-list"
      aria-label={label}
      data-columns={columns}
      data-size={size}
    >
      {items.map((item, i) => (
        <li key={i}>
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path
              d="M3.5 8.5 6.5 11.5 12.5 4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Label/value pairs for detail screens, stacked on narrow screens and in columns when wide. */
export function DescriptionList({
  title,
  description,
  headingLevel = 2,
  items,
  layout = "columns",
}: {
  title?: string;
  description?: string;
  headingLevel?: 2 | 3 | 4;
  items: { term: string; details: ReactNode; action?: ReactNode }[];
  layout?: "columns" | "stacked";
}) {
  const Heading = `h${headingLevel}` as const;
  return (
    <div className="m-description-list" data-layout={layout}>
      {title && (
        <div className="m-description-heading">
          <Heading>{title}</Heading>
          {description && <p>{description}</p>}
        </div>
      )}
      <dl>
        {items.map((item) => (
          <div key={item.term} data-action={item.action ? true : undefined}>
            <dt>{item.term}</dt>
            <dd>{item.details}</dd>
            {item.action && (
              <dd className="m-description-action">{item.action}</dd>
            )}
          </div>
        ))}
      </dl>
    </div>
  );
}

export interface CalendarEvent {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  title: string;
  /** Display text, e.g. "10:00". */
  time?: string;
  href?: string;
}
export interface CalendarProps {
  /** Accessible name of the whole calendar group. */
  label: string;
  value: string | null;
  onChange: (value: string) => void;
  /** Controlled visible month, YYYY-MM. */
  month?: string;
  onMonthChange?: (month: string) => void;
  min?: string;
  max?: string;
  disabledDates?: string[];
  isDateDisabled?: (date: string) => boolean;
  /** Intl locale for month, weekday and day labels; never the week start. */
  locale?: string;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** YYYY-MM-DD, supplied by the caller so server and client agree. */
  today: string;
  disabled?: boolean;
  /** Omit to hide the event list. */
  events?: CalendarEvent[];
  previousLabel?: string;
  nextLabel?: string;
  emptyEventsLabel?: string;
  eventCountLabel?: (count: number) => string;
}

// Calendar dates are ISO strings; arithmetic runs in UTC, which has no DST.
const utc = (date: string) => new Date(`${date}T00:00:00Z`);
function shiftDate(date: string, days: number, months = 0) {
  const d = utc(date);
  if (months) {
    const day = d.getUTCDate();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + months);
    const length = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
    ).getUTCDate();
    d.setUTCDate(Math.min(day, length));
  }
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Month-grid date picker with an optional event list for the selected day. */
export function Calendar({
  label,
  value,
  onChange,
  month,
  onMonthChange,
  min,
  max,
  disabledDates = [],
  isDateDisabled,
  locale,
  weekStartsOn = 0,
  today,
  disabled = false,
  events,
  previousLabel = "Previous month",
  nextLabel = "Next month",
  emptyEventsLabel = "No events",
  eventCountLabel = (count) => (count === 1 ? "1 event" : `${count} events`),
}: CalendarProps) {
  const headingId = useId();
  const eventsId = useId();
  const grid = useRef<HTMLDivElement>(null);
  const pending = useRef<string | null>(null);
  const [ownMonth, setOwnMonth] = useState(
    () => month ?? (value ?? today).slice(0, 7),
  );
  const [active, setActive] = useState<string | null>(null);
  const shown = month ?? ownMonth;
  // A keyboard target in another month is focused once that month renders.
  useEffect(() => {
    const target = pending.current;
    if (!target || target.slice(0, 7) !== shown) return;
    pending.current = null;
    grid.current
      ?.querySelector<HTMLElement>(`time[datetime="${target}"]`)
      ?.parentElement?.focus();
  });

  const format = (date: string, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(
      utc(date),
    );
  const fullDate = (date: string) => format(date, { dateStyle: "full" });
  const first = `${shown}-01`;
  const last = shiftDate(shiftDate(first, 0, 1), -1);
  const weekIndex = (date: string) =>
    (utc(date).getUTCDay() - weekStartsOn + 7) % 7;
  const end = shiftDate(last, 6 - weekIndex(last));
  const weeks: string[][] = [];
  for (
    let d = shiftDate(first, -weekIndex(first));
    d <= end;
    d = shiftDate(d, 7)
  )
    weeks.push(Array.from({ length: 7 }, (_, i) => shiftDate(d, i)));
  const unavailable = (date: string) =>
    (min !== undefined && date < min) ||
    (max !== undefined && date > max) ||
    disabledDates.includes(date) ||
    (isDateDisabled?.(date) ?? false);
  const visible = (date: string | null) =>
    date?.slice(0, 7) === shown ? date : undefined;
  const inside = weeks.flat().filter((date) => date.startsWith(shown));
  const tabStop =
    visible(active) ??
    visible(value) ??
    visible(today) ??
    inside.find((date) => !unavailable(date)) ??
    inside[0];
  const eventsOn = (date: string) =>
    (events ?? []).filter((event) => event.date === date);

  const showMonth = (next: string) => {
    if (month === undefined) setOwnMonth(next);
    onMonthChange?.(next);
  };
  const choose = (date: string) => {
    if (disabled || unavailable(date)) return;
    onChange(date);
    setActive(date);
    if (date.slice(0, 7) !== shown) {
      pending.current = date;
      showMonth(date.slice(0, 7));
    }
  };
  const move = (event: KeyboardEvent<HTMLButtonElement>, date: string) => {
    if (disabled) return;
    const offset = weekIndex(date);
    // [days, months] per key; Home/End respect the week start.
    const step = (
      {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [-7, 0],
        ArrowDown: [7, 0],
        Home: [-offset, 0],
        End: [6 - offset, 0],
        PageUp: [0, -1],
        PageDown: [0, 1],
      } as Record<string, [number, number]>
    )[event.key];
    if (!step) return;
    event.preventDefault();
    let next = shiftDate(date, ...step);
    if (min !== undefined && next < min) next = min;
    if (max !== undefined && next > max) next = max;
    if (next === date) return;
    pending.current = next;
    setActive(next);
    if (next.slice(0, 7) !== shown) showMonth(next.slice(0, 7));
  };

  const previous = shiftDate(first, 0, -1);
  const following = shiftDate(first, 0, 1);
  const selected = value ?? today;
  const selectedEvents = eventsOn(selected);
  const chevron = (d: string) => (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
      <path
        d={d}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
  return (
    <div className="m-calendar" role="group" aria-label={label}>
      <div className="m-calendar-month">
        <div className="m-calendar-header">
          <h2 id={headingId} aria-live="polite">
            {format(first, { month: "long", year: "numeric" })}
          </h2>
          <Button
            variant="ghost"
            aria-label={previousLabel}
            disabled={
              disabled || (min !== undefined && shiftDate(first, -1) < min)
            }
            onClick={() => showMonth(previous.slice(0, 7))}
          >
            {chevron("m12 5-5 5 5 5")}
          </Button>
          <Button
            variant="ghost"
            aria-label={nextLabel}
            disabled={disabled || (max !== undefined && following > max)}
            onClick={() => showMonth(following.slice(0, 7))}
          >
            {chevron("m8 5 5 5-5 5")}
          </Button>
        </div>
        <div
          ref={grid}
          className="m-calendar-grid"
          role="grid"
          aria-labelledby={headingId}
        >
          <div className="m-calendar-row" role="row">
            {weeks[0].map((date) => (
              <div
                key={date}
                role="columnheader"
                aria-label={format(date, { weekday: "long" })}
              >
                {format(date, { weekday: "short" })}
              </div>
            ))}
          </div>
          {weeks.map((week) => (
            <div key={week[0]} className="m-calendar-row" role="row">
              {week.map((date) => {
                const count = eventsOn(date).length;
                return (
                  <div
                    key={date}
                    role="gridcell"
                    aria-selected={date === value}
                  >
                    <button
                      type="button"
                      className="m-calendar-day"
                      tabIndex={date === tabStop ? 0 : -1}
                      aria-label={
                        count
                          ? `${fullDate(date)}, ${eventCountLabel(count)}`
                          : fullDate(date)
                      }
                      aria-current={date === today ? "date" : undefined}
                      aria-disabled={unavailable(date) || undefined}
                      data-outside={date.startsWith(shown) ? undefined : ""}
                      disabled={disabled}
                      onClick={() => choose(date)}
                      onFocus={() => setActive(date)}
                      onKeyDown={(event) => move(event, date)}
                    >
                      <time dateTime={date}>{utc(date).getUTCDate()}</time>
                      {count > 0 && (
                        <span className="m-calendar-dot" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {events && (
        <section className="m-calendar-events" aria-labelledby={eventsId}>
          <h3 id={eventsId}>{fullDate(selected)}</h3>
          {selectedEvents.length ? (
            <ol>
              {selectedEvents.map((event) => (
                <li key={event.id}>
                  {event.time && <span>{event.time}</span>}
                  {event.href ? (
                    <KitLink href={event.href}>{event.title}</KitLink>
                  ) : (
                    <span>{event.title}</span>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p>{emptyEventsLabel}</p>
          )}
        </section>
      )}
    </div>
  );
}
