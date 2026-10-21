// Seeded problems for tests/cli.test.mjs. Do not "fix" this file.
import {
  Button,
  Hero,
  PageHeading,
  type MarketingTone,
} from "@tonycodes-ui/mortar";
import { Card as Panel } from "@tonycodes-ui/mortar/src/layout";

export function App({ tone }: { tone: MarketingTone }) {
  return (
    <main className="layout">
      <Hero
        title="Ship faster"
        description="A seeded audit fixture."
        align="center"
      />
      <Hero title="Again" description="Old value." layout="centered" />
      <PageHeading title="Projects" heading="Old heading" />
      <Button variant="primary" colour="red" onClick={() => {}}>
        Save
      </Button>
      <p style={{ color: "#ff3366" }}>{tone}</p>
      <Panel />
    </main>
  );
}
