import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  h,
  html,
  Calendar,
  DescriptionList,
  OrderHistory,
  OrderSummary,
  ProductList,
  ProductReviews,
  ProgressSteps,
  ShoppingCart,
  StackedList,
} from "./support/render.mjs";

const image = { src: "/a.png", alt: "A" };
const sha = (text) => createHash("sha256").update(text).digest("hex");
const tote = { id: "a", name: "Tote", href: "#a", price: "£1", image };
const line = { ...tote, quantity: 1 };
const noop = () => {};
const review = {
  id: "r",
  author: "Ana Kovač",
  rating: 5,
  date: "d",
  title: "T",
  body: "B",
};
const tracker = [
  { id: "placed", name: "Order placed", status: "complete" },
  { id: "shipped", name: "Shipped", status: "current" },
  { id: "delivered", name: "Delivered", status: "upcoming" },
];
const order = {
  id: "o",
  number: "1",
  date: "d",
  total: "t",
  status: "s",
  href: "#o",
  items: [{ id: "i", name: "N", image, quantity: 1, price: "£1" }],
};

// Markup captured before these variants were added; the defaults must not move.
test("default markup is unchanged by the commerce and application variants", () => {
  assert.equal(
    sha(
      html(Calendar, {
        today: "2026-10-17",
        selected: "2026-10-20",
        events: [{ id: "e", date: "2026-10-20", title: "Call", time: "10:00" }],
      }),
    ),
    "fc53e9779c1d8f64426c7ba7bfeffde78d4c7814503122fd183852e87a64e7c5",
  );
  assert.equal(
    html(ProgressSteps, {
      steps: [
        { id: "a", name: "A", status: "complete" },
        { id: "b", name: "B", status: "current" },
      ],
    }),
    '<nav data-m-component="ProgressSteps" class="m-progress-steps" aria-label="Progress"><ol><li data-status="complete"><span><span class="m-progress-step-text"><span class="m-progress-step-number">Step 1</span><span class="m-progress-step-name">A</span><span class="m-sr-only"> (completed)</span></span></span></li><li data-status="current"><span aria-current="step"><span class="m-progress-step-text"><span class="m-progress-step-number">Step 2</span><span class="m-progress-step-name">B</span></span></span></li></ol></nav>',
  );
  assert.equal(
    html(OrderHistory, { orders: [order] }),
    '<div data-m-component="OrderHistory" class="m-order-history"><section class="m-order" aria-labelledby="_R_0_-o"><header class="m-order-header"><h2 id="_R_0_-o" class="m-order-title">Order 1</h2><dl><div><dt>Date placed</dt><dd>d</dd></div><div><dt>Total</dt><dd>t</dd></div></dl><a href="#o">View order<span class="m-sr-only"> 1</span></a></header><p class="m-order-status">s</p><ul class="m-order-items"><li><div class="m-product-image"><img src="/a.png" alt="A" loading="lazy"/></div><div><p class="m-order-item-name">N</p><p class="m-product-meta">Qty 1</p></div><p class="m-product-price">£1</p></li></ul></section></div>',
  );
  assert.equal(
    html(OrderSummary, {
      lines: [{ label: "Sub", value: "£1" }],
      total: { label: "Total", value: "£1" },
      action: h("button", null, "Go"),
    }),
    '<section data-m-component="OrderSummary" class="m-order-summary" aria-labelledby="_R_0_"><h2 id="_R_0_" class="m-order-summary-title">Order summary</h2><dl><div><dt>Sub</dt><dd>£1</dd></div><div class="m-order-total"><dt>Total</dt><dd>£1</dd></div></dl><div class="m-order-action"><button>Go</button></div></section>',
  );
  assert.equal(
    html(ShoppingCart, {
      items: [line],
      onQuantityChange: noop,
      onRemove: noop,
    }),
    '<ul data-m-component="ShoppingCart" class="m-cart" aria-label="Items in your bag"><li><div class="m-product-image"><img src="/a.png" alt="A" loading="lazy"/></div><div class="m-cart-info"><h3 class="m-cart-item-title"><a href="#a">Tote</a></h3><p class="m-product-price">£1</p></div><div class="m-cart-controls"><label class="m-sr-only" for="_R_0_-a">Quantity, Tote</label><div class="m-select-control"><select id="_R_0_-a"><option value="1" selected="">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option><option value="7">7</option><option value="8">8</option></select><svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false"><path d="m6 8 4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></div><button type="button" class="m-cart-remove">Remove<span class="m-sr-only"> Tote</span></button></div></li></ul>',
  );
  assert.equal(
    html(ShoppingCart, { items: [], onQuantityChange: noop, onRemove: noop }),
    '<div data-m-component="ShoppingCart" class="m-cart-empty" tabindex="-1"><div data-m-component="EmptyState" class="m-empty"><h3>Your bag is empty</h3><p>Items you add will appear here.</p></div></div>',
  );
  assert.equal(
    sha(
      html(ProductReviews, {
        average: 4,
        count: 1,
        distribution: [{ stars: 5, count: 1 }],
        reviews: [{ ...review, author: "Ana" }],
      }),
    ),
    "e5fef861009a60cd81788f5824fcea4d284d1285a889b3e0d8f93d0a6625ebca",
  );
  assert.equal(
    sha(
      html(ProductList, {
        label: "L",
        products: [{ ...tote, badge: "New" }],
      }),
    ),
    "89e108e47f16a3c8f7ded31c40dc7bad290b0b6f70c5caf5c343b2c1598f6745",
  );
  assert.equal(
    html(DescriptionList, { title: "T", items: [{ term: "a", details: "b" }] }),
    '<div data-m-component="DescriptionList" class="m-description-list"><div class="m-description-heading"><h2 class="m-description-title">T</h2></div><dl><div><dt>a</dt><dd>b</dd></div></dl></div>',
  );
  assert.equal(
    html(StackedList, {
      title: "T",
      items: [
        { id: "1", title: "A", description: "d", href: "#a", trailing: "x" },
        { id: "2", title: "B" },
      ],
    }),
    '<section data-m-component="StackedList" class="m-stacked-list" aria-labelledby="_R_0_-title"><header><h2 id="_R_0_-title" class="m-stacked-title">T</h2></header><ul><li><a href="#a"><span class="m-stacked-text"><strong>A</strong><span>d</span></span></a><div class="m-stacked-trailing">x</div></li><li><div><span class="m-stacked-text"><strong>B</strong></span></div></li></ul></section>',
  );
});

test("Calendar agenda lists the selected day's events in time order beside the month", () => {
  const events = [
    { id: "late", date: "2026-10-21", title: "Retro", start: "15:00" },
    {
      id: "early",
      date: "2026-10-21",
      title: "Leslie Alexander",
      start: "09:00",
      end: "10:30",
      media: h("span", { className: "face" }),
    },
    { id: "other", date: "2026-10-22", title: "Elsewhere", time: "11:00" },
  ];
  const markup = html(Calendar, {
    agenda: true,
    today: "2026-10-17",
    selected: "2026-10-21",
    events,
  });
  assert.match(
    markup,
    /^<div data-m-component="Calendar" class="m-calendar" data-agenda="true"><div class="m-calendar-main"><div class="m-calendar-header">/,
  );
  assert.match(
    markup,
    /<\/table><\/div><section class="m-calendar-agenda" aria-labelledby="(_R_0_)-agenda"><h3 id="\1-agenda" class="m-calendar-agenda-title" aria-live="polite">Schedule for <time dateTime="2026-10-21">Wednesday, 21 October 2026<\/time><\/h3>/,
  );
  assert.match(
    markup,
    /<ol class="m-calendar-agenda-list"><li><span class="face"><\/span><p class="m-calendar-agenda-text"><strong>Leslie Alexander<\/strong> <span class="m-calendar-event-time"><time>09:00<\/time>–<time>10:30<\/time><\/span><\/p><\/li><li><p class="m-calendar-agenda-text"><strong>Retro<\/strong>/,
  );
  assert.doesNotMatch(markup, /Elsewhere/);
  // Event buttons, a day without events, the current date without a selection and the heading level.
  const buttons = html(Calendar, {
    agenda: true,
    today: "2026-10-22",
    headingLevel: 3,
    events,
    onEventSelect: noop,
  });
  assert.match(buttons, /<h4 id="[^"]+-agenda"/);
  assert.match(
    buttons,
    /<button type="button" class="m-calendar-agenda-text"><strong>Elsewhere<\/strong> <span class="m-calendar-event-time"><time>11:00<\/time><\/span><\/button>/,
  );
  const empty = html(Calendar, {
    agenda: true,
    today: "2026-10-23",
    events,
  });
  assert.match(empty, /<p class="m-calendar-none">No events<\/p><\/section>/);
  // The agenda belongs to the month view only.
  assert.doesNotMatch(
    html(Calendar, { agenda: true, view: "week", today: "2026-10-21" }),
    /m-calendar-agenda/,
  );
});

test("ProgressSteps bar renders names without markers, and navigation={false} drops the landmark", () => {
  const bar = html(ProgressSteps, {
    label: "Order 1 progress",
    variant: "bar",
    navigation: false,
    steps: tracker,
  });
  assert.match(
    bar,
    /^<div data-m-component="ProgressSteps" class="m-progress-steps" role="group" aria-label="Order 1 progress" data-variant="bar"><ol>/,
  );
  assert.match(
    bar,
    /<li data-status="complete"><span><span class="m-progress-step-text"><span class="m-progress-step-name">Order placed<\/span><span class="m-sr-only"> \(completed\)<\/span><\/span><\/span><\/li><li data-status="current"><span aria-current="step">/,
  );
  assert.doesNotMatch(bar, /m-progress-step-marker|m-progress-step-number/);
  assert.match(bar, /<\/ol><\/div>$/);
  assert.match(
    html(ProgressSteps, { variant: "bar", steps: tracker }),
    /^<nav data-m-component="ProgressSteps" class="m-progress-steps" aria-label="Progress" data-variant="bar">/,
  );
});

test("OrderHistory shows an order's progress as a status tracker", () => {
  const markup = html(OrderHistory, {
    orders: [{ ...order, number: "WU1", progress: tracker }],
  });
  assert.match(
    markup,
    /<p class="m-order-status">s<\/p><div data-m-component="ProgressSteps" class="m-progress-steps m-order-progress" role="group" aria-label="Order WU1 progress" data-variant="bar"><ol>/,
  );
  assert.equal((markup.match(/aria-current="step"/g) || []).length, 1);
  assert.doesNotMatch(
    html(OrderHistory, { orders: [{ ...order, progress: [] }] }),
    /m-progress-steps/,
  );
});

test("ShoppingCart composes a summary column and related products", () => {
  const related = {
    title: "You may also like",
    products: [{ ...tote, id: "b", name: "Mug", href: "#b" }],
  };
  const markup = html(ShoppingCart, {
    id: "bag",
    className: "mt-4",
    items: [line],
    onQuantityChange: noop,
    onRemove: noop,
    summary: h("aside", null, "Summary"),
    related,
  });
  assert.match(
    markup,
    /^<div id="bag" data-m-component="ShoppingCart" class="m-cart-layout mt-4" data-summary="true"><ul class="m-cart" aria-label="Items in your bag">/,
  );
  assert.match(
    markup,
    /<\/ul><div class="m-cart-summary"><aside>Summary<\/aside><\/div><section class="m-cart-related" aria-labelledby="([^"]+)"><h2 id="\1" class="m-cart-related-title">You may also like<\/h2><ul data-m-component="ProductList" class="m-product-list" aria-label="You may also like" data-columns="4"><li><div class="m-product-image"><img src="\/a.png" alt="A" loading="lazy"\/><\/div><div class="m-product-info"><h3 class="m-product-name"><a href="#b">Mug<\/a><\/h3>/,
  );
  // Related products also follow an empty bag, at the chosen heading level.
  const empty = html(ShoppingCart, {
    items: [],
    onQuantityChange: noop,
    onRemove: noop,
    related: { ...related, headingLevel: 3 },
  });
  assert.match(
    empty,
    /^<div data-m-component="ShoppingCart" class="m-cart-layout"><div class="m-cart-empty" tabindex="-1">/,
  );
  assert.match(empty, /<h3 id="[^"]+" class="m-cart-related-title">/);
  assert.match(empty, /<h4 class="m-product-name">/);
});

test("OrderSummary lines can explain an estimate with a hint", () => {
  const markup = html(OrderSummary, {
    lines: [
      { label: "Subtotal", value: "£1" },
      {
        label: "Shipping estimate",
        value: "£2",
        hint: h("a", { href: "#ship" }, "How shipping is worked out"),
      },
      { label: "Tax estimate", value: "£3", hint: "At checkout" },
    ],
    total: { label: "Total", value: "£6" },
  });
  assert.match(
    markup,
    /<div><dt>Shipping estimate<span class="m-order-hint"><a href="#ship">How shipping is worked out<\/a><\/span><\/dt><dd>£2<\/dd><\/div><div><dt>Tax estimate<span class="m-order-hint">At checkout<\/span><\/dt>/,
  );
  assert.match(markup, /<div><dt>Subtotal<\/dt><dd>£1<\/dd><\/div>/);
});

test("ProductReviews avatars show each reviewer's photo or initials, hidden from assistive technology", () => {
  const markup = html(ProductReviews, {
    avatars: true,
    average: 5,
    count: 2,
    distribution: [{ stars: 5, count: 2 }],
    reviews: [
      review,
      { ...review, id: "s", author: "Tom Cook", avatar: "/tom.png" },
    ],
  });
  assert.match(
    markup,
    /<section data-m-component="ProductReviews" class="m-reviews" aria-labelledby="[^"]+" data-avatars="true">/,
  );
  assert.match(
    markup,
    /<header><span data-m-component="Avatar" class="m-avatar m-avatar-md m-review-avatar" aria-hidden="true"><span aria-hidden="true">AK<\/span><\/span><div class="m-stars"/,
  );
  assert.match(
    markup,
    /<span data-m-component="Avatar" class="m-avatar m-avatar-md m-review-avatar" aria-hidden="true"><img src="\/tom.png" alt=""\/><\/span>/,
  );
  assert.match(markup, /<p class="m-review-meta">Tom Cook · d<\/p>/);
});

test("ProductList overlay sets the name and price on a panel inside the image", () => {
  const markup = html(ProductList, {
    label: "L",
    variant: "overlay",
    products: [{ ...tote, meta: "Natural", badge: "New" }],
  });
  assert.equal(
    markup,
    '<ul data-m-component="ProductList" class="m-product-list" aria-label="L" data-columns="4" data-variant="overlay"><li><div class="m-product-image"><img src="/a.png" alt="A" loading="lazy"/><span class="m-product-badge">New</span><div class="m-product-overlay"><div class="m-product-info"><h3 class="m-product-name"><a href="#a">Tote</a></h3><p class="m-product-meta">Natural</p></div><p class="m-product-price">£1</p></div></div></li></ul>',
  );
});

test("DescriptionList striped variant is a data attribute; plain omits it", () => {
  const items = [{ term: "a", details: "b" }];
  assert.match(
    html(DescriptionList, { items, variant: "striped" }),
    /^<div data-m-component="DescriptionList" class="m-description-list" data-variant="striped"><dl>/,
  );
  assert.doesNotMatch(
    html(DescriptionList, { items, variant: "plain" }),
    /data-variant/,
  );
});

test("StackedList rows take a second meta column and chevrons on linked rows", () => {
  const markup = html(StackedList, {
    label: "People",
    chevrons: true,
    items: [
      {
        id: "1",
        title: "Leslie",
        description: "leslie@example.com",
        meta: h("span", null, "CEO"),
        href: "#leslie",
      },
      { id: "2", title: "Tom", meta: "Offline" },
    ],
  });
  assert.match(
    markup,
    /<li><a href="#leslie"><span class="m-stacked-text"><strong>Leslie<\/strong><span>leslie@example.com<\/span><\/span><span class="m-stacked-meta"><span>CEO<\/span><\/span><span class="m-stacked-chevron" aria-hidden="true"><svg/,
  );
  // Rows without a link get no chevron.
  assert.match(
    markup,
    /<li><div><span class="m-stacked-text"><strong>Tom<\/strong><\/span><span class="m-stacked-meta">Offline<\/span><\/div><\/li>/,
  );
});
