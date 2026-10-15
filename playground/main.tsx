import { KitLink } from "../src/navigation.js";
import {
  Suspense,
  lazy,
  useState,
  useEffect,
  useMemo,
  type ComponentType,
} from "react";
import { createRoot } from "react-dom/client";
import {
  ThemeProvider,
  Select,
  SegmentedControl,
  PageHeading,
  Notice,
  DocsShell,
  Input,
  CodeBlock,
  Badge,
} from "../src/index.js";
import catalog from "../catalog.json";
import { SaasLandingRecipe } from "./recipes.js";
import "./styles.css";
const fixtures = import.meta.glob("../previews/*Preview.tsx");
const kitNames: Record<string, string> = {
  foundation: "Foundation",
  application: "Application UI",
  marketing: "Marketing UI",
  docs: "Documentation",
};
function url(key: string, value: string) {
  const next = new URLSearchParams(location.search);
  next.set(key, value);
  if (key === "state" && value === "default") next.delete("state");
  if (key === "component") {
    next.delete("state");
    next.delete("recipe");
  }
  return `?${next}`;
}
function Playground({
  params,
  navigate,
}: {
  params: URLSearchParams;
  navigate: (href: string) => void | false;
}) {
  const component = params.get("component") || "Button";
  const entry = catalog.components.find((c) => c.export === component);
  const Preview = useMemo(() => {
    const loader = entry ? fixtures[`../${entry.preview.source}`] : undefined;
    return loader
      ? lazy(loader as () => Promise<{ default: ComponentType }>)
      : null;
  }, [entry]);
  const [search, setSearch] = useState("");
  const matches = catalog.components.filter((c) =>
    `${c.name} ${c.kitId}`.toLowerCase().includes(search.toLowerCase()),
  );
  const navigation = Object.entries(kitNames)
    .map(([id, title]) => ({
      title,
      items: matches
        .filter((c) => c.kitId === id)
        .map((c) => ({
          label: c.name,
          href: url("component", c.export),
          current: c.export === component,
        })),
    }))
    .filter((group) => group.items.length)
    .concat({
      title: "Page recipes",
      items: [
        {
          label: "SaaS landing",
          href: url("recipe", "saas-landing"),
          current: false,
        },
      ],
    });
  return (
    <DocsShell
      brand="Mortar"
      homeHref="?component=Button"
      version="Playground"
      layout="wide"
      navigationLabel="Component catalogue"
      navigation={navigation}
      actions={
        <SegmentedControl
          label="Appearance"
          value={params.get("theme") || "light"}
          options={[
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
            { value: "system", label: "System" },
          ]}
          onChange={(value) => navigate(url("theme", value))}
        />
      }
    >
      <div className="m-stack">
        <div className="max-w-md">
          <Input
            label="Find a component"
            type="search"
            placeholder="Search components or kits…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {search && (
          <div role="status">
            {matches.length} matching components
            {matches.length === 0
              ? ". Try another name or clear your search."
              : ""}
          </div>
        )}
        <div
          className={search ? "flex flex-wrap gap-2" : "hidden"}
          role="group"
          aria-label="Search results"
        >
          {search &&
            matches.map((c) => (
              <KitLink
                className="m-button"
                href={url("component", c.export)}
                key={c.id}
              >
                {c.name}
              </KitLink>
            ))}
        </div>
        <PageHeading
          title={entry?.name || "Component not found"}
          description={
            entry?.description || "Choose a component from the catalogue."
          }
          actions={entry ? <Badge>{kitNames[entry.kitId]}</Badge> : undefined}
        />
        <section className="m-stack" aria-label="Preview settings">
          <div className="flex flex-wrap gap-4 items-end">
            <Select
              label="Brand"
              value={params.get("brand") || "neutral"}
              options={[
                { value: "neutral", label: "Neutral" },
                { value: "green", label: "Green" },
              ]}
              onChange={(e) => navigate(url("brand", e.target.value))}
            />
            <Select
              label="Density"
              value={params.get("density") || "comfortable"}
              options={[
                { value: "compact", label: "Compact" },
                { value: "comfortable", label: "Comfortable" },
                { value: "spacious", label: "Spacious" },
              ]}
              onChange={(e) => navigate(url("density", e.target.value))}
            />
            {entry && (
              <Select
                label="Example state"
                value={params.get("state") || "default"}
                options={[
                  { value: "default", label: "Default" },
                  ...entry.testing.states.map((state) => ({
                    value: state,
                    label: state,
                  })),
                ]}
                onChange={(e) => navigate(url("state", e.target.value))}
              />
            )}
          </div>
        </section>
        <section
          aria-label="Live preview"
          className="rounded-lg border border-[var(--m-line)] p-6 min-w-0 min-h-36"
        >
          <Suspense
            fallback={
              <p role="status" aria-label="Loading preview">
                Loading preview…
              </p>
            }
          >
            {Preview ? (
              <div data-mortar-preview={component}>
                <Preview key={params.get("state") || "default"} />
              </div>
            ) : (
              <Notice title="Unknown component" tone="danger">
                Choose a component from the catalogue.
              </Notice>
            )}
          </Suspense>
        </section>
        {entry && (
          <details>
            <summary>Usage and component contract</summary>
            <div className="m-stack pt-4">
              <CodeBlock
                label="Import"
                code={`import { ${entry.export} } from "@tony-ui/mortar";`}
              />
              <p>{entry.contract.usage}</p>
              <CodeBlock
                label="Props"
                code={JSON.stringify(entry.contract.props, null, 2)}
              />
              <p>{entry.contract.accessibility}</p>
            </div>
          </details>
        )}
      </div>
    </DocsShell>
  );
}
function PlaygroundApp() {
  const [query, setQuery] = useState(location.search);
  const params = new URLSearchParams(query);
  useEffect(() => {
    const sync = () => setQuery(location.search);
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  const navigate = (href: string): void | false => {
    const destination = new URL(href, location.href);
    if (
      destination.origin !== location.origin ||
      destination.pathname !== location.pathname
    )
      return false;
    if (destination.href !== location.href)
      history.pushState(null, "", destination);
    setQuery(destination.search);
  };
  return (
    <ThemeProvider
      brand={params.get("brand") === "green" ? "green" : "neutral"}
      navigate={navigate}
      onAppearanceChange={(value) => navigate(url("theme", value))}
      appearance={
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
      {params.get("recipe") === "saas-landing" ? (
        <SaasLandingRecipe />
      ) : (
        <Playground params={params} navigate={navigate} />
      )}
    </ThemeProvider>
  );
}
createRoot(document.getElementById("root")!).render(<PlaygroundApp />);
