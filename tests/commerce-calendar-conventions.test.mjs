import test from "node:test";
import assert from "node:assert/strict";
import {
  h,
  html,
  Calendar,
  OrderHistory,
  OrderSummary,
  ProductFilters,
  ProductList,
  ProductOverview,
  ProductReviews,
  ShoppingCart,
} from "./support/render.mjs";

const image = { src: "/a.png", alt: "A" };
const product = { id: "a", name: "Tote", href: "#a", price: "£1", image };
const line = { ...product, quantity: 1 };
const noop = () => {};

test("ProductList sets item headings with itemHeadingLevel and merges className and id", () => {
  const markup = html(ProductList, {
    label: "New",
    products: [product],
    itemHeadingLevel: 2,
    id: "new",
    className: "my-list",
  });
  assert.match(
    markup,
    /^<ul id="new" class="m-product-list my-list" aria-label="New" data-columns="4">/,
  );
  assert.match(
    markup,
    /<h2 class="m-product-name"><a href="#a">Tote<\/a><\/h2>/,
  );
});

test("ShoppingCart line headings follow headingLevel; the empty state gets the same level", () => {
  const items = html(ShoppingCart, {
    items: [line],
    onQuantityChange: noop,
    onRemove: noop,
    headingLevel: 2,
    className: "my-cart",
  });
  assert.match(
    items,
    /<ul class="m-cart my-cart" aria-label="Items in your bag">/,
  );
  assert.match(
    items,
    /<h2 class="m-cart-item-title"><a href="#a">Tote<\/a><\/h2>/,
  );
  assert.doesNotMatch(items, /<h3/);
  // The quantity select uses the shared chevron icon.
  assert.match(
    items,
    /<\/select><svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">/,
  );
  const empty = html(ShoppingCart, {
    items: [],
    onQuantityChange: noop,
    onRemove: noop,
    headingLevel: 2,
    empty: { title: "Nothing here", action: h("a", { href: "#shop" }, "Shop") },
  });
  assert.match(empty, /^<div class="m-cart-empty" tabindex="-1">/);
  assert.match(empty, /<h2>Nothing here<\/h2>/);
  assert.match(empty, /<a href="#shop">Shop<\/a>/);
  const defaults = html(ShoppingCart, {
    items: [],
    onQuantityChange: noop,
    onRemove: noop,
  });
  assert.match(
    defaults,
    /<h3>Your bag is empty<\/h3><p>Items you add will appear here\.<\/p>/,
  );
});

test("OrderHistory passes its headingLevel and empty content to its empty state", () => {
  const markup = html(OrderHistory, {
    orders: [],
    headingLevel: 3,
    empty: { title: "No orders", description: "Place one." },
  });
  assert.match(markup, /<div class="m-order-history"><div class="m-empty">/);
  assert.match(markup, /<h3>No orders<\/h3><p>Place one\.<\/p>/);
  assert.match(html(OrderHistory, { orders: [] }), /<h2>No orders yet<\/h2>/);
});

test("ProductReviews and OrderSummary headings follow headingLevel", () => {
  const reviews = html(ProductReviews, {
    average: 5,
    count: 1,
    distribution: [{ stars: 5, count: 1 }],
    reviews: [
      {
        id: "r",
        author: "A",
        rating: 5,
        date: "1 Oct",
        title: "Good",
        body: "Yes",
      },
    ],
    headingLevel: 3,
    id: "reviews",
    className: "my-reviews",
  });
  assert.match(reviews, /^<section id="reviews" class="m-reviews my-reviews"/);
  assert.match(
    reviews,
    /<h3 id="[^"]+" class="m-reviews-title">Customer reviews<\/h3>/,
  );
  assert.match(reviews, /<h4 id="[^"]+" class="m-review-title">Good<\/h4>/);
  const summary = html(OrderSummary, {
    lines: [],
    total: { label: "Total", value: "£1" },
    headingLevel: 4,
    id: "summary",
  });
  assert.match(summary, /^<section id="summary" class="m-order-summary"/);
  assert.match(
    summary,
    /<h4 id="[^"]+" class="m-order-summary-title">Order summary<\/h4>/,
  );
});

test("ProductOverview and ProductFilters accept id and className on their roots", () => {
  assert.match(
    html(ProductOverview, {
      name: "Tote",
      price: "£1",
      images: [image],
      id: "tote",
      className: "my-overview",
    }),
    /<div id="tote" class="m-product-overview my-overview">/,
  );
  assert.match(
    html(ProductFilters, {
      facets: [],
      selected: {},
      onChange: noop,
      id: "filters",
      className: "my-filters",
    }),
    /^<section id="filters" class="m-filters my-filters" aria-label="Filters">/,
  );
});

const meetings = [
  {
    id: "s",
    date: "2027-01-12",
    title: "Standup",
    start: "09:00",
    end: "09:30",
  },
  { id: "e", date: "2027-01-12", title: "Early", start: "06:00", end: "07:00" },
  { id: "l", date: "2027-01-13", title: "Late", start: "18:30", end: "21:00" },
];

test("Calendar shows the controlled date in every view", () => {
  const base = { today: "2026-10-19", date: "2027-01-12", events: meetings };
  const month = html(Calendar, base);
  assert.match(month, />January 2027<\/h2>/);
  assert.match(month, /<button[^>]*data-date="2027-01-12"[^>]*tabindex="0"/);
  const week = html(Calendar, { ...base, view: "week" });
  assert.match(week, />11\s.\s17 January 2027<\/h2>/);
  const day = html(Calendar, { ...base, view: "day" });
  assert.match(day, />Tuesday, 12 January 2027<\/h2>/);
  assert.match(html(Calendar, { ...base, view: "year" }), />2027<\/h2>/);
});

test("Calendar starts on the first of a controlled month that excludes the selected day", () => {
  const markup = html(Calendar, {
    month: "2026-11",
    selected: "2026-10-20",
    today: "2026-10-19",
  });
  assert.match(markup, /<button[^>]*data-date="2026-11-01"[^>]*tabindex="0"/);
  assert.equal(markup.match(/tabindex="0"/g)?.length, 1);
});

test("Calendar headings follow headingLevel; the default variant has no data-variant", () => {
  const month = html(Calendar, {
    month: "2026-10",
    today: "2026-10-19",
    headingLevel: 3,
    id: "cal",
    className: "my-cal",
  });
  assert.match(
    month,
    /^<div id="cal" class="m-calendar my-cal"><div class="m-calendar-header"><h3 /,
  );
  assert.doesNotMatch(month, /data-variant/);
  const year = html(Calendar, {
    view: "year",
    today: "2026-10-19",
    headingLevel: 3,
  });
  assert.match(year, /<h3 id="[^"]+" class="m-calendar-title"/);
  assert.equal(
    year.match(/<h4 [^>]*class="m-calendar-month-title"/g)?.length,
    12,
  );
  const week = html(Calendar, {
    view: "week",
    today: "2026-10-19",
    headingLevel: 4,
  });
  assert.equal(
    week.match(/<h5 [^>]*class="m-calendar-column-heading"/g)?.length,
    7,
  );
});

test("week events separate title and time, and mark events cut off by the visible hours", () => {
  const markup = html(Calendar, {
    view: "week",
    date: "2027-01-12",
    today: "2026-10-19",
    events: meetings,
    onEventSelect: noop,
  });
  assert.match(
    markup,
    /class="m-calendar-event">Standup <span class="m-calendar-event-time"><time>09:00<\/time>–<time>09:30<\/time><\/span>/,
  );
  // 06:00–07:00 with an 08:00 start: drawn at the top edge, cut off above.
  const early = markup.match(
    /<li data-clipped-start="true" style="([^"]+)">.{0,80}Early/,
  );
  assert.ok(early, markup);
  assert.match(early[1], /--m-top:0\.0000%/);
  // 18:30–21:00 with a 19:00 end: drawn to the bottom edge, cut off below.
  const late = markup.match(
    /<li data-clipped-end="true" style="([^"]+)">.{0,80}Late/,
  );
  assert.ok(late, markup);
  assert.match(late[1], /--m-height:4\.5455%/);
  assert.match(markup, /<time>18:30<\/time>–<time>21:00<\/time>/);
  assert.doesNotMatch(
    markup.slice(markup.indexOf("Standup") - 200, markup.indexOf("Standup")),
    /data-clipped/,
  );
});
