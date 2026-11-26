import { useMemo, useState } from "react";
import * as UI from "../src/index.js";
import * as Grid from "../src/data-grid.js";
import type {
  DataGridColumn,
  DataGridColumnWidths,
  DataGridPagination,
} from "../src/data-grid.js";

type Status = "draft" | "sent" | "paid" | "overdue";
interface Invoice {
  id: string;
  number: string;
  customer: string;
  issued: Date;
  amount: number;
  status: Status;
}

const customers = [
  "Acme Corp",
  "Globex",
  "Initech",
  "Umbrella Labs",
  "Hooli",
  "Stark Industries",
  "Wayne Enterprises",
  "Soylent Co",
];
const statuses: Status[] = ["draft", "sent", "paid", "overdue"];
const tones = {
  draft: "neutral",
  sent: "info",
  paid: "success",
  overdue: "danger",
} as const;

/** Deterministic rows so screenshots and probes are stable. */
export function invoices(count: number): Invoice[] {
  const start = Date.UTC(2026, 0, 1);
  return Array.from({ length: count }, (_, i) => ({
    id: `inv-${i + 1}`,
    number: `INV-${String(i + 1).padStart(6, "0")}`,
    customer: customers[(i * 7) % customers.length],
    issued: new Date(start + ((i * 37) % 320) * 86_400_000),
    amount: ((i * 7919) % 990_000) / 100 + 50,
    status: statuses[(i * 3 + Math.floor(i / 8)) % statuses.length],
  }));
}

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const day = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export const columns: DataGridColumn<Invoice>[] = [
  {
    key: "number",
    label: "Invoice",
    render: (row) => row.number,
    sortable: true,
    pin: "start",
    width: "9rem",
  },
  {
    key: "customer",
    label: "Customer",
    render: (row) => row.customer,
    sortable: true,
    filter: "text",
  },
  {
    key: "issued",
    label: "Issued",
    render: (row) => day.format(row.issued),
    sortValue: (row) => row.issued,
    filterValue: (row) => day.format(row.issued),
    sortable: true,
    priority: "low",
  },
  {
    key: "amount",
    label: "Amount",
    render: (row) => money.format(row.amount),
    align: "end",
    sortable: true,
  },
  {
    key: "status",
    label: "Status",
    render: (row) => <UI.Badge tone={tones[row.status]}>{row.status}</UI.Badge>,
    sortable: true,
    filter: {
      options: statuses.map((s) => ({
        value: s,
        label: s[0].toUpperCase() + s.slice(1),
      })),
    },
    pin: "end",
  },
];

/** The detail grid caps Amount, so the first resize brings it within range. */
const detailColumns: DataGridColumn<Invoice>[] = columns.map((col) =>
  col.key === "amount" ? { ...col, maxWidth: 140 } : col,
);

/** Loading, error and empty fixtures, chosen by the harness with ?state=. */
function StatePreview({ state }: { state: string }) {
  return (
    <div data-state={state}>
      <Grid.DataGrid
        caption="State example"
        columns={columns}
        rows={[]}
        rowLabel={(row) => row.number}
        loading={state === "loading"}
        error={state === "error" ? "Check this value" : undefined}
      />
    </div>
  );
}

export default function Preview() {
  const state = new URLSearchParams(location.search).get("state");
  return state ? <StatePreview state={state} /> : <Grids />;
}

function Grids() {
  const rows = useMemo(() => invoices(100_000), []);
  const paged = useMemo(() => invoices(240), []);
  const detailed = useMemo(() => invoices(8), []);
  const [widths, setWidths] = useState<DataGridColumnWidths>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [pagination, setPagination] = useState<DataGridPagination>({
    page: 1,
    pageSize: 25,
  });
  // The playground Code view shows this element (playground/examples.mjs).
  const example = (
    <Grid.DataGrid
      caption="Invoices (100,000 rows, virtualized)"
      rows={rows}
      rowLabel={(row) => row.number}
      columns={columns}
      virtualize
      searchable
      defaultSort={[{ key: "issued", direction: "descending" }]}
      selectedIds={selected}
      onSelectionChange={setSelected}
      bulkActions={<UI.Button variant="secondary">Mark as paid</UI.Button>}
      noun="invoices"
    />
  );
  return (
    <div style={{ display: "grid", gap: 32 }}>
      {example}
      <Grid.DataGrid
        caption="Invoices (paged)"
        rows={paged}
        rowLabel={(row) => row.number}
        columns={columns}
        pagination={pagination}
        onPaginationChange={setPagination}
        density="compact"
        noun="invoices"
      />
      <Grid.DataGrid
        caption="Invoices with details"
        rows={detailed}
        rowLabel={(row) => row.number}
        columns={detailColumns}
        resizable
        columnWidths={widths}
        onColumnWidthsChange={setWidths}
        renderDetail={(row) => (
          <UI.DescriptionList
            items={[
              { term: "Customer", details: row.customer },
              { term: "Issued", details: day.format(row.issued) },
              { term: "Amount due", details: money.format(row.amount) },
            ]}
          />
        )}
        rowCanExpand={(row) => row.status !== "draft"}
        defaultExpandedIds={["inv-2"]}
        noun="invoices"
      />
    </div>
  );
}
