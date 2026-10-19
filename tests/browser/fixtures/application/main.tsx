import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
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

const root = document.getElementById("root");
if (!root) throw new Error("missing fixture root");
createRoot(root).render(
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
  </ThemeProvider>,
);
