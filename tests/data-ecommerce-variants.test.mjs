import test from "node:test";
import assert from "node:assert/strict";
import {
  h,
  html,
  GridList,
  MetricGroup,
  OrderHistory,
  ProductList,
  ProductOverview,
} from "./support/render.mjs";
const image = { src: "/a.png", alt: "A" };

test("ProductList default markup is unchanged by the card, swatch and action options", () => {
  const markup = html(ProductList, {
    label: "New",
    products: [
      {
        id: "a",
        name: "Tote",
        href: "#a",
        price: "£1",
        image,
        meta: "Natural",
      },
    ],
  });
  assert.equal(
    markup,
    '<ul class="m-product-list" aria-label="New" data-columns="4"><li><div class="m-product-image"><img src="/a.png" alt="A" loading="lazy"/></div><div class="m-product-info"><h3 class="m-product-name"><a href="#a">Tote</a></h3><p class="m-product-meta">Natural</p></div><p class="m-product-price">£1</p></li></ul>',
  );
});

test("ProductList cards variant renders description, labelled swatches and an action", () => {
  const markup = html(ProductList, {
    label: "Bags",
    variant: "cards",
    products: [
      {
        id: "a",
        name: "Tote",
        href: "#a",
        price: "£1",
        image,
        description: "Heavy canvas.",
        swatches: [
          { label: "Natural", swatch: "#d9c9a8" },
          { label: "Black", swatch: "#26262a" },
        ],
        action: h("button", { type: "button" }, "Add to bag"),
      },
    ],
  });
  assert.match(markup, /data-variant="cards"/);
  assert.match(markup, /<p class="m-product-summary">Heavy canvas\.<\/p>/);
  assert.match(
    markup,
    /<ul class="m-product-swatches" aria-label="Tote colours"><li><span class="m-swatch" aria-hidden="true" style="background:#d9c9a8"><\/span><span class="m-sr-only">Natural<\/span><\/li>/,
  );
  assert.match(
    markup,
    /<div class="m-product-card-action"><button type="button">Add to bag<\/button><\/div>/,
  );
  const empty = html(ProductList, {
    label: "Bags",
    products: [
      { id: "a", name: "Tote", href: "#a", price: "£1", image, swatches: [] },
    ],
  });
  assert.doesNotMatch(empty, /m-product-swatches|data-variant/);
});

test("ProductOverview grid gallery shows every image without thumbnail buttons", () => {
  const props = {
    name: "Mug",
    price: "£18",
    images: [
      { src: "/1.png", alt: "Front" },
      { src: "/2.png", alt: "Side" },
      { src: "/3.png", alt: "Back" },
    ],
  };
  const thumbs = html(ProductOverview, props);
  assert.match(
    thumbs,
    /<div class="m-product-gallery"><div class="m-product-image"><img src="\/1.png" alt="Front"\/><\/div><div class="m-product-thumbs"/,
  );
  assert.doesNotMatch(thumbs, /data-gallery/);
  const grid = html(ProductOverview, { ...props, gallery: "grid" });
  assert.match(
    grid,
    /<div class="m-product-gallery" data-gallery="grid"><div class="m-product-image"><img src="\/1.png" alt="Front"\/><\/div><div class="m-product-image"><img src="\/2.png" alt="Side"\/><\/div><div class="m-product-image"><img src="\/3.png" alt="Back"\/><\/div><\/div>/,
  );
  assert.doesNotMatch(grid, /m-product-thumbs|Show image/);
});

test("OrderHistory renders order and item quick actions only when given", () => {
  const order = {
    id: "o",
    number: "W1",
    date: "1 Oct",
    total: "£1",
    status: "Delivered",
    href: "#o",
    items: [{ id: "i", name: "Tote", image, quantity: 1, price: "£1" }],
  };
  const plain = html(OrderHistory, { orders: [order] });
  assert.doesNotMatch(plain, /m-order-actions|m-order-item-actions/);
  assert.match(
    plain,
    /<p class="m-product-price">£1<\/p><\/li><\/ul><\/section><\/div>$/,
  );
  const withActions = html(OrderHistory, {
    orders: [
      {
        ...order,
        actions: h("a", { href: "#inv" }, "View invoice"),
        items: [{ ...order.items[0], actions: h("button", null, "Buy again") }],
      },
    ],
  });
  assert.match(
    withActions,
    /View order<span class="m-sr-only"> W1<\/span><\/a><div class="m-order-actions"><a href="#inv">View invoice<\/a><\/div><\/header>/,
  );
  assert.match(
    withActions,
    /<div class="m-order-item-actions"><button>Buy again<\/button><\/div><\/li>/,
  );
});

test("GridList renders details as a description list and opts into split actions", () => {
  const items = [
    { id: "a", title: "Tuple", actions: h("a", { href: "#e" }, "Email") },
  ];
  const plain = html(GridList, { label: "Clients", items });
  assert.match(
    plain,
    /<ul class="m-grid-list" aria-label="Clients" data-columns="3">/,
  );
  assert.doesNotMatch(plain, /data-actions|m-grid-list-details/);
  const rich = html(GridList, {
    label: "Clients",
    actionsLayout: "split",
    items: [
      {
        ...items[0],
        details: [
          { term: "Last invoice", details: "14 Oct" },
          { term: "Amount", details: "£2,000" },
        ],
      },
    ],
  });
  assert.match(rich, /data-columns="3" data-actions="split"/);
  assert.match(
    rich,
    /<dl class="m-grid-list-details"><div><dt>Last invoice<\/dt><dd>14 Oct<\/dd><\/div><div><dt>Amount<\/dt><dd>£2,000<\/dd><\/div><\/dl><div class="m-grid-list-actions">/,
  );
});

test("MetricGroup announces trends and shows previous values; defaults unchanged", () => {
  const plain = html(MetricGroup, {
    label: "Summary",
    items: [
      { label: "Requests", value: "1.4M", change: "+12%", tone: "success" },
    ],
  });
  assert.equal(
    plain,
    '<dl class="m-metrics" aria-label="Summary"><div><dt>Requests</dt><dd><strong>1.4M</strong><span class="m-tone-success">+12%</span></dd></div></dl>',
  );
  const trend = html(MetricGroup, {
    label: "Summary",
    variant: "cards",
    items: [
      {
        label: "Subscribers",
        value: "71,897",
        previous: "70,946",
        change: "12%",
        trend: "up",
        tone: "success",
      },
      {
        label: "Clicks",
        value: "24%",
        change: "4%",
        trend: "down",
        tone: "danger",
      },
    ],
  });
  assert.match(
    trend,
    /<dl class="m-metrics" aria-label="Summary" data-variant="cards">/,
  );
  assert.match(trend, /<span class="m-metric-previous">from 70,946<\/span>/);
  assert.match(
    trend,
    /<span class="m-tone-success" data-trend="up"><svg[^>]*aria-hidden="true"[^>]*>.*?<\/svg><span class="m-sr-only">Increased by <\/span>12%<\/span>/,
  );
  assert.match(trend, /<span class="m-sr-only">Decreased by <\/span>4%/);
});
