import { StateFixture } from "./StateFixture.js";
import { useState, type ReactNode } from "react";
import * as UI from "../src/index.js";

/** Fixtures for the ecommerce kit. Product art is inline SVG so previews never hit the network. */

const art = (shape: string, fill: string, tone = "f1efe9") =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><rect width='400' height='400' fill='#${tone}'/>${shape.replaceAll("FILL", `#${fill}`)}</svg>`,
  )}`;
const tote = (fill: string, tone?: string) =>
  art(
    "<path d='M140 150c0-40 25-62 60-62s60 22 60 62' fill='none' stroke='#5b4a36' stroke-width='12'/><path d='M100 150h200l-18 170H118z' fill='FILL'/>",
    fill,
    tone,
  );
const mug = (fill: string) =>
  art(
    "<path d='M120 130h140v150a30 30 0 0 1-30 30h-80a30 30 0 0 1-30-30z' fill='FILL'/><path d='M260 170h20a30 30 0 0 1 0 60h-20' fill='none' stroke='FILL' stroke-width='16'/>",
    fill,
  );
const shirt = (fill: string) =>
  art(
    "<path d='M150 100l-60 40 25 45 30-15v150h110V170l30 15 25-45-60-40c-10 20-25 30-50 30s-40-10-50-30z' fill='FILL'/>",
    fill,
  );

export const products: UI.ProductCard[] = [
  {
    id: "tote",
    name: "Canvas tote",
    href: "#tote",
    price: "£32",
    meta: "Natural",
    badge: "New",
    image: {
      src: tote("d9c9a8"),
      alt: "Natural canvas tote bag with leather handles",
    },
  },
  {
    id: "mug",
    name: "Stoneware mug",
    href: "#mug",
    price: "£18",
    meta: "Sage",
    image: { src: mug("9fb5a0"), alt: "Sage green stoneware mug" },
  },
  {
    id: "tee",
    name: "Organic tee",
    href: "#tee",
    price: "£28",
    meta: "Charcoal",
    image: { src: shirt("3d3f45"), alt: "Charcoal organic cotton t-shirt" },
  },
  {
    id: "tote-black",
    name: "Canvas tote",
    href: "#tote-black",
    price: "£32",
    meta: "Black",
    image: {
      src: tote("26262a"),
      alt: "Black canvas tote bag with leather handles",
    },
  },
];

/** Category per product id, for templates that filter the list. */
export const productCategory: Record<string, string> = {
  tote: "bags",
  "tote-black": "bags",
  mug: "kitchen",
  tee: "clothing",
};

export const toteImages: UI.ProductImage[] = [
  { src: tote("d9c9a8"), alt: "Natural canvas tote bag, front" },
  { src: tote("d9c9a8", "e4e1d8"), alt: "Natural canvas tote bag, in use" },
  { src: tote("26262a"), alt: "Black canvas tote bag, front" },
];

export const cartItems: UI.CartItem[] = [
  {
    id: "tote",
    name: "Canvas tote",
    href: "#tote",
    price: "£32",
    quantity: 1,
    meta: "Natural · Large",
    stock: "In stock",
    image: products[0].image,
  },
  {
    id: "mug",
    name: "Stoneware mug",
    href: "#mug",
    price: "£18",
    quantity: 2,
    meta: "Sage",
    stock: "Ships in 3–4 days",
    image: products[1].image,
  },
];

export const facets: UI.FilterFacet[] = [
  {
    id: "colour",
    label: "Colour",
    options: [
      { value: "black", label: "Black", count: 12 },
      { value: "natural", label: "Natural", count: 9 },
      { value: "sage", label: "Sage", count: 4 },
      { value: "charcoal", label: "Charcoal", count: 6 },
    ],
  },
  {
    id: "category",
    label: "Category",
    options: [
      { value: "bags", label: "Bags", count: 14 },
      { value: "kitchen", label: "Kitchen", count: 8 },
      { value: "clothing", label: "Clothing", count: 11 },
    ],
  },
];

export const reviews: UI.Review[] = [
  {
    id: "r1",
    author: "Ana K.",
    rating: 5,
    date: "2 September 2026",
    title: "Holds everything",
    body: "Laptop, lunch and a jumper, and it still looks smart after a month of commuting.",
  },
  {
    id: "r2",
    author: "Tom C.",
    rating: 4,
    date: "18 August 2026",
    title: "Great bag, short handles",
    body: "Lovely canvas. The handles are a little short to wear over a winter coat.",
  },
];

export const orders: UI.Order[] = [
  {
    id: "o1",
    number: "WU88191111",
    date: "6 October 2026",
    total: "£82.95",
    status: "Delivered on 9 October 2026",
    href: "#order-1",
    items: [
      {
        id: "tote",
        name: "Canvas tote",
        image: products[0].image,
        quantity: 1,
        price: "£32",
        href: "#tote",
      },
      {
        id: "mug",
        name: "Stoneware mug",
        image: products[1].image,
        quantity: 2,
        price: "£36",
        href: "#mug",
      },
    ],
  },
  {
    id: "o2",
    number: "WU88191009",
    date: "12 September 2026",
    total: "£28.00",
    status: "Delivered on 15 September 2026",
    href: "#order-2",
    items: [
      {
        id: "tee",
        name: "Organic tee",
        image: products[2].image,
        quantity: 1,
        price: "£28",
        href: "#tee",
      },
    ],
  },
];

export function EcommerceCase({ name }: { name: string }) {
  const [selected, setSelected] = useState<Record<string, string>>({
    colour: "natural",
    size: "large",
  });
  const [added, setAdded] = useState(0);
  const [items, setItems] = useState(cartItems);
  const [quick, setQuick] = useState(false);
  const [filters, setFilters] = useState<Record<string, string[]>>({
    colour: ["black"],
  });
  const scenario = new URLSearchParams(location.search).get("state");
  if (scenario) return <StateFixture name={name} state={scenario} />;
  let example: ReactNode;
  switch (name) {
    case "ProductList":
      example = (
        <UI.Stack gap="xl">
          <UI.ProductList label="New arrivals" products={products} />
          <UI.ProductList
            label="Bags and kitchen"
            variant="card"
            columns={3}
            products={[
              {
                ...products[0],
                id: "tote-card",
                meta: undefined,
                badge: undefined,
                description:
                  "Heavy organic canvas with an inside pocket and leather handles.",
                swatches: [
                  { label: "Natural", swatch: "#d9c9a8" },
                  { label: "Black", swatch: "#26262a" },
                ],
                action: (
                  <UI.Button variant="secondary">
                    Add to bag<span className="m-sr-only"> Canvas tote</span>
                  </UI.Button>
                ),
              },
              {
                ...products[1],
                id: "mug-card",
                meta: undefined,
                description: "Hand-glazed stoneware that keeps coffee warm.",
                swatches: [
                  { label: "Sage", swatch: "#9fb5a0" },
                  { label: "Chalk", swatch: "#f1efe9" },
                ],
                action: (
                  <UI.Button variant="secondary">
                    Add to bag<span className="m-sr-only"> Stoneware mug</span>
                  </UI.Button>
                ),
              },
              {
                ...products[2],
                id: "tee-card",
                meta: undefined,
                description: "Midweight organic cotton with a relaxed fit.",
                swatches: [{ label: "Charcoal", swatch: "#3d3f45" }],
                action: (
                  <UI.Button variant="secondary">
                    Add to bag<span className="m-sr-only"> Organic tee</span>
                  </UI.Button>
                ),
              },
            ]}
          />
        </UI.Stack>
      );
      break;
    case "ProductOverview":
      example = (
        <>
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
                  { value: "travel", label: "Travel", disabled: true },
                ],
              },
            ]}
            selected={selected}
            onSelect={(option, value) =>
              setSelected((current) => ({ ...current, [option]: value }))
            }
            onAdd={() => setAdded((n) => n + 1)}
            details={[
              "Holds a 16-inch laptop",
              "Machine washable",
              "Made in Portugal",
            ]}
          />
          <output aria-label="Bag">
            {added} added · {selected.colour} · {selected.size}
          </output>
          <UI.Divider />
          <UI.ProductOverview
            name="Stoneware mug"
            headingLevel={2}
            price="£18"
            gallery="grid"
            description="Hand-glazed stoneware, shown from every side at once."
            images={[
              { src: mug("9fb5a0"), alt: "Sage stoneware mug, front" },
              { src: mug("b8c7b0"), alt: "Sage stoneware mug, in daylight" },
              { src: mug("7e9480"), alt: "Sage stoneware mug, in shade" },
            ]}
            addLabel="Add mug"
            onAdd={() => setAdded((n) => n + 1)}
          />
        </>
      );
      break;
    case "ShoppingCart":
      example = (
        <>
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
            emptyAction={
              <UI.ActionLink label="Continue shopping" href="#shop" />
            }
          />
          <output aria-label="Bag count">
            {items.reduce((n, item) => n + item.quantity, 0)}
          </output>
        </>
      );
      break;
    case "OrderSummary":
      example = (
        <div className="max-w-sm">
          <UI.OrderSummary
            lines={[
              { label: "Subtotal", value: "£68.00" },
              { label: "Shipping", value: "£4.95" },
              { label: "VAT included", value: "£11.33" },
            ]}
            total={{ label: "Order total", value: "£72.95" }}
            action={<UI.Button>Checkout</UI.Button>}
          />
        </div>
      );
      break;
    case "ProductQuickView":
      example = (
        <>
          <UI.Button variant="secondary" onClick={() => setQuick(true)}>
            Quick view
          </UI.Button>
          <UI.ProductQuickView
            open={quick}
            onClose={() => setQuick(false)}
            href="#tote"
            name="Canvas tote"
            price="£32"
            description="Heavy organic cotton canvas with leather handles."
            images={toteImages}
            rating={{ value: 4.5, count: 112 }}
            options={[
              {
                id: "size",
                label: "Size",
                values: [
                  { value: "small", label: "Small" },
                  { value: "large", label: "Large" },
                ],
              },
            ]}
            selected={{ size: selected.size }}
            onSelect={(option, value) =>
              setSelected((current) => ({ ...current, [option]: value }))
            }
            onAdd={() => setQuick(false)}
          />
        </>
      );
      break;
    case "ProductFilters":
      example = (
        <div className="max-w-xs">
          <UI.ProductFilters
            facets={facets}
            selected={filters}
            onChange={(facet, values) =>
              setFilters((current) => ({ ...current, [facet]: values }))
            }
          />
          <output aria-label="Applied filters">
            {Object.entries(filters)
              .filter(([, values]) => values.length)
              .map(([facet, values]) => `${facet}: ${values.join(", ")}`)
              .join("; ") || "none"}
          </output>
        </div>
      );
      break;
    case "ProductReviews":
      example = (
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
          action={<UI.Button variant="secondary">Write a review</UI.Button>}
        />
      );
      break;
    case "OrderHistory":
      example = (
        <UI.Stack gap="xl">
          <UI.OrderHistory orders={orders} />
          <UI.OrderHistory
            headingLevel={3}
            orders={[
              {
                ...orders[0],
                id: "o3",
                number: "WU88191207",
                href: "#order-3",
                actions: (
                  <UI.ActionLink
                    label="View invoice"
                    href="#invoice-3"
                    variant="secondary"
                  />
                ),
                items: orders[0].items.map((item) => ({
                  ...item,
                  actions: (
                    <>
                      <UI.Button variant="secondary">
                        Buy again<span className="m-sr-only"> {item.name}</span>
                      </UI.Button>
                      <UI.ActionLink
                        label={`View ${item.name.toLowerCase()}`}
                        href={item.href ?? "#product"}
                        variant="ghost"
                      />
                    </>
                  ),
                })),
              },
            ]}
          />
        </UI.Stack>
      );
      break;
    default:
      example = (
        <UI.Notice title="Unknown fixture">
          This component is not registered.
        </UI.Notice>
      );
  }
  return <>{example}</>;
}
