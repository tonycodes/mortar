// A clean application that renders DataTable: the audit must find nothing.
import {
  AppShell,
  Button,
  DataTable,
  PageHeading,
  ThemeProvider,
  type SectionTone,
} from "@tonycodes-ui/mortar";
import * as M from "@tonycodes-ui/mortar";

const tone: SectionTone = "muted";
const columns = [
  {
    key: "name",
    label: "Name",
    render: (row: { id: string; name: string }) => row.name,
  },
];

export function App({ onSave }: { onSave: () => void }) {
  const props = { size: "sm" as const };
  const rows = [{ id: "keys", name: "API keys" }];
  return (
    <ThemeProvider
      brand="neutral"
      density="comfortable"
      initialAppearance="system"
    >
      <AppShell
        brand="Example"
        navigation={[{ label: "Overview", href: "/", current: true }]}
      >
        <PageHeading
          title="Projects"
          description={`Don't panic: ${tone}`}
          actions={
            <Button
              variant="secondary"
              type="button"
              onClick={onSave}
              {...props}
            >
              Save
            </Button>
          }
        />
        <DataTable
          caption="API keys"
          columns={columns}
          rows={rows}
          rowLabel={(row) => row.name}
        />
        <M.Notice tone="success" title="Saved" />
        <a href="#add" className="layout" data-testid="projects">
          Add
        </a>
      </AppShell>
    </ThemeProvider>
  );
}
