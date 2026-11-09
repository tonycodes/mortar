// Seeded legacy imports for tests/cli.test.mjs. Do not "fix" this file.
import { Button, ThemeProvider } from "@tony-ui/mortar";
import { brandToCss } from "@tony-ui/mortar/brand";
import { Card as Panel } from "@tony-ui/mortar/src/layout";
import "@tony-ui/mortar/styles.css";

void brandToCss;

export function App() {
  return (
    <ThemeProvider
      brand="neutral"
      density="comfortable"
      initialAppearance="system"
    >
      <Button type="button">Save</Button>
      <Panel />
    </ThemeProvider>
  );
}
