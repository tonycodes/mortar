import { NavigationContext, type Navigate } from "./navigation.js";
import { SegmentedControl } from "./inspection.js";
import { ThemeScopeContext } from "./internal.js";
import { Portal } from "@headlessui/react";
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Appearance = "light" | "dark" | "system";
export type Brand = "neutral" | "green";
export type Density = "compact" | "comfortable" | "spacious";
type Theme = {
  appearance: Appearance;
  setAppearance: (value: Appearance) => void;
  brand: Brand;
  density: Density;
};
const ThemeContext = createContext<Theme | null>(null);
export interface ThemeProviderProps {
  children: ReactNode;
  initialAppearance?: Appearance;
  appearance?: Appearance;
  onAppearanceChange?: (value: Appearance) => void;
  /** Connect the application router once for every kit link. A nested provider without it keeps the outer router. */
  navigate?: Navigate;
  brand?: Brand;
  density?: Density;
  /**
   * document writes the root element. container paints a wrapper and leaves
   * the document unchanged; menus, listboxes and dialogs opened inside it keep
   * its theme.
   */
  scope?: "document" | "container";
  /** On the container wrapper (container scope only). */
  className?: string;
}
const DARK = "(prefers-color-scheme: dark)";
function subscribeToScheme(update: () => void) {
  const media = window.matchMedia(DARK);
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
}
/**
 * The system colour scheme. The server snapshot is light, and React hydrates
 * with it before switching to the real value, so markup always matches.
 */
function useSystemDark() {
  return useSyncExternalStore(
    subscribeToScheme,
    () => window.matchMedia(DARK).matches,
    () => false,
  );
}
/**
 * A body-level element that receives the container's overlays (menus,
 * listboxes, popovers) so they keep its theme without being clipped by it.
 */
function usePortalHost(enabled: boolean, attributes: Record<string, string>) {
  // Created during the first client render so portals can target it at once.
  const [target] = useState(() => ({
    current:
      typeof document === "undefined" ? null : document.createElement("div"),
  }));
  const host = target.current;
  useLayoutEffect(() => {
    if (!host || !enabled) return;
    host.className = "m-theme-scope";
    for (const [key, value] of Object.entries(attributes))
      host.setAttribute(key, value);
  });
  // Headless UI attaches the host when an overlay opens; remove it with us.
  useEffect(() => () => host?.remove(), [host]);
  return target;
}
/** One provider per application. Selection never requires a hosted account. */
export function ThemeProvider({
  children,
  initialAppearance = "system",
  appearance: controlledAppearance,
  onAppearanceChange,
  navigate,
  brand = "neutral",
  density = "comfortable",
  scope = "document",
  className,
}: ThemeProviderProps) {
  const [localAppearance, setLocalAppearance] =
    useState<Appearance>(initialAppearance);
  const appearance = controlledAppearance ?? localAppearance;
  const setAppearance = (value: Appearance) => {
    setLocalAppearance(value);
    onAppearanceChange?.(value);
  };
  const systemDark = useSystemDark();
  const outerNavigate = useContext(NavigationContext);
  const resolvedAppearance = (
    appearance === "system" ? (systemDark ? "dark" : "light") : appearance
  ) as "light" | "dark";
  const attributes = {
    "data-mortar": "",
    "data-mortar-brand": brand,
    "data-mortar-density": density,
    "data-mortar-appearance": resolvedAppearance,
  };
  const host = usePortalHost(scope === "container", attributes);
  useEffect(() => {
    if (scope !== "document") return;
    const element = document.documentElement;
    const attributes = {
      "data-mortar": "",
      "data-mortar-brand": brand,
      "data-mortar-density": density,
    };
    const previous = Object.keys(attributes).map(
      (key) => [key, element.getAttribute(key)] as const,
    );
    for (const [key, value] of Object.entries(attributes))
      element.setAttribute(key, value);
    return () => {
      for (const [key, value] of previous)
        value === null
          ? element.removeAttribute(key)
          : element.setAttribute(key, value);
    };
  }, [brand, density, scope]);
  useEffect(() => {
    if (scope !== "document") return;
    const element = document.documentElement;
    const previous = element.getAttribute("data-mortar-appearance");
    element.setAttribute("data-mortar-appearance", resolvedAppearance);
    return () => {
      previous === null
        ? element.removeAttribute("data-mortar-appearance")
        : element.setAttribute("data-mortar-appearance", previous);
    };
  }, [resolvedAppearance, scope]);
  const theme = (
    <NavigationContext.Provider value={navigate ?? outerNavigate}>
      <ThemeContext.Provider
        value={{ appearance, setAppearance, brand, density }}
      >
        {children}
      </ThemeContext.Provider>
    </NavigationContext.Provider>
  );
  if (scope === "container")
    return (
      <div {...attributes} className={className}>
        <ThemeScopeContext.Provider value={attributes}>
          <Portal.Group target={host}>{theme}</Portal.Group>
        </ThemeScopeContext.Provider>
      </div>
    );
  return theme;
}
export function AppearanceControl({
  value,
  onChange,
  className,
}: {
  value?: Appearance;
  onChange?: (value: Appearance) => void;
  className?: string;
} = {}) {
  const controlled = value !== undefined || onChange !== undefined;
  if ((value === undefined) !== (onChange === undefined))
    throw new Error(
      "AppearanceControl requires both value and onChange, or neither.",
    );
  const context = useContext(ThemeContext);
  if (!controlled && !context)
    throw new Error("AppearanceControl requires ThemeProvider");
  const appearance = controlled ? value : context!.appearance;
  const select = (next: Appearance) => {
    if (controlled) onChange?.(next);
    else context!.setAppearance(next);
  };
  return (
    <SegmentedControl
      label="Appearance"
      value={appearance!}
      className={className}
      options={(["light", "dark", "system"] as const).map((option) => ({
        value: option,
        label: option[0].toUpperCase() + option.slice(1),
      }))}
      onChange={(next) => select(next as Appearance)}
    />
  );
}
