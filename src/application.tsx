import { KitLink, type ItemGroup, type LinkItem } from "./navigation.js";
import {
  useId,
  useRef,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Button, EmptyState, Input, Notice, type Tone } from "./primitives.js";
import { BrandMark } from "./layout.js";
import { ArrowDown, ArrowUp, Check, SortArrows } from "./icons.js";
import { headingTag } from "./heading.js";
import {
  LinkContent,
  MobileNavDialog,
  SectionIntro,
  TermList,
  introSlots,
  useDomId,
} from "./internal.js";
/** A navigation link; `icon` replaces the default marker in the sidebar. */
export interface NavigationItem extends LinkItem {
  /** Sub-pages; the item becomes a disclosure, open when a child is current. */
  children?: NavigationItem[];
}
export interface AppShellProps {
  brand: string;
  /** Logo node shown in place of the placeholder brand mark. */
  logo?: ReactNode;
  workspace?: string;
  user?: ReactNode;
  navigation: NavigationItem[];
  secondaryNavigation?: ItemGroup<NavigationItem>[];
  header?: ReactNode;
  actions?: ReactNode;
  /** Secondary column beside the main content (multi-column layout). */
  aside?: ReactNode;
  /** Accessible name for the secondary column. */
  asideLabel?: string;
  children: ReactNode;
}
function SidebarContent({
  brand,
  logo,
  workspace,
  homeHref,
  navigation,
  sections = [],
  footer,
  label = "Primary",
  onNavigate,
}: SidebarProps & { onNavigate?: () => void }) {
  const links = (items: NavigationItem[]): ReactNode[] =>
    items.map((item, index) =>
      item.children?.length ? (
        <details
          key={`${item.label}:${item.href}:${index}`}
          className="m-nav-group"
          open={item.children.some((child) => child.current) || undefined}
        >
          <summary>
            <LinkContent
              prefix="nav"
              marker
              icon={item.icon}
              label={item.label}
            />
          </summary>
          <div className="m-nav-children">{links(item.children)}</div>
        </details>
      ) : (
        <KitLink
          key={`${item.label}:${item.href}:${index}`}
          href={item.href}
          aria-current={item.current ? "page" : undefined}
          onClick={onNavigate}
        >
          <LinkContent
            prefix="nav"
            marker
            icon={item.icon}
            label={item.label}
            count={item.count}
            countWhen="truthy"
          />
        </KitLink>
      ),
    );
  return (
    <>
      {brand && (
        <KitLink
          className="m-workspace"
          href={homeHref || navigation[0]?.href || "#"}
        >
          <BrandMark logo={logo} />
          <span>
            <strong>{brand}</strong>
            {workspace && <small>{workspace}</small>}
          </span>
        </KitLink>
      )}
      <nav aria-label={label}>
        {links(navigation)}
        {sections.map((group) => (
          <section key={group.label}>
            <h2>{group.label}</h2>
            {links(group.items)}
          </section>
        ))}
      </nav>
      {footer && <div className="m-user">{footer}</div>}
    </>
  );
}
export interface SidebarProps {
  brand?: string;
  logo?: ReactNode;
  workspace?: string;
  /** Destination for the brand link; defaults to the first navigation item. */
  homeHref?: string;
  navigation: NavigationItem[];
  sections?: ItemGroup<NavigationItem>[];
  /** Account menu or other content pinned to the bottom. */
  footer?: ReactNode;
  label?: string;
}
/** Vertical application navigation; AppShell composes the same content. */
export function Sidebar(props: SidebarProps) {
  return (
    <div className="m-sidebar-panel">
      <SidebarContent {...props} />
    </div>
  );
}
export function AppShell({
  brand,
  logo,
  workspace,
  user,
  navigation,
  secondaryNavigation = [],
  header,
  actions,
  aside,
  asideLabel = "Details",
  children,
}: AppShellProps) {
  const [open, setOpen] = useState(false);
  const sidebar = {
    brand,
    logo,
    workspace,
    navigation,
    sections: secondaryNavigation,
    footer: user,
  };
  return (
    <div className="m-app-shell">
      <KitLink className="m-skip" href="#m-content">
        Skip to content
      </KitLink>
      <aside className="m-sidebar">
        <SidebarContent {...sidebar} />
      </aside>
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
        {aside ? (
          <div className="m-app-columns">
            <main id="m-content" tabIndex={-1}>
              {children}
            </main>
            <aside className="m-app-aside" aria-label={asideLabel}>
              {aside}
            </aside>
          </div>
        ) : (
          <main id="m-content" tabIndex={-1}>
            {children}
          </main>
        )}
      </div>
      <MobileNavDialog open={open} onClose={() => setOpen(false)} title={brand}>
        <SidebarContent {...sidebar} onNavigate={() => setOpen(false)} />
      </MobileNavDialog>
    </div>
  );
}
/** Top navigation with a centred page column: Tailwind's stacked application layout. */
export function StackedShell({
  brand,
  logo,
  homeHref,
  navigation,
  actions,
  header,
  width = "lg",
  children,
}: {
  brand: string;
  logo?: ReactNode;
  homeHref?: string;
  navigation: NavigationItem[];
  actions?: ReactNode;
  /** Page heading shown above the content, e.g. a PageHeading. */
  header?: ReactNode;
  width?: "md" | "lg" | "xl" | "full";
  children: ReactNode;
}) {
  const contentId = useDomId("m-stacked-");
  return (
    <div className="m-stacked-shell">
      <KitLink className="m-skip" href={`#${contentId}`}>
        Skip to content
      </KitLink>
      <Navbar
        brand={brand}
        logo={logo}
        homeHref={homeHref}
        items={navigation}
        actions={actions}
      />
      <main id={contentId} tabIndex={-1} data-width={width}>
        {header && <div className="m-stacked-header">{header}</div>}
        {children}
      </main>
    </div>
  );
}
/** Horizontal application navigation that collapses into a menu on narrow screens. */
export function Navbar({
  brand,
  logo,
  homeHref = "/",
  items,
  actions,
  label = "Primary",
}: {
  brand: string;
  logo?: ReactNode;
  homeHref?: string;
  items: NavigationItem[];
  actions?: ReactNode;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <header className="m-navbar">
      <KitLink className="m-brand" href={homeHref}>
        <BrandMark logo={logo} />
        {brand}
      </KitLink>
      <Button
        variant="ghost"
        className="m-navbar-toggle"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        Menu
      </Button>
      <nav id={id} aria-label={label} data-open={open}>
        {items.map((item, index) => (
          <KitLink
            key={`${item.label}:${item.href}:${index}`}
            href={item.href}
            aria-current={item.current ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            <LinkContent
              prefix="nav"
              icon={item.icon}
              label={item.label}
              count={item.count}
              countWhen="truthy"
            />
          </KitLink>
        ))}
      </nav>
      {actions && <div className="m-actions">{actions}</div>}
    </header>
  );
}
export interface BreadcrumbItem {
  label: string;
  href?: string;
}
/** Trail to the current page; the item without an href is the current page. */
export function Breadcrumbs({
  items,
  label = "Breadcrumb",
  separator = "slash",
}: {
  items: BreadcrumbItem[];
  label?: string;
  separator?: "slash" | "chevron";
}) {
  return (
    <nav
      className="m-breadcrumbs"
      aria-label={label}
      data-separator={separator}
    >
      <ol>
        {items.map((b, i) => (
          <li key={i}>
            {b.href ? (
              <KitLink href={b.href}>{b.label}</KitLink>
            ) : (
              <span aria-current="page">{b.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
export type TabNavItem = LinkItem;
/** Tabs that link between pages, e.g. settings sections. Uses links, not ARIA tabs. */
export function TabNav({
  label,
  items,
  variant = "underline",
  fullWidth = false,
}: {
  label: string;
  items: TabNavItem[];
  /** Underlined tabs (default) or filled pills. */
  variant?: "underline" | "pills";
  /** Stretch the tabs to share the full width. */
  fullWidth?: boolean;
}) {
  return (
    <nav
      className="m-tab-nav"
      aria-label={label}
      data-variant={variant === "underline" ? undefined : variant}
      data-full-width={fullWidth || undefined}
    >
      <ul>
        {items.map((item) => (
          <li key={item.href}>
            <KitLink
              href={item.href}
              aria-current={item.current ? "page" : undefined}
            >
              <LinkContent
                prefix="tab"
                icon={item.icon}
                label={item.label}
                count={item.count}
                countWhen="defined"
              />
            </KitLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
export interface ProgressStep {
  id: string;
  name: string;
  description?: string;
  /** Lets people revisit the step, e.g. a completed form page. */
  href?: string;
  status: "complete" | "current" | "upcoming";
}
/** Where someone is in a multi-step flow. The current step is marked aria-current="step". */
export function ProgressSteps({
  steps,
  label = "Progress",
  variant = "simple",
}: {
  steps: ProgressStep[];
  label?: string;
  /** simple: bars with step numbers; circles: vertical with descriptions; bullets: "Step 2 of 4" with dots. */
  variant?: "simple" | "circles" | "bullets";
}) {
  const current = steps.findIndex((step) => step.status === "current");
  return (
    <nav className="m-progress-steps" aria-label={label} data-variant={variant}>
      {variant === "bullets" && current >= 0 && (
        <p>
          Step {current + 1} of {steps.length}
        </p>
      )}
      <ol>
        {steps.map((step, index) => {
          const body = (
            <>
              {variant !== "simple" && (
                <span className="m-progress-step-marker" aria-hidden="true">
                  {variant === "circles" && step.status === "complete" && (
                    <Check variant="step" />
                  )}
                </span>
              )}
              <span
                className={
                  variant === "bullets" ? "m-sr-only" : "m-progress-step-text"
                }
              >
                {variant === "simple" && (
                  <span className="m-progress-step-number">
                    Step {index + 1}
                  </span>
                )}
                <span className="m-progress-step-name">{step.name}</span>
                {step.description && variant === "circles" && (
                  <span className="m-progress-step-description">
                    {step.description}
                  </span>
                )}
                {step.status === "complete" && (
                  <span className="m-sr-only"> (completed)</span>
                )}
              </span>
            </>
          );
          const ariaCurrent =
            step.status === "current" ? ("step" as const) : undefined;
          return (
            <li key={step.id} data-status={step.status}>
              {step.href ? (
                <KitLink href={step.href} aria-current={ariaCurrent}>
                  {body}
                </KitLink>
              ) : (
                <span aria-current={ariaCurrent}>{body}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
/** Card with a title, explanation and one decisive action, e.g. deleting an account. */
export function ActionPanel({
  title,
  description,
  action,
  children,
  tone = "default",
  headingLevel = 2,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
  tone?: "default" | "danger";
  headingLevel?: 2 | 3;
}) {
  const id = useId();
  const [, headingSlot, descriptionSlot] = introSlots({
    title,
    description,
    id,
    headingLevel,
    descriptionClassName: null,
  });
  return (
    <section className="m-action-panel" aria-labelledby={id} data-tone={tone}>
      <div className="m-action-panel-text">
        {headingSlot}
        {descriptionSlot}
        {children}
      </div>
      {action && <div className="m-action-panel-action">{action}</div>}
    </section>
  );
}
export function PageHeading({
  title,
  description,
  eyebrow,
  actions,
  breadcrumbs,
  headingLevel = 1,
  meta = [],
  avatar,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  headingLevel?: 1 | 2;
  /** Facts under the title, e.g. "Full-time", "Remote", "Closes 9 January". */
  meta?: { label: string; icon?: ReactNode }[];
  /** Avatar or logo beside the title (decorative). */
  avatar?: ReactNode;
}) {
  const text = (
    <div>
      {...introSlots({
        eyebrow,
        title,
        description,
        headingLevel,
        descriptionClassName: null,
      })}
      {meta.length > 0 && (
        <ul className="m-heading-meta">
          {meta.map((item, index) => (
            <li key={`${item.label}:${index}`}>
              {item.icon && <span aria-hidden="true">{item.icon}</span>}
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
  return (
    <header className="m-page-heading">
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="m-heading-row">
        {avatar ? (
          <div className="m-heading-main">
            <span className="m-heading-avatar" aria-hidden="true">
              {avatar}
            </span>
            {text}
          </div>
        ) : (
          text
        )}
        {actions && <div className="m-actions">{actions}</div>}
      </div>
    </header>
  );
}
export function MetricGroup({
  label,
  items,
  variant = "shared",
}: {
  label: string;
  items: {
    label: string;
    value: string;
    change?: string;
    tone?: Tone;
    /** Decorative icon before the label. */
    icon?: ReactNode;
    /** Direction of the change: adds an arrow and announces "Increased by" or "Decreased by". */
    trend?: "up" | "down";
    /** Prior value for comparison, shown as "from …" after the value. */
    previous?: string;
  }[];
  /** `shared` joins metrics with shared borders; `cards` separates them into individual cards. */
  variant?: "shared" | "cards";
}) {
  return (
    <TermList
      className="m-metrics"
      aria-label={label}
      data-variant={variant === "cards" ? "cards" : undefined}
      items={items.map((item) => ({
        key: item.label,
        term: (
          <>
            {item.icon && (
              <span className="m-metric-icon" aria-hidden="true">
                {item.icon}
              </span>
            )}
            {item.label}
          </>
        ),
        details: (
          <>
            <strong>{item.value}</strong>
            {item.previous && (
              <span className="m-metric-previous">from {item.previous}</span>
            )}
            {item.change && (
              <span
                className={`m-tone-${item.tone || "neutral"}`}
                data-trend={item.trend}
              >
                {item.trend && (
                  <>
                    {item.trend === "up" ? <ArrowUp /> : <ArrowDown />}
                    <span className="m-sr-only">
                      {item.trend === "up" ? "Increased by " : "Decreased by "}
                    </span>
                  </>
                )}
                {item.change}
              </span>
            )}
          </>
        ),
      }))}
    />
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
  /** Group rows under full-width header rows. Groups keep the order in which they first appear in rows; sorting applies within each group. */
  groupBy?: (row: T) => string;
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
/** Buckets ordered rows by group; groups keep their first-appearance order in the unsorted rows. */
function groupRows<T>(rows: T[], ordered: T[], groupBy: (row: T) => string) {
  const groups = new Map<string, T[]>(rows.map((row) => [groupBy(row), []]));
  ordered.forEach((row) => groups.get(groupBy(row))!.push(row));
  return [...groups];
}
/** Full-width header row that labels the rows of its tbody. */
function TableGroupRow({ label, span }: { label: string; span: number }) {
  return (
    <tr className="m-table-group">
      <th colSpan={span} scope="rowgroup">
        {label}
      </th>
    </tr>
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
  groupBy,
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
  const span = columns.length + (onSelectionChange ? 1 : 0);
  const renderRow = (row: T) => {
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
                <KitLink className="m-row-link" href={href}>
                  {content}
                </KitLink>
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
  };
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
                          <SortArrows direction={direction} />
                        </button>
                      ) : (
                        col.label
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            {groupBy ? (
              groupRows(rows, visibleRows, groupBy).map(([label, group]) => (
                <tbody key={label}>
                  <TableGroupRow label={label} span={span} />
                  {group.map(renderRow)}
                </tbody>
              ))
            ) : (
              <tbody>{visibleRows.map(renderRow)}</tbody>
            )}
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
  rows = [],
  groups,
  rowHeaders = true,
  striped = false,
}: {
  caption: string;
  captionVisible?: boolean;
  columns: { key: string; label: string; align?: "left" | "right" }[];
  rows?: Record<string, ReactNode>[];
  /** Labelled row groups, each its own tbody under a full-width header row. Ungrouped rows render first. */
  groups?: { label: string; rows: Record<string, ReactNode>[] }[];
  /** Treat the first column as row headers. */
  rowHeaders?: boolean;
  striped?: boolean;
}) {
  const renderRow = (row: Record<string, ReactNode>, i: number) => (
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
  );
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
        {(!groups || rows.length > 0) && <tbody>{rows.map(renderRow)}</tbody>}
        {groups?.map((group, g) => (
          <tbody key={g}>
            <TableGroupRow label={group.label} span={columns.length} />
            {group.rows.map(renderRow)}
          </tbody>
        ))}
      </table>
    </div>
  );
}
/** Page numbers to show: first, last and the current page's neighbours, with gaps. */
function pageWindow(page: number, count: number) {
  const pages = new Set([1, count, page - 1, page, page + 1]);
  const shown = [...pages]
    .filter((n) => n >= 1 && n <= count)
    .sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  shown.forEach((n, i) => {
    if (i && n - shown[i - 1] > 1) out.push("gap");
    out.push(n);
  });
  return out;
}
export function Pagination({
  page,
  pageCount,
  onChange,
  numbered = false,
  summary,
  label = "Pagination",
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  /** Show individual page buttons between Previous and Next. */
  numbered?: boolean;
  /** "Showing 51 to 60 of 114 results". */
  summary?: { from: number; to: number; total: number; noun?: string };
  /** Accessible name; give each pagination on a page a distinct one. */
  label?: string;
}) {
  const count = Math.max(1, pageCount);
  return (
    <nav className="m-pagination" aria-label={label}>
      {summary ? (
        <p aria-live="polite">
          Showing <strong>{summary.from}</strong> to{" "}
          <strong>{summary.to}</strong> of <strong>{summary.total}</strong>{" "}
          {summary.noun ?? "results"}
        </p>
      ) : (
        <span aria-live="polite">
          Page {page} of {count}
        </span>
      )}
      <div className="m-actions">
        <Button
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </Button>
        {numbered && (
          <div className="m-pagination-pages">
            {pageWindow(page, count).map((n, i) =>
              n === "gap" ? (
                <span
                  key={`gap-${i}`}
                  className="m-pagination-gap"
                  aria-hidden="true"
                >
                  …
                </span>
              ) : (
                <button
                  key={n}
                  type="button"
                  aria-current={n === page ? "page" : undefined}
                  aria-label={`Page ${n}`}
                  onClick={() => onChange(n)}
                >
                  {n}
                </button>
              ),
            )}
          </div>
        )}
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
        <SectionIntro
          title={title}
          description={description}
          id={id}
          descriptionClassName={null}
        />
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
    /** Avatar of who acted; replaces the tone dot. */
    actor?: ReactNode;
    /** Comment text, shown as a quote under the title. */
    body?: ReactNode;
  }[];
}) {
  return (
    <ol className="m-activity" aria-label={label}>
      {items.map((item) => (
        <li key={item.id}>
          {item.actor ? (
            <span className="m-activity-actor">{item.actor}</span>
          ) : (
            <span
              aria-hidden="true"
              className={`m-activity-dot m-tone-${item.tone || "neutral"}`}
            />
          )}
          <div>
            <strong>{item.title}</strong>
            {item.description && <p>{item.description}</p>}
            {item.body && (
              <blockquote className="m-activity-body">{item.body}</blockquote>
            )}
          </div>
          <span>{item.time}</span>
        </li>
      ))}
    </ol>
  );
}

export interface SignInProvider {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
}
/**
 * Brand-consistent sign-in surface. Mortar renders the form; the consumer's auth
 * SDK supplies provider redirects and the email-link request through callbacks.
 */
export function SignInPanel({
  title,
  description,
  logo,
  providers = [],
  email,
  footer,
  dividerLabel = "or",
  headingLevel = 1,
  aside,
}: {
  title: string;
  /** Use 2 when the panel sits inside a page that already has an h1. */
  headingLevel?: 1 | 2;
  /** Image or quote beside the form on wide screens (split-screen layout). */
  aside?: ReactNode;
  description?: string;
  logo?: ReactNode;
  providers?: SignInProvider[];
  email?: {
    onSubmit: (email: string) => void;
    label?: string;
    placeholder?: string;
    submitLabel?: string;
    status?: "idle" | "submitting" | "success" | "error";
    message?: string;
  };
  footer?: ReactNode;
  dividerLabel?: string;
}) {
  const [value, setValue] = useState("");
  const headingId = useId();
  const Heading = headingTag(headingLevel);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (email?.status !== "submitting") email?.onSubmit(value);
  };
  const panel = (
    <section className="m-sign-in" aria-labelledby={headingId}>
      <header>
        {logo && <BrandMark logo={logo} />}
        <Heading id={headingId}>{title}</Heading>
        {description && <p>{description}</p>}
      </header>
      {providers.length > 0 && (
        <div className="m-sign-in-providers">
          {providers.map((provider) => (
            <Button
              key={provider.id}
              variant="secondary"
              onClick={provider.onSelect}
            >
              {provider.icon && (
                <span className="m-sign-in-icon" aria-hidden="true">
                  {provider.icon}
                </span>
              )}
              {provider.label}
            </Button>
          ))}
        </div>
      )}
      {providers.length > 0 && email && (
        <p className="m-sign-in-divider">
          <span>{dividerLabel}</span>
        </p>
      )}
      {email && (
        <form onSubmit={submit} aria-busy={email.status === "submitting"}>
          <Input
            label={email.label || "Email address"}
            type="email"
            autoComplete="email"
            placeholder={email.placeholder}
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            error={email.status === "error" ? email.message : undefined}
            disabled={email.status === "submitting"}
          />
          {email.status === "success" && (
            <p role="status">
              {email.message || "Check your inbox for a sign-in link."}
            </p>
          )}
          <Button type="submit" loading={email.status === "submitting"}>
            {email.submitLabel || "Email me a sign-in link"}
          </Button>
        </form>
      )}
      {footer && <footer>{footer}</footer>}
    </section>
  );
  return aside ? (
    <div className="m-sign-in-split">
      {panel}
      <div className="m-sign-in-aside">{aside}</div>
    </div>
  ) : (
    panel
  );
}
