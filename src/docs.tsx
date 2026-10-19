import { KitLink } from "./navigation.js";
import { useEffect, useId, useState, type ReactNode } from "react";
import { Button, type LinkAction, type Tone } from "./primitives.js";
import type { NavigationItem } from "./application.js";
import { CommandPalette, type CommandItem } from "./workspace.js";
import { Kbd } from "./display.js";
import { BrandMark } from "./layout.js";
import type { ItemGroup, LinkItem } from "./navigation.js";
import { childLevel, headingTag, type HeadingLevel } from "./heading.js";
import {
  MobileNavDialog,
  NavTreeLinks,
  TermList,
  cx,
  rovingIndex,
} from "./internal.js";

export interface DocsShellProps {
  className?: string;
  brand: string;
  /** Logo node shown in place of the placeholder brand mark. */
  logo?: ReactNode;
  /** Use the available content width for explorers and workspaces. */
  layout?: "article" | "wide";
  navigationLabel?: string;
  homeHref?: string;
  version?: ReactNode;
  sections?: Pick<LinkItem, "label" | "href" | "current">[];
  /** Groups of pages; items show their icon and count, and children become disclosures. */
  navigation: ItemGroup<NavigationItem>[];
  toc?: { id: string; label: string; current?: boolean }[];
  tocLabel?: string;
  tocFooter?: ReactNode;
  search?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

export function DocsShell({
  className,
  brand,
  logo,
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
        <section key={group.label}>
          <h2>{group.label}</h2>
          <NavTreeLinks items={group.items} onNavigate={() => setOpen(false)} />
        </section>
      ))}
    </nav>
  );
  return (
    <div
      className={cx("m-docs-shell", className)}
      data-layout={layout === "article" ? undefined : layout}
    >
      <KitLink className="m-skip" href={`#${contentId}`}>
        Skip to content
      </KitLink>
      <header className="m-docs-header">
        <Button
          variant="ghost"
          className="m-menu-trigger"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          Menu
        </Button>
        <KitLink className="m-brand" href={homeHref}>
          <BrandMark logo={logo} />
          {brand}
        </KitLink>
        {version && <div className="m-docs-version">{version}</div>}
        {sections.length > 0 && (
          <nav aria-label="Sections" className="m-docs-sections">
            {sections.map((s, index) => (
              <KitLink
                key={`${s.label}:${s.href}:${index}`}
                href={s.href}
                aria-current={s.current ? "page" : undefined}
              >
                {s.label}
              </KitLink>
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
                <KitLink
                  key={t.id}
                  href={`#${t.id}`}
                  aria-current={t.current ? "location" : undefined}
                >
                  {t.label}
                </KitLink>
              ))}
            </nav>
            {tocFooter && <div className="m-docs-toc-footer">{tocFooter}</div>}
          </aside>
        )}
      </div>
      <MobileNavDialog open={open} onClose={() => setOpen(false)} title={brand}>
        {tree}
      </MobileNavDialog>
    </div>
  );
}

/** True when a key press belongs to a text field or an open dialog, not the page. */
function ownedKeyPress(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="dialog"], [role="alertdialog"], dialog[open]',
    ),
  );
}

export function SearchTrigger({
  className,
  onOpen,
  label = "Search docs",
}: {
  className?: string;
  onOpen: () => void;
  label?: string;
}) {
  // The shortcut hint is platform-specific; it renders after mount so server
  // and client markup agree.
  const [apple, setApple] = useState<boolean>();
  useEffect(() => {
    setApple(
      /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent),
    );
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        !(e.metaKey || e.ctrlKey) ||
        e.altKey ||
        e.shiftKey ||
        e.key.toLowerCase() !== "k" ||
        e.repeat ||
        // Another trigger on the page already handled this press.
        e.defaultPrevented ||
        ownedKeyPress(e.target)
      )
        return;
      e.preventDefault();
      onOpen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpen]);
  return (
    <button
      type="button"
      className={cx("m-search-trigger", className)}
      onClick={onOpen}
      aria-keyshortcuts="Meta+K Control+K"
    >
      <span>{label}</span>
      {apple !== undefined && <Kbd keys={[apple ? "⌘K" : "Ctrl K"]} />}
    </button>
  );
}

export function SearchDialog(props: {
  open: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  groups: ItemGroup<CommandItem>[];
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
  id,
  className,
  items,
  itemHeadingLevel = 3,
}: {
  id?: string;
  className?: string;
  items: {
    title: string;
    id?: string;
    description?: ReactNode;
    content?: ReactNode;
  }[];
  /** Level of each step's title. */
  itemHeadingLevel?: HeadingLevel;
}) {
  const Heading = headingTag(itemHeadingLevel);
  return (
    <ol id={id} className={cx("m-steps", className)}>
      {items.map((item, i) => (
        <li key={`${item.title}:${i}`}>
          <span className="m-step-number" aria-hidden="true">
            {i + 1}
          </span>
          <div>
            <Heading id={item.id}>{item.title}</Heading>
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

const calloutLabel: Record<Tone, string> = {
  neutral: "Note",
  info: "Note",
  success: "Tip",
  warning: "Warning",
  danger: "Caution",
};

export function Callout({
  id,
  className,
  tone = "neutral",
  title,
  children,
}: {
  id?: string;
  className?: string;
  /** neutral: a note. info: a highlighted note. success: a tip. warning and danger: a caution, e.g. a breaking change. */
  tone?: Tone;
  /** Visible lead-in that also names the note; defaults to the tone's word, e.g. "Warning". */
  title?: string;
  children: ReactNode;
}) {
  const labelId = useId();
  return (
    <div
      id={id}
      className={cx("m-callout", className)}
      role="note"
      aria-labelledby={labelId}
      data-tone={tone === "neutral" ? undefined : tone}
    >
      <strong id={labelId}>{title || calloutLabel[tone]}</strong>
      <span aria-hidden="true"> · </span>
      <div>{children}</div>
    </div>
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
  id,
  className,
  label,
  items,
}: {
  id?: string;
  className?: string;
  label: string;
  items: FileNode[];
}) {
  return (
    <figure id={id} className={cx("m-file-tree", className)} aria-label={label}>
      <FileBranch nodes={items} />
    </figure>
  );
}

function CopyButton({ text }: { text: string }) {
  const [result, setResult] = useState<"copied" | "failed">();
  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => setResult(undefined), 1600);
    return () => clearTimeout(t);
  }, [result]);
  const copy = async () => {
    try {
      // A missing API (insecure context) and a denied permission both fail.
      if (!navigator.clipboard) throw Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setResult("copied");
    } catch {
      setResult("failed");
    }
  };
  return (
    <button
      type="button"
      className="m-code-copy"
      data-result={result}
      onClick={copy}
    >
      <span aria-live="polite">
        {result === "copied"
          ? "Copied"
          : result === "failed"
            ? "Copy failed"
            : "Copy"}
      </span>
    </button>
  );
}

/** Dark code surface with optional language tabs, filename, line numbers and highlighted lines. */
export function CodeTabs({
  id,
  className,
  tabs,
  filename,
  language,
  lineNumbers = false,
  highlightLines = [],
  prompt,
}: {
  id?: string;
  className?: string;
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
  const tabId = (tab: { id: string }) => `${base}-tab-${tab.id}`;
  const panelId = `${base}-panel`;
  return (
    <figure id={id} className={cx("m-code-tabs", className)}>
      <div className="m-code-bar">
        {tabs.length > 1 ? (
          <div role="tablist" aria-label={filename || "Code examples"}>
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={tabId(t)}
                aria-selected={t.id === current.id}
                aria-controls={panelId}
                tabIndex={t.id === current.id ? 0 : -1}
                onClick={() => setActive(t.id)}
                onKeyDown={(e) => {
                  const n = rovingIndex(
                    e.key,
                    tabs.findIndex((x) => x.id === current.id),
                    tabs.length,
                  );
                  if (n === null) return;
                  e.preventDefault();
                  const next = tabs[n]!;
                  setActive(next.id);
                  document.getElementById(tabId(next))?.focus();
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
        id={tabs.length > 1 ? panelId : undefined}
        role={tabs.length > 1 ? "tabpanel" : undefined}
        aria-labelledby={tabs.length > 1 ? tabId(current) : undefined}
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
  id,
  className,
  version,
  date,
  dateLabel,
  changes,
  headingLevel = 3,
}: {
  id?: string;
  className?: string;
  /** Level of the version heading; change groups sit one level below. */
  headingLevel?: HeadingLevel;
  version: string;
  date: string;
  dateLabel: string;
  changes: {
    type: "added" | "changed" | "fixed" | "deprecated" | "removed";
    items: ReactNode[];
  }[];
}) {
  const Heading = headingTag(headingLevel);
  const GroupHeading = headingTag(childLevel(headingLevel));
  return (
    <article id={id} className={cx("m-release", className)}>
      <header>
        <Heading className="m-release-version">{version}</Heading>
        <time dateTime={date}>{dateLabel}</time>
      </header>
      <div>
        {changes.map((c) => (
          <section key={c.type} data-type={c.type}>
            <GroupHeading className="m-release-type">
              {c.type.charAt(0).toUpperCase() + c.type.slice(1)}
            </GroupHeading>
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
  id,
  className,
  headingLevel = 2,
  method,
  path,
  title,
  description,
  paramsLabel = "Body parameters",
  params,
  examples,
}: {
  id?: string;
  className?: string;
  /** Level of the endpoint title; the parameters heading sits one level below. */
  headingLevel?: HeadingLevel;
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
  const headingId = useId();
  const Heading = headingTag(headingLevel);
  const ParamsHeading = headingTag(childLevel(headingLevel));
  return (
    <section
      id={id}
      className={cx("m-api-endpoint", className)}
      aria-labelledby={headingId}
    >
      <div className="m-api-text">
        <p className="m-api-route">
          <span data-method={method}>{method}</span>
          <code>{path}</code>
        </p>
        <Heading id={headingId} className="m-api-title">
          {title}
        </Heading>
        {description && <div className="m-api-description">{description}</div>}
        <ParamsHeading className="m-api-params-title">
          {paramsLabel}
        </ParamsHeading>
        <TermList
          className="m-param-list"
          items={params.map((p) => ({
            key: p.name,
            term: (
              <>
                <code>{p.name}</code>
                <span>{p.type}</span>
                <span data-required={p.required || undefined}>
                  {p.required ? "Required" : "Optional"}
                </span>
              </>
            ),
            details: p.description,
          }))}
        />
      </div>
      {examples && <div className="m-api-examples">{examples}</div>}
    </section>
  );
}

export function PageFeedback({
  id,
  className,
  question = "Was this page helpful?",
  value,
  onChange,
  updated,
}: {
  id?: string;
  className?: string;
  question?: string;
  value: "yes" | "no" | null;
  onChange: (value: "yes" | "no") => void;
  updated?: ReactNode;
}) {
  return (
    <div id={id} className={cx("m-page-feedback", className)}>
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
  id,
  className,
  previous,
  next,
  label = "Previous and next page",
}: {
  id?: string;
  className?: string;
  previous?: LinkAction;
  next?: LinkAction;
  /** Names the navigation landmark; keep it distinct from other navigation on the page. */
  label?: string;
}) {
  return (
    <nav id={id} className={cx("m-pager", className)} aria-label={label}>
      {previous ? (
        <KitLink href={previous.href} rel="prev">
          <small>Previous</small>
          <span>
            <span aria-hidden="true">← </span>
            {previous.label}
          </span>
        </KitLink>
      ) : (
        <span />
      )}
      {next && (
        <KitLink href={next.href} rel="next" data-next="true">
          <small>Next</small>
          <span>
            {next.label}
            <span aria-hidden="true"> →</span>
          </span>
        </KitLink>
      )}
    </nav>
  );
}

export function LinkCards({
  id,
  className,
  items,
}: {
  id?: string;
  className?: string;
  items: Pick<LinkItem, "label" | "href" | "description">[];
}) {
  return (
    <ul id={id} className={cx("m-link-cards", className)}>
      {items.map((item, index) => (
        <li key={`${item.label}:${item.href}:${index}`}>
          <KitLink href={item.href}>
            <strong>
              {item.label}
              <span aria-hidden="true"> →</span>
            </strong>
            {item.description && <span>{item.description}</span>}
          </KitLink>
        </li>
      ))}
    </ul>
  );
}
