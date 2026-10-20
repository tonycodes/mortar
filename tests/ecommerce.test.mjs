import test from "node:test";
import assert from "node:assert/strict";
import {
  h,
  html,
  ProductList,
  ProductOverview,
  ShoppingCart,
  OrderSummary,
} from "./support/render.mjs";
const image = { src: "/tote.png", alt: "Natural canvas tote bag" };

test("ProductList names each card by its product link and shows the price", () => {
  const markup = html(ProductList, {
    label: "New arrivals",
    products: [
      {
        id: "tote",
        name: "Canvas tote",
        href: "#tote",
        price: "£32",
        image,
        meta: "Natural",
        badge: "New",
      },
    ],
  });
  assert.match(
    markup,
    /<ul data-m-component="ProductList" class="m-product-list" aria-label="New arrivals" data-columns="4">/,
  );
  assert.match(
    markup,
    /<h3 class="m-product-name"><a href="#tote">Canvas tote<\/a><\/h3>/,
  );
  assert.match(markup, /<p class="m-product-price">£32<\/p>/);
  assert.match(
    markup,
    /<img src="\/tote.png" alt="Natural canvas tote bag" loading="lazy"\/>/,
  );
});

test("ProductOverview groups options as radio fieldsets and labels the gallery", () => {
  const markup = html(ProductOverview, {
    name: "Canvas tote",
    price: "£32",
    description: "Heavy cotton canvas with leather handles.",
    images: [image, { src: "/tote-2.png", alt: "Tote bag, inside pocket" }],
    rating: { value: 4.5, count: 112 },
    options: [
      {
        id: "size",
        label: "Size",
        values: [
          { value: "s", label: "Small" },
          { value: "l", label: "Large", disabled: true },
        ],
      },
    ],
    selected: { size: "s" },
    onSelect() {},
    onAdd() {},
  });
  assert.match(markup, /<h1 class="m-product-name">Canvas tote<\/h1>/);
  assert.match(markup, /<p class="m-product-price">£32<\/p>/);
  assert.match(markup, /aria-label="Rated 4.5 out of 5 from 112 reviews"/);
  assert.match(markup, /<fieldset[^>]*><legend>Size<\/legend>/);
  // React orders attributes itself, so check each input's attributes independently.
  const inputs = markup.match(/<input [^>]*>/g);
  const small = inputs.find((i) => i.includes('value="s"'));
  const large = inputs.find((i) => i.includes('value="l"'));
  assert.match(small, /type="radio"/);
  assert.match(small, /name="[^"]+-size"/);
  assert.match(small, /checked=""/);
  assert.match(large, /disabled=""/);
  assert.doesNotMatch(large, /checked/);
  assert.match(
    markup,
    /<div class="m-product-thumbs" role="group" aria-label="Product images">/,
  );
  assert.match(
    markup,
    /<button type="button" aria-pressed="true" aria-label="Show image 1 of 2: Natural canvas tote bag">/,
  );
  // The add button submits the form, so Enter in the form adds too.
  assert.match(
    markup,
    /<form class="m-product-form">.*<button data-m-component="Button" type="submit" class="m-button m-button-primary[^"]*">Add to bag<\/button><\/form>/,
  );
  const busy = html(ProductOverview, {
    name: "Canvas tote",
    price: "£32",
    images: [image],
    loading: true,
  });
  assert.match(
    busy,
    // Loading keeps the button focusable: aria-disabled, not native disabled.
    /<button data-m-component="Button" type="submit" aria-disabled="true" aria-busy="true"/,
  );
});

test("ShoppingCart labels per-line controls with the product name and handles empty carts", () => {
  const markup = html(ShoppingCart, {
    items: [
      {
        id: "tote",
        name: "Canvas tote",
        href: "#tote",
        price: "£32",
        quantity: 2,
        image,
        meta: "Natural · Small",
      },
    ],
    onQuantityChange() {},
    onRemove() {},
  });
  assert.match(
    markup,
    /<ul data-m-component="ShoppingCart" class="m-cart" aria-label="Items in your bag">/,
  );
  assert.match(markup, /<label[^>]*>Quantity, Canvas tote<\/label>/);
  assert.match(markup, /<option value="2" selected="">2<\/option>/);
  assert.match(
    markup,
    /<button type="button"[^>]*>Remove<span class="m-sr-only"> Canvas tote<\/span><\/button>/,
  );
  const empty = html(ShoppingCart, {
    items: [],
    onQuantityChange() {},
    onRemove() {},
  });
  assert.match(empty, /Your bag is empty/);
  assert.doesNotMatch(empty, /<ul class="m-cart"/);
});

test("OrderSummary lists lines and a distinguished total", () => {
  const markup = html(OrderSummary, {
    lines: [
      { label: "Subtotal", value: "£64" },
      { label: "Shipping", value: "£4.95" },
    ],
    total: { label: "Order total", value: "£68.95" },
    action: h("button", {}, "Checkout"),
  });
  assert.match(
    markup,
    /<section data-m-component="OrderSummary" class="m-order-summary" aria-labelledby="[^"]+"/,
  );
  assert.match(
    markup,
    /<h2 id="[^"]+" class="m-order-summary-title">Order summary<\/h2>/,
  );
  assert.match(markup, /<dt>Shipping<\/dt><dd>£4.95<\/dd>/);
  assert.match(
    markup,
    /<div class="m-order-total"><dt>Order total<\/dt><dd>£68.95<\/dd><\/div>/,
  );
  assert.match(markup, /<button>Checkout<\/button>/);
});
