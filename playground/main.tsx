import { KitLink } from "../src/navigation.js";
import { Suspense, lazy, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  ThemeProvider,
  Select,
  SegmentedControl,
  PageHeading,
  DocsShell,
  Input,
  CodeBlock,
  Badge,
  PagerLinks,
} from "../src/index.js";
import catalog from "../catalog.json";
import { templates } from "./templates.js";
import {
  CategoryPage,
  ExamplePanel,
  Overview,
  PreviewRoot,
  categoryHref,
  findCategory,
  homeHref,
  kits,
  locate,
  ordered,
  url,
} from "./explorer.js";
import "./styles.css";
const BrandBuilder = lazy(() =>
  import("./brand-builder.js").then((m) => ({ default: m.BrandBuilder })),
);
function Playground({
  params,
  navigate,
}: {
  params: URLSearchParams;
  navigate: (href: string) => void | false;
}) {
  const component = params.get("component");
  const tool = params.get("page") === "brand" ? "brand" : null;
  const category = findCategory(params.get("category"));
  const kitId = kits.some((k) => k.id === params.get("kit"))
    ? params.get("kit")
    : null;
  const entry = component
    ? catalog.components.find((c) => c.export === component)
    : undefined;
  const [search, setSearch] = useState("");
  const needle = search.toLowerCase();
  const matches = catalog.components.filter((c) =>
    `${c.name} ${c.kitId} ${locate(c.export)?.category.title ?? ""}`
      .toLowerCase()
      .includes(needle),
  );
  const navigation = [
    {
      label: "Browse",
      items: [
        {
          label: "All components",
          href: homeHref(),
          current: !component && !category && !kitId && !tool,
        },
        {
          label: "Brand builder",
          href: url("page", "brand"),
          current: tool === "brand",
        },
      ],
    },
    ...kits.flatMap((kit) =>
      kit.categories.map((cat) => ({
        label: cat.title,
        items: cat.components
          .filter((name) => matches.some((c) => c.export === name))
          .map((name) => ({
            label: name,
            href: url("component", name),
            current: name === component,
          })),
      })),
    ),
  ]
    .filter((group) => group.items.length)
    .concat({
      label: "Page templates",
      items: templates.map((template) => ({
        label: template.title,
        href: url("recipe", template.id),
        current: false,
      })),
    });
  const place = component ? locate(component) : undefined;
  const index = place ? ordered.indexOf(place) : -1;
  const pager = (offset: number) => {
    const item = index >= 0 ? ordered[index + offset] : undefined;
    return item
      ? { label: item.name, href: url("component", item.name) }
      : undefined;
  };
  let content;
  if (tool === "brand") {
    content = (
      <Suspense
        fallback={
          <p role="status" aria-label="Loading brand builder">
            Loading brand builder…
          </p>
        }
      >
        <BrandBuilder />
      </Suspense>
    );
  } else if (component) {
    content = (
      <>
        <PageHeading
          title={entry?.name || "Component not found"}
          description={
            entry?.description || "Choose a component from the catalogue."
          }
          breadcrumbs={
            place
              ? [
                  { label: "Components", href: homeHref() },
                  { label: place.kit.title, href: url("kit", place.kit.id) },
                  {
                    label: place.category.title,
                    href: categoryHref(place.kit, place.category),
                  },
                  { label: place.name },
                ]
              : undefined
          }
          actions={
            entry && place ? <Badge>{place.kit.title}</Badge> : undefined
          }
        />
        {entry ? (
          <ExamplePanel
            entry={entry}
            view={params.get("view") === "code" ? "code" : "preview"}
            onViewChange={(view) => navigate(url("view", view))}
            toolbar={
              <section
                className="pg-example-toolbar"
                aria-label="Preview settings"
              >
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
              </section>
            }
          >
            <PreviewRoot
              name={entry.export}
              stateKey={params.get("state") || "default"}
            />
          </ExamplePanel>
        ) : (
          <PreviewRoot name={component} />
        )}
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
        {place && <PagerLinks previous={pager(-1)} next={pager(1)} />}
      </>
    );
  } else if (category) {
    content = <CategoryPage kit={category.kit} category={category.category} />;
  } else {
    content = <Overview kitId={kitId} />;
  }
  return (
    <DocsShell
      brand="Mortar"
      homeHref={homeHref()}
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
      <div className="m-stack pg-crumbs">
        <div className="max-w-md">
          <Input
            label="Find a component"
            type="search"
            placeholder="Search components, kits or categories…"
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
        {content}
      </div>
    </DocsShell>
  );
}
function PlaygroundApp() {
  const [query, setQuery] = useState(location.search);
  const params = new URLSearchParams(query);
  const Template = templates.find(
    (template) => template.id === params.get("recipe"),
  )?.Component;
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
      {Template ? (
        <Suspense
          fallback={
            <p role="status" className="m-sr-only">
              Loading page…
            </p>
          }
        >
          <Template />
        </Suspense>
      ) : (
        <Playground params={params} navigate={navigate} />
      )}
    </ThemeProvider>
  );
}
createRoot(document.getElementById("root")!).render(<PlaygroundApp />);
