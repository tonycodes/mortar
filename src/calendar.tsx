import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

export interface CalendarEvent {
  id: string;
  /** Day of the event as YYYY-MM-DD. */
  date: string;
  title: string;
  /** Display time, e.g. "10:00". */
  time?: string;
}

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
}) {
  const today = todayProp || localToday();
  const [ownMonth, setOwnMonth] = useState(
    controlledMonth || monthOf(selected || today),
  );
  const month = controlledMonth || ownMonth;
  const [focused, setFocused] = useState(selected || today);
  const focusDate = monthOf(focused) === month ? focused : `${month}-01`;
  const moved = useRef(false);
  const grid = useRef<HTMLTableElement>(null);
  const headingId = useId();

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
  const offset = (new Date(toTime(first)).getUTCDay() - weekStartsOn + 7) % 7;
  const start = addDays(first, -offset);
  const weeks = Array.from({ length: 6 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)),
  );

  function showMonth(next: string) {
    if (!controlledMonth) setOwnMonth(next);
    onMonthChange?.(next);
  }
  function move(date: string) {
    moved.current = true;
    setFocused(date);
    if (monthOf(date) !== month) showMonth(monthOf(date));
  }
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    grid.current
      ?.querySelector<HTMLButtonElement>(`[data-date="${focusDate}"]`)
      ?.focus();
  });
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, date: string) {
    const weekday = (new Date(toTime(date)).getUTCDay() - weekStartsOn + 7) % 7;
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

  return (
    <div className="m-calendar" data-variant={variant}>
      <div className="m-calendar-header">
        <h2 id={headingId} aria-live="polite">
          {formats.title.format(new Date(toTime(first)))}
        </h2>
        <div className="m-calendar-nav">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => step(-1)}
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="m12 5-5 5 5 5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button type="button" aria-label="Next month" onClick={() => step(1)}>
            <svg
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="m8 5 5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
      <table role="grid" aria-labelledby={headingId} ref={grid}>
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
                      aria-label={
                        count
                          ? `${name}, ${count} ${count === 1 ? "event" : "events"}`
                          : name
                      }
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
