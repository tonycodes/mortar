import { useId, useState, type ReactNode } from "react";
import { KitLink } from "./navigation.js";
import {
  ActionLink,
  Button,
  Checkbox,
  EmptyState,
  Modal,
} from "./primitives.js";
import { FilterChip } from "./display.js";

export interface ProductImage {
  src: string;
  /** Describe the product shown; images are the main product information. */
  alt: string;
}

export interface ProductCard {
  id: string;
  name: string;
  href: string;
  /** Preformatted price, e.g. "£32" or "From £18". */
  price: string;
  image: ProductImage;
  /** Colour, variant or category shown under the name. */
  meta?: string;
  badge?: string;
}

/** Grid of product cards; each card's name link covers the card. */
export function ProductList({
  label,
  products,
  columns = 4,
  headingLevel = 3,
}: {
  label: string;
  products: ProductCard[];
  columns?: 2 | 3 | 4;
  headingLevel?: 2 | 3 | 4;
}) {
  const Heading = `h${headingLevel}` as const;
  return (
    <ul className="m-product-list" aria-label={label} data-columns={columns}>
      {products.map((product) => (
        <li key={product.id}>
          <div className="m-product-image">
            <img
              src={product.image.src}
              alt={product.image.alt}
              loading="lazy"
            />
            {product.badge && (
              <span className="m-product-badge">{product.badge}</span>
            )}
          </div>
          <div className="m-product-info">
            <Heading>
              <KitLink href={product.href}>{product.name}</KitLink>
            </Heading>
            {product.meta && <p className="m-product-meta">{product.meta}</p>}
          </div>
          <p className="m-product-price">{product.price}</p>
        </li>
      ))}
    </ul>
  );
}

export interface ProductOption {
  id: string;
  label: string;
  values: {
    value: string;
    label: string;
    /** CSS colour for a swatch; the label remains the accessible name. */
    swatch?: string;
    disabled?: boolean;
  }[];
}

const star = (
  <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
    <path
      d="M10 1.8l2.5 5.3 5.8.7-4.3 4 1.1 5.7L10 14.7l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z"
      fill="currentColor"
    />
  </svg>
);

/** Product page body: gallery, price, rating, option pickers, add to bag and details. */
export function ProductOverview({
  name,
  price,
  description,
  images,
  rating,
  options = [],
  selected = {},
  onSelect,
  onAdd,
  addLabel = "Add to bag",
  adding = false,
  details = [],
  headingLevel = 1,
  hideName = false,
}: {
  name: string;
  price: string;
  description?: ReactNode;
  images: ProductImage[];
  rating?: { value: number; count: number; href?: string };
  options?: ProductOption[];
  /** Selected value per option id. */
  selected?: Record<string, string>;
  onSelect?: (option: string, value: string) => void;
  onAdd?: () => void;
  addLabel?: string;
  adding?: boolean;
  details?: string[];
  headingLevel?: 1 | 2;
  /** Omit the name heading when a container (e.g. a dialog title) already shows it. */
  hideName?: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const group = useId();
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const shown = images[current] ?? images[0];
  return (
    <div className="m-product-overview">
      <div className="m-product-gallery">
        {shown && (
          <div className="m-product-image">
            <img src={shown.src} alt={shown.alt} />
          </div>
        )}
        {images.length > 1 && (
          <div
            className="m-product-thumbs"
            role="group"
            aria-label="Product images"
          >
            {images.map((image, index) => (
              <button
                key={image.src}
                type="button"
                aria-pressed={index === current}
                aria-label={`Show image ${index + 1} of ${images.length}: ${image.alt}`}
                onClick={() => setCurrent(index)}
              >
                <img src={image.src} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="m-product-details">
        {!hideName && <Heading>{name}</Heading>}
        <p className="m-product-price">{price}</p>
        {rating && (
          <div className="m-rating">
            <Stars
              value={rating.value}
              label={`Rated ${rating.value} out of 5 from ${rating.count} reviews`}
            />
            {rating.href ? (
              <KitLink href={rating.href}>{rating.count} reviews</KitLink>
            ) : (
              <span aria-hidden="true">{rating.count} reviews</span>
            )}
          </div>
        )}
        {description && (
          <div className="m-product-description">{description}</div>
        )}
        <form
          className="m-product-form"
          onSubmit={(event) => {
            event.preventDefault();
            onAdd?.();
          }}
        >
          {options.map((option) => (
            <fieldset
              key={option.id}
              className="m-product-option"
              data-swatches={option.values.some((v) => v.swatch) || undefined}
            >
              <legend>{option.label}</legend>
              <div>
                {option.values.map((value) => (
                  <label
                    key={value.value}
                    data-disabled={value.disabled || undefined}
                  >
                    <input
                      type="radio"
                      name={`${group}-${option.id}`}
                      value={value.value}
                      checked={selected[option.id] === value.value}
                      disabled={value.disabled}
                      onChange={() => onSelect?.(option.id, value.value)}
                    />
                    {value.swatch ? (
                      <>
                        <span
                          className="m-swatch"
                          aria-hidden="true"
                          style={{ background: value.swatch }}
                        />
                        <span className="m-sr-only">{value.label}</span>
                      </>
                    ) : (
                      <span>{value.label}</span>
                    )}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <Button type="button" onClick={onAdd} loading={adding}>
            {addLabel}
          </Button>
        </form>
        {details.length > 0 && (
          <ul className="m-product-highlights">
            {details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export interface CartItem {
  id: string;
  name: string;
  href: string;
  price: string;
  quantity: number;
  image: ProductImage;
  /** Chosen options, e.g. "Natural · Small". */
  meta?: string;
  /** Availability note, e.g. "In stock" or "Ships in 3 weeks". */
  stock?: string;
}

/** Bag contents with per-line quantity and remove controls. */
export function ShoppingCart({
  items,
  onQuantityChange,
  onRemove,
  label = "Items in your bag",
  maxQuantity = 8,
  emptyTitle = "Your bag is empty",
  emptyDescription = "Items you add will appear here.",
  emptyAction,
}: {
  items: CartItem[];
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  label?: string;
  maxQuantity?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
}) {
  const base = useId();
  if (!items.length)
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  return (
    <ul className="m-cart" aria-label={label}>
      {items.map((item) => {
        const quantityId = `${base}-${item.id}`;
        const choices = Array.from(
          { length: Math.max(maxQuantity, item.quantity) },
          (_, i) => i + 1,
        );
        return (
          <li key={item.id}>
            <div className="m-product-image">
              <img src={item.image.src} alt={item.image.alt} loading="lazy" />
            </div>
            <div className="m-cart-info">
              <h3>
                <KitLink href={item.href}>{item.name}</KitLink>
              </h3>
              {item.meta && <p className="m-product-meta">{item.meta}</p>}
              <p className="m-product-price">{item.price}</p>
              {item.stock && <p className="m-cart-stock">{item.stock}</p>}
            </div>
            <div className="m-cart-controls">
              <label className="m-sr-only" htmlFor={quantityId}>
                Quantity, {item.name}
              </label>
              <div className="m-select-control">
                <select
                  id={quantityId}
                  value={item.quantity}
                  onChange={(event) =>
                    onQuantityChange(item.id, Number(event.target.value))
                  }
                >
                  {choices.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="m6 8 4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <button
                type="button"
                className="m-cart-remove"
                onClick={() => onRemove(item.id)}
              >
                Remove<span className="m-sr-only"> {item.name}</span>
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Cost breakdown with a distinguished total and a checkout action. */
export function OrderSummary({
  title = "Order summary",
  lines,
  total,
  action,
  headingLevel = 2,
  children,
}: {
  title?: string;
  lines: { label: string; value: string }[];
  total: { label: string; value: string };
  action?: ReactNode;
  headingLevel?: 2 | 3;
  /** Notes such as a discount code field or delivery estimate. */
  children?: ReactNode;
}) {
  const id = useId();
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <section className="m-order-summary" aria-labelledby={id}>
      <Heading id={id}>{title}</Heading>
      <dl>
        {lines.map((line) => (
          <div key={line.label}>
            <dt>{line.label}</dt>
            <dd>{line.value}</dd>
          </div>
        ))}
        <div className="m-order-total">
          <dt>{total.label}</dt>
          <dd>{total.value}</dd>
        </div>
      </dl>
      {children}
      {action && <div className="m-order-action">{action}</div>}
    </section>
  );
}

type OverviewProps = Parameters<typeof ProductOverview>[0];

/** Product overview in a dialog, with a link to the full product page. */
export function ProductQuickView({
  open,
  onClose,
  href,
  detailsLabel = "View full details",
  ...product
}: Omit<OverviewProps, "headingLevel" | "hideName"> & {
  open: boolean;
  onClose: () => void;
  /** Full product page. */
  href: string;
  detailsLabel?: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title={product.name} size="lg">
      <div className="m-quick-view">
        <ProductOverview {...product} hideName />
        <ActionLink label={detailsLabel} href={href} variant="ghost" />
      </div>
    </Modal>
  );
}

export interface FilterFacet {
  id: string;
  label: string;
  options: { value: string; label: string; count?: number }[];
}

/** Collapsible checkbox facets with counts, plus removable chips for active filters. */
export function ProductFilters({
  facets,
  selected,
  onChange,
  label = "Filters",
}: {
  facets: FilterFacet[];
  /** Selected values per facet id. */
  selected: Record<string, string[]>;
  onChange: (facet: string, values: string[]) => void;
  label?: string;
}) {
  const active = facets.flatMap((facet) =>
    (selected[facet.id] || []).map((value) => ({
      facet,
      value,
      label:
        facet.options.find((option) => option.value === value)?.label ?? value,
    })),
  );
  const toggle = (facet: string, value: string, on: boolean) => {
    const current = selected[facet] || [];
    onChange(
      facet,
      on ? [...current, value] : current.filter((v) => v !== value),
    );
  };
  return (
    <section className="m-filters" aria-label={label}>
      {active.length > 0 && (
        <div
          className="m-filter-chips"
          role="group"
          aria-label="Active filters"
        >
          {active.map((item) => (
            <FilterChip
              key={`${item.facet.id}:${item.value}`}
              label={item.label}
              onRemove={() => toggle(item.facet.id, item.value, false)}
            />
          ))}
          <button
            type="button"
            className="m-filter-clear"
            onClick={() => facets.forEach((facet) => onChange(facet.id, []))}
          >
            Clear all
          </button>
        </div>
      )}
      {facets.map((facet) => {
        const count = (selected[facet.id] || []).length;
        return (
          <details key={facet.id} open>
            <summary>
              {facet.label}
              {count > 0 && <span className="m-filter-active">{count}</span>}
            </summary>
            <fieldset>
              <legend className="m-sr-only">{facet.label}</legend>
              {facet.options.map((option) => (
                <Checkbox
                  key={option.value}
                  checked={(selected[facet.id] || []).includes(option.value)}
                  onChange={(event) =>
                    toggle(facet.id, option.value, event.target.checked)
                  }
                  label={
                    <>
                      {option.label}
                      {option.count !== undefined && (
                        <span className="m-filter-count">({option.count})</span>
                      )}
                    </>
                  }
                />
              ))}
            </fieldset>
          </details>
        );
      })}
    </section>
  );
}

function Stars({ value, label }: { value: number; label: string }) {
  return (
    <div className="m-stars" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} data-filled={value >= n - 0.25 || undefined}>
          {star}
        </span>
      ))}
    </div>
  );
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  body: ReactNode;
}

/** Rating summary with a star distribution, followed by individual reviews. */
export function ProductReviews({
  title = "Customer reviews",
  average,
  count,
  distribution,
  reviews,
  action,
}: {
  title?: string;
  average: number;
  count: number;
  distribution: { stars: number; count: number }[];
  reviews: Review[];
  /** E.g. a "Write a review" button. */
  action?: ReactNode;
}) {
  const id = useId();
  return (
    <section className="m-reviews" aria-labelledby={id}>
      <div className="m-reviews-summary">
        <h2 id={id}>{title}</h2>
        <div className="m-rating">
          <Stars
            value={average}
            label={`Rated ${average} out of 5 from ${count} reviews`}
          />
          <span aria-hidden="true">Based on {count} reviews</span>
        </div>
        <dl className="m-reviews-distribution">
          {distribution.map((row) => (
            <div key={row.stars}>
              <dt>
                {row.stars} {row.stars === 1 ? "star" : "stars"}
              </dt>
              <dd>
                <meter
                  min={0}
                  max={count}
                  value={row.count}
                  aria-label={`${row.stars} ${row.stars === 1 ? "star" : "stars"}: ${row.count} ${row.count === 1 ? "review" : "reviews"}`}
                />
                <span>{row.count}</span>
              </dd>
            </div>
          ))}
        </dl>
        {action}
      </div>
      <div className="m-review-list">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="m-review"
            aria-labelledby={`${id}-${review.id}`}
          >
            <header>
              <Stars
                value={review.rating}
                label={`Rated ${review.rating} out of 5`}
              />
              <h3 id={`${id}-${review.id}`}>{review.title}</h3>
              <p className="m-review-meta">
                {review.author} · {review.date}
              </p>
            </header>
            <div className="m-review-body">{review.body}</div>
          </article>
        ))}
      </div>
    </section>
  );
}

export interface Order {
  id: string;
  number: string;
  date: string;
  total: string;
  status: string;
  href: string;
  items: {
    id: string;
    name: string;
    image: ProductImage;
    quantity: number;
    price: string;
    href?: string;
  }[];
}

/** Past orders, each with its summary, status and line items. */
export function OrderHistory({
  orders,
  headingLevel = 2,
  emptyTitle = "No orders yet",
  emptyDescription = "Orders you place will appear here.",
}: {
  orders: Order[];
  headingLevel?: 2 | 3;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const base = useId();
  if (!orders.length)
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <div className="m-order-history">
      {orders.map((order) => {
        const id = `${base}-${order.id}`;
        return (
          <section key={order.id} className="m-order" aria-labelledby={id}>
            <header className="m-order-header">
              <Heading id={id}>Order {order.number}</Heading>
              <dl>
                <div>
                  <dt>Date placed</dt>
                  <dd>{order.date}</dd>
                </div>
                <div>
                  <dt>Total</dt>
                  <dd>{order.total}</dd>
                </div>
              </dl>
              <KitLink href={order.href}>
                View order<span className="m-sr-only"> {order.number}</span>
              </KitLink>
            </header>
            <p className="m-order-status">{order.status}</p>
            <ul className="m-order-items">
              {order.items.map((item) => (
                <li key={item.id}>
                  <div className="m-product-image">
                    <img
                      src={item.image.src}
                      alt={item.image.alt}
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <p className="m-order-item-name">
                      {item.href ? (
                        <KitLink href={item.href}>{item.name}</KitLink>
                      ) : (
                        item.name
                      )}
                    </p>
                    <p className="m-product-meta">Qty {item.quantity}</p>
                  </div>
                  <p className="m-product-price">{item.price}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
