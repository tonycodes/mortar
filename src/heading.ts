// Shared heading-level helpers. Internal: not exported from the package entry.

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** The heading element for a level, e.g. `headingTag(2)` is `"h2"`. */
export function headingTag<L extends HeadingLevel>(level: L) {
  return `h${level}` as `h${L}`;
}

/** The level for headings nested under `level`, capped at `max` (default h6). */
export function childLevel(level: HeadingLevel, max: HeadingLevel = 6) {
  return Math.min(level + 1, max) as HeadingLevel;
}
