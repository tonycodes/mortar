/* DataGrid: an interactive table for large or server-driven datasets, built on
   TanStack Table and TanStack Virtual (optional peer dependencies). Mortar owns
   the markup, styles, keyboard handling and public types; no TanStack type
   appears in the props, so the engine can change without a breaking release. */
import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  columnFilteringFeature,
  columnPinningFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type Updater,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { KitLink } from "./navigation.js";
import {
  Button,
  Checkbox,
  EmptyState,
  Input,
  Notice,
  Select,
} from "./primitives.js";
import { Pagination } from "./application.js";
import { ChevronRight, SortArrows } from "./icons.js";
import type { HeadingLevel } from "./heading.js";
import { componentRoot, cx } from "./internal.js";
import {
  columnAlign,
  compareValues,
  isEmpty,
  SelectAll,
  type DataTableColumn,
  type SortDirection,
  type TableSort,
} from "./table-core.js";

type SortValue = string | number | Date | null | undefined;

export interface DataGridColumn<T> extends Omit<DataTableColumn<T>, "pin"> {
  /** Keep the column in view while the grid scrolls sideways. */
  pin?: "start" | "end";
  /**
   * Adds a filter control to the toolbar. `text` matches part of the value,
   * ignoring case; `options` offers an exact-match choice.
   */
  filter?: "text" | { options: { value: string; label: string }[] };
  /** The value filters and search compare. Defaults to sortValue, then row[key]. */
  filterValue?: (row: T) => string | number | null | undefined;
  /** Whether people can hide the column from the Columns menu. Default true; the first column always shows. */
  hideable?: boolean;
  /** With the grid's `resizable`, set false to keep this column's width fixed. */
  resizable?: boolean;
  /** Narrowest width, in pixels, a resize can reach. Default 64. */
  minWidth?: number;
  /** Widest width, in pixels, a resize can reach. Default 2000. */
  maxWidth?: number;
}

/** Column widths in pixels, by column key. */
export type DataGridColumnWidths = Record<string, number>;

/** Column key to filter value. A missing or empty value means no filter. */
export type DataGridFilters = Record<string, string>;

export interface DataGridPagination {
  /** One-based page number. */
  page: number;
  pageSize: number;
}

export interface DataGridProps<T extends { id: string }> {
  caption: string;
  columns: DataGridColumn<T>[];
  /** Every row in client mode; the current page in server mode. */
  rows: T[];
  rowLabel: (row: T) => string;
  /**
   * `client` sorts, filters, searches and pages rows in the browser. `server`
   * only reports state changes: pass the matching page of rows and rowCount.
   */
  mode?: "client" | "server";
  /** Total matching rows. Required in server mode. */
  rowCount?: number;
  /** Controlled sort levels, the first sorting first. Shift-click a header to add a level. */
  sort?: TableSort[];
  defaultSort?: TableSort[];
  onSortChange?: (sort: TableSort[]) => void;
  filters?: DataGridFilters;
  defaultFilters?: DataGridFilters;
  onFiltersChange?: (filters: DataGridFilters) => void;
  /** Show a search field that matches any column's filter value. */
  searchable?: boolean;
  /** Controlled search text. */
  search?: string;
  defaultSearch?: string;
  onSearchChange?: (search: string) => void;
  /** Selected row ids, which may include rows that are not loaded. */
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  /** Keys of hidden columns. */
  hiddenColumns?: string[];
  defaultHiddenColumns?: string[];
  onHiddenColumnsChange?: (keys: string[]) => void;
  /** Pages rows when set; without it every row renders (pair large sets with virtualize). */
  pagination?: DataGridPagination;
  defaultPagination?: DataGridPagination;
  onPaginationChange?: (pagination: DataGridPagination) => void;
  /** Render only the rows in view. Needs maxHeight (default 32rem when virtualizing). */
  /**
   * Lets people resize columns: drag the edge of a header, or focus it and
   * use the arrow keys. Widths are in pixels; once every visible column has
   * one, the table lays out at exactly those widths.
   */
  resizable?: boolean;
  columnWidths?: DataGridColumnWidths;
  defaultColumnWidths?: DataGridColumnWidths;
  onColumnWidthsChange?: (widths: DataGridColumnWidths) => void;
  /**
   * Content shown in a full-width row under a row when it is expanded. Adds a
   * toggle at the start of each row. Not available with `virtualize` yet.
   */
  renderDetail?: (row: T) => ReactNode;
  /** Which rows can expand. Default every row. */
  rowCanExpand?: (row: T) => boolean;
  expandedIds?: string[];
  defaultExpandedIds?: string[];
  onExpandedChange?: (ids: string[]) => void;
  virtualize?: boolean;
  /** Row height in pixels used for virtualization until a row is measured. Default 44. */
  estimateRowHeight?: number;
  /** Link each row's first cell to a detail page. */
  rowHref?: (row: T) => string | undefined;
  maxHeight?: string;
  density?: "default" | "compact";
  striped?: boolean;
  /** Extra toolbar content, after the built-in search and filters. */
  toolbar?: ReactNode;
  bulkActions?: ReactNode;
  footer?: ReactNode;
  empty?: { title: string; description?: string; action?: ReactNode };
  /** Shown when rows exist but search or filters match none. */
  noResults?: { title: string; description?: string };
  headingLevel?: HeadingLevel;
  loading?: boolean;
  error?: string;
  /** Plural noun for counts, e.g. "invoices". Default "rows". */
  noun?: string;
  id?: string;
  className?: string;
}

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  rowSelectionFeature,
  columnVisibilityFeature,
  columnPinningFeature,
});

/** Controlled when value is defined, otherwise local state seeded from initial. */
function useControllable<V>(
  value: V | undefined,
  initial: V,
  onChange?: (next: V) => void,
) {
  const [local, setLocal] = useState(initial);
  const current = value !== undefined ? value : local;
  const set = (next: V) => {
    if (value === undefined) setLocal(next);
    onChange?.(next);
  };
  return [current, set] as const;
}

const resolve = <V,>(updater: Updater<V>, old: V) =>
  typeof updater === "function" ? (updater as (old: V) => V)(old) : updater;

function sortValueOf<T>(col: DataGridColumn<T>, row: T): SortValue {
  return col.sortValue
    ? col.sortValue(row)
    : ((row as Record<string, unknown>)[col.key] as SortValue);
}
function filterValueOf<T>(col: DataGridColumn<T>, row: T) {
  const value = col.filterValue ? col.filterValue(row) : sortValueOf(col, row);
  if (isEmpty(value)) return "";
  return value instanceof Date ? value.toISOString() : String(value);
}

const matches = (value: string, query: string) =>
  value.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());

// A stable default: a new [] each render would rebuild the selection set and
// recount select-all over every row on every render.
const NO_IDS: string[] = [];
const NO_WIDTHS: DataGridColumnWidths = {};
const MIN_WIDTH = 64;
const MAX_WIDTH = 2000;
// Arrow keys move a column edge by this much; with Shift, four times as far.
const KEY_STEP = 16;
// The selection and expand columns' widths, as set in data.css.
const SELECT_WIDTH = 44;
const EXPAND_WIDTH = 48;

// Stable table options: functions recreated each render would invalidate
// TanStack's row-model caches.
const getRowId = (row: { id: string }) => row.id;
const isMultiSortEvent = (e: unknown) =>
  !!(e as { shiftKey?: boolean })?.shiftKey;
const globalFilterFn = (
  row: { getValue: (columnId: string) => unknown },
  columnId: string,
  value: string,
) => matches(String(row.getValue(columnId) ?? ""), value);

export function DataGrid<T extends { id: string }>({
  caption,
  columns,
  rows,
  rowLabel,
  mode = "client",
  rowCount,
  sort: sortProp,
  defaultSort = [],
  onSortChange,
  filters: filtersProp,
  defaultFilters = {},
  onFiltersChange,
  searchable = false,
  search: searchProp,
  defaultSearch = "",
  onSearchChange,
  selectedIds: selectedIdsProp,
  onSelectionChange,
  hiddenColumns: hiddenProp,
  defaultHiddenColumns = [],
  onHiddenColumnsChange,
  pagination: paginationProp,
  defaultPagination,
  onPaginationChange,
  resizable = false,
  columnWidths: columnWidthsProp,
  defaultColumnWidths = NO_WIDTHS,
  onColumnWidthsChange,
  renderDetail,
  rowCanExpand,
  expandedIds: expandedIdsProp,
  defaultExpandedIds = NO_IDS,
  onExpandedChange,
  virtualize = false,
  estimateRowHeight = 44,
  rowHref,
  maxHeight = virtualize ? "32rem" : undefined,
  density = "default",
  striped = false,
  toolbar,
  bulkActions,
  footer,
  empty = {
    title: "No records",
    description: "Records will appear here when they are available.",
  },
  noResults = {
    title: "No matching records",
    description: "Try a different search or clear the filters.",
  },
  headingLevel = 3,
  loading,
  error,
  noun = "rows",
  id,
  className,
}: DataGridProps<T>) {
  const server = mode === "server";
  const selectedIds = selectedIdsProp ?? NO_IDS;
  const [sort, setSort] = useControllable(sortProp, defaultSort, onSortChange);
  const [filters, setFilters] = useControllable(
    filtersProp,
    defaultFilters,
    onFiltersChange,
  );
  const [search, setSearch] = useControllable(
    searchProp,
    defaultSearch,
    onSearchChange,
  );
  const [hidden, setHidden] = useControllable(
    hiddenProp,
    defaultHiddenColumns,
    onHiddenColumnsChange,
  );
  const [paging, setPaging] = useControllable(
    paginationProp,
    defaultPagination,
    onPaginationChange as (p: DataGridPagination | undefined) => void,
  );
  const [widths, setWidths] = useControllable(
    columnWidthsProp,
    defaultColumnWidths,
    onColumnWidthsChange,
  );
  const [expanded, setExpanded] = useControllable(
    expandedIdsProp,
    defaultExpandedIds,
    onExpandedChange,
  );
  const expandedSet = useMemo(() => new Set(expanded), [expanded]);
  // Detail rows change row heights, which the virtualizer's single measured
  // height can't follow, so virtualized grids don't expand (yet).
  const expandable = !!renderDetail && !virtualize;
  useEffect(() => {
    if (renderDetail && virtualize)
      console.warn(
        "DataGrid: renderDetail is not available with virtualize yet; rows will not expand.",
      );
  }, [renderDetail, virtualize]);
  const detailBase = useId();

  // TanStack state derived from Mortar's public state. Each slice is memoised on
  // its value: a new object every render would make TanStack re-sort and
  // re-filter every row on every render, including each scroll frame.
  const sortKey = JSON.stringify(sort);
  const sorting = useMemo<SortingState>(
    () => sort.map((s) => ({ id: s.key, desc: s.direction === "descending" })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sortKey],
  );
  const filtersKey = JSON.stringify(filters);
  const columnFilters = useMemo<ColumnFiltersState>(
    () =>
      Object.entries(filters)
        .filter(([, value]) => !isEmpty(value))
        .map(([key, value]) => ({ id: key, value })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtersKey],
  );
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const rowSelection = useMemo<RowSelectionState>(
    () => Object.fromEntries(selectedIds.map((rowId) => [rowId, true])),
    [selectedIds],
  );
  const hiddenKey = hidden.join(",");
  const columnVisibility = useMemo(
    () =>
      Object.fromEntries(
        columns.map((col, index) => [
          col.key,
          index === 0 || !hidden.includes(col.key),
        ]),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columns, hiddenKey],
  );
  const columnPinning = useMemo(
    () => ({
      start: columns.filter((c) => c.pin === "start").map((c) => c.key),
      end: columns.filter((c) => c.pin === "end").map((c) => c.key),
    }),
    [columns],
  );
  const pageIndex = paging ? Math.max(0, paging.page - 1) : 0;
  const pageSize = paging ? paging.pageSize : Number.MAX_SAFE_INTEGER;
  const pagination = useMemo<PaginationState>(
    () => ({ pageIndex, pageSize }),
    [pageIndex, pageSize],
  );

  const defs = useMemo<ColumnDef<typeof features, T>[]>(
    () =>
      columns.map((col) => ({
        id: col.key,
        // Empty values read as undefined, so sortUndefined puts them last in
        // both directions, as DataTable does. Filters treat them as "".
        accessorFn: (row: T) => filterValueOf(col, row) || undefined,
        enableSorting: !!col.sortable,
        enableColumnFilter: !!col.filter,
        enableHiding: col.hideable !== false,
        // Ascending only; TanStack reverses for descending. Rows whose value
        // is empty never reach here: sortUndefined handles them.
        sortFn: (a, b) =>
          compareValues(
            sortValueOf(col, a.original),
            sortValueOf(col, b.original),
          ),
        sortUndefined: "last",
        filterFn: (row, columnId, value: string) => {
          const cell = String(row.getValue(columnId) ?? "");
          return typeof col.filter === "object"
            ? cell === value
            : matches(cell, value);
        },
      })),
    [columns],
  );

  const table = useTable({
    features,
    columns: defs,
    data: rows,
    getRowId,
    state: {
      sorting,
      columnFilters,
      globalFilter: search,
      rowSelection,
      columnVisibility,
      columnPinning,
      pagination,
    },
    manualSorting: server,
    manualFiltering: server,
    manualPagination: server || !paging,
    rowCount: server ? rowCount : undefined,
    enableMultiSort: true,
    isMultiSortEvent,
    enableSortingRemoval: true,
    autoResetPageIndex: false,
    globalFilterFn,
    onSortingChange: (u) =>
      setSort(
        resolve(u, sorting).map((s) => ({
          key: s.id,
          direction: (s.desc ? "descending" : "ascending") as SortDirection,
        })),
      ),
    onColumnFiltersChange: (u) =>
      setFilters(
        Object.fromEntries(
          resolve(u, columnFilters).map((f) => [f.id, String(f.value)]),
        ),
      ),
    onGlobalFilterChange: (u) => setSearch(String(resolve(u, search) ?? "")),
    onRowSelectionChange: (u) => {
      const next = resolve(u, rowSelection);
      onSelectionChange?.(Object.keys(next).filter((key) => next[key]));
    },
    onColumnVisibilityChange: (u) => {
      const next = resolve(u, columnVisibility);
      setHidden(columns.filter((c) => !next[c.key]).map((c) => c.key));
    },
    onPaginationChange: (u) => {
      if (!paging) return;
      const next = resolve(u, pagination);
      setPaging({ page: next.pageIndex + 1, pageSize: next.pageSize });
    },
  });

  // Filtering or searching moves back to the first page.
  const resetPage = () => paging && setPaging({ ...paging, page: 1 });

  const visibleColumns = columns.filter((c) => columnVisibility[c.key]);
  const ordered = [
    ...visibleColumns.filter((c) => c.pin === "start"),
    ...visibleColumns.filter((c) => !c.pin),
    ...visibleColumns.filter((c) => c.pin === "end"),
  ];
  const matchingCount = server
    ? (rowCount ?? rows.length)
    : table.getFilteredRowModel().rows.length;
  // A page past the end (rows removed, or a stale controlled page) shows the
  // last page; the effect below reports the corrected page.
  const pageCount = paging
    ? Math.max(1, Math.ceil(matchingCount / paging.pageSize))
    : 1;
  const page = paging ? Math.min(Math.max(1, paging.page), pageCount) : 1;
  const sortedRows = table.getSortedRowModel().rows;
  const displayRows =
    paging && !server
      ? sortedRows.slice((page - 1) * paging.pageSize, page * paging.pageSize)
      : table.getRowModel().rows;
  useLayoutEffect(() => {
    if (paging && paging.page !== page && matchingCount > 0)
      setPaging({ ...paging, page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, paging?.page, matchingCount]);
  const filtering = columnFilters.length > 0 || !isEmpty(search.trim());

  // Select all covers every matching row in client mode, and the loaded page in
  // server mode; selections elsewhere are kept.
  const scopeRows = server ? displayRows : table.getFilteredRowModel().rows;
  const scopeIds = useMemo(() => scopeRows.map((row) => row.id), [scopeRows]);
  // Counted once per selection or result change, not on every scroll frame.
  const selectedInScope = useMemo(
    () => scopeIds.reduce((n, rowId) => n + (selected.has(rowId) ? 1 : 0), 0),
    [scopeIds, selected],
  );
  const allInScope = scopeIds.length > 0 && selectedInScope === scopeIds.length;
  const scopeSet = useMemo(() => new Set(scopeIds), [scopeIds]);
  const toggleAll = () =>
    onSelectionChange?.(
      allInScope
        ? selectedIds.filter((rowId) => !scopeSet.has(rowId))
        : [...selectedIds, ...scopeIds.filter((rowId) => !selected.has(rowId))],
    );

  // Sticky offsets for pinned columns come from the rendered header widths.
  // A callback ref, so the effect re-runs when the table remounts after an
  // empty or loading state.
  const [headerRow, setHeaderRow] = useState<HTMLTableRowElement | null>(null);
  const [offsets, setOffsets] = useState<Record<string, number>>({});
  const pinKey = ordered
    .filter((c) => c.pin)
    .map((c) => `${c.key}:${c.pin}`)
    .join(",");
  useLayoutEffect(() => {
    const tr = headerRow;
    if (!tr || !pinKey) return;
    const measure = () => {
      if (!tr.isConnected) return;
      const cells = [...tr.children] as HTMLElement[];
      const next: Record<string, number> = {};
      let start = 0;
      for (const cell of cells) {
        const key = cell.dataset.key;
        const pin = cell.dataset.pin;
        if (
          pin === "start" ||
          cell.dataset.select !== undefined ||
          cell.dataset.expand !== undefined
        ) {
          if (key) next[key] = start;
          start += cell.offsetWidth;
        } else break;
      }
      let end = 0;
      for (const cell of cells.reverse()) {
        if (cell.dataset.pin !== "end") break;
        next[cell.dataset.key!] = end;
        end += cell.offsetWidth;
      }
      setOffsets((old) =>
        JSON.stringify(old) === JSON.stringify(next) ? old : next,
      );
    };
    measure();
    // Column widths can change while the row's width stays the same (new
    // data, a new virtual window), so watch the pinned cells themselves.
    const observer = new ResizeObserver(measure);
    observer.observe(tr);
    for (const cell of tr.querySelectorAll("[data-pin], [data-select]"))
      observer.observe(cell);
    return () => observer.disconnect();
  }, [headerRow, pinKey, hidden.join(","), expandable, !!onSelectionChange]);

  // Column resizing. Rendered header widths are tracked so a resize starts
  // from what is on screen and the separators can report a value.
  // Columns a narrow grid hides by priority are display: none; they take no
  // width and don't count toward the table's. A grid inside a hidden tab or
  // dialog has no layout at all, so nothing is measured until it shows.
  const [measured, setMeasured] = useState<Record<string, number>>({});
  const [priorityHidden, setPriorityHidden] = useState<string[]>(NO_IDS);
  useLayoutEffect(() => {
    const tr = headerRow;
    if (!tr || !resizable) return;
    const measure = () => {
      if (!tr.isConnected || !tr.getClientRects().length) return;
      const next: Record<string, number> = {};
      const gone: string[] = [];
      for (const cell of tr.children as HTMLCollectionOf<HTMLElement>) {
        const key = cell.dataset.key;
        if (!key) continue;
        if (getComputedStyle(cell).display === "none") gone.push(key);
        else next[key] = cell.getBoundingClientRect().width;
      }
      setMeasured((old) =>
        JSON.stringify(old) === JSON.stringify(next) ? old : next,
      );
      setPriorityHidden((old) =>
        old.join(",") === gone.join(",") ? old : gone,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    for (const cell of tr.children) observer.observe(cell);
    return () => observer.disconnect();
  }, [headerRow, resizable, hidden.join(","), expandable]);
  // A drag shows its width live and reports it once, when it ends.
  const [drag, setDrag] = useState<{
    key: string;
    width: number;
    base: DataGridColumnWidths;
  } | null>(null);
  const widthOf = (key: string) =>
    drag ? (drag.key === key ? drag.width : drag.base[key]) : widths[key];
  const minOf = (col: DataGridColumn<T>) => col.minWidth ?? MIN_WIDTH;
  const maxOf = (col: DataGridColumn<T>) => col.maxWidth ?? MAX_WIDTH;
  const clampWidth = (col: DataGridColumn<T>, width: number) =>
    Math.round(Math.min(maxOf(col), Math.max(minOf(col), width)));
  // Every visible column gets a width the first time one is resized, so the
  // others keep the widths they had instead of sharing out the difference.
  // Snapshot widths respect each column's minimum and maximum.
  const shown = (col: DataGridColumn<T>) => !priorityHidden.includes(col.key);
  const resizeBase = () => {
    const base = { ...widths };
    for (const col of ordered)
      if (base[col.key] === undefined && shown(col) && measured[col.key])
        base[col.key] = clampWidth(col, measured[col.key]);
    return base;
  };
  // 2. A drag ends cleanly even if the table unmounts mid-drag (loading, an
  // empty result): the listeners live on the window and are removed here.
  const endDrag = useRef<(() => void) | null>(null);
  useLayoutEffect(() => () => endDrag.current?.(), [headerRow]);
  const startResize = (
    col: DataGridColumn<T>,
    event: PointerEvent<HTMLDivElement>,
  ) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const handle = event.currentTarget;
    const rtl = getComputedStyle(handle).direction === "rtl";
    const base = resizeBase();
    const start = base[col.key] ?? MIN_WIDTH;
    const startX = event.clientX;
    let width = start;
    endDrag.current?.();
    handle.setPointerCapture(event.pointerId);
    setDrag({ key: col.key, width, base });
    const move = (e: globalThis.PointerEvent) => {
      width = clampWidth(col, start + (e.clientX - startX) * (rtl ? -1 : 1));
      setDrag({ key: col.key, width, base });
    };
    const end = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      endDrag.current = null;
      setDrag(null);
      setWidths({ ...base, [col.key]: width });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    endDrag.current = end;
  };
  const keyResize = (
    col: DataGridColumn<T>,
    event: KeyboardEvent<HTMLDivElement>,
  ) => {
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const grow = rtl ? "ArrowLeft" : "ArrowRight";
    const shrink = rtl ? "ArrowRight" : "ArrowLeft";
    const base = resizeBase();
    const now = base[col.key] ?? MIN_WIDTH;
    const step = KEY_STEP * (event.shiftKey ? 4 : 1);
    let next: number | undefined;
    if (event.key === grow) next = now + step;
    else if (event.key === shrink) next = now - step;
    else if (event.key === "Home") next = minOf(col);
    else if (event.key === "End" && col.maxWidth !== undefined)
      next = col.maxWidth;
    if (next === undefined) return;
    event.preventDefault();
    setWidths({ ...base, [col.key]: clampWidth(col, next) });
  };
  const canResize = (col: DataGridColumn<T>) =>
    resizable && col.resizable !== false;
  // Exact widths once every visible column has one: fixed layout, and the
  // table as wide as its columns, so a resize changes only that column.
  const fixedWidths =
    resizable &&
    ordered.every((col) => !shown(col) || widthOf(col.key) !== undefined);
  const tableWidth = fixedWidths
    ? ordered.reduce(
        (sum, col) => sum + (shown(col) ? widthOf(col.key)! : 0),
        0,
      ) +
      (onSelectionChange ? SELECT_WIDTH : 0) +
      (expandable ? EXPAND_WIDTH : 0)
    : undefined;

  // Row virtualization: only the rows in view render, with spacer rows keeping
  // the scroll height. Rows keep aria-rowindex so assistive tech knows the size.
  // Rows share one height, so one rendered row is measured and its height used
  // for all of them. Measuring each row as it scrolls in would make the
  // virtualizer recompute every later row's position on each frame.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [rowHeight, setRowHeight] = useState(estimateRowHeight);
  const getScrollElement = useCallback(() => scrollRef.current, []);
  const estimateSize = useCallback(() => rowHeight, [rowHeight]);
  const virtualizer = useVirtualizer({
    count: virtualize ? displayRows.length : 0,
    getScrollElement,
    estimateSize,
    overscan: 8,
  });
  const items = virtualize ? virtualizer.getVirtualItems() : [];
  useLayoutEffect(() => {
    if (!virtualize) return;
    const row = scrollRef.current?.querySelector<HTMLElement>(
      "tbody tr:not(.m-data-grid-spacer)",
    );
    const height = row?.getBoundingClientRect().height;
    if (height && Math.abs(height - rowHeight) > 0.5) setRowHeight(height);
    // A new estimateSize alone does not rebuild the cached row positions.
    virtualizer.measure();
    // Only when row height can change: not on every scroll frame, where a
    // measurement would force a synchronous layout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    virtualize,
    density,
    hiddenKey,
    // The first virtual rows appear a render after mount, once the virtualizer
    // has its scroll element: measure then.
    items.length > 0,
    loading,
    rowHeight,
  ]);
  const windowRows = virtualize
    ? items.map((item) => ({ row: displayRows[item.index], index: item.index }))
    : displayRows.map((row, index) => ({ row, index }));
  const padTop = virtualize && items.length ? items[0].start : 0;
  const padBottom =
    virtualize && items.length
      ? virtualizer.getTotalSize() - items[items.length - 1].end
      : 0;
  const rowOffset = paging ? (page - 1) * paging.pageSize : 0;
  const span =
    ordered.length + (onSelectionChange ? 1 : 0) + (expandable ? 1 : 0);
  const pinnedStart = columnPinning.start.length > 0;
  const expandPin = pinnedStart
    ? {
        "data-pin": "start" as const,
        style: { insetInlineStart: offsets.__expand ?? 0 },
      }
    : {};
  const toggleExpanded = (rowId: string) =>
    setExpanded(
      expandedSet.has(rowId)
        ? expanded.filter((x) => x !== rowId)
        : [...expanded, rowId],
    );

  const pinStyle = (col: DataGridColumn<T>) =>
    col.pin && offsets[col.key] !== undefined
      ? col.pin === "start"
        ? { insetInlineStart: offsets[col.key] }
        : { insetInlineEnd: offsets[col.key] }
      : undefined;
  const cellProps = (col: DataGridColumn<T>, index: number) => ({
    "data-key": col.key,
    "data-pin": col.pin,
    "data-priority":
      index > 0 && col.priority && col.priority !== "high"
        ? col.priority
        : undefined,
    "data-align": columnAlign(col.align),
    "data-truncate": col.truncate || undefined,
    style: pinStyle(col),
  });

  const filterColumns = columns.filter((col) => col.filter);
  const hideable = columns.filter(
    (col, index) => index > 0 && col.hideable !== false,
  );
  const hasToolbarControls =
    searchable || filterColumns.length > 0 || hideable.length > 0;
  const sortIndex = (key: string) => sort.findIndex((s) => s.key === key);

  return (
    <section
      id={id}
      {...componentRoot("DataGrid")}
      className={cx("m-data-table", "m-data-grid", className)}
      aria-label={caption}
      data-density={density === "default" ? undefined : density}
      data-striped={striped || undefined}
    >
      {(hasToolbarControls || toolbar || selectedIds.length > 0) && (
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
            <>
              <div className="m-data-grid-controls">
                {searchable && (
                  <Input
                    label="Search"
                    type="search"
                    value={search}
                    onChange={(event) => {
                      table.setGlobalFilter(event.target.value);
                      resetPage();
                    }}
                  />
                )}
                {filterColumns.map((col) => {
                  const value = filters[col.key] ?? "";
                  const setValue = (next: string) => {
                    table.getColumn(col.key)?.setFilterValue(next || undefined);
                    resetPage();
                  };
                  return typeof col.filter === "object" ? (
                    <Select
                      key={col.key}
                      label={col.label}
                      value={value}
                      options={[
                        { value: "", label: "All" },
                        ...col.filter.options,
                      ]}
                      onChange={(event) => setValue(event.target.value)}
                    />
                  ) : (
                    <Input
                      key={col.key}
                      label={col.label}
                      value={value}
                      onChange={(event) => setValue(event.target.value)}
                    />
                  );
                })}
                {toolbar}
              </div>
              {hideable.length > 0 && (
                <Popover className="m-data-grid-columns">
                  <PopoverButton as={Button} variant="secondary">
                    Columns
                  </PopoverButton>
                  <PopoverPanel
                    anchor="bottom end"
                    className="m-data-grid-columns-panel"
                  >
                    <fieldset>
                      <legend>Show columns</legend>
                      {hideable.map((col) => (
                        <Checkbox
                          key={col.key}
                          label={col.label}
                          checked={!hidden.includes(col.key)}
                          onChange={() =>
                            setHidden(
                              hidden.includes(col.key)
                                ? hidden.filter((key) => key !== col.key)
                                : [...hidden, col.key],
                            )
                          }
                        />
                      ))}
                    </fieldset>
                  </PopoverPanel>
                </Popover>
              )}
            </>
          )}
        </div>
      )}
      {/* Mounted before loading starts so screen readers announce the change. */}
      <p
        className={loading ? "m-table-state" : "m-sr-only"}
        role="status"
        data-loading={loading || undefined}
      >
        {loading
          ? "Loading records…"
          : filtering
            ? `${matchingCount} matching ${noun}`
            : ""}
      </p>
      {loading ? null : error ? (
        <Notice title="Unable to load records" tone="danger" announce>
          {error}
        </Notice>
      ) : !rows.length && !filtering ? (
        <EmptyState
          title={empty.title}
          description={empty.description}
          action={empty.action}
          headingLevel={headingLevel}
        />
      ) : !displayRows.length ? (
        <EmptyState
          title={noResults.title}
          description={noResults.description}
          headingLevel={headingLevel}
          action={
            <Button
              variant="secondary"
              onClick={() => {
                table.resetColumnFilters(true);
                table.resetGlobalFilter(true);
                setFilters({});
                setSearch("");
                resetPage();
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div
          ref={scrollRef}
          className="m-table-scroll"
          role="region"
          aria-label={`${caption} scroll area`}
          tabIndex={0}
          style={maxHeight ? { maxHeight } : undefined}
          data-sticky={maxHeight ? true : undefined}
        >
          <table
            aria-rowcount={virtualize ? matchingCount + 1 : undefined}
            data-resized={fixedWidths || undefined}
            style={tableWidth ? { width: tableWidth } : undefined}
          >
            <caption className="m-sr-only">{caption}</caption>
            {ordered.some(
              (col) => col.width || widthOf(col.key) !== undefined,
            ) && (
              <colgroup>
                {onSelectionChange && <col className="m-table-select-col" />}
                {expandable && <col className="m-data-grid-expand-col" />}
                {ordered.map((col, index) => {
                  const width = widthOf(col.key);
                  return (
                    <col
                      key={col.key}
                      // Hidden with its cells on narrow grids, so the cells
                      // that remain keep their own columns.
                      data-priority={cellProps(col, index)["data-priority"]}
                      style={
                        width !== undefined
                          ? { width }
                          : col.width
                            ? { width: col.width }
                            : undefined
                      }
                    />
                  );
                })}
              </colgroup>
            )}
            <thead>
              <tr ref={setHeaderRow} aria-rowindex={virtualize ? 1 : undefined}>
                {onSelectionChange && (
                  <th
                    scope="col"
                    data-select=""
                    data-key="__select"
                    data-pin={columnPinning.start.length ? "start" : undefined}
                    style={
                      columnPinning.start.length
                        ? { insetInlineStart: 0 }
                        : undefined
                    }
                  >
                    <SelectAll
                      checked={allInScope}
                      partial={selectedInScope > 0 && !allInScope}
                      onChange={toggleAll}
                    />
                  </th>
                )}
                {expandable && (
                  <th
                    scope="col"
                    data-expand=""
                    data-key="__expand"
                    {...expandPin}
                  >
                    <span className="m-sr-only">Details</span>
                  </th>
                )}
                {ordered.map((col, index) => {
                  const position = sortIndex(col.key);
                  const width = widthOf(col.key) ?? measured[col.key];
                  const direction =
                    position >= 0 ? sort[position].direction : undefined;
                  return (
                    <th
                      key={col.key}
                      scope="col"
                      {...cellProps(col, index)}
                      data-resizable={canResize(col) || undefined}
                      // The separator inside would otherwise join the
                      // header's name ("Customer Resize Customer").
                      aria-labelledby={
                        canResize(col)
                          ? `${detailBase}-head-${encodeURIComponent(col.key)}`
                          : undefined
                      }
                      aria-sort={
                        col.sortable
                          ? position === 0
                            ? direction
                            : "none"
                          : undefined
                      }
                    >
                      {col.sortable ? (
                        <button
                          type="button"
                          className="m-sort-button"
                          onClick={(event) =>
                            table
                              .getColumn(col.key)
                              ?.toggleSorting(
                                undefined,
                                event.shiftKey && sort.length > 0,
                              )
                          }
                        >
                          <span
                            id={
                              canResize(col)
                                ? `${detailBase}-head-${encodeURIComponent(col.key)}`
                                : undefined
                            }
                          >
                            {col.label}
                          </span>
                          <SortArrows direction={direction} />
                          {sort.length > 1 && position >= 0 && (
                            <span className="m-sort-order">
                              <span className="m-sr-only">, sort level </span>
                              {position + 1}
                            </span>
                          )}
                        </button>
                      ) : canResize(col) ? (
                        <span
                          id={`${detailBase}-head-${encodeURIComponent(col.key)}`}
                        >
                          {col.label}
                        </span>
                      ) : (
                        col.label
                      )}
                      {canResize(col) && (
                        // A focusable separator: the window-splitter pattern.
                        <div
                          role="separator"
                          aria-orientation="vertical"
                          aria-label={`Resize ${col.label}`}
                          aria-valuenow={
                            width !== undefined ? Math.round(width) : undefined
                          }
                          aria-valuemin={minOf(col)}
                          aria-valuemax={maxOf(col)}
                          aria-valuetext={
                            width !== undefined
                              ? `${Math.round(width)} pixels`
                              : undefined
                          }
                          tabIndex={0}
                          className="m-data-grid-resizer"
                          data-active={drag?.key === col.key || undefined}
                          onPointerDown={(event) => startResize(col, event)}
                          onKeyDown={(event) => keyResize(col, event)}
                        />
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {padTop > 0 && (
                <tr aria-hidden="true" className="m-data-grid-spacer">
                  <td colSpan={span} style={{ height: padTop }} />
                </tr>
              )}
              {windowRows.map(({ row, index }) => {
                const original = row.original;
                const href = rowHref?.(original);
                const isSelected = selected.has(row.id);
                const canOpen =
                  expandable && (rowCanExpand ? rowCanExpand(original) : true);
                const isOpen = canOpen && expandedSet.has(row.id);
                const detailId = `${detailBase}-detail-${encodeURIComponent(row.id)}`;
                return (
                  <Fragment key={row.id}>
                    <tr
                      data-selected={isSelected || undefined}
                      data-expanded={isOpen || undefined}
                      data-linked={href ? true : undefined}
                      aria-rowindex={
                        virtualize ? rowOffset + index + 2 : undefined
                      }
                    >
                      {onSelectionChange && (
                        <td
                          data-select=""
                          data-pin={
                            columnPinning.start.length ? "start" : undefined
                          }
                          style={
                            columnPinning.start.length
                              ? { insetInlineStart: 0 }
                              : undefined
                          }
                        >
                          <input
                            type="checkbox"
                            aria-label={`Select ${rowLabel(original)}`}
                            checked={isSelected}
                            onChange={row.getToggleSelectedHandler()}
                          />
                        </td>
                      )}
                      {expandable && (
                        <td data-expand="" {...expandPin}>
                          {canOpen && (
                            <button
                              type="button"
                              className="m-data-grid-expand"
                              aria-expanded={isOpen}
                              aria-controls={isOpen ? detailId : undefined}
                              aria-label={`Details for ${rowLabel(original)}`}
                              onClick={() => toggleExpanded(row.id)}
                            >
                              <ChevronRight />
                            </button>
                          )}
                        </td>
                      )}
                      {ordered.map((col, colIndex) => {
                        const content = col.truncate ? (
                          <span className="m-truncate">
                            {col.render(original)}
                          </span>
                        ) : (
                          col.render(original)
                        );
                        return colIndex === 0 ? (
                          <th
                            scope="row"
                            key={col.key}
                            {...cellProps(col, colIndex)}
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
                          <td key={col.key} {...cellProps(col, colIndex)}>
                            {content}
                          </td>
                        );
                      })}
                    </tr>
                    {isOpen && (
                      <tr id={detailId} className="m-data-grid-detail">
                        <td colSpan={span}>{renderDetail!(original)}</td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {padBottom > 0 && (
                <tr aria-hidden="true" className="m-data-grid-spacer">
                  <td colSpan={span} style={{ height: padBottom }} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {(paging || footer) && !loading && !error && (
        <div className="m-table-footer">
          {paging && matchingCount > 0 && (
            <Pagination
              page={page}
              pageCount={pageCount}
              numbered
              summary={{
                from: Math.min(matchingCount, rowOffset + 1),
                to: Math.min(matchingCount, rowOffset + paging.pageSize),
                total: matchingCount,
                noun,
              }}
              onChange={(page) => setPaging({ ...paging, page })}
            />
          )}
          {footer}
        </div>
      )}
    </section>
  );
}

export type { TableSort, SortDirection };
