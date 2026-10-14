import {
  useId,
  useRef,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { Button, EmptyState, Input, Notice, type Tone } from "./primitives.js";
import { BrandMark } from "./layout.js";
export interface NavigationItem {
  label: string;
  href: string;
  current?: boolean;
  count?: string;
}
export interface AppShellProps {
  brand: string;
  /** Logo node shown in place of the placeholder brand mark. */
  logo?: ReactNode;
  workspace?: string;
  user?: ReactNode;
  navigation: NavigationItem[];
  secondaryNavigation?: { label: string; items: NavigationItem[] }[];
  header?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}
export function AppShell({
  brand,
  logo,
  workspace,
  user,
  navigation,
  secondaryNavigation = [],
  header,
  actions,
  children,
}: AppShellProps) {
  const [open, setOpen] = useState(false);
  const links = (items: NavigationItem[]) =>
    items.map((item) => (
      <a
        key={item.href}
        href={item.href}
        aria-current={item.current ? "page" : undefined}
        onClick={() => setOpen(false)}
      >
        <span className="m-nav-marker" aria-hidden="true" />
        {item.label}
        {item.count && <span className="m-nav-count">{item.count}</span>}
      </a>
    ));
  const content = (
    <>
      <a className="m-workspace" href={navigation[0]?.href || "#"}>
        <BrandMark logo={logo} />
        <span>
          <strong>{brand}</strong>
          {workspace && <small>{workspace}</small>}
        </span>
      </a>
      <nav aria-label="Primary">
        {links(navigation)}
        {secondaryNavigation.map((group) => (
          <section key={group.label}>
            <h2>{group.label}</h2>
            {links(group.items)}
          </section>
        ))}
      </nav>
      {user && <div className="m-user">{user}</div>}
    </>
  );
  return (
    <div className="m-app-shell">
      <a className="m-skip" href="#m-content">
        Skip to content
      </a>
      <aside className="m-sidebar">{content}</aside>
      <div className="m-app-main">
        <header className="m-app-header">
          <Button
            variant="ghost"
            className="m-menu-trigger"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            Menu
          </Button>
          <div className="m-header-context">{header || workspace || brand}</div>
          <div className="m-actions">{actions}</div>
        </header>
        <main id="m-content" tabIndex={-1}>
          {children}
        </main>
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
          {content}
        </DialogPanel>
      </Dialog>
    </div>
  );
}
export function PageHeading({
  title,
  description,
  eyebrow,
  actions,
  breadcrumbs,
  headingLevel = 1,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <header className="m-page-heading">
      {breadcrumbs && (
        <nav aria-label="Breadcrumb">
          <ol>
            {breadcrumbs.map((b, i) => (
              <li key={i}>
                {b.href ? (
                  <a href={b.href}>{b.label}</a>
                ) : (
                  <span aria-current="page">{b.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="m-heading-row">
        <div>
          {eyebrow && <p className="m-eyebrow">{eyebrow}</p>}
          <Heading>{title}</Heading>
          {description && <p>{description}</p>}
        </div>
        {actions && <div className="m-actions">{actions}</div>}
      </div>
    </header>
  );
}
export function MetricGroup({
  label,
  items,
}: {
  label: string;
  items: { label: string; value: string; change?: string; tone?: Tone }[];
}) {
  return (
    <dl className="m-metrics" aria-label={label}>
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>
            <strong>{item.value}</strong>
            {item.change && (
              <span className={`m-tone-${item.tone || "neutral"}`}>
                {item.change}
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
export interface DataTableProps<T extends { id: string }> {
  caption: string;
  columns: {
    key: string;
    label: string;
    render: (row: T) => ReactNode;
    align?: "left" | "right";
  }[];
  rows: T[];
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  rowLabel: (row: T) => string;
  toolbar?: ReactNode;
  bulkActions?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  loading?: boolean;
  error?: string;
}
function SelectAll({
  checked,
  partial,
  onChange,
}: {
  checked: boolean;
  partial: boolean;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = partial;
  }, [partial]);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label="Select all rows"
      checked={checked}
      onChange={onChange}
    />
  );
}
export function DataTable<T extends { id: string }>({
  caption,
  columns,
  rows,
  selectedIds = [],
  onSelectionChange,
  rowLabel,
  toolbar,
  bulkActions,
  emptyTitle = "No records",
  emptyDescription = "Records will appear here when they are available.",
  loading,
  error,
}: DataTableProps<T>) {
  const selected = rows.filter((row) => selectedIds.includes(row.id));
  return (
    <section className="m-data-table" aria-label={caption}>
      {(toolbar || selected.length > 0) && (
        <div className="m-table-toolbar">
          {selected.length > 0 ? (
            <>
              <strong>{selected.length} selected</strong>
              <div className="m-actions">
                {bulkActions}
                <Button variant="ghost" onClick={() => onSelectionChange?.([])}>
                  Clear selection
                </Button>
              </div>
            </>
          ) : (
            toolbar
          )}
        </div>
      )}
      {loading ? (
        <p className="m-table-state" role="status">
          Loading records…
        </p>
      ) : error ? (
        <Notice title="Unable to load records" tone="danger" announce>
          {error}
        </Notice>
      ) : !rows.length ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div
          className="m-table-scroll"
          role="region"
          aria-label={`${caption} scroll area`}
          tabIndex={0}
        >
          <table>
            <caption className="m-sr-only">{caption}</caption>
            <thead>
              <tr>
                {onSelectionChange && (
                  <th scope="col">
                    <SelectAll
                      checked={selected.length === rows.length}
                      partial={
                        selected.length > 0 && selected.length < rows.length
                      }
                      onChange={() =>
                        onSelectionChange(
                          selected.length === rows.length
                            ? []
                            : rows.map((r) => r.id),
                        )
                      }
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th key={col.key} scope="col" data-align={col.align}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  data-selected={selectedIds.includes(row.id) || undefined}
                >
                  {onSelectionChange && (
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${rowLabel(row)}`}
                        checked={selectedIds.includes(row.id)}
                        onChange={() =>
                          onSelectionChange(
                            selectedIds.includes(row.id)
                              ? selectedIds.filter((id) => id !== row.id)
                              : [...selectedIds, row.id],
                          )
                        }
                      />
                    </td>
                  )}
                  {columns.map((col, index) =>
                    index === 0 ? (
                      <th scope="row" key={col.key} data-align={col.align}>
                        {col.render(row)}
                      </th>
                    ) : (
                      <td key={col.key} data-align={col.align}>
                        {col.render(row)}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
export function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  return (
    <nav className="m-pagination" aria-label="Pagination">
      <span aria-live="polite">
        Page {page} of {Math.max(1, pageCount)}
      </span>
      <div className="m-actions">
        <Button
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          disabled={page >= pageCount}
          onClick={() => onChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section className="m-settings-section" aria-labelledby={id}>
      <div>
        <h2 id={id}>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      <div className="m-stack">{children}</div>
    </section>
  );
}
export function ActivityFeed({
  label,
  items,
}: {
  label: string;
  items: {
    id: string;
    title: string;
    description?: string;
    time: string;
    tone?: Tone;
  }[];
}) {
  return (
    <ol className="m-activity" aria-label={label}>
      {items.map((item) => (
        <li key={item.id}>
          <span
            aria-hidden="true"
            className={`m-activity-dot m-tone-${item.tone || "neutral"}`}
          />
          <div>
            <strong>{item.title}</strong>
            {item.description && <p>{item.description}</p>}
          </div>
          <span>{item.time}</span>
        </li>
      ))}
    </ol>
  );
}

export interface SignInProvider {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
}
/**
 * Brand-consistent sign-in surface. Mortar renders the form; the consumer's auth
 * SDK supplies provider redirects and the email-link request through callbacks.
 */
export function SignInPanel({
  title,
  description,
  logo,
  providers = [],
  email,
  footer,
  dividerLabel = "or",
  headingLevel = 1,
}: {
  title: string;
  /** Use 2 when the panel sits inside a page that already has an h1. */
  headingLevel?: 1 | 2;
  description?: string;
  logo?: ReactNode;
  providers?: SignInProvider[];
  email?: {
    onSubmit: (email: string) => void;
    label?: string;
    placeholder?: string;
    submitLabel?: string;
    status?: "idle" | "submitting" | "success" | "error";
    message?: string;
  };
  footer?: ReactNode;
  dividerLabel?: string;
}) {
  const [value, setValue] = useState("");
  const headingId = useId();
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (email?.status !== "submitting") email?.onSubmit(value);
  };
  return (
    <section className="m-sign-in" aria-labelledby={headingId}>
      <header>
        {logo && <BrandMark logo={logo} />}
        <Heading id={headingId}>{title}</Heading>
        {description && <p>{description}</p>}
      </header>
      {providers.length > 0 && (
        <div className="m-sign-in-providers">
          {providers.map((provider) => (
            <Button
              key={provider.id}
              variant="secondary"
              onClick={provider.onSelect}
            >
              {provider.icon && (
                <span className="m-sign-in-icon" aria-hidden="true">
                  {provider.icon}
                </span>
              )}
              {provider.label}
            </Button>
          ))}
        </div>
      )}
      {providers.length > 0 && email && (
        <p className="m-sign-in-divider">
          <span>{dividerLabel}</span>
        </p>
      )}
      {email && (
        <form onSubmit={submit} aria-busy={email.status === "submitting"}>
          <Input
            label={email.label || "Email address"}
            type="email"
            autoComplete="email"
            placeholder={email.placeholder}
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            error={email.status === "error" ? email.message : undefined}
            disabled={email.status === "submitting"}
          />
          {email.status === "success" && (
            <p role="status">
              {email.message || "Check your inbox for a sign-in link."}
            </p>
          )}
          <Button type="submit" loading={email.status === "submitting"}>
            {email.submitLabel || "Email me a sign-in link"}
          </Button>
        </form>
      )}
      {footer && <footer>{footer}</footer>}
    </section>
  );
}
