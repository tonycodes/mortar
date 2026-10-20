import { lazy, type ComponentType, type LazyExoticComponent } from "react";

export interface PageTemplate {
  id: string;
  title: string;
  description: string;
  kind: "Marketing" | "Application" | "Ecommerce";
  /** Loaded on first render, so the pages stay out of the initial bundle. */
  Component: LazyExoticComponent<ComponentType>;
}

type Pages = typeof import("./template-pages.js");
type Recipes = typeof import("./recipes.js");
const page = (name: keyof Pages) =>
  lazy(() => import("./template-pages.js").then((m) => ({ default: m[name] })));
const recipe = (name: keyof Recipes) =>
  lazy(() => import("./recipes.js").then((m) => ({ default: m[name] })));

/** Whole-page templates shown on the overview and in the sidebar. */
export const templates: PageTemplate[] = [
  {
    id: "saas-landing",
    title: "Landing page",
    description: "Hero, features, pricing and sign-up for a SaaS product.",
    kind: "Marketing",
    Component: recipe("SaasLandingRecipe"),
  },
  {
    id: "pricing",
    title: "Pricing page",
    description: "Plans, comparison table, questions and a call to action.",
    kind: "Marketing",
    Component: page("PricingPageTemplate"),
  },
  {
    id: "about",
    title: "About page",
    description: "Story, team, stats and customers.",
    kind: "Marketing",
    Component: page("AboutPageTemplate"),
  },
  {
    id: "project-workspace",
    title: "Project workspace",
    description: "Multi-column app screen with a schedule and activity.",
    kind: "Application",
    Component: recipe("ProjectWorkspaceRecipe"),
  },
  {
    id: "settings",
    title: "Settings screen",
    description: "Tabs, grouped fields, a danger zone and unsaved changes.",
    kind: "Application",
    Component: page("SettingsScreenTemplate"),
  },
  {
    id: "product-page",
    title: "Product page",
    description: "Gallery, options, add to bag and related products.",
    kind: "Ecommerce",
    Component: page("ProductPageTemplate"),
  },
  {
    id: "cart-page",
    title: "Shopping bag",
    description: "Editable bag lines beside the order summary.",
    kind: "Ecommerce",
    Component: page("CartPageTemplate"),
  },
  {
    id: "category-page",
    title: "Category page",
    description: "Category previews, filters, products and incentives.",
    kind: "Ecommerce",
    Component: page("CategoryPageTemplate"),
  },
  {
    id: "checkout-page",
    title: "Checkout",
    description: "Contact, shipping, delivery and payment with a live total.",
    kind: "Ecommerce",
    Component: page("CheckoutPageTemplate"),
  },
  {
    id: "order-history",
    title: "Order history",
    description: "Past orders with status and items.",
    kind: "Ecommerce",
    Component: page("OrderHistoryPageTemplate"),
  },
];
