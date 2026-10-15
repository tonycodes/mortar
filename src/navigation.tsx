import {
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
