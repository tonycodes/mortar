// Shared decorative icons. Internal: not exported from the package entry.
import type { ReactNode } from "react";

/**
 * Decorative SVG on the 20×20 grid. Hidden from assistive technology unless
 * `decorative` is false; meaning is carried by surrounding text.
 */
export function Icon({
  className,
  viewBox = "0 0 20 20",
  fill = "none",
  stroke,
  strokeWidth,
  decorative = true,
  focusable = false,
  children,
}: {
  className?: string;
  viewBox?: string;
  /** SVG fill; `null` omits the attribute (paths set their own). */
  fill?: string | null;
  stroke?: string;
  strokeWidth?: string;
  /** Adds aria-hidden="true". */
  decorative?: boolean;
  /** Keep the SVG out of the tab order (focusable="false"); `true` omits the attribute. */
  focusable?: boolean;
  children: ReactNode;
}) {
  return (
    <svg
      className={className}
      viewBox={viewBox}
      fill={fill ?? undefined}
      stroke={stroke}
      strokeWidth={strokeWidth}
      aria-hidden={decorative ? "true" : undefined}
      focusable={decorative && !focusable ? "false" : undefined}
    >
      {children}
    </svg>
  );
}

/** Round-capped currentColor stroke. */
function Stroke({
  d,
  width,
  fill,
  join = true,
}: {
  d: string;
  width: string;
  fill?: string;
  /** Round line joins; the close glyph has none. */
  join?: boolean;
}) {
  return (
    <path
      d={d}
      fill={fill}
      stroke="currentColor"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin={join ? "round" : undefined}
    />
  );
}

export function ChevronDown() {
  return (
    <Icon>
      <Stroke d="m6 8 4 4 4-4" width="1.5" />
    </Icon>
  );
}

export function ChevronLeft() {
  return (
    <Icon>
      <Stroke d="m12 5-5 5 5 5" width="1.75" />
    </Icon>
  );
}

export function ChevronRight() {
  return (
    <Icon>
      <Stroke d="m8 5 5 5-5 5" width="1.75" />
    </Icon>
  );
}

/**
 * Check mark. The three call sites predate this module and differ:
 * `option` (listbox/combobox selected option), `list` (CheckList, 16×16 grid,
 * fill on the path) and `step` (ProgressSteps circles: stroke on the svg,
 * heavier weight, not aria-hidden because its marker span already is).
 */
export function Check({
  variant = "option",
  className,
}: {
  variant?: "option" | "list" | "step";
  className?: string;
}) {
  if (variant === "list")
    return (
      <Icon viewBox="0 0 16 16" fill={null}>
        <Stroke d="M3.5 8.5 6.5 11.5 12.5 4.5" width="1.75" fill="none" />
      </Icon>
    );
  if (variant === "step")
    return (
      <Icon stroke="currentColor" strokeWidth="2.5" decorative={false}>
        <path
          d="M5 10.5l3.5 3.5L15 7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Icon>
    );
  return (
    <Icon className={className}>
      <Stroke d="m5 10 3.5 3.5L15 7" width="1.75" />
    </Icon>
  );
}

export function Close() {
  return (
    <Icon>
      <Stroke d="m5 5 10 10M15 5 5 15" width="1.75" join={false} />
    </Icon>
  );
}

export function ArrowUp() {
  return (
    <Icon>
      <Stroke d="M10 15V5m0 0-4 4m4-4 4 4" width="1.75" />
    </Icon>
  );
}

export function ArrowDown() {
  return (
    <Icon>
      <Stroke d="M10 5v10m0 0-4-4m4 4 4-4" width="1.75" />
    </Icon>
  );
}

export function Star() {
  return (
    <Icon fill={null}>
      <path
        d="M10 1.8l2.5 5.3 5.8.7-4.3 4 1.1 5.7L10 14.7l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z"
        fill="currentColor"
      />
    </Icon>
  );
}

export function Paperclip() {
  return (
    <Icon>
      <Stroke
        d="M7 10.5l5-5a2.5 2.5 0 0 1 3.5 3.5l-6.5 6.5a4 4 0 0 1-5.7-5.7l6.2-6.2"
        width="1.5"
      />
    </Icon>
  );
}

/** Generic person silhouette for avatars without a photo (24×24 grid, filled). */
export function Person({ className }: { className?: string }) {
  return (
    <Icon
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      focusable
    >
      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0 1 12.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />
    </Icon>
  );
}

/** Table sort indicator; the active direction's chevron is marked data-active. */
export function SortArrows({
  direction,
}: {
  direction?: "ascending" | "descending";
}) {
  return (
    <Icon viewBox="0 0 12 12" fill={null}>
      <path
        d="M3.5 4.5 6 2l2.5 2.5"
        data-active={direction === "ascending" || undefined}
      />
      <path
        d="M3.5 7.5 6 10l2.5-2.5"
        data-active={direction === "descending" || undefined}
      />
    </Icon>
  );
}

const EYE =
  "M1.75 10S4.75 4.25 10 4.25 18.25 10 18.25 10 15.25 15.75 10 15.75 1.75 10 1.75 10zM10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z";
/** Open eye: shown while a password is hidden. */
export function Eye() {
  return (
    <Icon>
      <Stroke d={EYE} width="1.5" />
    </Icon>
  );
}

/** Struck-through eye: shown while a password is visible. */
export function EyeOff() {
  return (
    <Icon>
      <Stroke d={EYE + "M3 3l14 14"} width="1.5" />
    </Icon>
  );
}

/** Hollow circle: a requirement that is not met yet. */
export function Circle() {
  return (
    <Icon>
      <Stroke d="M10 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" width="1.5" />
    </Icon>
  );
}
