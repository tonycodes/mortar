import type { ReactNode } from "react";

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
