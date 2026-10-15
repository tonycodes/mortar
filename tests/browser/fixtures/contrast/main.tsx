import { createRoot } from "react-dom/client";
import { CallToAction, Pricing, ThemeProvider } from "../../../../src/index.js";
import "../../../../playground/styles.css";

const params = new URLSearchParams(location.search);
const brand = params.get("brand") === "green" ? "green" : "neutral";
const appearance = params.get("theme") === "dark" ? "dark" : "light";
const tone = params.get("tone") === "inverse" ? "inverse" : undefined;
const root = document.getElementById("root");
if (!root) throw new Error("missing fixture root");

createRoot(root).render(
  <ThemeProvider brand={brand} appearance={appearance}>
    <div data-mortar-preview="CallToAction">
      <CallToAction
        title="Start your next project"
        description="Use one shared foundation."
        actions={[
          { label: "Start", href: "#start" },
          { label: "Tour", href: "#tour" },
        ]}
        {...(tone ? { tone } : {})}
      />
    </div>
    <div data-mortar-preview="Pricing">
      <Pricing
        title="Plans"
        description="Example prices"
        plans={[
          {
            id: "team",
            name: "Team",
            description: "Small teams",
            monthly: "£24",
            features: ["Unlimited projects"],
            action: { label: "Choose", href: "#choose" },
            featured: true,
          },
        ]}
      />
    </div>
  </ThemeProvider>,
);
