import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Badge,
  Button,
  CommandPalette,
  DataTable,
  FilterChip,
  GridList,
  Pagination,
  ThemeProvider,
} from "../../../../src/index.js";
import "../../../../playground/styles.css";

const people = ["Ana", "Ben", "Cy", "Di", "Ed"].map((name) => ({
  id: name.toLowerCase(),
  name,
}));
const perPage = 2;

/** A paged table whose selection spans pages, as a consumer would wire it. */
function PagedTable() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const rows = people.slice((page - 1) * perPage, page * perPage);
  return (
    <>
      <DataTable
        caption="People"
        columns={[{ key: "name", label: "Name", render: (row) => row.name }]}
        rows={rows}
        rowLabel={(row) => row.name}
        selectedIds={selected}
        onSelectionChange={setSelected}
        footer={
          <Pagination
            page={page}
            pageCount={Math.ceil(people.length / perPage)}
            onChange={setPage}
          />
        }
      />
      <output aria-label="Selected ids">{selected.join(",")}</output>
    </>
  );
}

function Chips() {
  const [filters, setFilters] = useState(["Red", "Green", "Blue"]);
  return (
    <div role="group" aria-label="Active filters">
      {filters.map((filter) => (
        <FilterChip
          key={filter}
          label={filter}
          onRemove={() => setFilters((all) => all.filter((f) => f !== filter))}
        />
      ))}
    </div>
  );
}

function Palette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const items = [{ id: "deploy", label: "Deploy", onSelect() {} }].filter(
    (item) => item.label.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open palette</Button>
      <CommandPalette
        open={open}
        onClose={() => setOpen(false)}
        query={query}
        onQueryChange={setQuery}
        groups={[{ label: "Actions", items }]}
        empty={{ title: "Nothing matches", description: "Try another word." }}
      />
    </>
  );
}

// #77: an API keys table like Hive's (tony/arc ARC-22). Low and medium
// priority columns collapse as the table narrows; the action column is pinned.
const keys = [
  {
    id: "k1",
    name: "Production deploy key for the EU gateway",
    status: "Active",
  },
  { id: "k2", name: "Staging", status: "Revoked" },
];
function KeysTable({ wide = false }: { wide?: boolean }) {
  const [selected, setSelected] = useState<string[]>(["k2"]);
  // `wide` keeps every column (all high priority) so the table must scroll.
  const priority = (level: "medium" | "low") => (wide ? "high" : level);
  return (
    <DataTable
      caption={wide ? "Wide keys" : "API keys"}
      density="compact"
      striped
      rows={keys}
      rowLabel={(row) => row.name}
      selectedIds={selected}
      onSelectionChange={setSelected}
      columns={[
        { key: "name", label: "Name", truncate: true, render: (r) => r.name },
        {
          key: "status",
          label: "Status",
          render: (r) => <Badge>{r.status}</Badge>,
        },
        {
          key: "prefix",
          label: "Prefix",
          priority: priority("low"),
          render: () => "mk_live_4f9a",
        },
        {
          key: "created",
          label: "Created",
          priority: priority("low"),
          render: () => "12 October 2026",
        },
        {
          key: "used",
          label: "Last used",
          priority: priority("medium"),
          render: () => "3 November 2026",
        },
        {
          key: "action",
          label: "Action",
          pin: "end",
          render: (r) => <Button variant="secondary">Revoke {r.id}</Button>,
        },
      ]}
    />
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("missing fixture root");
const params = new URLSearchParams(location.search);
const scenario = params.get("case");
const appearance = params.get("theme") === "dark" ? "dark" : "light";
createRoot(root).render(
  scenario === "keys" ? (
    <ThemeProvider appearance={appearance}>
      <main style={{ padding: 16 }}>
        <KeysTable />
        <KeysTable wide />
      </main>
    </ThemeProvider>
  ) : (
    <ThemeProvider>
      <main>
        <h1>Application fixture</h1>
        <PagedTable />
        <Chips />
        <GridList
          label="Team"
          items={[
            {
              id: "ana",
              title: "Ana Kovač",
              href: "#ana",
              meta: <a href="#platform">Platform team</a>,
            },
          ]}
        />
        <Palette />
      </main>
    </ThemeProvider>
  ),
);
