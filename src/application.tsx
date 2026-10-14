import { useId, useRef, useEffect, useState, type ReactNode } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { Button, EmptyState, Notice, type Tone } from "./primitives.js";
export interface NavigationItem {
  label: string;
  href: string;
  current?: boolean;
  count?: string;
}
export interface AppShellProps {
  brand: string;
  workspace?: string;
  user?: ReactNode;
  navigation: NavigationItem[];
  secondaryNavigation?: { label: string; items: NavigationItem[] }[];
  header?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}
export function AppShell({
  brand,
  workspace,
  user,
  navigation,
  secondaryNavigation = [],
  header,
  actions,
  children,
}: AppShellProps) {
  const [open, setOpen] = useState(false);
  const links = (items: NavigationItem[]) =>
    items.map((item) => (
      <a
        key={item.href}
        href={item.href}
        aria-current={item.current ? "page" : undefined}
        onClick={() => setOpen(false)}
      >
        <span className="m-nav-marker" aria-hidden="true" />
        {item.label}
        {item.count && <span className="m-nav-count">{item.count}</span>}
      </a>
    ));
  const content = (
    <>
      <a className="m-workspace" href={navigation[0]?.href || "#"}>
        <span className="m-mark" aria-hidden="true" />
        <span>
          <strong>{brand}</strong>
          {workspace && <small>{workspace}</small>}
        </span>
      </a>
      <nav aria-label="Primary">
        {links(navigation)}
        {secondaryNavigation.map((group) => (
          <section key={group.label}>
            <h2>{group.label}</h2>
            {links(group.items)}
          </section>
        ))}
      </nav>
      {user && <div className="m-user">{user}</div>}
    </>
  );
  return (
    <div className="m-app-shell">
      <a className="m-skip" href="#m-content">
        Skip to content
      </a>
      <aside className="m-sidebar">{content}</aside>
      <div className="m-app-main">
        <header className="m-app-header">
          <Button
            variant="ghost"
            className="m-menu-trigger"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            Menu
          </Button>
          <div className="m-header-context">{header || workspace || brand}</div>
          <div className="m-actions">{actions}</div>
        </header>
        <main id="m-content" tabIndex={-1}>
          {children}
        </main>
      </div>
      <Dialog open={open} onClose={() => setOpen(false)} className="m-dialog">
        <div className="m-backdrop" aria-hidden="true" />
        <DialogPanel className="m-mobile-sidebar">
          <div className="m-dialog-heading">
            <DialogTitle>{brand}</DialogTitle>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Close navigation
            </Button>
          </div>
          {content}
        </DialogPanel>
      </Dialog>
    </div>
  );
}
export function PageHeading({
  title,
  description,
  eyebrow,
  actions,
  breadcrumbs,
  headingLevel = 1,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <header className="m-page-heading">
      {breadcrumbs && (
        <nav aria-label="Breadcrumb">
          <ol>
            {breadcrumbs.map((b, i) => (
              <li key={i}>
                {b.href ? (
                  <a href={b.href}>{b.label}</a>
                ) : (
                  <span aria-current="page">{b.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="m-heading-row">
        <div>
          {eyebrow && <p className="m-eyebrow">{eyebrow}</p>}
          <Heading>{title}</Heading>
          {description && <p>{description}</p>}
        </div>
        {actions && <div className="m-actions">{actions}</div>}
      </div>
    </header>
  );
}
export function MetricGroup({
  label,
  items,
}: {
  label: string;
  items: { label: string; value: string; change?: string; tone?: Tone }[];
}) {
  return (
    <dl className="m-metrics" aria-label={label}>
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>
            <strong>{item.value}</strong>
            {item.change && (
              <span className={`m-tone-${item.tone || "neutral"}`}>
                {item.change}
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
export type SortDirection = "ascending" | "descending";
export interface TableSort {
  key: string;
  direction: SortDirection;
}
export interface DataTableColumn<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right";
  /** Enable header sorting. Supply sortValue unless row[key] is a string, number or Date. */
  sortable?: boolean;
  sortValue?: (row: T) => string | number | Date | null | undefined;
  /** CSS width, e.g. "12rem" or "30%". */
  width?: string;
  /** Clip long values to one line with an ellipsis. */
  truncate?: boolean;
}
export interface DataTableProps<T extends { id: string }> {
  caption: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  rowLabel: (row: T) => string;
  /** Link each row's first cell to a detail page; the whole row becomes the click target. */
  rowHref?: (row: T) => string | undefined;
  /** Initial sort when the table sorts locally. */
  defaultSort?: TableSort;
  /** Controlled sort. With onSortChange the consumer orders rows (e.g. server-side). */
  sort?: TableSort | null;
  onSortChange?: (sort: TableSort) => void;
  /** Scroll height; the header sticks while rows scroll. */
  maxHeight?: string;
  density?: "default" | "compact";
  striped?: boolean;
  toolbar?: ReactNode;
  bulkActions?: ReactNode;
  /** Rendered under the rows inside the table card, e.g. Pagination. */
  footer?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  loading?: boolean;
  error?: string;
}
const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});
function compareValues(a: unknown, b: unknown) {
  const empty = (v: unknown) => v === null || v === undefined || v === "";
  if (empty(a) || empty(b))
    return empty(a) === empty(b) ? 0 : empty(a) ? 1 : -1;
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
    .sort((a, b) => {
      const empty = (v: unknown) => v === null || v === undefined || v === "";
      if (empty(a.v) || empty(b.v))
        return compareValues(a.v, b.v) || a.index - b.index;
      return sign * compareValues(a.v, b.v) || a.index - b.index;
    })
    .map((entry) => entry.row);
}
function SortIcon({ direction }: { direction?: SortDirection }) {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path
        d="M3.5 4.5 6 2l2.5 2.5"
        data-active={direction === "ascending" || undefined}
      />
      <path
        d="M3.5 7.5 6 10l2.5-2.5"
        data-active={direction === "descending" || undefined}
      />
    </svg>
  );
}
function SelectAll({
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
export function DataTable<T extends { id: string }>({
  caption,
  columns,
  rows,
  selectedIds = [],
  onSelectionChange,
  rowLabel,
  rowHref,
  defaultSort,
  sort: controlledSort,
  onSortChange,
  maxHeight,
  density = "default",
  striped = false,
  toolbar,
  bulkActions,
  footer,
  emptyTitle = "No records",
  emptyDescription = "Records will appear here when they are available.",
  loading,
  error,
}: DataTableProps<T>) {
  const [localSort, setLocalSort] = useState<TableSort | null>(
    defaultSort || null,
  );
  const sort = controlledSort !== undefined ? controlledSort : localSort;
  const sortColumn = sort && columns.find((c) => c.key === sort.key);
  const visibleRows =
    sort && sortColumn && !onSortChange
      ? sortRows(rows, sortColumn, sort.direction)
      : rows;
  const toggleSort = (key: string) => {
    const next: TableSort = {
      key,
      direction:
        sort?.key === key && sort.direction === "ascending"
          ? "descending"
          : "ascending",
    };
    if (controlledSort === undefined) setLocalSort(next);
    onSortChange?.(next);
  };
  const selected = rows.filter((row) => selectedIds.includes(row.id));
  return (
    <section
      className="m-data-table"
      aria-label={caption}
      data-density={density}
      data-striped={striped || undefined}
    >
      {(toolbar || selected.length > 0) && (
        <div className="m-table-toolbar">
          {selected.length > 0 ? (
            <>
              <strong>{selected.length} selected</strong>
              <div className="m-actions">
                {bulkActions}
                <Button variant="ghost" onClick={() => onSelectionChange?.([])}>
                  Clear selection
                </Button>
              </div>
            </>
          ) : (
            toolbar
          )}
        </div>
      )}
      {loading ? (
        <p className="m-table-state" role="status">
          Loading records…
        </p>
      ) : error ? (
        <Notice title="Unable to load records" tone="danger" announce>
          {error}
        </Notice>
      ) : !rows.length ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div
          className="m-table-scroll"
          role="region"
          aria-label={`${caption} scroll area`}
          tabIndex={0}
          style={maxHeight ? { maxHeight } : undefined}
          data-sticky={maxHeight ? true : undefined}
        >
          <table>
            <caption className="m-sr-only">{caption}</caption>
            {columns.some((col) => col.width) && (
              <colgroup>
                {onSelectionChange && <col className="m-table-select-col" />}
                {columns.map((col) => (
                  <col
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                  />
                ))}
              </colgroup>
            )}
            <thead>
              <tr>
                {onSelectionChange && (
                  <th scope="col">
                    <SelectAll
                      checked={selected.length === rows.length}
                      partial={
                        selected.length > 0 && selected.length < rows.length
                      }
                      onChange={() =>
                        onSelectionChange(
                          selected.length === rows.length
                            ? []
                            : rows.map((r) => r.id),
                        )
                      }
                    />
                  </th>
                )}
                {columns.map((col) => {
                  const direction =
                    sort?.key === col.key ? sort.direction : undefined;
                  return (
                    <th
                      key={col.key}
                      scope="col"
                      data-align={col.align}
                      aria-sort={col.sortable ? direction || "none" : undefined}
                    >
                      {col.sortable ? (
                        <button
                          type="button"
                          className="m-sort-button"
                          onClick={() => toggleSort(col.key)}
                        >
                          {col.label}
                          <SortIcon direction={direction} />
                        </button>
                      ) : (
                        col.label
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                const href = rowHref?.(row);
                return (
                  <tr
                    key={row.id}
                    data-selected={selectedIds.includes(row.id) || undefined}
                    data-linked={href ? true : undefined}
                  >
                    {onSelectionChange && (
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Select ${rowLabel(row)}`}
                          checked={selectedIds.includes(row.id)}
                          onChange={() =>
                            onSelectionChange(
                              selectedIds.includes(row.id)
                                ? selectedIds.filter((id) => id !== row.id)
                                : [...selectedIds, row.id],
                            )
                          }
                        />
                      </td>
                    )}
                    {columns.map((col, index) => {
                      const content = col.truncate ? (
                        <span className="m-truncate">{col.render(row)}</span>
                      ) : (
                        col.render(row)
                      );
                      return index === 0 ? (
                        <th
                          scope="row"
                          key={col.key}
                          data-align={col.align}
                          data-truncate={col.truncate || undefined}
                        >
                          {href ? (
                            <a className="m-row-link" href={href}>
                              {content}
                            </a>
                          ) : (
                            content
                          )}
                        </th>
                      ) : (
                        <td
                          key={col.key}
                          data-align={col.align}
                          data-truncate={col.truncate || undefined}
                        >
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {footer && <div className="m-table-footer">{footer}</div>}
    </section>
  );
}
/** Plain semantic table for documents, settings summaries and comparisons without row actions. */
export function Table({
  caption,
  captionVisible = false,
  columns,
  rows,
  rowHeaders = true,
  striped = false,
}: {
  caption: string;
  captionVisible?: boolean;
  columns: { key: string; label: string; align?: "left" | "right" }[];
  rows: Record<string, ReactNode>[];
  /** Treat the first column as row headers. */
  rowHeaders?: boolean;
  striped?: boolean;
}) {
  return (
    <div
      className="m-table"
      role="region"
      aria-label={caption}
      tabIndex={0}
      data-striped={striped || undefined}
    >
      <table>
        <caption className={captionVisible ? undefined : "m-sr-only"}>
          {caption}
        </caption>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col" data-align={col.align}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((col, index) =>
                index === 0 && rowHeaders ? (
                  <th key={col.key} scope="row" data-align={col.align}>
                    {row[col.key]}
                  </th>
                ) : (
                  <td key={col.key} data-align={col.align}>
                    {row[col.key]}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  return (
    <nav className="m-pagination" aria-label="Pagination">
      <span aria-live="polite">
        Page {page} of {Math.max(1, pageCount)}
      </span>
      <div className="m-actions">
        <Button
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          disabled={page >= pageCount}
          onClick={() => onChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section className="m-settings-section" aria-labelledby={id}>
      <div>
        <h2 id={id}>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      <div className="m-stack">{children}</div>
    </section>
  );
}
export function ActivityFeed({
  label,
  items,
}: {
  label: string;
  items: {
    id: string;
    title: string;
    description?: string;
    time: string;
    tone?: Tone;
  }[];
}) {
  return (
    <ol className="m-activity" aria-label={label}>
      {items.map((item) => (
        <li key={item.id}>
          <span
            aria-hidden="true"
            className={`m-activity-dot m-tone-${item.tone || "neutral"}`}
          />
          <div>
            <strong>{item.title}</strong>
            {item.description && <p>{item.description}</p>}
          </div>
          <span>{item.time}</span>
        </li>
      ))}
    </ol>
  );
}
