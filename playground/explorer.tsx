import { KitLink } from "../src/navigation.js";
import {
  Suspense,
  lazy,
  useEffect,
  useId,
  useState,
  type ComponentType,
  type LazyExoticComponent,
  type ReactNode,
} from "react";
import {
  Badge,
  CodeTabs,
  Notice,
  PageHeading,
  SegmentedControl,
} from "../src/index.js";
import catalog from "../catalog.json";
import taxonomy from "./taxonomy.json";
import { templates } from "./templates.js";

export type Entry = (typeof catalog.components)[number];
export type Kit = (typeof taxonomy.kits)[number];
export type Category = Kit["categories"][number];
export const kits = taxonomy.kits;
export const entries = new Map(catalog.components.map((c) => [c.export, c]));
/** Every component in taxonomy order, for previous/next links. */
export const ordered = kits.flatMap((kit) =>
  kit.categories.flatMap((category) =>
    category.components.map((name) => ({ name, kit, category })),
  ),
);

/** URL keys the brand builder (`?page=brand`) owns; other pages drop them. */
export const isBrandParam = (key: string) =>
  key === "name" ||
  key === "font" ||
  key === "font-heading" ||
  /^[ld]-[a-z-]+$/.test(key);
/** Keys that choose what the page shows; choosing one clears the others. */
const PLACES = [
  "component",
  "category",
  "kit",
  "state",
  "recipe",
  "view",
  "page",
];
function clearPlaces(next: URLSearchParams, keep?: string) {
  for (const k of PLACES) if (k !== keep) next.delete(k);
  for (const k of [...next.keys()]) if (isBrandParam(k)) next.delete(k);
}
export function url(key: string, value: string) {
  const next = new URLSearchParams(location.search);
  if (["component", "category", "kit", "recipe", "page"].includes(key))
    clearPlaces(next, key);
  next.set(key, value);
  if (key === "state" && value === "default") next.delete("state");
  if (key === "view" && value === "preview") next.delete("view");
  return `?${next}`;
}
/** Overview link that keeps appearance, brand and density. */
export function homeHref() {
  const next = new URLSearchParams(location.search);
  clearPlaces(next);
  return `?${next}`;
}
export const categoryHref = (kit: Kit, category: Category) =>
  url("category", `${kit.id}/${category.id}`);
export function locate(name: string) {
  return ordered.find((item) => item.name === name);
}
export function findCategory(path: string | null) {
  const [kitId, categoryId] = (path || "").split("/");
  const kit = kits.find((k) => k.id === kitId);
  const category = kit?.categories.find((c) => c.id === categoryId);
  return kit && category ? { kit, category } : undefined;
}

const fixtures = import.meta.glob("../previews/*Preview.tsx");
const previews = new Map<string, LazyExoticComponent<ComponentType>>();
export function previewFor(name: string) {
  const entry = entries.get(name);
  const loader = entry ? fixtures[`../${entry.preview.source}`] : undefined;
  if (!loader) return null;
  if (!previews.has(name))
    previews.set(
      name,
      lazy(loader as () => Promise<{ default: ComponentType }>),
    );
  return previews.get(name)!;
}

/**
 * The JSX one fixture case renders, extracted at build time from the fixture's
 * TypeScript AST (playground/examples.mjs) and loaded on first use.
 */
export async function exampleSource(entry: Entry): Promise<string> {
  const { default: examples } = await import("virtual:mortar-examples");
  return (
    examples[entry.export] ??
    `import { ${entry.export} } from "@tony-ui/mortar";`
  );
}

function ExampleCode({ entry }: { entry: Entry }) {
  const [code, setCode] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    exampleSource(entry).then((text) => live && setCode(text));
    return () => {
      live = false;
    };
  }, [entry]);
  return code === null ? (
    <p role="status">Loading source…</p>
  ) : (
    <CodeTabs
      filename={`${entry.export}Example.tsx`}
      tabs={[{ id: "react", label: "React", code }]}
    />
  );
}

export function PreviewRoot({
  name,
  marked = true,
  stateKey,
}: {
  name: string;
  marked?: boolean;
  stateKey?: string;
}) {
  const Preview = previewFor(name);
  return (
    <Suspense
      fallback={
        <p role="status" aria-label="Loading preview">
          Loading preview…
        </p>
      }
    >
      {Preview ? (
        <div data-mortar-preview={marked ? name : undefined}>
          <Preview key={stateKey} />
        </div>
      ) : (
        <Notice title="Unknown component" tone="danger">
          Choose a component from the catalogue.
        </Notice>
      )}
    </Suspense>
  );
}

/** Tailwind Plus style example: title bar with a Preview/Code switch above a framed canvas. */
export function ExamplePanel({
  entry,
  href,
  view: controlled,
  onViewChange,
  toolbar,
  children,
}: {
  entry: Entry;
  href?: string;
  view?: "preview" | "code";
  onViewChange?: (view: "preview" | "code") => void;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  const id = useId();
  const [local, setLocal] = useState<"preview" | "code">("preview");
  const view = controlled ?? local;
  return (
    <section className="pg-example" aria-labelledby={id}>
      <header className="pg-example-header">
        <div className="pg-example-title">
          <h2 id={id}>
            {href ? <KitLink href={href}>{entry.name}</KitLink> : entry.name}
          </h2>
          {href && <p>{entry.description}</p>}
        </div>
        <SegmentedControl
          label={`${entry.name} view`}
          value={view}
          options={[
            { value: "preview", label: "Preview" },
            { value: "code", label: "Code" },
          ]}
          onChange={(value) => {
            const next = value === "code" ? "code" : "preview";
            if (onViewChange) onViewChange(next);
            else setLocal(next);
          }}
        />
      </header>
      {toolbar}
      {view === "code" ? (
        <div className="pg-example-code">
          <ExampleCode entry={entry} />
        </div>
      ) : (
        <section
          aria-label={`${entry.name} preview`}
          className="pg-canvas rounded-b-lg border border-[var(--m-line)] p-6 min-w-0 min-h-36"
        >
          {children}
        </section>
      )}
    </section>
  );
}

function Thumbnail({ category }: { category: Category }) {
  if (category.thumbnail === null)
    return (
      <div className="pg-thumb pg-thumb-list" aria-hidden="true">
        {category.components.map((name) => (
          <Badge key={name}>{name}</Badge>
        ))}
      </div>
    );
  return (
    // inert removes focus; aria-hidden also hides the copy from tools that ignore inert.
    <div className="pg-thumb" inert aria-hidden="true">
      <div className="pg-thumb-scale">
        <PreviewRoot name={category.thumbnail} marked={false} />
      </div>
    </div>
  );
}

export function Overview({ kitId }: { kitId: string | null }) {
  const shown = kits.filter((k) => !kitId || k.id === kitId);
  const total = shown.reduce(
    (n, k) => n + k.categories.reduce((m, c) => m + c.components.length, 0),
    0,
  );
  const only = kitId ? shown[0] : undefined;
  return (
    <div className="pg-overview">
      <PageHeading
        title={only ? only.title : "Components"}
        description={
          only
            ? `${only.description} ${total} components.`
            : `${total} production-ready React components in ${shown.length} kits, built on shared semantic tokens and tested in light and dark.`
        }
        breadcrumbs={
          only
            ? [{ label: "Components", href: homeHref() }, { label: only.title }]
            : undefined
        }
      />
      {shown.map((kit) => {
        const count = kit.categories.reduce(
          (n, c) => n + c.components.length,
          0,
        );
        return (
          <section
            key={kit.id}
            className="pg-kit"
            aria-labelledby={`kit-${kit.id}`}
          >
            {!only && (
              <header className="pg-kit-header">
                <h2 id={`kit-${kit.id}`}>
                  <KitLink href={url("kit", kit.id)}>{kit.title}</KitLink>
                </h2>
                <p>{kit.description}</p>
                <span>{count} components</span>
              </header>
            )}
            {only && (
              <h2 id={`kit-${kit.id}`} className="m-sr-only">
                Categories
              </h2>
            )}
            <ul className="pg-category-grid">
              {kit.categories.map((category) => (
                <li key={category.id} className="pg-category-card">
                  <Thumbnail category={category} />
                  <h3>
                    <KitLink href={categoryHref(kit, category)}>
                      {category.title}
                    </KitLink>
                  </h3>
                  <p>
                    {category.components.length}{" "}
                    {category.components.length === 1
                      ? "component"
                      : "components"}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {!only && (
        <section className="pg-kit" aria-labelledby="kit-templates">
          <header className="pg-kit-header">
            <h2 id="kit-templates">Page templates</h2>
            <p>Whole pages composed only from Mortar components.</p>
            <span>{templates.length} templates</span>
          </header>
          <ul className="pg-category-grid">
            {templates.map(({ id, title, description, kind, Component }) => (
              <li key={id} className="pg-category-card">
                <div className="pg-thumb" inert aria-hidden="true">
                  <div className="pg-thumb-scale pg-thumb-page">
                    <Suspense fallback={null}>
                      <Component />
                    </Suspense>
                  </div>
                </div>
                <h3>
                  <KitLink href={url("recipe", id)}>{title}</KitLink>
                </h3>
                <p>
                  {kind} · {description}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function CategoryPage({
  kit,
  category,
}: {
  kit: Kit;
  category: Category;
}) {
  return (
    <div className="pg-category">
      <PageHeading
        title={category.title}
        description={`${category.components.length} components in ${kit.title}.`}
        breadcrumbs={[
          { label: "Components", href: homeHref() },
          { label: kit.title, href: url("kit", kit.id) },
          { label: category.title },
        ]}
      />
      {category.components.map((name) => {
        const entry = entries.get(name);
        return entry ? (
          <ExamplePanel key={name} entry={entry} href={url("component", name)}>
            <PreviewRoot name={name} marked={false} />
          </ExamplePanel>
        ) : null;
      })}
    </div>
  );
}
