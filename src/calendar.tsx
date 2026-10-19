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

/** Assign overlapping timed events to side-by-side lanes. */
function layout(events: CalendarEvent[]) {
  const timed = events
    .filter((e) => e.start)
    .map((e) => {
      const start = toMinutes(e.start!);
      return { event: e, start, end: e.end ? toMinutes(e.end) : start + 60 };
    })
    .sort((a, b) => a.start - b.start || a.end - b.end);
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
    if (cluster.length && item.start >= clusterEnd) flush();
    let lane = laneEnds.findIndex((end) => end <= item.start);
    if (lane < 0) {
      lane = laneEnds.length;
      laneEnds.push(item.end);
    } else laneEnds[lane] = item.end;
    cluster.push({ ...item, lane, lanes: 1 });
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  if (cluster.length) flush();
  return out;
}
function localToday() {
  const now = new Date();
  return toDate(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

/** Month grid with keyboard navigation; compact for picking dates, full for showing events. */
export function Calendar({
  month: controlledMonth,
  onMonthChange,
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
  onDateChange,
  dayStartHour = 8,
  dayEndHour = 19,
}: {
  /** Displayed month as YYYY-MM. Omit to let the calendar manage it. */
  month?: string;
  onMonthChange?: (month: string) => void;
  /** Selected day as YYYY-MM-DD. */
  selected?: string;
  onSelect?: (date: string) => void;
  events?: CalendarEvent[];
  variant?: "compact" | "full";
  weekStartsOn?: 0 | 1;
  /** Override today's date (YYYY-MM-DD), e.g. for tests or a user's time zone. */
  today?: string;
  locale?: string;
  /** Events listed per day in the full variant before "+N more". */
  maxEvents?: number;
  /** Twelve months, one month grid, or a time grid for one week or one day. */
  view?: CalendarView;
  /** Shows a Month/Week/Day switcher when provided. */
  onViewChange?: (view: CalendarView) => void;
  /** Makes events in week and day views buttons. */
  onEventSelect?: (id: string) => void;
  /** Week and day views: called with the new anchor date after Previous/Next. */
  onDateChange?: (date: string) => void;
  /** First and last hour shown in week and day views. */
  dayStartHour?: number;
  dayEndHour?: number;
}) {
  const today = todayProp || localToday();
  const [ownMonth, setOwnMonth] = useState(
    controlledMonth || monthOf(selected || today),
  );
  const month = controlledMonth || ownMonth;
  const [focused, setFocused] = useState(selected || today);
  const focusDate = monthOf(focused) === month ? focused : `${month}-01`;
  const moved = useRef(false);
  const grid = useRef<HTMLElement>(null);
  const headingId = useId();
  const [anchor, setAnchor] = useState(selected || today);

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

  function showMonth(next: string) {
    if (!controlledMonth) setOwnMonth(next);
    onMonthChange?.(next);
  }
  const year = anchor.slice(0, 4);
  const yearFocus = focused.slice(0, 4) === year ? focused : `${year}-01-01`;
  const showAnchor = (date: string) => {
    setAnchor(date);
    onDateChange?.(date);
  };
  function move(date: string) {
    moved.current = true;
    setFocused(date);
    if (view === "year") {
      if (date.slice(0, 4) !== year) showAnchor(date);
    } else if (monthOf(date) !== month) showMonth(monthOf(date));
  }
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    const target = view === "year" ? yearFocus : focusDate;
    grid.current
      ?.querySelector<HTMLButtonElement>(`[data-date="${target}"]`)
      ?.focus();
  });
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, date: string) {
    const weekday = weekdayIndex(date, weekStartsOn);
    const next = {
      ArrowLeft: () => addDays(date, -1),
      ArrowRight: () => addDays(date, 1),
      ArrowUp: () => addDays(date, -7),
      ArrowDown: () => addDays(date, 7),
      Home: () => addDays(date, -weekday),
      End: () => addDays(date, 6 - weekday),
      PageUp: () => addMonths(date, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(date, event.shiftKey ? 12 : 1),
    }[event.key];
    if (!next) return;
    event.preventDefault();
    move(next());
  }
  const step = (months: number) => {
    const next = addMonths(`${month}-01`, months);
    showMonth(monthOf(next));
    setFocused(monthOf(focused) === monthOf(next) ? focused : next);
  };

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
    const shiftYear = (by: number) => {
      showAnchor(addMonths(anchor, 12 * by));
      setFocused(addMonths(yearFocus, 12 * by));
    };
    const label = (date: string) =>
      dayLabel(
        formats.day.format(new Date(toTime(date))),
        byDay.get(date)?.length ?? 0,
      );
    return (
      <div className="m-calendar" data-view="year">
        <div className="m-calendar-header">
          <h2 id={headingId} aria-live="polite">
            {year}
          </h2>
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
                <h3 id={titleId}>
                  {formats.monthName.format(new Date(toTime(firstDay)))}
                </h3>
                <table>
                  <thead>
                    <tr>
                      {cells.slice(0, 7).map((date) => {
                        const d = new Date(toTime(date));
                        return (
                          <th
                            key={date}
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
                        {cells.slice(w * 7, w * 7 + 7).map((date) =>
                          monthOf(date) === `${year}-${mm}` ? (
                            <td key={date}>
                              <button
                                type="button"
                                data-date={date}
                                tabIndex={date === yearFocus ? 0 : -1}
                                aria-current={
                                  date === today ? "date" : undefined
                                }
                                aria-pressed={date === selected}
                                aria-label={label(date)}
                                onClick={() => {
                                  setFocused(date);
                                  onSelect?.(date);
                                }}
                                onKeyDown={(event) => onKeyDown(event, date)}
                              >
                                <span className="m-calendar-day">
                                  {Number(date.slice(8))}
                                </span>
                                {byDay.has(date) && (
                                  <span
                                    className="m-calendar-dot"
                                    aria-hidden="true"
                                  />
                                )}
                              </button>
                            </td>
                          ) : (
                            <td key={date} />
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
        anchor={anchor}
        onAnchorChange={showAnchor}
        events={byDay}
        today={today}
        selected={selected}
        weekStartsOn={weekStartsOn}
        locale={locale}
        formats={formats}
        headingId={headingId}
        switcher={switcher}
        onEventSelect={onEventSelect}
        dayStartHour={dayStartHour}
        dayEndHour={dayEndHour}
      />
    );

  return (
    <div className="m-calendar" data-variant={variant}>
      <div className="m-calendar-header">
        <h2 id={headingId} aria-live="polite">
          {formats.title.format(new Date(toTime(first)))}
        </h2>
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
            {weeks[0].map((date) => {
              const d = new Date(toTime(date));
              return (
                <th key={date} scope="col" abbr={formats.long.format(d)}>
                  {formats.short.format(d)}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week[0]}>
              {week.map((date) => {
                const dayEvents = byDay.get(date) || [];
                const count = dayEvents.length;
                const name = formats.day.format(new Date(toTime(date)));
                const listed = variant === "full" && count > 0;
                return (
                  <td
                    key={date}
                    aria-selected={date === selected ? true : undefined}
                    data-outside={monthOf(date) !== month || undefined}
                  >
                    <button
                      type="button"
                      data-date={date}
                      tabIndex={date === focusDate ? 0 : -1}
                      aria-current={date === today ? "date" : undefined}
                      aria-describedby={
                        listed ? `${headingId}-${date}` : undefined
                      }
                      aria-label={dayLabel(name, count)}
                      onClick={() => {
                        setFocused(date);
                        if (monthOf(date) !== month) showMonth(monthOf(date));
                        onSelect?.(date);
                      }}
                      onKeyDown={(event) => onKeyDown(event, date)}
                    >
                      <span className="m-calendar-day">
                        {Number(date.slice(8))}
                      </span>
                      {count > 0 && (
                        <span className="m-calendar-dot" aria-hidden="true" />
                      )}
                    </button>
                    {listed && (
                      <ol
                        className="m-calendar-events"
                        id={`${headingId}-${date}`}
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

/** Week and day views: labelled day sections whose events are positioned on an hour grid. */
function TimeGrid({
  view,
  anchor,
  onAnchorChange,
  events,
  today,
  selected,
  weekStartsOn,
  locale,
  formats,
  headingId,
  switcher,
  onEventSelect,
  dayStartHour,
  dayEndHour,
}: {
  view: "week" | "day";
  anchor: string;
  onAnchorChange: (date: string) => void;
  events: Map<string, CalendarEvent[]>;
  today: string;
  selected?: string;
  weekStartsOn: 0 | 1;
  locale: string;
  formats: { day: Intl.DateTimeFormat; short: Intl.DateTimeFormat };
  headingId: string;
  switcher: ReactNode;
  onEventSelect?: (id: string) => void;
  dayStartHour: number;
  dayEndHour: number;
}) {
  const offset = weekdayIndex(anchor, weekStartsOn);
  const days =
    view === "week"
      ? Array.from({ length: 7 }, (_, i) => addDays(anchor, i - offset))
      : [anchor];
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
      : formats.day.format(new Date(toTime(anchor)));
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
    const inner = (
      <>
        {event.title}
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
    <div className="m-calendar" data-view={view}>
      <div className="m-calendar-header">
        <h2 id={headingId} aria-live="polite">
          {title}
        </h2>
        {switcher}
        <div className="m-calendar-nav">
          <NavButton
            label={`Previous ${unit}`}
            direction="back"
            onClick={() => onAnchorChange(addDays(anchor, -step))}
          />
          <NavButton
            label={`Next ${unit}`}
            direction="forward"
            onClick={() => onAnchorChange(addDays(anchor, step))}
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
          {days.map((date) => {
            const dayEvents = events.get(date) || [];
            const allDay = dayEvents.filter((e) => !e.start);
            const timed = layout(dayEvents);
            const d = new Date(toTime(date));
            const labelId = `${headingId}-${date}`;
            return (
              <section
                key={date}
                className="m-calendar-column"
                aria-labelledby={labelId}
                data-selected={date === selected || undefined}
              >
                <h3
                  id={labelId}
                  aria-current={date === today ? "date" : undefined}
                >
                  <span className="m-calendar-column-label" aria-hidden="true">
                    <span>{formats.short.format(d)}</span>
                    <strong>{Number(date.slice(8))}</strong>
                  </span>
                  <span className="m-sr-only">{formats.day.format(d)}</span>
                </h3>
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
                        style={
                          {
                            "--m-top": pct((t.start - first) / span),
                            "--m-height": pct((t.end - t.start) / span),
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
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
