// A clean application for tests/cli.test.mjs: the audit must find nothing.
import {
  AppShell,
  Button,
  PageHeading,
  ThemeProvider,
  type SectionTone,
} from "@tony-ui/mortar";
import * as M from "@tony-ui/mortar";

const tone: SectionTone = "muted";

export function App({ onSave }: { onSave: () => void }) {
  const props = { size: "sm" as const };
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
        <M.Notice tone="success" title="Saved" />
        <a href="#add" className="layout" data-testid="projects">
          Add
        </a>
      </AppShell>
    </ThemeProvider>
  );
}
