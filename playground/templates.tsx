import { useState, type ComponentType } from "react";
import * as UI from "../src/index.js";
import { icons } from "../previews/CompositionFixture.js";
import { ProjectWorkspaceRecipe, SaasLandingRecipe } from "./recipes.js";
import {
  cartItems,
  facets,
  orders,
  productCategory,
  products,
  reviews,
  toteImages,
} from "../previews/EcommerceFixture.js";

/** Shared marketing chrome so every marketing template reads as one site. */
function SiteHeader() {
  return (
    <UI.MarketingHeader
      brand="Northwind"
      homeHref="?recipe=saas-landing"
      links={[
        {
          label: "Product",
          items: [
            {
              label: "Assistant",
              href: "#assistant",
              description: "Answer questions on your site, day and night.",
              icon: icons.inbox,
            },
            {
              label: "Booking",
              href: "#booking",
              description: "Let visitors book time without the back-and-forth.",
              icon: icons.calendar,
            },
          ],
          footer: [{ label: "Watch demo", href: "#demo" }],
        },
        { label: "Pricing", href: "?recipe=pricing" },
        { label: "About", href: "?recipe=about" },
      ]}
      action={{ label: "Start free", href: "#start" }}
      controls={<UI.AppearanceControl />}
    />
  );
}

function SiteFooter() {
  return (
    <UI.Footer
      brand="Northwind"
      description="Chat and booking for small businesses."
      columns={[
        {
          label: "Product",
          items: [
            { label: "Pricing", href: "?recipe=pricing" },
            { label: "Changelog", href: "#changelog" },
          ],
        },
        {
          label: "Company",
          items: [
            { label: "About", href: "?recipe=about" },
            { label: "Careers", href: "#careers" },
          ],
        },
      ]}
      copyright="© Northwind"
      legal={[
        { label: "Terms", href: "#terms" },
        { label: "Privacy", href: "#privacy" },
      ]}
    />
  );
}

/** Pricing page: intro, plans, a comparison table, questions and a closing call to action. */
export function PricingPageTemplate() {
  const start = { label: "Start free", href: "#start" };
  return (
    <>
      <SiteHeader />
      <main>
        <UI.HeaderSection
          eyebrow="Pricing"
          title="Pricing that grows with you"
          description="Start free, upgrade when your inbox gets busy. Every plan includes the assistant and booking."
          align="center"
        />
        <UI.Pricing
          title="Choose a plan"
          description="Prices exclude VAT. Cancel any time."
          billingToggle
          plans={[
            {
              id: "starter",
              name: "Starter",
              description: "For a single location.",
              monthly: "£0",
              features: ["100 conversations a month", "Booking page"],
              action: start,
            },
            {
              id: "team",
              name: "Team",
              description: "For growing businesses.",
              monthly: "£29",
              annual: "£290",
              features: ["Unlimited conversations", "Calendar sync", "3 seats"],
              action: start,
              featured: true,
            },
            {
              id: "business",
              name: "Business",
              description: "For several locations.",
              monthly: "£99",
              annual: "£990",
              features: ["Everything in Team", "SSO", "Priority support"],
              action: { label: "Talk to sales", href: "#sales" },
              availability: "coming-soon",
            },
          ]}
        />
        <UI.PlanComparison
          title="Compare plans"
          plans={["Starter", "Team", "Business"]}
          featuredPlan="Team"
          groups={[
            {
              label: "Assistant",
              rows: [
                {
                  feature: "Conversations",
                  values: ["100/mo", "Unlimited", "Unlimited"],
                },
                { feature: "Custom answers", values: [true, true, true] },
              ],
            },
            {
              label: "Booking",
              rows: [
                { feature: "Calendar sync", values: [false, true, true] },
                { feature: "Reminders by SMS", values: [false, false, true] },
              ],
            },
          ]}
        />
        <UI.FAQ
          title="Questions"
          items={[
            {
              question: "Is there a contract?",
              answer:
                "No. Plans are monthly or yearly and you can cancel any time.",
            },
            {
              question: "What counts as a conversation?",
              answer:
                "One visitor's chat in a 24-hour window, however many messages it has.",
            },
          ]}
        />
        <UI.CallToAction
          title="Try it on your site today"
          description="Set up takes about ten minutes."
          actions={[start, { label: "Book a demo", href: "#demo" }]}
          tone="inverse"
        />
      </main>
      <SiteFooter />
    </>
  );
}

/** About page: who we are, the story, the team and the customers. */
export function AboutPageTemplate() {
  return (
    <>
      <SiteHeader />
      <main>
        <UI.HeaderSection
          eyebrow="About us"
          title="Small team, busy inboxes"
          description="We build tools that let small businesses answer every customer without hiring a call centre."
          links={[
            { label: "Open roles", href: "#careers" },
            { label: "Press kit", href: "#press" },
          ]}
          stats={[
            { label: "Businesses", value: "2,400" },
            { label: "Conversations a month", value: "1.2M" },
            { label: "Countries", value: "18" },
          ]}
        />
        <UI.ContentSection
          eyebrow="Our story"
          title="Started behind a counter"
          description="Northwind began in a bike shop that kept missing calls while fixing bikes."
          tone="muted"
          media={
            <UI.MockWindow label="Northwind assistant">
              <UI.StatGroup
                label="This week"
                items={[
                  { value: "312", label: "Questions answered" },
                  { value: "41", label: "Bookings made" },
                ]}
              />
            </UI.MockWindow>
          }
        >
          <p>
            The owner wrote a few answers into a chat box on the shop's site.
            Within a month, most questions never reached the phone.
          </p>
          <p>
            Northwind turns that idea into a product any business can set up in
            an afternoon.
          </p>
        </UI.ContentSection>
        <UI.TeamGrid
          title="The team"
          description="Nine people across three time zones."
          members={[
            { name: "Ana Kovač", role: "Co-founder, engineering" },
            { name: "Tom Cook", role: "Co-founder, design" },
            { name: "Lindsay Walton", role: "Customer success" },
          ]}
        />
        <UI.LogoCloud
          label="Trusted by"
          items={[
            { name: "Wheelhouse" },
            { name: "Fern & Co" },
            { name: "Harbour Dental" },
          ]}
        />
        <UI.CallToAction
          title="Work with us"
          description="We're hiring engineers and support specialists."
          actions={[{ label: "See open roles", href: "#careers" }]}
        />
      </main>
      <SiteFooter />
    </>
  );
}

/** Settings screen: tabs, grouped fields, a destructive action and an unsaved-changes bar. */
export function SettingsScreenTemplate() {
  const [tab, setTab] = useState("general");
  const [name, setName] = useState("Northwind");
  const [zone, setZone] = useState<string | null>("europe-london");
  const [digest, setDigest] = useState(true);
  const dirty = name !== "Northwind" || zone !== "europe-london" || !digest;
  const reset = () => {
    setName("Northwind");
    setZone("europe-london");
    setDigest(true);
  };
  return (
    <UI.AppShell
      brand="Northwind"
      workspace="Acme workspace"
      navigation={[
        { label: "Inbox", href: "#inbox", count: "8" },
        { label: "Bookings", href: "#bookings" },
        { label: "Settings", href: "?recipe=settings", current: true },
      ]}
    >
      <UI.Stack gap="xl">
        <UI.PageHeading
          title="Settings"
          description="Manage your workspace, notifications and billing."
          breadcrumbs={[
            { label: "Workspace", href: "#workspace" },
            { label: "Settings" },
          ]}
        />
        <UI.Tabs
          label="Settings sections"
          value={tab}
          onChange={setTab}
          items={[
            {
              id: "general",
              label: "General",
              content: (
                <UI.Stack gap="xl">
                  <UI.SettingsSection
                    title="Workspace"
                    description="Shown to customers in chat and booking emails."
                  >
                    <UI.Fieldset legend="Details">
                      <UI.Input
                        label="Workspace name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                      <UI.Combobox
                        label="Time zone"
                        value={zone}
                        onChange={setZone}
                        options={[
                          { value: "europe-london", label: "Europe/London" },
                          { value: "europe-dublin", label: "Europe/Dublin" },
                          {
                            value: "america-new-york",
                            label: "America/New_York",
                          },
                        ]}
                      />
                    </UI.Fieldset>
                  </UI.SettingsSection>
                  <UI.SettingsSection
                    title="Notifications"
                    description="Choose what reaches your inbox."
                  >
                    <UI.Switch
                      label="Daily digest email"
                      checked={digest}
                      onChange={(e) => setDigest(e.target.checked)}
                    />
                  </UI.SettingsSection>
                  <UI.ActionPanel
                    title="Delete workspace"
                    description="Removes all conversations and bookings. This cannot be undone."
                    tone="danger"
                    action={
                      <UI.Button variant="danger">Delete workspace</UI.Button>
                    }
                  />
                </UI.Stack>
              ),
            },
            {
              id: "billing",
              label: "Billing",
              content: (
                <UI.DescriptionList
                  title="Current plan"
                  items={[
                    { term: "Plan", details: "Team, billed yearly" },
                    { term: "Renews", details: "1 March 2027" },
                    {
                      term: "Payment method",
                      details: "Visa ending 4242",
                      action: (
                        <UI.ActionLink
                          label="Update"
                          href="#card"
                          variant="ghost"
                        />
                      ),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      </UI.Stack>
      <UI.SaveBar
        open={dirty}
        message="You have unsaved changes"
        onSave={reset}
        onDiscard={reset}
      />
    </UI.AppShell>
  );
}

function StoreHeader() {
  return (
    <UI.MarketingHeader
      brand="Northwind Goods"
      homeHref="?recipe=product-page"
      links={[
        { label: "Bags", href: "?recipe=product-page" },
        { label: "Kitchen", href: "#kitchen" },
        { label: "Clothing", href: "#clothing" },
      ]}
      action={{ label: "Bag (3)", href: "?recipe=cart-page" }}
    />
  );
}

function StoreFooter() {
  return (
    <UI.Footer
      brand="Northwind Goods"
      description="Everyday goods, made to last."
      columns={[
        {
          label: "Shop",
          items: [
            { label: "Bags", href: "?recipe=product-page" },
            { label: "Kitchen", href: "#kitchen" },
          ],
        },
        {
          label: "Help",
          items: [
            { label: "Delivery", href: "#delivery" },
            { label: "Returns", href: "#returns" },
          ],
        },
      ]}
      copyright="© Northwind Goods"
    />
  );
}

/** Product page: breadcrumbs, gallery and options, then related products. */
export function ProductPageTemplate() {
  const [selected, setSelected] = useState<Record<string, string>>({
    colour: "natural",
    size: "large",
  });
  return (
    <>
      <StoreHeader />
      <UI.Container as="main" size="lg">
        <UI.Stack gap="xl">
          <UI.Breadcrumbs
            separator="chevron"
            items={[
              { label: "Home", href: "#home" },
              { label: "Bags", href: "#bags" },
              { label: "Canvas tote" },
            ]}
          />
          <UI.ProductOverview
            name="Canvas tote"
            price="£32"
            description="Heavy organic cotton canvas with vegetable-tanned leather handles and an inside pocket."
            images={toteImages}
            rating={{ value: 4.5, count: 112, href: "#reviews" }}
            options={[
              {
                id: "colour",
                label: "Colour",
                values: [
                  { value: "natural", label: "Natural", swatch: "#d9c9a8" },
                  { value: "black", label: "Black", swatch: "#26262a" },
                ],
              },
              {
                id: "size",
                label: "Size",
                values: [
                  { value: "small", label: "Small" },
                  { value: "large", label: "Large" },
                ],
              },
            ]}
            selected={selected}
            onSelect={(option, value) =>
              setSelected((current) => ({ ...current, [option]: value }))
            }
            details={["Holds a 16-inch laptop", "Machine washable"]}
          />
          <UI.SectionHeading title="You may also like" divider={false} />
          <UI.ProductList
            label="Related products"
            products={products.slice(1)}
            columns={3}
          />
          <UI.ProductReviews
            average={4.4}
            count={112}
            distribution={[
              { stars: 5, count: 70 },
              { stars: 4, count: 30 },
              { stars: 3, count: 8 },
              { stars: 2, count: 3 },
              { stars: 1, count: 1 },
            ]}
            reviews={reviews}
          />
        </UI.Stack>
      </UI.Container>
      <StoreFooter />
    </>
  );
}

/** Shopping bag page: editable lines beside the order summary. */
export function CartPageTemplate() {
  const [items, setItems] = useState(cartItems);
  return (
    <>
      <StoreHeader />
      <UI.Container as="main" size="lg">
        <UI.Stack gap="xl">
          <UI.PageHeading title="Shopping bag" />
          <div className="pg-cart-layout">
            <UI.ShoppingCart
              items={items}
              onQuantityChange={(id, quantity) =>
                setItems((current) =>
                  current.map((item) =>
                    item.id === id ? { ...item, quantity } : item,
                  ),
                )
              }
              onRemove={(id) =>
                setItems((current) => current.filter((item) => item.id !== id))
              }
              headingLevel={2}
              empty={{
                title: "Your bag is empty",
                description: "Items you add will appear here.",
                action: (
                  <UI.ActionLink
                    label="Continue shopping"
                    href="?recipe=product-page"
                  />
                ),
              }}
            />
            <UI.OrderSummary
              lines={[
                { label: "Subtotal", value: "£68.00" },
                { label: "Shipping", value: "£4.95" },
              ]}
              total={{ label: "Order total", value: "£72.95" }}
              action={<UI.Button>Checkout</UI.Button>}
            />
          </div>
        </UI.Stack>
      </UI.Container>
      <StoreFooter />
    </>
  );
}

/** Category page: category previews, filters beside the grid, and incentives. */
export function CategoryPageTemplate() {
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const colours = selected.colour || [];
  const categories = selected.category || [];
  const shown = products.filter(
    (product) =>
      (!colours.length ||
        colours.includes(product.meta?.toLowerCase() ?? "")) &&
      (!categories.length || categories.includes(productCategory[product.id])),
  );
  return (
    <>
      <StoreHeader />
      <UI.Container as="main" size="lg">
        <UI.Stack gap="xl">
          <UI.PageHeading
            title="Shop all"
            description="Everyday goods in natural materials."
          />
          <UI.SectionHeading title="Shop by category" divider={false} />
          <UI.GridList
            label="Shop by category"
            columns={3}
            itemHeadingLevel={2}
            items={[
              {
                id: "bags",
                title: "Bags",
                description: "Totes and travel",
                href: "#bags",
                cover: { src: products[0].image.src, alt: "" },
              },
              {
                id: "kitchen",
                title: "Kitchen",
                description: "Stoneware and linen",
                href: "#kitchen",
                cover: { src: products[1].image.src, alt: "" },
              },
              {
                id: "clothing",
                title: "Clothing",
                description: "Organic basics",
                href: "#clothing",
                cover: { src: products[2].image.src, alt: "" },
              },
            ]}
          />
          <div className="pg-shop-layout">
            <UI.ProductFilters
              facets={facets}
              selected={selected}
              onChange={setSelected}
            />
            {shown.length ? (
              <UI.ProductList
                label="Products"
                products={shown}
                columns={3}
                itemHeadingLevel={2}
              />
            ) : (
              <UI.EmptyState
                title="No matching products"
                description="Try removing a filter."
                headingLevel={2}
              />
            )}
          </div>
        </UI.Stack>
      </UI.Container>
      <UI.FeatureGrid
        title="Why shop with us"
        columns={3}
        tone="muted"
        items={[
          {
            title: "Free delivery",
            description: "On orders over £50 in the UK.",
            icon: icons.inbox,
          },
          {
            title: "30-day returns",
            description: "Changed your mind? Send it back free.",
            icon: icons.calendar,
          },
          {
            title: "Made to last",
            description: "Repairs are free for the first year.",
            icon: icons.clock,
          },
        ]}
      />
      <StoreFooter />
    </>
  );
}

/** Checkout page: contact, shipping, delivery and payment beside the order summary. */
export function CheckoutPageTemplate() {
  const [delivery, setDelivery] = useState("standard");
  return (
    <>
      <StoreHeader />
      <UI.Container as="main" size="lg">
        <UI.Stack gap="xl">
          <UI.PageHeading title="Checkout" />
          <div className="pg-cart-layout">
            <form
              className="pg-checkout-form"
              onSubmit={(event) => event.preventDefault()}
            >
              <UI.Fieldset legend="Contact">
                <UI.Input
                  label="Email address"
                  type="email"
                  autoComplete="email"
                />
              </UI.Fieldset>
              <UI.Fieldset legend="Shipping address">
                <UI.Input label="Full name" autoComplete="name" />
                <UI.Input label="Address" autoComplete="street-address" />
                <UI.Input label="Postcode" autoComplete="postal-code" />
              </UI.Fieldset>
              <UI.RadioGroup
                label="Delivery method"
                name="delivery"
                value={delivery}
                onChange={setDelivery}
                options={[
                  {
                    value: "standard",
                    label: "Standard — £4.95",
                    description: "3–5 working days",
                  },
                  {
                    value: "express",
                    label: "Express — £9.95",
                    description: "Next working day",
                  },
                ]}
              />
              <UI.Fieldset
                legend="Payment"
                description="Payments are encrypted."
              >
                <UI.Input
                  label="Card number"
                  autoComplete="cc-number"
                  inputMode="numeric"
                />
                <UI.Input label="Expiry (MM/YY)" autoComplete="cc-exp" />
              </UI.Fieldset>
            </form>
            <UI.OrderSummary
              lines={[
                { label: "Subtotal", value: "£68.00" },
                {
                  label: "Shipping",
                  value: delivery === "express" ? "£9.95" : "£4.95",
                },
              ]}
              total={{
                label: "Order total",
                value: delivery === "express" ? "£77.95" : "£72.95",
              }}
              action={<UI.Button>Pay now</UI.Button>}
            >
              <UI.StackedList
                label="Items"
                items={cartItems.map((item) => ({
                  id: item.id,
                  title: item.name,
                  description: `${item.meta} · Qty ${item.quantity}`,
                }))}
              />
            </UI.OrderSummary>
          </div>
        </UI.Stack>
      </UI.Container>
      <StoreFooter />
    </>
  );
}

/** Order history page. */
export function OrderHistoryPageTemplate() {
  return (
    <>
      <StoreHeader />
      <UI.Container as="main" size="lg">
        <UI.Stack gap="xl">
          <UI.PageHeading
            title="Order history"
            description="Check the status of recent orders and buy again."
          />
          <UI.OrderHistory orders={orders} />
        </UI.Stack>
      </UI.Container>
      <StoreFooter />
    </>
  );
}

export interface PageTemplate {
  id: string;
  title: string;
  description: string;
  kind: "Marketing" | "Application" | "Ecommerce";
  Component: ComponentType;
}

/** Whole-page templates shown on the overview and in the sidebar. */
export const templates: PageTemplate[] = [
  {
    id: "saas-landing",
    title: "Landing page",
    description: "Hero, features, pricing and sign-up for a SaaS product.",
    kind: "Marketing",
    Component: SaasLandingRecipe,
  },
  {
    id: "pricing",
    title: "Pricing page",
    description: "Plans, comparison table, questions and a call to action.",
    kind: "Marketing",
    Component: PricingPageTemplate,
  },
  {
    id: "about",
    title: "About page",
    description: "Story, team, stats and customers.",
    kind: "Marketing",
    Component: AboutPageTemplate,
  },
  {
    id: "project-workspace",
    title: "Project workspace",
    description: "Multi-column app screen with a schedule and activity.",
    kind: "Application",
    Component: ProjectWorkspaceRecipe,
  },
  {
    id: "settings",
    title: "Settings screen",
    description: "Tabs, grouped fields, a danger zone and unsaved changes.",
    kind: "Application",
    Component: SettingsScreenTemplate,
  },
  {
    id: "product-page",
    title: "Product page",
    description: "Gallery, options, add to bag and related products.",
    kind: "Ecommerce",
    Component: ProductPageTemplate,
  },
  {
    id: "cart-page",
    title: "Shopping bag",
    description: "Editable bag lines beside the order summary.",
    kind: "Ecommerce",
    Component: CartPageTemplate,
  },
  {
    id: "category-page",
    title: "Category page",
    description: "Category previews, filters, products and incentives.",
    kind: "Ecommerce",
    Component: CategoryPageTemplate,
  },
  {
    id: "checkout-page",
    title: "Checkout",
    description: "Contact, shipping, delivery and payment with a live total.",
    kind: "Ecommerce",
    Component: CheckoutPageTemplate,
  },
  {
    id: "order-history",
    title: "Order history",
    description: "Past orders with status and items.",
    kind: "Ecommerce",
    Component: OrderHistoryPageTemplate,
  },
];
