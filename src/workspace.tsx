import { KitLink, type ItemGroup } from "./navigation.js";
import { Fragment, useId, type ReactNode } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Description,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { Button } from "./primitives.js";
import { Kbd } from "./display.js";
import { Close } from "./icons.js";
import { childLevel, headingTag, type HeadingLevel } from "./heading.js";
import { DialogFrame, cx } from "./internal.js";

export interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  /** Panel width: md (default), lg or xl. */
  size?: "md" | "lg" | "xl";
  /** Class on the sliding panel. */
  className?: string;
}
export function SlideOver({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  size = "md",
  className,
}: SlideOverProps) {
  return (
    <DialogFrame open={open} onClose={onClose}>
      <DialogPanel
        className={cx("m-slide-over", className)}
        data-size={size === "md" ? undefined : size}
      >
        <header>
          <div>
            <DialogTitle>{title}</DialogTitle>
            {description && <Description>{description}</Description>}
          </div>
          <Button variant="ghost" onClick={onClose} aria-label="Close panel">
            <Close />
          </Button>
        </header>
        <div className="m-slide-over-body">{children}</div>
        {actions && <footer className="m-actions">{actions}</footer>}
      </DialogPanel>
    </DialogFrame>
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

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  groups: ItemGroup<CommandItem>[];
  label?: string;
  placeholder?: string;
  /** Announced when no group has items; defaults to "No results for “query”.". */
  empty?: { title: string; description?: string };
  footer?: ReactNode;
  /** Class on the palette panel. */
  className?: string;
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
  empty,
  footer,
  className,
}: CommandPaletteProps) {
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  return (
    <DialogFrame open={open} onClose={onClose}>
      <div className="m-dialog-position m-palette-position">
        <DialogPanel className={cx("m-palette", className)}>
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
            <ComboboxOptions static modal={false} className="m-palette-results">
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
            </ComboboxOptions>
          </Combobox>
          {/* Always mounted, so "no results" is announced when it appears.
              It sits outside the listbox, which only allows options; the
              options are not modal so this stays exposed (the dialog already
              is). */}
          <p className={total ? "m-sr-only" : "m-palette-empty"} role="status">
            {total ? (
              ""
            ) : empty ? (
              <>
                {empty.title}
                {empty.description && <span> {empty.description}</span>}
              </>
            ) : (
              `No results for “${query}”.`
            )}
          </p>
          {footer && <div className="m-palette-footer">{footer}</div>}
        </DialogPanel>
      </div>
    </DialogFrame>
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
export interface StackedListProps {
  /** Accessible name; defaults to the visible `title`. */
  label?: string;
  /** Visible heading above the list. */
  title?: ReactNode;
  /** Level of the title, or of the group headings when there is no title. Group headings sit one level below the title. */
  headingLevel?: HeadingLevel;
  /** Button or link in the header, e.g. "View all". */
  action?: ReactNode;
  /** Rows; with `groups` they render first, ungrouped. */
  items?: StackedListItem[];
  /** Sections with sticky headings, e.g. a directory grouped by letter. */
  groups?: ItemGroup<StackedListItem>[];
  id?: string;
  className?: string;
}
export function StackedList({
  label,
  title,
  headingLevel = 2,
  action,
  items = [],
  groups = [],
  id,
  className,
}: StackedListProps) {
  const base = useId();
  const hasTitle = title !== undefined && title !== null && title !== "";
  const Title = headingTag(headingLevel);
  const GroupHeading = headingTag(
    hasTitle ? childLevel(headingLevel) : headingLevel,
  );
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
    <section
      id={id}
      className={cx("m-stacked-list", className)}
      aria-label={label}
      aria-labelledby={label || !hasTitle ? undefined : `${base}-title`}
    >
      {(hasTitle || action) && (
        <header>
          {hasTitle && (
            <Title id={`${base}-title`} className="m-stacked-title">
              {title}
            </Title>
          )}
          {action && <div className="m-stacked-action">{action}</div>}
        </header>
      )}
      {(items.length > 0 || !groups.length) && <ul>{items.map(row)}</ul>}
      {groups.map((group, index) => (
        <div key={group.label} className="m-stacked-group">
          <GroupHeading
            id={`${base}-${index}`}
            className="m-stacked-group-heading"
          >
            {group.label}
          </GroupHeading>
          <ul aria-labelledby={`${base}-${index}`}>{group.items.map(row)}</ul>
        </div>
      ))}
    </section>
  );
}
