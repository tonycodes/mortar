import { Suspense, lazy, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import {
  ThemeProvider,
  Select,
  AppearanceControl,
  PageHeading,
  Notice,
} from "../src/index.js";
import catalog from "../catalog.json";
import "./styles.css";
const fixtures = import.meta.glob("../previews/*Preview.tsx");
const params = new URLSearchParams(location.search);
const component = params.get("component") || "Button";
const loader = fixtures[`../previews/${component}Preview.tsx`];
const Preview = loader
  ? lazy(loader as () => Promise<{ default: ComponentType }>)
  : null;
createRoot(document.getElementById("root")!).render(
  <ThemeProvider
    brand={params.get("brand") === "green" ? "green" : "neutral"}
    initialAppearance={params.get("theme") === "dark" ? "dark" : "light"}
  >
    <main className="m-stack p-6 mx-auto max-w-6xl">
      <PageHeading
        title="Mortar playground"
        description="Shared components and shells. No service account required."
      />
      <div className="flex flex-wrap gap-4 items-end">
        <Select
          label="Component"
          value={component}
          options={catalog.components.map((c) => ({
            value: c.export,
            label: c.name,
          }))}
          onChange={(e) => {
            params.set("component", e.target.value);
            location.search = params.toString();
          }}
        />
        <AppearanceControl />
      </div>
      <Suspense fallback={<p role="status">Loading preview…</p>}>
        {Preview ? (
          <Preview />
        ) : (
          <Notice title="Unknown component" tone="danger">
            Choose a component from the catalogue.
          </Notice>
        )}
      </Suspense>
    </main>
  </ThemeProvider>,
);
