# DataGrid

`DataGrid` is the interactive table for large or server-driven data: multi-column sort, column filters, search, selection across pages, paging, hidden and pinned columns, and row virtualization for tens of thousands of rows. It ships from its own entry point, `@tonycodes-ui/mortar/data-grid`, and renders the same markup and styles as `DataTable`, so the two look the same side by side.

## DataGrid or DataTable

| Use         | When                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| `DataTable` | A few hundred rows or fewer, single-column sort, your own toolbar. It has no extra dependencies.                          |
| `DataGrid`  | Thousands of rows, data the server sorts and pages, or people need filters, search, multi-sort, hidden or pinned columns. |

Moving from `DataTable` is mostly a rename: `DataGridColumn` takes every `DataTableColumn` field, and `caption`, `rows`, `rowLabel`, `selectedIds`, `onSelectionChange`, `bulkActions`, `rowHref`, `empty`, `loading`, `error`, `density` and `striped` work the same way. `sort` becomes a list of sort levels.

## Install

The grid's engine, [TanStack Table](https://tanstack.com/table) and [TanStack Virtual](https://tanstack.com/virtual), are optional peer dependencies. Install them only in apps that import the grid:

```sh
npm install @tanstack/react-table @tanstack/react-virtual
```

The grid needs both packages whenever it is imported, even when it isn't virtualized. Mortar's stylesheet already includes the grid's styles, so there is nothing else to import.

In server mode, always pass `rowCount`. Without it the grid counts only the rows it was given, so paging shows a single page.

## Client mode

In client mode (the default) the grid sorts, filters, searches and pages every row in the browser. Pass all the rows.

```tsx
import { Badge, Button } from "@tonycodes-ui/mortar";
import { DataGrid, type DataGridColumn } from "@tonycodes-ui/mortar/data-grid";

const columns: DataGridColumn<Invoice>[] = [
  {
    key: "number",
    label: "Invoice",
    render: (r) => r.number,
    sortable: true,
    pin: "start",
  },
  {
    key: "customer",
    label: "Customer",
    render: (r) => r.customer,
    sortable: true,
    filter: "text",
  },
  {
    key: "amount",
    label: "Amount",
    render: (r) => money.format(r.amount),
    align: "end",
    sortable: true,
  },
  {
    key: "status",
    label: "Status",
    render: (r) => <Badge tone={tone[r.status]}>{r.status}</Badge>,
    filter: { options: statusOptions },
    pin: "end",
  },
];

<DataGrid
  caption="Invoices"
  rows={invoices}
  columns={columns}
  rowLabel={(r) => r.number}
  searchable
  virtualize
  selectedIds={selected}
  onSelectionChange={setSelected}
  bulkActions={<Button variant="secondary">Mark as paid</Button>}
  noun="invoices"
/>;
```

`render` controls what a cell shows. Sorting, filters and search use the raw value instead: `sortValue(row)` for sorting and `filterValue(row)` for filters and search, both defaulting to `row[key]`. Give dates and amounts a `sortValue` that returns the `Date` or number, and a `filterValue` that returns the text people will type.

## Server mode

With `mode="server"` the grid never sorts, filters or pages rows itself. It reports what people asked for, and you fetch the matching page and its total.

```tsx
const [sort, setSort] = useState<TableSort[]>([
  { key: "issued", direction: "descending" },
]);
const [filters, setFilters] = useState<DataGridFilters>({});
const [search, setSearch] = useState("");
const [pagination, setPagination] = useState({ page: 1, pageSize: 50 });
const { data, isLoading, error } = useInvoices({
  sort,
  filters,
  search,
  pagination,
});

<DataGrid
  caption="Invoices"
  mode="server"
  rows={data?.rows ?? []}
  rowCount={data?.total ?? 0}
  columns={columns}
  rowLabel={(r) => r.number}
  sort={sort}
  onSortChange={setSort}
  filters={filters}
  onFiltersChange={setFilters}
  searchable
  search={search}
  onSearchChange={setSearch}
  pagination={pagination}
  onPaginationChange={setPagination}
  loading={isLoading}
  error={error?.message}
/>;
```

Put the state in your request key, so a change fetches again. Filtering or searching returns to page 1.

## State

Every piece of state is controlled when you pass its value and its `on…Change` callback, and kept by the grid when you pass only a `default…` value (or nothing):

| State          | Controlled                               | Uncontrolled           |
| -------------- | ---------------------------------------- | ---------------------- |
| Sort levels    | `sort`, `onSortChange`                   | `defaultSort`          |
| Column filters | `filters`, `onFiltersChange`             | `defaultFilters`       |
| Search         | `search`, `onSearchChange`               | `defaultSearch`        |
| Hidden columns | `hiddenColumns`, `onHiddenColumnsChange` | `defaultHiddenColumns` |
| Paging         | `pagination`, `onPaginationChange`       | `defaultPagination`    |
| Selection      | `selectedIds`, `onSelectionChange`       | none                   |

Hidden columns and sort levels are plain arrays, so they are easy to save per user.

## Behaviour

- **Sorting.** Click a header to sort; click again to reverse, and a third time to remove the sort. Shift-click adds the column as another level; numbered badges show the order. Empty values sort last in both directions, as in `DataTable`.
- **Filters and search.** A column with `filter: "text"` gets a text box that matches part of the value, ignoring case; `filter: { options }` gets a choice that matches exactly. `searchable` adds a field that searches every column's filter value. The status region announces the number of matching rows, and when nothing matches the grid offers to clear the filters.
- **Selection.** "Select all" selects every matching row in client mode and the loaded page in server mode, and keeps selections made elsewhere. Selected ids may include rows that are not loaded.
- **Paging or virtualization.** Pass `pagination` to page rows, or `virtualize` to render only the rows in view. Virtualization needs a fixed height: `maxHeight`, which defaults to 32rem when virtualizing. Without either, every row renders.
- **Columns.** People can hide any column but the first from the Columns menu; set `hideable: false` to keep one. `pin: "start"` or `pin: "end"` keeps a column in view while the grid scrolls sideways. `priority` hides secondary columns on narrow grids, as in `DataTable`.

## Resizing columns

`resizable` lets people resize columns: drag the edge of a header, or focus that edge and use the arrow keys (16 pixels a step, 64 with Shift). Home sets a column to its minimum, and End to its `maxWidth` when it has one.

```tsx
const [widths, setWidths] = useState<DataGridColumnWidths>(savedWidths);

<DataGrid
  caption="Invoices"
  rows={invoices}
  rowLabel={(row) => row.number}
  columns={columns}
  resizable
  columnWidths={widths}
  onColumnWidthsChange={(next) => {
    setWidths(next);
    save(next);
  }}
/>;
```

- Widths are in pixels, by column key. The first resize gives every visible column the width it had on screen, so the other columns keep their widths, and from then on the table is exactly as wide as its columns and scrolls sideways when it's wider than its container. Text that doesn't fit is cut off with an ellipsis.
- A drag shows its width as it moves and reports it once, when it ends. A key press reports straight away.
- Columns take `minWidth` (default 64) and `maxWidth` (default 2000); `resizable: false` keeps one column's width fixed. The first resize also brings any column outside those limits back within them. A column's `width` is its starting width until someone resizes it.
- Keep `columnWidths` to remember widths between visits.

## Expandable rows

`renderDetail` adds a toggle at the start of each row; an expanded row shows the detail in a full-width row underneath it.

```tsx
<DataGrid
  caption="Invoices"
  rows={invoices}
  rowLabel={(row) => row.number}
  columns={columns}
  renderDetail={(row) => <InvoiceLines invoice={row} />}
  rowCanExpand={(row) => row.lines.length > 0}
/>
```

- `rowCanExpand` decides which rows get a toggle; by default every row does.
- `expandedIds`, `defaultExpandedIds` and `onExpandedChange` hold which rows are open, like the selection. Expanded ids are kept when rows are sorted, filtered or paged.
- Detail rows aren't available with `virtualize` yet: the grid shows a console warning and doesn't expand rows.

## Accessibility

Each column edge is a focusable separator named "Resize Customer" (for example), with its width in pixels as its value between its minimum and maximum. The header itself is still named just "Customer". Each expand toggle is a button named "Details for" and the row's `rowLabel`, with `aria-expanded`, and `aria-controls` pointing to the detail row while it's open.

The grid is a semantic table with a caption, `scope` on headers and `aria-sort` on the sorted column. A virtualized grid sets `aria-rowcount` and each row's `aria-rowindex`, so screen readers know where they are in the full set. Every row checkbox is named from `rowLabel`. Check keyboard use and focus in your own toolbar content and bulk actions.

## Performance

With 100,000 client-side rows in the playground, sorting takes about 250ms, searching about 300ms, and scrolling stays at one frame (about 17ms) with fewer than 30 rows in the page. `tests/browser/data-grid-performance.spec.mjs` holds the budget. Keep `columns` stable (define them outside the component or memoise them): a new array every render rebuilds the grid's column definitions.

## Not yet

Column reordering, grouping with totals, inline editing, and detail rows in a virtualized grid are planned and not in this version.
