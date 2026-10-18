import { KitLink } from "./navigation.js";
import { Fragment, useId, type ReactNode } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { Button } from "./primitives.js";
import { Kbd } from "./display.js";

export function SlideOver({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  /** Panel width: md (default), lg or xl. */
  size?: "md" | "lg" | "xl";
}) {
  return (
    <Dialog open={open} onClose={onClose} className="m-dialog">
      <div className="m-backdrop" aria-hidden="true" />
      <DialogPanel
        className="m-slide-over"
        data-size={size === "md" ? undefined : size}
      >
        <header>
          <div>
            <DialogTitle>{title}</DialogTitle>
            {description && <Description>{description}</Description>}
          </div>
          <Button variant="ghost" onClick={onClose} aria-label="Close panel">
            <span aria-hidden="true">✕</span>
          </Button>
        </header>
        <div className="m-slide-over-body">{children}</div>
        {actions && <footer className="m-actions">{actions}</footer>}
      </DialogPanel>
    </Dialog>
  );
}

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  meta?: string;
  shortcut?: string[];
  /** Icon or avatar before the label. */
  icon?: ReactNode;
  /** [start, end) character range of label to emphasise as the query match. */
  match?: [number, number];
  onSelect: () => void;
}

function Highlight({
  label,
  match,
}: {
  label: string;
  match?: [number, number];
}) {
  if (!match) return <>{label}</>;
  const [a, b] = match;
  return (
    <>
      {label.slice(0, a)}
      <mark>{label.slice(a, b)}</mark>
      {label.slice(b)}
    </>
  );
}

/** Controlled ⌘K palette. Filtering and ranking stay with the consumer. */
export function CommandPalette({
  open,
  onClose,
  query,
  onQueryChange,
  groups,
  label = "Command menu",
  placeholder = "Type a command or search",
  emptyMessage,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  groups: { label: string; items: CommandItem[] }[];
  label?: string;
  placeholder?: string;
  emptyMessage?: string;
  footer?: ReactNode;
}) {
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  return (
    <Dialog open={open} onClose={onClose} className="m-dialog">
      <div className="m-backdrop" aria-hidden="true" />
      <div className="m-dialog-position m-palette-position">
        <DialogPanel className="m-palette">
          <DialogTitle className="m-sr-only">{label}</DialogTitle>
          <Combobox<CommandItem | null>
            value={null}
            onChange={(item) => {
              if (!item) return;
              item.onSelect();
              onClose();
            }}
          >
            <div className="m-palette-input">
              <ComboboxInput
                autoFocus
                aria-label={label}
                placeholder={placeholder}
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                onKeyDownCapture={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose();
                  }
                }}
              />
              <Kbd keys={["esc"]} />
            </div>
            <ComboboxOptions static className="m-palette-results">
              {groups
                .filter((g) => g.items.length)
                .map((group) => (
                  <div role="group" aria-label={group.label} key={group.label}>
                    <div className="m-palette-group" aria-hidden="true">
                      {group.label}
                    </div>
                    {group.items.map((item) => (
                      <ComboboxOption key={item.id} value={item} as={Fragment}>
                        <div className="m-palette-item">
                          {item.icon && (
                            <span className="m-palette-icon" aria-hidden="true">
                              {item.icon}
                            </span>
                          )}
                          <span>
                            <span className="m-palette-label">
                              <Highlight
                                label={item.label}
                                match={item.match}
                              />
                            </span>
                            {item.description && (
                              <small>{item.description}</small>
                            )}
                          </span>
                          {item.shortcut ? (
                            <Kbd keys={item.shortcut} />
                          ) : (
                            item.meta && (
                              <span className="m-palette-meta">
                                {item.meta}
                              </span>
                            )
                          )}
                        </div>
                      </ComboboxOption>
                    ))}
                  </div>
                ))}
              {!total && (
                <p className="m-palette-empty" role="status">
                  {emptyMessage || `No results for “${query}”.`}
                </p>
              )}
            </ComboboxOptions>
          </Combobox>
          {footer && <div className="m-palette-footer">{footer}</div>}
        </DialogPanel>
      </div>
    </Dialog>
  );
}

export interface StackedListItem {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  href?: string;
}
export function StackedList({
  label,
  heading,
  action,
  items = [],
  groups,
}: {
  label: string;
  heading?: ReactNode;
  action?: ReactNode;
  items?: StackedListItem[];
  /** Sections with sticky headings, e.g. a directory grouped by letter. */
  groups?: { label: string; items: StackedListItem[] }[];
}) {
  const base = useId();
  const row = (item: StackedListItem) => {
    const body = (
      <>
        {item.leading}
        <span className="m-stacked-text">
          <strong>{item.title}</strong>
          {item.description && <span>{item.description}</span>}
        </span>
      </>
    );
    return (
      <li key={item.id}>
        {item.href ? (
          <KitLink href={item.href}>{body}</KitLink>
        ) : (
          <div>{body}</div>
        )}
        {item.trailing && (
          <div className="m-stacked-trailing">{item.trailing}</div>
        )}
      </li>
    );
  };
  return (
    <section className="m-stacked-list" aria-label={label}>
      {(heading || action) && (
        <header>
          <h2>{heading}</h2>
          {action}
        </header>
      )}
      {groups ? (
        groups.map((group, index) => (
          <div key={group.label} className="m-stacked-group">
            <h3 id={`${base}-${index}`} className="m-stacked-group-heading">
              {group.label}
            </h3>
            <ul aria-labelledby={`${base}-${index}`}>{group.items.map(row)}</ul>
          </div>
        ))
      ) : (
        <ul>{items.map(row)}</ul>
      )}
    </section>
  );
}
