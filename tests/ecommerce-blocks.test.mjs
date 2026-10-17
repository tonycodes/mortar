import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ProductFilters,
  ProductOverview,
  ProductReviews,
  OrderHistory,
} from "../dist/index.js";
const h = React.createElement;
const html = (type, props) => renderToStaticMarkup(h(type, props));

test("ProductFilters renders facets as labelled checkbox groups with counts and active chips", () => {
  const markup = html(ProductFilters, {
    facets: [
      {
        id: "colour",
        label: "Colour",
        options: [
          { value: "black", label: "Black", count: 12 },
          { value: "sage", label: "Sage", count: 4 },
        ],
      },
    ],
    selected: { colour: ["black"] },
    onChange() {},
  });
  assert.match(markup, /<section class="m-filters" aria-label="Filters">/);
  assert.match(
    markup,
    /<details open=""><summary>Colour<span class="m-filter-active">1<\/span><\/summary>/,
  );
  assert.match(markup, /<fieldset><legend class="m-sr-only">Colour<\/legend>/);
  assert.match(markup, /Black<span class="m-filter-count">\(12\)<\/span>/);
  assert.match(
    markup,
    /<div class="m-filter-chips" role="group" aria-label="Active filters">/,
  );
  assert.match(markup, /Clear all/);
  const none = html(ProductFilters, {
    facets: [{ id: "colour", label: "Colour", options: [] }],
    selected: {},
    onChange() {},
  });
  assert.doesNotMatch(none, /Active filters|Clear all/);
});

test("ProductOverview can hide its name when a dialog already titles it", () => {
  const props = {
    name: "Canvas tote",
    price: "£32",
    images: [{ src: "/a.png", alt: "Tote" }],
  };
  assert.match(html(ProductOverview, props), /<h1>Canvas tote<\/h1>/);
  assert.doesNotMatch(
    html(ProductOverview, { ...props, hideName: true }),
    /Canvas tote<\/h/,
  );
});

test("ProductReviews summarises ratings with an accessible distribution and lists reviews", () => {
  const markup = html(ProductReviews, {
    average: 4.4,
    count: 112,
    distribution: [
      { stars: 5, count: 70 },
      { stars: 4, count: 30 },
      { stars: 3, count: 8 },
      { stars: 2, count: 3 },
      { stars: 1, count: 1 },
    ],
    reviews: [
      {
        id: "r1",
        author: "Ana K.",
        rating: 5,
        date: "2 September 2026",
        title: "Holds everything",
        body: "Laptop, lunch and a jumper.",
      },
    ],
  });
  assert.match(markup, /<section class="m-reviews" aria-labelledby="[^"]+">/);
  assert.match(markup, /aria-label="Rated 4.4 out of 5 from 112 reviews"/);
  assert.match(
    markup,
    /<dt>5 stars<\/dt><dd><meter min="0" max="112" value="70" aria-label="5 stars: 70 reviews"><\/meter><span>70<\/span><\/dd>/,
  );
  assert.match(
    markup,
    /<dt>1 star<\/dt><dd><meter min="0" max="112" value="1" aria-label="1 star: 1 review">/,
  );
  assert.match(markup, /<article class="m-review" aria-labelledby="[^"]+">/);
  assert.match(markup, /aria-label="Rated 5 out of 5"/);
  assert.match(markup, /<h3 id="[^"]+">Holds everything<\/h3>/);
  assert.match(markup, /Ana K\./);
});

test("OrderHistory lists each order with its number, status and line items", () => {
  const markup = html(OrderHistory, {
    orders: [
      {
        id: "o1",
        number: "WU88191111",
        date: "6 October 2026",
        total: "£82.95",
        status: "Delivered on 9 October 2026",
        href: "#order",
        items: [
          {
            id: "tote",
            name: "Canvas tote",
            image: { src: "/a.png", alt: "Tote" },
            quantity: 1,
            price: "£32",
          },
        ],
      },
    ],
  });
  assert.match(markup, /<section class="m-order" aria-labelledby="([^"]+)">/);
  assert.match(markup, /<h2 id="[^"]+">Order WU88191111<\/h2>/);
  assert.match(markup, /<dt>Date placed<\/dt><dd>6 October 2026<\/dd>/);
  assert.match(markup, /<dt>Total<\/dt><dd>£82.95<\/dd>/);
  assert.match(
    markup,
    /<a href="#order">View order<span class="m-sr-only"> WU88191111<\/span><\/a>/,
  );
  assert.match(markup, /Delivered on 9 October 2026/);
  assert.match(markup, /Canvas tote/);
});
