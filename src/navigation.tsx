import {
  type ReactNode,
  createContext,
  useContext,
  type AnchorHTMLAttributes,
  type MouseEvent,
} from "react";

/** Return false to leave a route to the browser; otherwise the app owns navigation. */
export type Navigate = (href: string) => void | false;
export const NavigationContext = createContext<Navigate | undefined>(undefined);

export function followLink(
  event: MouseEvent<HTMLAnchorElement>,
  navigate?: Navigate,
) {
  const anchor = event.currentTarget;
  if (
    !navigate ||
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    anchor.hasAttribute("download") ||
    (anchor.target && anchor.target !== "_self") ||
    anchor.rel.split(/\s+/).includes("external")
  )
    return;
  const raw = anchor.getAttribute("href");
  if (!raw || raw.startsWith("#")) return;
  const destination = new URL(anchor.href);
  const current = new URL(anchor.ownerDocument.URL);
  if (
    !["http:", "https:"].includes(destination.protocol) ||
    destination.origin !== current.origin
  )
    return;
  if (
    destination.pathname === current.pathname &&
    destination.search === current.search &&
    destination.hash
  )
    return;
  if (
    navigate(destination.pathname + destination.search + destination.hash) !==
    false
  )
    event.preventDefault();
}

/** Internal shared anchor: retains native link semantics unless an app router handles it. */
export function KitLink({
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const navigate = useContext(NavigationContext);
  return (
    <a
      {...props}
      onClick={(event) => {
        onClick?.(event);
        followLink(event, navigate);
      }}
    />
  );
}

/** A navigation link: sidebar and navbar items, page tabs and flyout entries. */
export interface LinkItem {
  label: string;
  href: string;
  /** The page being shown; marked aria-current="page". */
  current?: boolean;
  /** Icon shown before the label. */
  icon?: ReactNode;
  /** Shown after the label, e.g. a number of items. */
  count?: number | string;
  description?: string;
}

/** Items gathered under a visible group label. */
export interface ItemGroup<T> {
  label: string;
  items: T[];
}

export interface IconLink {
  /** Accessible name; also the visible text when there is no icon. */
  label: string;
  href: string;
  icon?: ReactNode;
}
/** Labelled list of profile or social links; icon links are named by their label. */
export function IconLinks({
  label,
  links,
}: {
  label: string;
  links: IconLink[];
}) {
  return (
    <ul className="m-icon-links" aria-label={label}>
      {links.map((link, index) => (
        <li key={`${link.label}:${link.href}:${index}`}>
          {link.icon ? (
            <KitLink href={link.href} aria-label={link.label}>
              <span aria-hidden="true">{link.icon}</span>
            </KitLink>
          ) : (
            <KitLink href={link.href}>{link.label}</KitLink>
          )}
        </li>
      ))}
    </ul>
  );
}
