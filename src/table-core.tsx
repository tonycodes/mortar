// Table building blocks shared by DataTable and DataGrid. Internal: the public
// types are re-exported from application.tsx and the package entry.
import { useEffect, useRef, type ReactNode } from "react";
export type SortDirection = "ascending" | "descending";
export interface TableSort {
  key: string;
  direction: SortDirection;
}
export interface DataTableColumn<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  /** `end` aligns numbers and amounts to the trailing edge. */
  align?: "start" | "end";
  /** Enable header sorting. Supply sortValue unless row[key] is a string, number or Date. */
  sortable?: boolean;
  sortValue?: (row: T) => string | number | Date | null | undefined;
  /** CSS width, e.g. "12rem" or "30%". */
  width?: string;
  /** Clip long values to one line with an ellipsis. */
  truncate?: boolean;
  /**
   * How long the column stays as the table narrows (its own width, not the
   * screen's): `medium` hides below 480px, `low` below 768px. The first
   * column always shows. Hidden columns leave the accessibility tree too, so
   * keep what people need in visible columns or on the detail page.
   */
  priority?: "high" | "medium" | "low";
  /**
   * `end` pins the column to the trailing edge while the table scrolls
   * sideways, so a row-actions or status column stays reachable.
   */
  pin?: "end";
}
/** Responsive attributes shared by a column's `col`, header and cells. */
export function columnLayout<T>(col: DataTableColumn<T>, index: number) {
  return {
    "data-priority":
      index > 0 && col.priority && col.priority !== "high"
        ? col.priority
        : undefined,
    "data-pin": col.pin,
  };
}
const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});
const isEmpty = (v: unknown) => v === null || v === undefined || v === "";
function compareValues(a: unknown, b: unknown) {
  if (isEmpty(a) || isEmpty(b))
    return isEmpty(a) === isEmpty(b) ? 0 : isEmpty(a) ? 1 : -1;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "number" && typeof b === "number") return a - b;
  return collator.compare(String(a), String(b));
}
/** Stable sort; empty values always sort last regardless of direction. */
export function sortRows<T>(
  rows: T[],
  column: Pick<DataTableColumn<T>, "key" | "sortValue">,
  direction: SortDirection,
) {
  const value =
    column.sortValue ||
    ((row: T) => (row as Record<string, unknown>)[column.key] as string);
  const sign = direction === "ascending" ? 1 : -1;
  return rows
    .map((row, index) => ({ row, index, v: value(row) }))
    .sort(
      (a, b) =>
        // Empty values sort last in both directions, so only real values flip.
        (isEmpty(a.v) || isEmpty(b.v) ? 1 : sign) * compareValues(a.v, b.v) ||
        a.index - b.index,
    )
    .map((entry) => entry.row);
}
export function SelectAll({
  checked,
  partial,
  onChange,
}: {
  checked: boolean;
  partial: boolean;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = partial;
  }, [partial]);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label="Select all rows"
      checked={checked}
      onChange={onChange}
    />
  );
}
/** Buckets ordered rows by group; groups keep their first-appearance order in the unsorted rows. */
export function groupRows<T>(
  rows: T[],
  ordered: T[],
  groupBy: (row: T) => string,
) {
  const groups = new Map<string, T[]>(rows.map((row) => [groupBy(row), []]));
  ordered.forEach((row) => groups.get(groupBy(row))!.push(row));
  return [...groups];
}
/** Full-width header row that labels the rows of its tbody. */
export function TableGroupRow({
  label,
  span,
}: {
  label: string;
  span: number;
}) {
  return (
    <tr className="m-table-group">
      <th colSpan={span} scope="rowgroup">
        {label}
      </th>
    </tr>
  );
}
export const columnAlign = (align?: "start" | "end") =>
  align === "end" ? "end" : undefined;
