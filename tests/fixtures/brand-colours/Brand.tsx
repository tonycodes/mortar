// Brand definitions for tests/cli.test.mjs: colour literals here define the
// brand, so only the stray colour at the end is a raw-colour finding.
import { Button, ThemeProvider } from "@tony-ui/mortar";
import { brandToCss, type BrandDefinition } from "@tony-ui/mortar/brand";

const tenant = {
  light: { primary: "#1d4ed8", onPrimary: "#ffffff", paper: "#f8fafc" },
  dark: {
    primary: "#93c5fd",
    paper: "#0b1f3a",
    accentGradient: "linear-gradient(90deg, #ff6a00, rgb(255 179 0))",
  },
};
const typed: BrandDefinition = { light: { accent: "#7c3aed" } };
const satisfied = {
  dark: { accent: "oklch(70% 0.15 300)" },
} satisfies BrandDefinition;
export const css = brandToCss("typed", typed) + brandToCss("other", satisfied);
const rule = `[data-mortar-brand="acme"] { --m-brand-l-primary: #0f766e; }`;

export function Branded() {
  return (
    <ThemeProvider
      brand="acme"
      brandTokens={{ light: { primary: "#be123c", selected: "#ffe4e6" } }}
    >
      <ThemeProvider brand="tenant" brandTokens={tenant}>
        <style>{rule}</style>
        <div style={{ "--m-brand-d-primary": "#fda4af" } as object} />
        <Button>Go</Button>
        <p style={{ color: "#ff00aa" }}>Stray</p>
      </ThemeProvider>
    </ThemeProvider>
  );
}
