import { createRoot } from "react-dom/client";
import {
  CallToAction,
  Footer,
  Hero,
  MarketingHeader,
} from "../../../../src/index.js";
import "../../../../playground/styles.css";

const link = (label: string, href: string) => ({ label, href });
const root = document.getElementById("root");
if (!root) throw new Error("missing fixture root");

createRoot(root).render(
  <div>
    <MarketingHeader
      brand="Northwind"
      links={[link("Docs", "/docs"), link("Guide", "/docs")]}
    />
    <Hero
      title="Example"
      description="A shared foundation."
      actions={[link("Start", "/start"), link("Tour", "/start")]}
    />
    <CallToAction
      title="Next"
      actions={[link("Primary", "/next"), link("Secondary", "/next")]}
    />
    <Footer
      brand="Northwind"
      description="Example product"
      columns={[
        {
          title: "Product",
          links: [link("Pricing", "/pricing"), link("Plans", "/pricing")],
        },
      ]}
      legal={[link("Terms", "/legal"), link("Privacy", "/legal")]}
      copyright="2026 Northwind"
    />
  </div>,
);
