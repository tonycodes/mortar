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

export function url(key: string, value: string) {
  const next = new URLSearchParams(location.search);
  next.set(key, value);
  if (key === "state" && value === "default") next.delete("state");
  if (key === "view" && value === "preview") next.delete("view");
  if (["component", "category", "kit"].includes(key)) {
    for (const k of ["component", "category", "kit", "state", "recipe", "view"])
      if (k !== key) next.delete(k);
  }
  return `?${next}`;
}
/** Overview link that keeps appearance, brand and density. */
export function homeHref() {
  const next = new URLSearchParams(location.search);
  for (const k of ["component", "category", "kit", "state", "recipe", "view"])
    next.delete(k);
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
const sources = import.meta.glob("../previews/*.tsx", {
  query: "?raw",
  import: "default",
});
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

/** Recover the JSX for one fixture case so the Code view shows what the preview renders. */
export async function exampleSource(entry: Entry): Promise<string> {
  const load = (path: string) =>
    (sources[path] as (() => Promise<string>) | undefined)?.();
  const preview = await load(`../${entry.preview.source}`);
  const fixture = preview?.match(/from "\.\/(\w+)"/)?.[1];
  const text = fixture && (await load(`../previews/${fixture}.tsx`));
  let body: string | undefined;
  if (text) {
    const start = text.indexOf(`case "${entry.export}":`);
    if (start >= 0) {
      const rest = text.slice(start);
      const end = rest.search(/\n\s*break;/);
      const block = end >= 0 ? rest.slice(0, end) : "";
      const open = block.indexOf("= (");
      const close = block.lastIndexOf(");");
      if (open >= 0 && close > open) body = block.slice(open + 3, close);
    }
  }
  const imports = `import { ${entry.export} } from "@tony-ui/mortar";`;
  if (!body) return imports;
  const lines = body.replace(/\bUI\./g, "").split("\n");
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const indent = Math.min(
    ...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length),
  );
  const used = [
    ...new Set(
      [...body.matchAll(/<UI\.(\w+)/g)]
        .map((m) => m[1])
        .filter((n) => entries.has(n)),
    ),
  ].sort();
  return [
    `import { ${(used.length ? used : [entry.export]).join(", ")} } from "@tony-ui/mortar";`,
    "",
    ...lines.map((l) => l.slice(indent)),
  ].join("\n");
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
    <div className="pg-thumb" inert>
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
