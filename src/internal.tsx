// Shared building blocks for the kit's components. Internal: nothing here is
// exported from the package entry, so these can change without a release note.
import {
  Fragment,
  createContext,
  createElement,
  useContext,
  useId,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { ActionLink, Button, type LinkAction } from "./primitives.js";
import { headingTag, type HeadingLevel } from "./heading.js";

/** Joins the truthy class names with single spaces. */
export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export interface IntroProps {
  eyebrow?: string;
  /** Omit to render no heading. */
  title?: string;
  description?: string;
  /** Id for the heading, e.g. the target of the section's aria-labelledby. */
  id?: string;
  headingLevel?: HeadingLevel;
  /** Class on the description paragraph; `null` leaves it unstyled. */
  descriptionClassName?: string | null;
}
/**
 * The eyebrow, heading and description that open a section, as three child
 * slots. Spread them (`{...introSlots(props)}`) when consumer content follows
 * in the same parent: React derives useId values from each child's position,
 * so keeping the slots flat keeps the ids of that content unchanged.
 */
export function introSlots({
  eyebrow,
  title,
  description,
  id,
  headingLevel = 2,
  descriptionClassName = "m-section-description",
}: IntroProps): ReactNode[] {
  const Heading = headingTag(headingLevel);
  return [
    eyebrow && <p className="m-eyebrow">{eyebrow}</p>,
    title !== undefined && <Heading id={id}>{title}</Heading>,
    description && (
      <p className={descriptionClassName ?? undefined}>{description}</p>
    ),
  ];
}
/** The section intro as one element, for parents where nothing user-supplied follows it. */
export function SectionIntro(props: IntroProps) {
  return <>{...introSlots(props)}</>;
}

/** A row of link actions: the first primary, the rest secondary. */
export function ActionLinks({ actions }: { actions: LinkAction[] }) {
  return (
    <div className="m-actions">
      {actions.map((action, i) => (
        <ActionLink
          key={`${action.label}:${action.href}:${i}`}
          {...action}
          variant={i === 0 ? "primary" : "secondary"}
        />
      ))}
    </div>
  );
}

export interface Term {
  term: ReactNode;
  details: ReactNode;
  /** React key; defaults to the term. */
  key?: string;
  /** Extra content after the details, e.g. a second dd. */
  after?: ReactNode;
  /** Attributes for the term's wrapping div. */
  attributes?: HTMLAttributes<HTMLDivElement> &
    Record<`data-${string}`, unknown>;
}
/** A description list whose terms each sit in a div with their details. */
export function TermList({
  items,
  children,
  ...props
}: HTMLAttributes<HTMLDListElement> &
  Record<`data-${string}`, unknown> & {
    items: Term[];
    /** Content after the terms, e.g. a total row. */
    children?: ReactNode;
  }) {
  // createElement keeps each element's child count the same as the hand-written
  // lists this replaced (no empty `after` or `children` slot), so useId values
  // inside the details do not move.
  const rows = items.map((item) =>
    createElement(
      "div",
      { key: item.key ?? String(item.term), ...item.attributes },
      <dt>{item.term}</dt>,
      <dd>{item.details}</dd>,
      ...("after" in item ? [item.after] : []),
    ),
  );
  return createElement(
    "dl",
    props,
    rows,
    ...(children === undefined ? [] : [children]),
  );
}

/**
 * Icon, label and count inside a navigation link or tab. `prefix` picks the
 * class family (`m-nav-*` or `m-tab-*`). Navigation links show a count when it
 * is truthy and tabs whenever it is defined (`countWhen`); the API phase
 * settles on one rule. Without `countWhen` there is no count slot at all.
 */
export function LinkContent({
  prefix,
  label,
  icon,
  count,
  marker = false,
  countWhen,
}: {
  prefix: "nav" | "tab";
  label: ReactNode;
  icon?: ReactNode;
  count?: number | string;
  /** Show the dot marker when there is no icon (sidebar links). */
  marker?: boolean;
  countWhen?: "truthy" | "defined";
}) {
  const glyph = (
    <span className={`m-${prefix}-icon`} aria-hidden="true">
      {icon}
    </span>
  );
  const shown = countWhen === "defined" ? count !== undefined : count;
  // createElement keeps the child count of the markup this replaced, so useId
  // values inside a consumer's icon stay put.
  return createElement(
    Fragment,
    null,
    marker ? (
      icon ? (
        glyph
      ) : (
        <span className="m-nav-marker" aria-hidden="true" />
      )
    ) : (
      icon && glyph
    ),
    label,
    ...(countWhen
      ? [shown && <span className={`m-${prefix}-count`}>{count}</span>]
      : []),
  );
}

/** A generated id that is safe in CSS selectors and URL fragments. */
export function useDomId(prefix: string) {
  return prefix + useId().replace(/[^a-zA-Z0-9-]/g, "");
}

/**
 * Next index for arrow, Home and End keys in a horizontal set (wrapping), or
 * null for any other key.
 */
export function rovingIndex(key: string, index: number, count: number) {
  if (key === "ArrowRight") return (index + 1) % count;
  if (key === "ArrowLeft") return (index - 1 + count) % count;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}

/** Colour swatch whose label is announced in place of the colour. */
export function Swatch({ color, label }: { color?: string; label: ReactNode }) {
  return (
    <>
      <span
        className="m-swatch"
        aria-hidden="true"
        style={{ background: color }}
      />
      <span className="m-sr-only">{label}</span>
    </>
  );
}

/** Ids and describedby wiring for a labelled field with a hint or error message. */
export function useField({
  id,
  hint,
  error,
  describedBy,
}: {
  id?: string;
  hint?: string;
  error?: string;
  /** The consumer's own aria-describedby, kept before the message id. */
  describedBy?: string;
}) {
  const generated = useId();
  const fieldId = id || generated;
  const messageId = fieldId + "-message";
  return {
    fieldId,
    messageId,
    describedBy:
      [describedBy, (error || hint) && messageId].filter(Boolean).join(" ") ||
      undefined,
  };
}

/** The hint or error under a field; the error wins and is styled as one. */
export function FieldMessage({
  id,
  hint,
  error,
}: {
  id: string;
  hint?: string;
  error?: string;
}) {
  return error || hint ? (
    <p id={id} className={error ? "m-error" : ""}>
      {error || hint}
    </p>
  ) : null;
}

/** Headless dialog root with the shared backdrop. */
export function DialogFrame({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onClose={onClose} className="m-dialog">
      <ThemeScope>
        <div className="m-backdrop" aria-hidden="true" />
        {children}
      </ThemeScope>
    </Dialog>
  );
}

/** Narrow-screen navigation drawer used by AppShell and DocsShell. */
export function MobileNavDialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <DialogFrame open={open} onClose={onClose}>
      <DialogPanel className="m-mobile-sidebar">
        <div className="m-dialog-heading">
          <DialogTitle>{title}</DialogTitle>
          <Button variant="ghost" onClick={onClose}>
            Close navigation
          </Button>
        </div>
        {children}
      </DialogPanel>
    </DialogFrame>
  );
}

// Marketing and docs helpers, appended; the helpers above are unchanged.
import { cloneElement, isValidElement } from "react";
import { KitLink } from "./navigation.js";

/**
 * `introSlots` with the shared `m-section-title` class on the heading, so a
 * section title keeps its style at any `headingLevel`.
 */
export function titledIntroSlots(props: IntroProps): ReactNode[] {
  const slots = introSlots(props);
  const heading = slots[1];
  if (isValidElement<{ className?: string }>(heading))
    slots[1] = cloneElement(heading, { className: "m-section-title" });
  return slots;
}
/** `data-tone` for a section surface tone; the default tone sets no attribute. */
export function sectionTone(tone?: "default" | "muted" | "inverse") {
  return tone && tone !== "default" ? tone : undefined;
}

/** `SectionIntro` with the `m-section-title` heading class. */
export function TitledIntro(props: IntroProps) {
  return <>{...titledIntroSlots(props)}</>;
}

/** A navigation link with optional sub-pages (NavigationItem's shape). */
export interface NavTreeItem {
  label: string;
  href: string;
  current?: boolean;
  icon?: ReactNode;
  count?: number | string;
  children?: NavTreeItem[];
}
/**
 * Navigation links with icon and count. An item with children becomes a
 * disclosure, open when a child is current. A count shows whenever defined.
 */
export function NavTreeLinks({
  items,
  marker = false,
  onNavigate,
}: {
  items: NavTreeItem[];
  /** Show the dot marker when an item has no icon (sidebar links). */
  marker?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      {items.map((item, index) =>
        item.children?.length ? (
          <details
            key={`${item.label}:${item.href}:${index}`}
            className="m-nav-group"
            open={item.children.some((child) => child.current) || undefined}
          >
            <summary>
              <LinkContent
                prefix="nav"
                marker={marker}
                icon={item.icon}
                label={item.label}
                count={item.count}
                countWhen="defined"
              />
            </summary>
            <div className="m-nav-children">
              <NavTreeLinks
                items={item.children}
                marker={marker}
                onNavigate={onNavigate}
              />
            </div>
          </details>
        ) : (
          <KitLink
            key={`${item.label}:${item.href}:${index}`}
            href={item.href}
            aria-current={item.current ? "page" : undefined}
            onClick={onNavigate}
          >
            <LinkContent
              prefix="nav"
              marker={marker}
              icon={item.icon}
              label={item.label}
              count={item.count}
              countWhen="defined"
            />
          </KitLink>
        ),
      )}
    </>
  );
}

/**
 * The hint or error under a field. Unlike FieldMessage, the error is its own
 * role="alert" element, so it is announced when it appears.
 */
export function FieldFeedback({
  id,
  hint,
  error,
}: {
  id: string;
  hint?: string;
  error?: string;
}) {
  if (error)
    return (
      <p key="error" id={id} className="m-error" role="alert">
        {error}
      </p>
    );
  return hint ? (
    <p key="hint" id={id}>
      {hint}
    </p>
  ) : null;
}

/** Decorative required marker after a field label; the control itself is marked required. */
export function RequiredMark() {
  return (
    <span className="m-required" aria-hidden="true">
      *
    </span>
  );
}

const TABBABLE =
  'a[href], button:not(:disabled), input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';
/**
 * Call before `element` is removed. If focus is inside it, move focus to the
 * next tabbable element after it (within `scope`, default the document), else
 * the previous one, else `fallback`, so focus never drops to the body.
 */
export function focusAway(
  element: HTMLElement | null,
  {
    scope,
    fallback,
  }: { scope?: HTMLElement | null; fallback?: HTMLElement | null } = {},
) {
  if (!element) return;
  const document = element.ownerDocument;
  if (!element.contains(document.activeElement)) return;
  const candidates = [
    ...(scope ?? document.body).querySelectorAll<HTMLElement>(TABBABLE),
  ].filter(
    (el) =>
      !element.contains(el) &&
      !el.closest("[hidden], [inert]") &&
      el.getClientRects().length > 0,
  );
  const following = (el: HTMLElement) =>
    element.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING;
  const after = candidates.find(following);
  const before = candidates.filter((el) => !following(el)).pop();
  (after ?? before ?? fallback)?.focus();
}

/**
 * The data-mortar-* attributes of the nearest container-scoped ThemeProvider.
 * Optional (undefined outside one), so it does not make dialogs depend on it.
 */
export const ThemeScopeContext = createContext<
  Record<string, string> | undefined
>(undefined);
/**
 * Re-applies a container-scoped theme to content rendered outside its wrapper
 * (dialogs portal to the document body). The wrapper is display: contents, so
 * it carries the tokens without adding a box.
 */
export function ThemeScope({ children }: { children: ReactNode }) {
  const attributes = useContext(ThemeScopeContext);
  if (!attributes) return <>{children}</>;
  return (
    <div {...attributes} className="m-theme-scope">
      {children}
    </div>
  );
}

// Application helpers, appended after the marketing and docs ones.

/**
 * introSlots with a component-specific class on the heading (titledIntroSlots
 * always uses m-section-title), so a title keeps its
 * styles at any `headingLevel` instead of only as an h2.
 */
export function classedIntroSlots(
  props: IntroProps,
  titleClassName: string,
): ReactNode[] {
  const [eyebrow, heading, description] = introSlots(props);
  return [
    eyebrow,
    isValidElement<{ className?: string }>(heading)
      ? cloneElement(heading, { className: titleClassName })
      : heading,
    description,
  ];
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
/**
 * Call before a consumer callback that removes `element` (e.g. a chip's
 * remove button). Once the removal has rendered, if focus fell to the body,
 * it moves to the nearest focusable element that took the removed one's place,
 * or the one before it, searching up through the ancestors that remain.
 */
export function focusAfterRemoval(element: HTMLElement) {
  const trail: [HTMLElement, number][] = [];
  for (let node: HTMLElement | null = element; node?.parentElement;) {
    const parent: HTMLElement = node.parentElement;
    trail.push([parent, [...parent.children].indexOf(node)]);
    node = parent;
  }
  setTimeout(() => {
    const active = element.ownerDocument.activeElement;
    if (
      element.isConnected ||
      (active && active !== element.ownerDocument.body)
    )
      return;
    for (const [parent, index] of trail) {
      if (!parent.isConnected) continue;
      const siblings = [...parent.children] as HTMLElement[];
      const candidates = [
        ...siblings.slice(index),
        ...siblings.slice(0, index).reverse(),
      ];
      for (const candidate of candidates) {
        const target = candidate.matches(FOCUSABLE)
          ? candidate
          : candidate.querySelector<HTMLElement>(FOCUSABLE);
        if (target) return target.focus();
      }
    }
  });
}
