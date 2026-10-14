import { useEffect, useId, useState, type ReactNode } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { Button, type LinkAction } from "./primitives.js";
import type { NavigationItem } from "./application.js";
import { CommandPalette, type CommandItem } from "./workspace.js";
import { Kbd } from "./display.js";

export interface DocsShellProps {
  brand: string;
  /** Use the available content width for explorers and workspaces. */
  layout?: "article" | "wide";
  navigationLabel?: string;
  homeHref?: string;
  version?: ReactNode;
  sections?: (LinkAction & { current?: boolean })[];
  navigation: { title: string; items: NavigationItem[] }[];
  toc?: { id: string; label: string; current?: boolean }[];
  tocLabel?: string;
  tocFooter?: ReactNode;
  search?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

export function DocsShell({
  brand,
  layout = "article",
  navigationLabel = "Documentation",
  homeHref = "/",
  version,
  sections = [],
  navigation,
  toc = [],
  tocLabel = "On this page",
  tocFooter,
  search,
  actions,
  children,
}: DocsShellProps) {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const tree = (
    <nav aria-label={navigationLabel}>
      {navigation.map((group) => (
        <section key={group.title}>
          <h2>{group.title}</h2>
          {group.items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={item.current ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </section>
      ))}
    </nav>
  );
  return (
    <div className="m-docs-shell" data-layout={layout}>
      <a className="m-skip" href={`#${contentId}`}>
        Skip to content
      </a>
      <header className="m-docs-header">
        <Button
          variant="ghost"
          className="m-menu-trigger"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
        >
          Menu
        </Button>
        <a className="m-brand" href={homeHref}>
          <span className="m-mark" aria-hidden="true" />
          {brand}
        </a>
        {version && <div className="m-docs-version">{version}</div>}
        {sections.length > 0 && (
          <nav aria-label="Sections" className="m-docs-sections">
            {sections.map((s) => (
              <a
                key={s.href}
                href={s.href}
                aria-current={s.current ? "page" : undefined}
              >
                {s.label}
              </a>
            ))}
          </nav>
        )}
        <div className="m-actions">
          {search}
          {actions}
        </div>
      </header>
      <div className="m-docs-body">
        <aside className="m-docs-nav">{tree}</aside>
        <main id={contentId} tabIndex={-1}>
          {children}
        </main>
        {toc.length > 0 && (
          <aside className="m-docs-toc">
            <nav aria-label={tocLabel}>
              <h2>{tocLabel}</h2>
              {toc.map((t) => (
                <a
                  key={t.id}
                  href={`#${t.id}`}
                  aria-current={t.current ? "location" : undefined}
                >
                  {t.label}
                </a>
              ))}
            </nav>
            {tocFooter && <div className="m-docs-toc-footer">{tocFooter}</div>}
          </aside>
        )}
      </div>
      <Dialog open={open} onClose={() => setOpen(false)} className="m-dialog">
        <div className="m-backdrop" aria-hidden="true" />
        <DialogPanel className="m-mobile-sidebar">
          <div className="m-dialog-heading">
            <DialogTitle>{brand}</DialogTitle>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Close navigation
            </Button>
          </div>
          {tree}
        </DialogPanel>
      </Dialog>
    </div>
  );
}

export function SearchTrigger({
  onOpen,
  label = "Search docs",
}: {
  onOpen: () => void;
  label?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpen]);
  return (
    <button
      type="button"
      className="m-search-trigger"
      onClick={onOpen}
      aria-keyshortcuts="Meta+K Control+K"
    >
      <span>{label}</span>
      <Kbd keys={["⌘K"]} />
    </button>
  );
}

export function SearchDialog(props: {
  open: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  groups: { label: string; items: CommandItem[] }[];
  attribution?: ReactNode;
}) {
  return (
    <CommandPalette
      {...props}
      label="Search documentation"
      placeholder="Search docs"
      footer={
        <>
          <span>
            <Kbd keys={["↑", "↓"]} /> navigate
          </span>
          <span>
            <Kbd keys={["↵"]} /> open
          </span>
          {props.attribution && (
            <span className="m-palette-attribution">{props.attribution}</span>
          )}
        </>
      }
    />
  );
}

export function Steps({
  items,
}: {
  items: {
    title: string;
    id?: string;
    description?: ReactNode;
    content?: ReactNode;
  }[];
}) {
  return (
    <ol className="m-steps">
      {items.map((item, i) => (
        <li key={item.title}>
          <span className="m-step-number" aria-hidden="true">
            {i + 1}
          </span>
          <div>
            <h3 id={item.id}>{item.title}</h3>
            {item.description && (
              <div className="m-step-description">{item.description}</div>
            )}
            {item.content}
          </div>
        </li>
      ))}
    </ol>
  );
}

const calloutLabel = {
  note: "Note",
  tip: "Tip",
  warning: "Warning",
  breaking: "Breaking",
} as const;

export function Callout({
  type = "note",
  title,
  children,
}: {
  type?: keyof typeof calloutLabel;
  title?: string;
  children: ReactNode;
}) {
  return (
    <aside
      className="m-callout"
      data-type={type}
      aria-label={title || calloutLabel[type]}
    >
      <strong>{title || calloutLabel[type]}</strong>
      <span aria-hidden="true"> · </span>
      <div>{children}</div>
    </aside>
  );
}

export interface FileNode {
  name: string;
  note?: string;
  highlighted?: boolean;
  children?: FileNode[];
}

function FileBranch({ nodes }: { nodes: FileNode[] }) {
  return (
    <ul>
      {nodes.map((node) => (
        <li
          key={node.name}
          data-folder={!!node.children || undefined}
          data-highlighted={node.highlighted || undefined}
        >
          <span className="m-file-row">
            <span aria-hidden="true" className="m-file-caret">
              {node.children ? "▾" : ""}
            </span>
            <span>{node.name}</span>
            {node.note && <small>{node.note}</small>}
          </span>
          {node.children && <FileBranch nodes={node.children} />}
        </li>
      ))}
    </ul>
  );
}

export function FileTree({
  label,
  items,
}: {
  label: string;
  items: FileNode[];
}) {
  return (
    <figure className="m-file-tree" aria-label={label}>
      <FileBranch nodes={items} />
    </figure>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="m-prose">{children}</div>;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <button
      type="button"
      className="m-code-copy"
      onClick={() =>
        navigator.clipboard?.writeText(text).then(() => setCopied(true))
      }
    >
      <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

/** Dark code surface with optional language tabs, filename, line numbers and highlighted lines. */
export function CodeTabs({
  tabs,
  filename,
  language,
  lineNumbers = false,
  highlightLines = [],
  prompt,
}: {
  tabs: { id: string; label: string; code: string }[];
  filename?: string;
  language?: string;
  lineNumbers?: boolean;
  highlightLines?: number[];
  prompt?: string;
}) {
  const [active, setActive] = useState(tabs[0]?.id);
  const base = useId();
  const current = tabs.find((t) => t.id === active) || tabs[0];
  if (!current) return null;
  const lines = current.code.split("\n");
  return (
    <figure className="m-code-tabs">
      <div className="m-code-bar">
        {tabs.length > 1 ? (
          <div role="tablist" aria-label={filename || "Code examples"}>
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`${base}-${t.id}`}
                aria-selected={t.id === current.id}
                tabIndex={t.id === current.id ? 0 : -1}
                onClick={() => setActive(t.id)}
                onKeyDown={(e) => {
                  const i = tabs.findIndex((x) => x.id === current.id);
                  const n =
                    e.key === "ArrowRight"
                      ? i + 1
                      : e.key === "ArrowLeft"
                        ? i - 1
                        : null;
                  if (n === null) return;
                  const next = tabs[(n + tabs.length) % tabs.length]!;
                  setActive(next.id);
                  document.getElementById(`${base}-${next.id}`)?.focus();
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : (
          <figcaption>{filename || current.label}</figcaption>
        )}
        {language && <span className="m-code-language">{language}</span>}
        <CopyButton text={current.code} />
      </div>
      <pre
        tabIndex={0}
        role={tabs.length > 1 ? "tabpanel" : undefined}
        aria-labelledby={tabs.length > 1 ? `${base}-${current.id}` : undefined}
      >
        <code>
          {lines.map((line, i) => (
            <span
              key={i}
              className="m-code-line"
              data-highlighted={highlightLines.includes(i + 1) || undefined}
            >
              {lineNumbers && (
                <span className="m-code-number" aria-hidden="true">
                  {i + 1}
                </span>
              )}
              {prompt && (
                <span className="m-code-prompt" aria-hidden="true">
                  {prompt}{" "}
                </span>
              )}
              {line || " "}
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}

export function Release({
  version,
  date,
  dateLabel,
  changes,
}: {
  version: string;
  date: string;
  dateLabel: string;
  changes: {
    type: "added" | "changed" | "fixed" | "deprecated" | "removed";
    items: ReactNode[];
  }[];
}) {
  return (
    <article className="m-release">
      <header>
        <h3>{version}</h3>
        <time dateTime={date}>{dateLabel}</time>
      </header>
      <div>
        {changes.map((c) => (
          <section key={c.type} data-type={c.type}>
            <h4>{c.type.charAt(0).toUpperCase() + c.type.slice(1)}</h4>
            <ul>
              {c.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </article>
  );
}

export function ApiEndpoint({
  method,
  path,
  title,
  description,
  paramsLabel = "Body parameters",
  params,
  examples,
}: {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  title: string;
  description?: ReactNode;
  paramsLabel?: string;
  params: {
    name: string;
    type: string;
    required?: boolean;
    description: ReactNode;
  }[];
  /** Request/response samples, typically CodeTabs. */
  examples?: ReactNode;
}) {
  const id = useId();
  return (
    <section className="m-api-endpoint" aria-labelledby={id}>
      <div className="m-api-text">
        <p className="m-api-route">
          <span data-method={method}>{method}</span>
          <code>{path}</code>
        </p>
        <h2 id={id}>{title}</h2>
        {description && <div className="m-api-description">{description}</div>}
        <h3>{paramsLabel}</h3>
        <dl className="m-param-list">
          {params.map((p) => (
            <div key={p.name}>
              <dt>
                <code>{p.name}</code>
                <span>{p.type}</span>
                <span data-required={p.required || undefined}>
                  {p.required ? "Required" : "Optional"}
                </span>
              </dt>
              <dd>{p.description}</dd>
            </div>
          ))}
        </dl>
      </div>
      {examples && <div className="m-api-examples">{examples}</div>}
    </section>
  );
}

export function PageFeedback({
  question = "Was this page helpful?",
  value,
  onChange,
  updated,
}: {
  question?: string;
  value: "yes" | "no" | null;
  onChange: (value: "yes" | "no") => void;
  updated?: ReactNode;
}) {
  return (
    <div className="m-page-feedback">
      <div role="group" aria-label={question}>
        <span>{question}</span>
        {(["yes", "no"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={value === v}
            onClick={() => onChange(v)}
          >
            {v === "yes" ? "Yes" : "No"}
          </button>
        ))}
      </div>
      {updated && <span>{updated}</span>}
    </div>
  );
}

export function PagerLinks({
  previous,
  next,
}: {
  previous?: LinkAction;
  next?: LinkAction;
}) {
  return (
    <nav className="m-pager" aria-label="Pagination">
      {previous ? (
        <a href={previous.href} rel="prev">
          <small>Previous</small>
          <span>← {previous.label}</span>
        </a>
      ) : (
        <span />
      )}
      {next && (
        <a href={next.href} rel="next" data-next>
          <small>Next</small>
          <span>{next.label} →</span>
        </a>
      )}
    </nav>
  );
}

export function LinkCards({
  items,
}: {
  items: { href: string; title: string; description?: string }[];
}) {
  return (
    <ul className="m-link-cards">
      {items.map((item) => (
        <li key={item.href}>
          <a href={item.href}>
            <strong>{item.title} →</strong>
            {item.description && <span>{item.description}</span>}
          </a>
        </li>
      ))}
    </ul>
  );
}
