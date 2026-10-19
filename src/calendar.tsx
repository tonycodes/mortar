import type React from "react";
import {
  type CSSProperties,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { SegmentedControl } from "./inspection.js";
import { ChevronLeft, ChevronRight } from "./icons.js";
import { childLevel, headingTag, type HeadingLevel } from "./heading.js";
import { componentRoot, cx } from "./internal.js";

export interface CalendarEvent {
  id: string;
  /** Day of the event as YYYY-MM-DD. */
  date: string;
  title: string;
  /** Display time, e.g. "10:00". */
  time?: string;
  /** Start as HH:MM; positions the event in week and day views. Omit for all-day. */
  start?: string;
  /** End as HH:MM; defaults to an hour after start. */
  end?: string;
  /** Avatar or icon beside the event in the month view's `agenda`. */
  media?: ReactNode;
}
export type CalendarView = "year" | "month" | "week" | "day";

// Dates are YYYY-MM-DD strings handled in UTC, so no local time zone can shift a day.
const DAY = 86_400_000;
const toTime = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const toDate = (time: number) => new Date(time).toISOString().slice(0, 10);
const addDays = (date: string, days: number) =>
  toDate(toTime(date) + days * DAY);
function addMonths(date: string, months: number) {
  const [y, m, d] = date.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return toDate(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), Math.min(d, last)),
  );
}
const monthOf = (date: string) => date.slice(0, 7);
/** Column of a date in a week starting on `weekStartsOn` (0 = Sunday). */
const weekdayIndex = (date: string, weekStartsOn: number) =>
  (new Date(toTime(date)).getUTCDay() - weekStartsOn + 7) % 7;
/** A day button's name: the full date, plus how many events it has. */
const dayLabel = (name: string, count: number) =>
  count ? `${name}, ${count} ${count === 1 ? "event" : "events"}` : name;
const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
};

/** Shortest drawn event, in minutes, so an event at the edge stays visible. */
const MIN_DRAWN = 30;

/**
 * Place timed events between `min` and `max` minutes and assign overlapping
 * ones to side-by-side lanes. Events that start before `min` or end after
 * `max` are drawn at the edge and flagged as clipped.
 */
function layout(events: CalendarEvent[], min: number, max: number) {
  const timed = events
    .filter((e) => e.start)
    .map((e) => {
      const start = toMinutes(e.start!);
      const end = e.end ? toMinutes(e.end) : start + 60;
      const top = Math.min(Math.max(start, min), max - MIN_DRAWN);
      const bottom = Math.max(Math.min(end, max), top + MIN_DRAWN);
      return {
        event: e,
        top,
        bottom,
        clippedStart: start < min,
        clippedEnd: end > max,
      };
    })
    .sort((a, b) => a.top - b.top || a.bottom - b.bottom);
  type Placed = (typeof timed)[number] & { lane: number; lanes: number };
  const out: Placed[] = [];
  let cluster: Placed[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;
  const flush = () => {
    const lanes = Math.max(1, ...cluster.map((c) => c.lane + 1));
    cluster.forEach((c) => (c.lanes = lanes));
    out.push(...cluster);
    cluster = [];
    laneEnds = [];
    clusterEnd = -1;
  };
  for (const item of timed) {
    if (cluster.length && item.top >= clusterEnd) flush();
    let lane = laneEnds.findIndex((end) => end <= item.top);
    if (lane < 0) {
      lane = laneEnds.length;
      laneEnds.push(item.bottom);
    } else laneEnds[lane] = item.bottom;
    cluster.push({ ...item, lane, lanes: 1 });
    clusterEnd = Math.max(clusterEnd, item.bottom);
  }
  if (cluster.length) flush();
  return out;
}
function localToday() {
  const now = new Date();
  return toDate(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

export interface CalendarProps {
  /** Displayed month as YYYY-MM. Omit to follow `date`. */
  month?: string;
  /** Called with YYYY-MM whenever the current date moves into another month, in any view. */
  onMonthChange?: (month: string) => void;
  /**
   * The current date as YYYY-MM-DD: the month view's focusable day, the
   * year shown in the year view and the week or day shown in the time views.
   * Omit to let the calendar manage it; it starts at `selected` or today.
   */
  date?: string;
  /** Called with the new current date after navigation in any view. */
  onDateChange?: (date: string) => void;
  /** Selected day as YYYY-MM-DD. */
  selected?: string;
  onSelect?: (date: string) => void;
  events?: CalendarEvent[];
  /** Month view only: `full` lists each day's events in its cell. */
  variant?: "compact" | "full";
  weekStartsOn?: 0 | 1;
  /** Override today's date (YYYY-MM-DD), e.g. for tests or a user's time zone. */
  today?: string;
  locale?: string;
  /** Month view with `variant="full"` only: events listed per day before "+N more". */
  maxEvents?: number;
  /** Twelve months, one month grid, or a time grid for one week or one day. */
  view?: CalendarView;
  /** Shows a Year/Month/Week/Day switcher when provided. */
  onViewChange?: (view: CalendarView) => void;
  /** Makes events in week and day views, and in the agenda, buttons. */
  onEventSelect?: (id: string) => void;
  /**
   * Month view only: lists the events of the selected day (or the current
   * date when nothing is selected) beside the month, or below it when
   * narrow, under a "Schedule for" heading one level below the title.
   */
  agenda?: boolean;
  /**
   * First and last hour shown in week and day views. Events that start or
   * end outside them are drawn at the edge with a dashed border and keep
   * their real times in their text.
   */
  dayStartHour?: number;
  dayEndHour?: number;
  /** Level of the title (month, year, week or day); month and day headings are one below. */
  headingLevel?: HeadingLevel;
  id?: string;
  className?: string;
}

/**
 * Calendar with year, month, week and day views. One current date (`date`)
 * is shared by every view, so moving through months and then switching to
 * the week view shows a week of the month you reached. The month and year
 * views are grids with keyboard navigation; the week and day views place
 * timed events on an hour grid.
 */
export function Calendar({
  month: controlledMonth,
  onMonthChange,
  date: controlledDate,
  onDateChange,
  selected,
  onSelect,
  events = [],
  variant = "compact",
  weekStartsOn = 1,
  today: todayProp,
  locale = "en-GB",
  maxEvents = 2,
  view = "month",
  onViewChange,
  onEventSelect,
  agenda = false,
  dayStartHour = 8,
  dayEndHour = 19,
  headingLevel = 2,
  id,
  className,
}: CalendarProps) {
  const today = todayProp || localToday();
  const [ownDate, setOwnDate] = useState(() => {
    const start = selected || today;
    return controlledMonth && monthOf(start) !== controlledMonth
      ? `${controlledMonth}-01`
      : start;
  });
  // Follow a changed `selected` or `month` prop when the date is uncontrolled.
  const [seen, setSeen] = useState({ selected, month: controlledMonth });
  if (seen.selected !== selected || seen.month !== controlledMonth) {
    setSeen({ selected, month: controlledMonth });
    if (controlledDate === undefined) {
      let next = selected && selected !== seen.selected ? selected : ownDate;
      if (controlledMonth && monthOf(next) !== controlledMonth)
        next = `${controlledMonth}-01`;
      if (next !== ownDate) setOwnDate(next);
    }
  }
  const date = controlledDate ?? ownDate;
  const month = controlledMonth ?? monthOf(date);
  const focusDate = monthOf(date) === month ? date : `${month}-01`;
  const moved = useRef(false);
  const grid = useRef<HTMLElement>(null);
  const headingId = useId();
  const Heading = headingTag(headingLevel);
  const SubHeading = headingTag(childLevel(headingLevel));
  const rootClass = cx("m-calendar", className);

  const formats = useMemo(
    () => ({
      title: new Intl.DateTimeFormat(locale, {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
      day: new Intl.DateTimeFormat(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
      short: new Intl.DateTimeFormat(locale, {
        weekday: "short",
        timeZone: "UTC",
      }),
      long: new Intl.DateTimeFormat(locale, {
        weekday: "long",
        timeZone: "UTC",
      }),
      narrow: new Intl.DateTimeFormat(locale, {
        weekday: "narrow",
        timeZone: "UTC",
      }),
      monthName: new Intl.DateTimeFormat(locale, {
        month: "long",
        timeZone: "UTC",
      }),
    }),
    [locale],
  );
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events)
      map.set(event.date, [...(map.get(event.date) || []), event]);
    return map;
  }, [events]);

  const first = `${month}-01`;
  const start = addDays(first, -weekdayIndex(first, weekStartsOn));
  const weeks = Array.from({ length: 6 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)),
  );

  function setDate(next: string) {
    if (next === date) return;
    if (controlledDate === undefined) setOwnDate(next);
    onDateChange?.(next);
    if (monthOf(next) !== month) onMonthChange?.(monthOf(next));
  }
  const year = date.slice(0, 4);
  function move(next: string) {
    moved.current = true;
    setDate(next);
  }
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    const target = view === "year" ? date : focusDate;
    grid.current
      ?.querySelector<HTMLButtonElement>(`[data-date="${target}"]`)
      ?.focus();
  });
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, day: string) {
    const weekday = weekdayIndex(day, weekStartsOn);
    const next = {
      ArrowLeft: () => addDays(day, -1),
      ArrowRight: () => addDays(day, 1),
      ArrowUp: () => addDays(day, -7),
      ArrowDown: () => addDays(day, 7),
      Home: () => addDays(day, -weekday),
      End: () => addDays(day, 6 - weekday),
      PageUp: () => addMonths(day, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(day, event.shiftKey ? 12 : 1),
    }[event.key];
    if (!next) return;
    event.preventDefault();
    move(next());
  }
  const step = (months: number) => setDate(addMonths(focusDate, months));

  const switcher = onViewChange && (
    <SegmentedControl
      label="Calendar view"
      value={view}
      options={[
        { value: "year", label: "Year" },
        { value: "month", label: "Month" },
        { value: "week", label: "Week" },
        { value: "day", label: "Day" },
      ]}
      onChange={(next) => onViewChange(next as CalendarView)}
    />
  );
  if (view === "year") {
    const shiftYear = (by: number) => setDate(addMonths(date, 12 * by));
    const label = (day: string) =>
      dayLabel(
        formats.day.format(new Date(toTime(day))),
        byDay.get(day)?.length ?? 0,
      );
    return (
      <div
        id={id}
        {...componentRoot("Calendar")}
        className={rootClass}
        data-view="year"
      >
        <div className="m-calendar-header">
          <Heading
            id={headingId}
            className="m-calendar-title"
            aria-live="polite"
          >
            {year}
          </Heading>
          {switcher}
          <div className="m-calendar-nav">
            <NavButton
              label="Previous year"
              direction="back"
              onClick={() => shiftYear(-1)}
            />
            <NavButton
              label="Next year"
              direction="forward"
              onClick={() => shiftYear(1)}
            />
          </div>
        </div>
        <div
          className="m-calendar-year"
          ref={grid as React.RefObject<HTMLDivElement>}
        >
          {Array.from({ length: 12 }, (_, i) => {
            const mm = String(i + 1).padStart(2, "0");
            const firstDay = `${year}-${mm}-01`;
            const lead = weekdayIndex(firstDay, weekStartsOn);
            const cells = Array.from({ length: 42 }, (_, n) =>
              addDays(firstDay, n - lead),
            );
            const titleId = `${headingId}-m${mm}`;
            return (
              <section
                key={mm}
                className="m-calendar-month"
                aria-labelledby={titleId}
              >
                <SubHeading id={titleId} className="m-calendar-month-title">
                  {formats.monthName.format(new Date(toTime(firstDay)))}
                </SubHeading>
                <table>
                  <thead>
                    <tr>
                      {cells.slice(0, 7).map((day) => {
                        const d = new Date(toTime(day));
                        return (
                          <th
                            key={day}
                            scope="col"
                            abbr={formats.long.format(d)}
                          >
                            {formats.narrow.format(d)}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 6 }, (_, w) => (
                      <tr key={w}>
                        {cells.slice(w * 7, w * 7 + 7).map((day) =>
                          monthOf(day) === `${year}-${mm}` ? (
                            <td key={day}>
                              <button
                                type="button"
                                data-date={day}
                                tabIndex={day === date ? 0 : -1}
                                aria-current={
                                  day === today ? "date" : undefined
                                }
                                aria-pressed={day === selected}
                                aria-label={label(day)}
                                onClick={() => {
                                  setDate(day);
                                  onSelect?.(day);
                                }}
                                onKeyDown={(event) => onKeyDown(event, day)}
                              >
                                <span className="m-calendar-day">
                                  {Number(day.slice(8))}
                                </span>
                                {byDay.has(day) && (
                                  <span
                                    className="m-calendar-dot"
                                    aria-hidden="true"
                                  />
                                )}
                              </button>
                            </td>
                          ) : (
                            <td key={day} />
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            );
          })}
        </div>
      </div>
    );
  }
  if (view !== "month")
    return (
      <TimeGrid
        view={view}
        date={date}
        onDateChange={setDate}
        events={byDay}
        today={today}
        selected={selected}
        weekStartsOn={weekStartsOn}
        locale={locale}
        formats={formats}
        headingId={headingId}
        headingLevel={headingLevel}
        switcher={switcher}
        onEventSelect={onEventSelect}
        dayStartHour={dayStartHour}
        dayEndHour={dayEndHour}
        id={id}
        className={rootClass}
      />
    );

  const monthGrid = (
    <>
      <div className="m-calendar-header">
        <Heading id={headingId} className="m-calendar-title" aria-live="polite">
          {formats.title.format(new Date(toTime(first)))}
        </Heading>
        {switcher}
        <div className="m-calendar-nav">
          <NavButton
            label="Previous month"
            direction="back"
            onClick={() => step(-1)}
          />
          <NavButton
            label="Next month"
            direction="forward"
            onClick={() => step(1)}
          />
        </div>
      </div>
      <table
        role="grid"
        aria-labelledby={headingId}
        ref={grid as React.RefObject<HTMLTableElement>}
      >
        <thead>
          <tr>
            {weeks[0].map((day) => {
              const d = new Date(toTime(day));
              return (
                <th key={day} scope="col" abbr={formats.long.format(d)}>
                  {formats.short.format(d)}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week[0]}>
              {week.map((day) => {
                const dayEvents = byDay.get(day) || [];
                const count = dayEvents.length;
                const name = formats.day.format(new Date(toTime(day)));
                const listed = variant === "full" && count > 0;
                return (
                  <td
                    key={day}
                    aria-selected={day === selected ? true : undefined}
                    data-outside={monthOf(day) !== month || undefined}
                  >
                    <button
                      type="button"
                      data-date={day}
                      tabIndex={day === focusDate ? 0 : -1}
                      aria-current={day === today ? "date" : undefined}
                      aria-pressed={day === selected}
                      aria-describedby={
                        listed ? `${headingId}-${day}` : undefined
                      }
                      aria-label={dayLabel(name, count)}
                      onClick={() => {
                        setDate(day);
                        onSelect?.(day);
                      }}
                      onKeyDown={(event) => onKeyDown(event, day)}
                    >
                      <span className="m-calendar-day">
                        {Number(day.slice(8))}
                      </span>
                      {count > 0 && (
                        <span className="m-calendar-dot" aria-hidden="true" />
                      )}
                    </button>
                    {listed && (
                      <ol
                        className="m-calendar-events"
                        id={`${headingId}-${day}`}
                      >
                        {dayEvents.slice(0, maxEvents).map((event) => (
                          <li key={event.id}>
                            {event.time && <time>{event.time}</time>}
                            {event.time && " "}
                            {event.title}
                          </li>
                        ))}
                        {count > maxEvents && (
                          <li className="m-calendar-more">
                            +{count - maxEvents} more
                          </li>
                        )}
                      </ol>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
  const rootProps = {
    ...componentRoot("Calendar"),
    id,
    className: rootClass,
    "data-variant": variant === "full" ? "full" : undefined,
  };
  if (!agenda) return <div {...rootProps}>{monthGrid}</div>;
  const agendaDay = selected ?? date;
  const agendaEvents = [...(byDay.get(agendaDay) || [])].sort((a, b) =>
    (a.start ?? a.time ?? "").localeCompare(b.start ?? b.time ?? ""),
  );
  const agendaId = `${headingId}-agenda`;
  return (
    <div {...rootProps} data-agenda="true">
      <div className="m-calendar-main">{monthGrid}</div>
      <section className="m-calendar-agenda" aria-labelledby={agendaId}>
        <SubHeading
          id={agendaId}
          className="m-calendar-agenda-title"
          aria-live="polite"
        >
          Schedule for{" "}
          <time dateTime={agendaDay}>
            {formats.day.format(new Date(toTime(agendaDay)))}
          </time>
        </SubHeading>
        {agendaEvents.length ? (
          <ol className="m-calendar-agenda-list">
            {agendaEvents.map((event) => {
              const when = event.start ? (
                <>
                  <time>{event.start}</time>
                  {event.end && (
                    <>
                      –<time>{event.end}</time>
                    </>
                  )}
                </>
              ) : event.time ? (
                <time>{event.time}</time>
              ) : (
                "All day"
              );
              // The space keeps the title and time apart in a button's name.
              const text = (
                <>
                  <strong>{event.title}</strong>{" "}
                  <span className="m-calendar-event-time">{when}</span>
                </>
              );
              return (
                <li key={event.id}>
                  {event.media}
                  {onEventSelect ? (
                    <button
                      type="button"
                      className="m-calendar-agenda-text"
                      onClick={() => onEventSelect(event.id)}
                    >
                      {text}
                    </button>
                  ) : (
                    <p className="m-calendar-agenda-text">{text}</p>
                  )}
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="m-calendar-none">No events</p>
        )}
      </section>
    </div>
  );
}

function NavButton({
  label,
  direction,
  onClick,
}: {
  label: string;
  direction: "back" | "forward";
  onClick: () => void;
}) {
  return (
    <button type="button" aria-label={label} onClick={onClick}>
      {direction === "back" ? <ChevronLeft /> : <ChevronRight />}
    </button>
  );
}

/** Week and day views: labelled day groups whose events are positioned on an hour grid. */
function TimeGrid({
  view,
  date,
  onDateChange,
  events,
  today,
  selected,
  weekStartsOn,
  locale,
  formats,
  headingId,
  headingLevel,
  switcher,
  onEventSelect,
  dayStartHour,
  dayEndHour,
  id,
  className,
}: {
  view: "week" | "day";
  date: string;
  onDateChange: (date: string) => void;
  events: Map<string, CalendarEvent[]>;
  today: string;
  selected?: string;
  weekStartsOn: 0 | 1;
  locale: string;
  formats: { day: Intl.DateTimeFormat; short: Intl.DateTimeFormat };
  headingId: string;
  headingLevel: HeadingLevel;
  switcher: ReactNode;
  onEventSelect?: (id: string) => void;
  dayStartHour: number;
  dayEndHour: number;
  id?: string;
  className: string;
}) {
  const Heading = headingTag(headingLevel);
  const DayHeading = headingTag(childLevel(headingLevel));
  const offset = weekdayIndex(date, weekStartsOn);
  const days =
    view === "week"
      ? Array.from({ length: 7 }, (_, i) => addDays(date, i - offset))
      : [date];
  const step = view === "week" ? 7 : 1;
  const unit = view === "week" ? "week" : "day";
  const range = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const title =
    view === "week"
      ? range.formatRange(
          new Date(toTime(days[0])),
          new Date(toTime(days[days.length - 1])),
        )
      : formats.day.format(new Date(toTime(date)));
  const first = dayStartHour * 60;
  const span = Math.max(60, (dayEndHour - dayStartHour) * 60);
  const pct = (n: number) =>
    `${(Math.min(Math.max(n, 0), 1) * 100).toFixed(4)}%`;
  const hours = Array.from(
    { length: dayEndHour - dayStartHour },
    (_, i) => dayStartHour + i,
  );
  const times = (event: CalendarEvent) => (
    <span className="m-calendar-event-time">
      <time>{event.start}</time>
      {event.end && (
        <>
          –<time>{event.end}</time>
        </>
      )}
    </span>
  );
  const item = (event: CalendarEvent, timed: boolean) => {
    // The space keeps the title and time apart in the accessible name.
    const inner = (
      <>
        {event.title}
        {timed && " "}
        {timed && times(event)}
      </>
    );
    return onEventSelect ? (
      <button
        type="button"
        className="m-calendar-event"
        onClick={() => onEventSelect(event.id)}
      >
        {inner}
      </button>
    ) : timed ? (
      <div className="m-calendar-event">{inner}</div>
    ) : (
      inner
    );
  };
  return (
    <div
      id={id}
      {...componentRoot("Calendar")}
      className={className}
      data-view={view}
    >
      <div className="m-calendar-header">
        <Heading id={headingId} className="m-calendar-title" aria-live="polite">
          {title}
        </Heading>
        {switcher}
        <div className="m-calendar-nav">
          <NavButton
            label={`Previous ${unit}`}
            direction="back"
            onClick={() => onDateChange(addDays(date, -step))}
          />
          <NavButton
            label={`Next ${unit}`}
            direction="forward"
            onClick={() => onDateChange(addDays(date, step))}
          />
        </div>
      </div>
      <div
        className="m-calendar-timegrid"
        style={
          {
            "--m-hours": hours.length,
            "--m-days": days.length,
          } as CSSProperties
        }
      >
        <div className="m-calendar-hours" aria-hidden="true">
          {hours.map((h) => (
            <span key={h}>{`${String(h).padStart(2, "0")}:00`}</span>
          ))}
        </div>
        <div className="m-calendar-columns" data-count={days.length}>
          {days.map((day) => {
            const dayEvents = events.get(day) || [];
            const allDay = dayEvents.filter((e) => !e.start);
            const timed = layout(dayEvents, first, first + span);
            const d = new Date(toTime(day));
            const labelId = `${headingId}-${day}`;
            return (
              <div
                key={day}
                role="group"
                className="m-calendar-column"
                aria-labelledby={labelId}
                data-selected={day === selected || undefined}
              >
                <DayHeading
                  id={labelId}
                  className="m-calendar-column-heading"
                  aria-current={day === today ? "date" : undefined}
                >
                  <span className="m-calendar-column-label" aria-hidden="true">
                    <span>{formats.short.format(d)}</span>
                    <strong>{Number(day.slice(8))}</strong>
                  </span>
                  <span className="m-sr-only">{formats.day.format(d)}</span>
                </DayHeading>
                {allDay.length > 0 && (
                  <ul className="m-calendar-allday" aria-label="All day">
                    {allDay.map((event) => (
                      <li key={event.id}>{item(event, false)}</li>
                    ))}
                  </ul>
                )}
                {timed.length > 0 ? (
                  <ol className="m-calendar-slots">
                    {timed.map((t) => (
                      <li
                        key={t.event.id}
                        data-clipped-start={t.clippedStart || undefined}
                        data-clipped-end={t.clippedEnd || undefined}
                        style={
                          {
                            "--m-top": pct((t.top - first) / span),
                            "--m-height": pct((t.bottom - t.top) / span),
                            "--m-lane": t.lane,
                            "--m-lanes": t.lanes,
                          } as CSSProperties
                        }
                      >
                        {item(t.event, true)}
                      </li>
                    ))}
                  </ol>
                ) : allDay.length ? (
                  // Keeps the hour lines in columns that only have all-day events.
                  <div className="m-calendar-slots" aria-hidden="true" />
                ) : (
                  <p className="m-calendar-none">No events</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
