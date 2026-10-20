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
import { headingTag, type HeadingLevel } from "./heading.js";
import {
  LinkContent,
  NavGroups,
  NavTreeLinks,
  MobileNavDialog,
  TermList,
  cx,
  componentRoot,
  classedIntroSlots,
  useDomId,
} from "./internal.js";
/**
 * A navigation link; `icon` replaces the default marker in the sidebar. With
 * `children` the item becomes a disclosure: its own `href` is the first link
 * inside it, and it opens when it or a child is current.
 */
export interface NavigationItem extends LinkItem {
  /** Sub-pages; the item becomes a disclosure, open when it or a child is current. */
  children?: NavigationItem[];
}
export interface AppShellProps {
  brand: string;
  /** Logo node shown in place of the placeholder brand mark. */
  logo?: ReactNode;
  workspace?: string;
  /** Destination for the brand link; defaults to the first navigation item. */
  homeHref?: string;
  /** Account menu or other content pinned to the bottom of the sidebar. */
  footer?: ReactNode;
  navigation: NavigationItem[];
  /** Labelled groups of links under the main navigation. */
  sections?: ItemGroup<NavigationItem>[];
  header?: ReactNode;
  actions?: ReactNode;
  /** Secondary column beside the main content (multi-column layout). */
  aside?: ReactNode;
  /** Accessible name for the secondary column. */
  asideLabel?: string;
  children: ReactNode;
  className?: string;
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
}: Omit<SidebarProps, "className"> & { onNavigate?: () => void }) {
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
        <NavTreeLinks items={navigation} marker onNavigate={onNavigate} />
        <NavGroups groups={sections} marker onNavigate={onNavigate} />
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
  /** Labelled groups of links under the main navigation. */
  sections?: ItemGroup<NavigationItem>[];
  /** Account menu or other content pinned to the bottom. */
  footer?: ReactNode;
  /** Accessible name of the navigation landmark. */
  label?: string;
  className?: string;
}
/** Vertical application navigation; AppShell composes the same content. */
export function Sidebar({ className, ...props }: SidebarProps) {
  return (
    <div
      {...componentRoot("Sidebar")}
      className={cx("m-sidebar-panel", className)}
    >
      <SidebarContent {...props} />
    </div>
  );
}
export function AppShell({
  brand,
  logo,
  workspace,
  homeHref,
  footer,
  navigation,
  sections = [],
  header,
  actions,
  aside,
  asideLabel = "Details",
  children,
  className,
}: AppShellProps) {
  const [open, setOpen] = useState(false);
  const contentId = useDomId("m-content-");
  const sidebar = {
    brand,
    logo,
    workspace,
    homeHref,
    navigation,
    sections,
    footer,
  };
  const main = (
    <main id={contentId} tabIndex={-1}>
      {children}
    </main>
  );
  return (
    <div
      {...componentRoot("AppShell")}
      className={cx("m-app-shell", className)}
    >
      <KitLink className="m-skip" href={`#${contentId}`}>
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
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            Menu
          </Button>
          <div className="m-header-context">{header || workspace || brand}</div>
          <div className="m-actions">{actions}</div>
        </header>
        {aside ? (
          <div className="m-app-columns">
            {main}
            <aside className="m-app-aside" aria-label={asideLabel}>
              {aside}
            </aside>
          </div>
        ) : (
          main
        )}
      </div>
      <MobileNavDialog open={open} onClose={() => setOpen(false)} title={brand}>
        <SidebarContent {...sidebar} onNavigate={() => setOpen(false)} />
      </MobileNavDialog>
    </div>
  );
}
export interface StackedShellProps {
  brand: string;
  logo?: ReactNode;
  homeHref?: string;
  navigation: LinkItem[];
  actions?: ReactNode;
  /** Page heading shown above the content, e.g. a PageHeading. */
  header?: ReactNode;
  width?: "md" | "lg" | "xl" | "full";
  children: ReactNode;
  className?: string;
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
  className,
}: StackedShellProps) {
  const contentId = useDomId("m-stacked-");
  return (
    <div
      {...componentRoot("StackedShell")}
      className={cx("m-stacked-shell", className)}
    >
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
export interface NavbarProps {
  brand: string;
  logo?: ReactNode;
  homeHref?: string;
  /** Top-level links; the navbar has no sub-menus. */
  items: LinkItem[];
  actions?: ReactNode;
  /** Accessible name of the navigation landmark. */
  label?: string;
  className?: string;
}
/** Horizontal application navigation that collapses into a menu on narrow screens. */
export function Navbar({
  brand,
  logo,
  homeHref = "/",
  items,
  actions,
  label = "Primary",
  className,
}: NavbarProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <header {...componentRoot("Navbar")} className={cx("m-navbar", className)}>
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
      <nav id={id} aria-label={label} data-open={open || undefined}>
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
export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  label?: string;
  separator?: "slash" | "chevron";
  className?: string;
}
/** Trail to the current page; the item without an href is the current page. */
export function Breadcrumbs({
  items,
  label = "Breadcrumb",
  separator = "slash",
  className,
}: BreadcrumbsProps) {
  return (
    <nav
      {...componentRoot("Breadcrumbs")}
      className={cx("m-breadcrumbs", className)}
      aria-label={label}
      data-separator={separator === "slash" ? undefined : separator}
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
export interface TabNavProps {
  label: string;
  items: TabNavItem[];
  /** Underlined tabs (default) or filled pills. */
  variant?: "underline" | "pills";
  /** Stretch the tabs to share the full width. */
  fullWidth?: boolean;
  className?: string;
}
/** Tabs that link between pages, e.g. settings sections. Uses links, not ARIA tabs. */
export function TabNav({
  label,
  items,
  variant = "underline",
  fullWidth = false,
  className,
}: TabNavProps) {
  return (
    <nav
      {...componentRoot("TabNav")}
      className={cx("m-tab-nav", className)}
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
export interface ProgressStepsProps {
  steps: ProgressStep[];
  label?: string;
  /**
   * simple: bars with step numbers; circles: vertical with descriptions;
   * bullets: "Step 2 of 4" with dots; bar: one track filled up to the current
   * step with the names beneath, e.g. an order's delivery progress.
   */
  variant?: "simple" | "circles" | "bullets" | "bar";
  /**
   * `false` renders a labelled group instead of a navigation landmark, for
   * progress that reports status rather than offering wayfinding, e.g. an
   * order tracker (default true).
   */
  navigation?: boolean;
  className?: string;
}
/** Where someone is in a multi-step flow. The current step is marked aria-current="step". */
export function ProgressSteps({
  steps,
  label = "Progress",
  variant = "simple",
  navigation = true,
  className,
}: ProgressStepsProps) {
  const current = steps.findIndex((step) => step.status === "current");
  const Root = navigation ? "nav" : "div";
  return (
    <Root
      {...componentRoot("ProgressSteps")}
      className={cx("m-progress-steps", className)}
      role={navigation ? undefined : "group"}
      aria-label={label}
      data-variant={variant === "simple" ? undefined : variant}
    >
      {variant === "bullets" && current >= 0 && (
        <p>
          Step {current + 1} of {steps.length}
        </p>
      )}
      <ol>
        {steps.map((step, index) => {
          const body = (
            <>
              {(variant === "circles" || variant === "bullets") && (
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
    </Root>
  );
}
export interface ActionPanelProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
  /** `danger` marks a destructive action, e.g. deleting an account. */
  tone?: "default" | "danger";
  headingLevel?: HeadingLevel;
  id?: string;
  className?: string;
}
/** Card with a title, explanation and one decisive action, e.g. deleting an account. */
export function ActionPanel({
  title,
  description,
  action,
  children,
  tone = "default",
  headingLevel = 2,
  id,
  className,
}: ActionPanelProps) {
  const headingId = useId();
  const [, headingSlot, descriptionSlot] = classedIntroSlots(
    {
      title,
      description,
      id: headingId,
      headingLevel,
      descriptionClassName: null,
    },
    "m-action-panel-title",
  );
  return (
    <section
      id={id}
      {...componentRoot("ActionPanel")}
      className={cx("m-action-panel", className)}
      aria-labelledby={headingId}
      data-tone={tone === "default" ? undefined : tone}
    >
      <div className="m-action-panel-text">
        {headingSlot}
        {descriptionSlot}
        {children}
      </div>
      {action && <div className="m-action-panel-action">{action}</div>}
    </section>
  );
}
export interface PageHeadingProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  /** The page's h1 by default; use 2 when the page already has one. */
  headingLevel?: HeadingLevel;
  /** Facts under the title, e.g. "Full-time", "Remote", "Closes 9 January". */
  meta?: { label: string; icon?: ReactNode }[];
  /** Avatar or logo beside the title (decorative). */
  avatar?: ReactNode;
  id?: string;
  className?: string;
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
  id,
  className,
}: PageHeadingProps) {
  const text = (
    <div>
      {...classedIntroSlots(
        {
          eyebrow,
          title,
          description,
          headingLevel,
          descriptionClassName: null,
        },
        "m-page-title",
      )}
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
    <header
      id={id}
      {...componentRoot("PageHeading")}
      className={cx("m-page-heading", className)}
    >
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
export interface MetricGroupProps {
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
  className?: string;
}
export function MetricGroup({
  label,
  items,
  variant = "shared",
  className,
}: MetricGroupProps) {
  return (
    <TermList
      {...componentRoot("MetricGroup")}
      className={cx("m-metrics", className)}
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
                className="m-metric-change"
                data-tone={
                  item.tone && item.tone !== "neutral" ? item.tone : undefined
                }
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
  /** `end` aligns numbers and amounts to the trailing edge. */
  align?: "start" | "end";
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
  /** Selected row ids, which may include rows on other pages. */
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
  /** Shown when there are no rows. */
  empty?: { title: string; description?: string; action?: ReactNode };
  /** Level of the empty state's heading. */
  headingLevel?: HeadingLevel;
  loading?: boolean;
  error?: string;
  id?: string;
  className?: string;
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
const columnAlign = (align?: "start" | "end") =>
  align === "end" ? "end" : undefined;
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
  empty = {
    title: "No records",
    description: "Records will appear here when they are available.",
  },
  headingLevel = 3,
  loading,
  error,
  id,
  className,
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
  const pageIds = rows.map((row) => row.id);
  const selectedHere = pageIds.filter((rowId) => selectedIds.includes(rowId));
  const allHere = rows.length > 0 && selectedHere.length === rows.length;
  // Select all adds or removes this page's rows and keeps selections made on
  // other pages.
  const toggleAll = () =>
    onSelectionChange?.(
      allHere
        ? selectedIds.filter((rowId) => !pageIds.includes(rowId))
        : [
            ...selectedIds,
            ...pageIds.filter((rowId) => !selectedIds.includes(rowId)),
          ],
    );
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
                    ? selectedIds.filter((rowId) => rowId !== row.id)
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
              data-align={columnAlign(col.align)}
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
              data-align={columnAlign(col.align)}
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
      id={id}
      {...componentRoot("DataTable")}
      className={cx("m-data-table", className)}
      aria-label={caption}
      data-density={density === "default" ? undefined : density}
      data-striped={striped || undefined}
    >
      {(toolbar || selectedIds.length > 0) && (
        <div className="m-table-toolbar">
          {selectedIds.length > 0 ? (
            <>
              <strong>{selectedIds.length} selected</strong>
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
      {/* Mounted before loading starts so screen readers announce the change. */}
      <p
        className={loading ? "m-table-state" : "m-sr-only"}
        role="status"
        data-loading={loading || undefined}
      >
        {loading ? "Loading records…" : ""}
      </p>
      {loading ? null : error ? (
        <Notice title="Unable to load records" tone="danger" announce>
          {error}
        </Notice>
      ) : !rows.length ? (
        <EmptyState
          title={empty.title}
          description={empty.description}
          action={empty.action}
          headingLevel={headingLevel}
        />
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
                      checked={allHere}
                      partial={selectedHere.length > 0 && !allHere}
                      onChange={toggleAll}
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
                      data-align={columnAlign(col.align)}
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
export interface TableProps {
  caption: string;
  captionVisible?: boolean;
  /** `align: "end"` aligns numbers and amounts to the trailing edge. */
  columns: { key: string; label: string; align?: "start" | "end" }[];
  rows?: Record<string, ReactNode>[];
  /** Labelled row groups, each its own tbody under a full-width header row. Ungrouped rows render first. */
  groups?: { label: string; rows: Record<string, ReactNode>[] }[];
  /** Treat the first column as row headers. */
  rowHeaders?: boolean;
  striped?: boolean;
  id?: string;
  className?: string;
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
  id,
  className,
}: TableProps) {
  const renderRow = (row: Record<string, ReactNode>, i: number) => (
    <tr key={i}>
      {columns.map((col, index) =>
        index === 0 && rowHeaders ? (
          <th key={col.key} scope="row" data-align={columnAlign(col.align)}>
            {row[col.key]}
          </th>
        ) : (
          <td key={col.key} data-align={columnAlign(col.align)}>
            {row[col.key]}
          </td>
        ),
      )}
    </tr>
  );
  return (
    <div
      id={id}
      {...componentRoot("Table")}
      className={cx("m-table", className)}
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
              <th key={col.key} scope="col" data-align={columnAlign(col.align)}>
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
export interface PaginationProps {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  /** Show individual page buttons between Previous and Next. */
  numbered?: boolean;
  /** "Showing 51 to 60 of 114 results". */
  summary?: { from: number; to: number; total: number; noun?: string };
  /** Accessible name; give each pagination on a page a distinct one. */
  label?: string;
  className?: string;
}
export function Pagination({
  page,
  pageCount,
  onChange,
  numbered = false,
  summary,
  label = "Pagination",
  className,
}: PaginationProps) {
  const count = Math.max(1, pageCount);
  const atStart = page <= 1;
  const atEnd = page >= count;
  // Previous and Next use aria-disabled rather than disabled at the ends, so
  // the button someone just pressed keeps focus instead of dropping it to the
  // page body.
  return (
    <nav
      {...componentRoot("Pagination")}
      className={cx("m-pagination", className)}
      aria-label={label}
    >
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
          aria-disabled={atStart || undefined}
          onClick={() => !atStart && onChange(page - 1)}
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
          aria-disabled={atEnd || undefined}
          onClick={() => !atEnd && onChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
export interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  headingLevel?: HeadingLevel;
  id?: string;
  className?: string;
}
export function SettingsSection({
  title,
  description,
  children,
  headingLevel = 2,
  id,
  className,
}: SettingsSectionProps) {
  const headingId = useId();
  return (
    <section
      id={id}
      {...componentRoot("SettingsSection")}
      className={cx("m-settings-section", className)}
      aria-labelledby={headingId}
    >
      <div>
        {...classedIntroSlots(
          {
            title,
            description,
            id: headingId,
            headingLevel,
            descriptionClassName: null,
          },
          "m-settings-title",
        )}
      </div>
      <div className="m-stack">{children}</div>
    </section>
  );
}
export interface ActivityFeedProps {
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
  className?: string;
}
export function ActivityFeed({ label, items, className }: ActivityFeedProps) {
  return (
    <ol
      {...componentRoot("ActivityFeed")}
      className={cx("m-activity", className)}
      aria-label={label}
    >
      {items.map((item) => (
        <li key={item.id}>
          {item.actor ? (
            <span className="m-activity-actor">{item.actor}</span>
          ) : (
            <span
              aria-hidden="true"
              className="m-activity-dot"
              data-tone={
                item.tone && item.tone !== "neutral" ? item.tone : undefined
              }
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
export interface SignInPanelProps {
  title: string;
  /** The page's h1 by default; use 2 when the panel sits inside a page that already has one. */
  headingLevel?: HeadingLevel;
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
  id?: string;
  className?: string;
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
  id,
  className,
}: SignInPanelProps) {
  const [value, setValue] = useState("");
  const headingId = useId();
  const Heading = headingTag(headingLevel);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (email?.status !== "submitting") email?.onSubmit(value);
  };
  const success = email?.status === "success";
  const panel = (
    <section
      id={aside ? undefined : id}
      {...componentRoot("SignInPanel", !aside)}
      className={cx("m-sign-in", !aside && className)}
      aria-labelledby={headingId}
    >
      <header>
        {logo && <BrandMark logo={logo} />}
        <Heading id={headingId} className="m-sign-in-title">
          {title}
        </Heading>
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
          {/* Always mounted, so the confirmation is announced when it appears. */}
          <p role="status" className={success ? undefined : "m-sr-only"}>
            {success
              ? email.message || "Check your inbox for a sign-in link."
              : ""}
          </p>
          <Button type="submit" loading={email.status === "submitting"}>
            {email.submitLabel || "Email me a sign-in link"}
          </Button>
        </form>
      )}
      {footer && <footer>{footer}</footer>}
    </section>
  );
  return aside ? (
    <div
      id={id}
      {...componentRoot("SignInPanel")}
      className={cx("m-sign-in-split", className)}
    >
      {panel}
      <div className="m-sign-in-aside">{aside}</div>
    </div>
  ) : (
    panel
  );
}
