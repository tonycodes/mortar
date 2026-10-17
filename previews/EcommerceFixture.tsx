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

export function EcommerceCase({ name }: { name: string }) {
  const [selected, setSelected] = useState<Record<string, string>>({
    colour: "natural",
    size: "large",
  });
  const [added, setAdded] = useState(0);
  const [items, setItems] = useState(cartItems);
  const scenario = new URLSearchParams(location.search).get("state");
  if (scenario) return <StateFixture name={name} state={scenario} />;
  let example: ReactNode;
  switch (name) {
    case "ProductList":
      example = <UI.ProductList label="New arrivals" products={products} />;
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
    default:
      example = (
        <UI.Notice title="Unknown fixture">
          This component is not registered.
        </UI.Notice>
      );
  }
  return <>{example}</>;
}
