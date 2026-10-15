import { NavigationContext, type Navigate } from "./navigation.js";
import {
  createContext,
  useContext,
  useEffect,
  useState,
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
  /** Connect the application router once for every kit link. */
  navigate?: Navigate;
  brand?: Brand;
  density?: Density;
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
}: ThemeProviderProps) {
  const [localAppearance, setLocalAppearance] =
    useState<Appearance>(initialAppearance);
  const appearance = controlledAppearance ?? localAppearance;
  const setAppearance = (value: Appearance) => {
    setLocalAppearance(value);
    onAppearanceChange?.(value);
  };
  useEffect(() => {
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
  }, [brand, density]);
  useEffect(() => {
    const element = document.documentElement;
    const previous = element.getAttribute("data-mortar-appearance");
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () =>
      element.setAttribute(
        "data-mortar-appearance",
        appearance === "system"
          ? media.matches
            ? "dark"
            : "light"
          : appearance,
      );
    update();
    media.addEventListener("change", update);
    return () => {
      media.removeEventListener("change", update);
      previous === null
        ? element.removeAttribute("data-mortar-appearance")
        : element.setAttribute("data-mortar-appearance", previous);
    };
  }, [appearance]);
  return (
    <NavigationContext.Provider value={navigate}>
      <ThemeContext.Provider
        value={{ appearance, setAppearance, brand, density }}
      >
        {children}
      </ThemeContext.Provider>
    </NavigationContext.Provider>
  );
}
export function AppearanceControl() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("AppearanceControl requires ThemeProvider");
  return (
    <div className="m-segmented" role="group" aria-label="Appearance">
      {(["light", "dark", "system"] as const).map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={context.appearance === value}
          onClick={() => context.setAppearance(value)}
        >
          {value[0].toUpperCase() + value.slice(1)}
        </button>
      ))}
    </div>
  );
}
