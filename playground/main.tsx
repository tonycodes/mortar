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
const entry = catalog.components.find((c) => c.export === component);
const loader = entry ? fixtures[`../${entry.preview.source}`] : undefined;
const Preview = loader
  ? lazy(loader as () => Promise<{ default: ComponentType }>)
  : null;
createRoot(document.getElementById("root")!).render(
  <ThemeProvider
    brand={params.get("brand") === "green" ? "green" : "neutral"}
    initialAppearance={
      params.get("theme") === "system"
        ? "system"
        : params.get("theme") === "dark"
          ? "dark"
          : "light"
    }
    density={
      params.get("density") === "compact"
        ? "compact"
        : params.get("density") === "spacious"
          ? "spacious"
          : "comfortable"
    }
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
      <Suspense
        fallback={
          <p role="status" aria-label="Loading preview">
            Loading preview…
          </p>
        }
      >
        {Preview ? (
          <div data-mortar-preview={component}>
            <Preview />
          </div>
        ) : (
          <Notice title="Unknown component" tone="danger">
            Choose a component from the catalogue.
          </Notice>
        )}
      </Suspense>
    </main>
  </ThemeProvider>,
);
