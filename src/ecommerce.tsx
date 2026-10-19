import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { KitLink } from "./navigation.js";
import {
  ActionLink,
  Button,
  Checkbox,
  EmptyState,
  Modal,
} from "./primitives.js";
import { Avatar, FilterChip } from "./display.js";
import { ProgressSteps, type ProgressStep } from "./application.js";
import { ChevronDown, Star } from "./icons.js";
import { childLevel, headingTag, type HeadingLevel } from "./heading.js";
import { Swatch, TermList, cx } from "./internal.js";

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
  /** Supporting text under the name, e.g. in the card variant. */
  description?: string;
  /** Available colours as data: `swatch` is any CSS colour the consumer supplies; the label is announced. */
  swatches?: { label: string; swatch: string }[];
  /** Control under the card, e.g. an "Add to bag" button; it sits above the card link. */
  action?: ReactNode;
}

export interface ProductListProps {
  /** Accessible name of the list. */
  label: string;
  products: ProductCard[];
  columns?: 2 | 3 | 4;
  /** Heading level of each product name (default 3). */
  itemHeadingLevel?: HeadingLevel;
  /**
   * `cards` frames each product with a border, for listings with full
   * details; `overlay` sets the name and price on a panel over the image.
   */
  variant?: "plain" | "cards" | "overlay";
  id?: string;
  className?: string;
}

/** Grid of product cards; each card's name link covers the card. */
export function ProductList({
  label,
  products,
  columns = 4,
  itemHeadingLevel = 3,
  variant = "plain",
  id,
  className,
}: ProductListProps) {
  const Heading = headingTag(itemHeadingLevel);
  const overlay = variant === "overlay";
  return (
    <ul
      id={id}
      className={cx("m-product-list", className)}
      aria-label={label}
      data-columns={columns}
      data-variant={variant === "plain" ? undefined : variant}
    >
      {products.map((product) => {
        const text = (
          <>
            <div className="m-product-info">
              <Heading className="m-product-name">
                <KitLink href={product.href}>{product.name}</KitLink>
              </Heading>
              {product.meta && <p className="m-product-meta">{product.meta}</p>}
              {product.description && (
                <p className="m-product-summary">{product.description}</p>
              )}
            </div>
            <p className="m-product-price">{product.price}</p>
          </>
        );
        return (
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
              {overlay && <div className="m-product-overlay">{text}</div>}
            </div>
            {!overlay && text}
            {product.swatches && product.swatches.length > 0 && (
              <ul
                className="m-product-swatches"
                aria-label={`${product.name} colours`}
              >
                {product.swatches.map((colour) => (
                  <li key={colour.label}>
                    <Swatch color={colour.swatch} label={colour.label} />
                  </li>
                ))}
              </ul>
            )}
            {product.action && (
              <div className="m-product-card-action">{product.action}</div>
            )}
          </li>
        );
      })}
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

export interface ProductOverviewProps {
  name: string;
  price: string;
  description?: ReactNode;
  images: ProductImage[];
  rating?: { value: number; count: number; href?: string };
  options?: ProductOption[];
  /** Selected value per option id. */
  selected?: Record<string, string>;
  onSelect?: (option: string, value: string) => void;
  /** Called when the add form is submitted (button click or Enter). */
  onAdd?: () => void;
  addLabel?: string;
  /** Shows the add button as busy while the item is being added. */
  loading?: boolean;
  details?: string[];
  /** Level of the product name heading (default 1: the product page's title). */
  headingLevel?: HeadingLevel;
  /** Omit the name heading when a container (e.g. a dialog title) already shows it. */
  hideName?: boolean;
  /** `grid` shows every image at once: the first large, the rest tiered beneath it. */
  gallery?: "thumbnails" | "grid";
  id?: string;
  className?: string;
}

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
  loading = false,
  details = [],
  headingLevel = 1,
  hideName = false,
  gallery = "thumbnails",
  id,
  className,
}: ProductOverviewProps) {
  const [current, setCurrent] = useState(0);
  // A new image set (another product, or another colour) starts at its first image.
  const imageKey = images.map((image) => image.src).join("\n");
  const [shownKey, setShownKey] = useState(imageKey);
  if (shownKey !== imageKey) {
    setShownKey(imageKey);
    setCurrent(0);
  }
  const group = useId();
  const Heading = headingTag(headingLevel);
  const shown = images[current] ?? images[0];
  return (
    <div id={id} className={cx("m-product-overview", className)}>
      {gallery === "grid" ? (
        <div className="m-product-gallery" data-gallery="grid">
          {images.map((image) => (
            <div key={image.src} className="m-product-image">
              <img src={image.src} alt={image.alt} />
            </div>
          ))}
        </div>
      ) : (
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
      )}
      <div className="m-product-details">
        {!hideName && <Heading className="m-product-name">{name}</Heading>}
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
            if (!loading) onAdd?.();
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
                      <Swatch color={value.swatch} label={value.label} />
                    ) : (
                      <span>{value.label}</span>
                    )}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <Button type="submit" loading={loading}>
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

/** Content of an empty state: a title, an optional description and action. */
export interface EmptyContent {
  title: string;
  description?: string;
  action?: ReactNode;
}

export interface ShoppingCartProps {
  items: CartItem[];
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  /** Accessible name of the list of lines. */
  label?: string;
  maxQuantity?: number;
  /** Level of each line's product name, and of the empty state's title (default 3). */
  headingLevel?: HeadingLevel;
  /** Shown when there are no items. */
  empty?: EmptyContent;
  /**
   * Beside the lines when wide and below them when narrow, e.g. an
   * OrderSummary with shipping and tax estimates and the checkout action.
   */
  summary?: ReactNode;
  /**
   * Products to suggest under the bag, shown as a ProductList with a heading
   * (default level 2; product names one level below). Also shown when the
   * bag is empty.
   */
  related?: {
    title: string;
    products: ProductCard[];
    headingLevel?: HeadingLevel;
  };
  id?: string;
  className?: string;
}

/**
 * Bag contents with per-line quantity and remove controls. After a removal,
 * focus moves to the next line's Remove button (the previous one after the
 * last line), or to the empty state once the bag is empty.
 */
export function ShoppingCart({
  summary,
  related,
  id,
  className,
  ...props
}: ShoppingCartProps) {
  if (!summary && !related)
    return <CartLines {...props} id={id} className={className} />;
  return (
    <div
      id={id}
      className={cx("m-cart-layout", className)}
      data-summary={summary ? true : undefined}
    >
      <CartLines {...props} />
      {summary && <div className="m-cart-summary">{summary}</div>}
      {related && <CartRelated {...related} />}
    </div>
  );
}

function CartRelated({
  title,
  products,
  headingLevel = 2,
}: NonNullable<ShoppingCartProps["related"]>) {
  const titleId = useId();
  const Heading = headingTag(headingLevel);
  return (
    <section className="m-cart-related" aria-labelledby={titleId}>
      <Heading id={titleId} className="m-cart-related-title">
        {title}
      </Heading>
      <ProductList
        label={title}
        products={products}
        itemHeadingLevel={childLevel(headingLevel)}
      />
    </section>
  );
}

function CartLines({
  items,
  onQuantityChange,
  onRemove,
  label = "Items in your bag",
  maxQuantity = 8,
  headingLevel = 3,
  empty = {
    title: "Your bag is empty",
    description: "Items you add will appear here.",
  },
  id,
  className,
}: Omit<ShoppingCartProps, "summary" | "related">) {
  const base = useId();
  const Heading = headingTag(headingLevel);
  const root = useRef<HTMLElement>(null);
  // The line whose Remove button was pressed, until the consumer drops it.
  const removing = useRef<{ index: number; id: string } | null>(null);
  useEffect(() => {
    const pending = removing.current;
    if (!pending || items.some((item) => item.id === pending.id)) return;
    removing.current = null;
    const buttons =
      root.current?.querySelectorAll<HTMLButtonElement>(".m-cart-remove");
    if (buttons?.length)
      buttons[Math.min(pending.index, buttons.length - 1)].focus();
    else root.current?.focus();
  }, [items]);
  if (!items.length)
    return (
      <div
        id={id}
        className={cx("m-cart-empty", className)}
        ref={root as RefObject<HTMLDivElement>}
        tabIndex={-1}
      >
        <EmptyState
          title={empty.title}
          description={empty.description}
          action={empty.action}
          headingLevel={headingLevel}
        />
      </div>
    );
  return (
    <ul
      id={id}
      className={cx("m-cart", className)}
      aria-label={label}
      ref={root as RefObject<HTMLUListElement>}
    >
      {items.map((item, index) => {
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
              <Heading className="m-cart-item-title">
                <KitLink href={item.href}>{item.name}</KitLink>
              </Heading>
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
                <ChevronDown />
              </div>
              <button
                type="button"
                className="m-cart-remove"
                onClick={() => {
                  removing.current = { index, id: item.id };
                  onRemove(item.id);
                }}
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
  id,
  className,
}: {
  title?: string;
  /**
   * Cost lines. `hint` explains an estimate under its label, e.g. "Calculated
   * at checkout" or a link to how shipping is worked out.
   */
  lines: { label: string; value: string; hint?: ReactNode }[];
  total: { label: string; value: string };
  action?: ReactNode;
  headingLevel?: HeadingLevel;
  /** Notes such as a discount code field or delivery estimate. */
  children?: ReactNode;
  id?: string;
  className?: string;
}) {
  const titleId = useId();
  const Heading = headingTag(headingLevel);
  return (
    <section
      id={id}
      className={cx("m-order-summary", className)}
      aria-labelledby={titleId}
    >
      <Heading id={titleId} className="m-order-summary-title">
        {title}
      </Heading>
      <TermList
        items={lines.map((line) => ({
          key: line.label,
          term: line.hint ? (
            <>
              {line.label}
              <span className="m-order-hint">{line.hint}</span>
            </>
          ) : (
            line.label
          ),
          details: line.value,
        }))}
      >
        <div className="m-order-total">
          <dt>{total.label}</dt>
          <dd>{total.value}</dd>
        </div>
      </TermList>
      {children}
      {action && <div className="m-order-action">{action}</div>}
    </section>
  );
}

/** Product overview in a dialog, with a link to the full product page. */
export function ProductQuickView({
  open,
  onClose,
  href,
  detailsLabel = "View full details",
  className,
  ...product
}: Omit<
  ProductOverviewProps,
  "headingLevel" | "hideName" | "id" | "className"
> & {
  open: boolean;
  onClose: () => void;
  /** Full product page. */
  href: string;
  detailsLabel?: string;
  /** Class on the dialog's content wrapper. */
  className?: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title={product.name} size="lg">
      <div className={cx("m-quick-view", className)}>
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

/**
 * Collapsible checkbox facets with counts, plus removable chips for active
 * filters. Every change, Clear all included, calls `onChange` once with the
 * complete next selection.
 */
export function ProductFilters({
  facets,
  selected,
  onChange,
  label = "Filters",
  id,
  className,
}: {
  facets: FilterFacet[];
  /** Selected values per facet id. */
  selected: Record<string, string[]>;
  /** The complete next selection, keyed by facet id. */
  onChange: (selected: Record<string, string[]>) => void;
  label?: string;
  id?: string;
  className?: string;
}) {
  const root = useRef<HTMLElement>(null);
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
    onChange({
      ...selected,
      [facet]: on ? [...current, value] : current.filter((v) => v !== value),
    });
  };
  const clearAll = () => {
    onChange(
      Object.fromEntries(
        [...Object.keys(selected), ...facets.map((facet) => facet.id)].map(
          (facet) => [facet, []],
        ),
      ),
    );
    // The chips and this button disappear: continue from the first facet.
    root.current?.querySelector("summary")?.focus();
  };
  // A removed chip takes its button with it: focus the chip that takes its
  // place (or the previous one), else the first facet.
  const removedChip = useRef<number | null>(null);
  const activeKey = active
    .map((item) => `${item.facet.id}:${item.value}`)
    .join();
  useEffect(() => {
    const index = removedChip.current;
    if (index === null) return;
    removedChip.current = null;
    const buttons = root.current?.querySelectorAll<HTMLButtonElement>(
      ".m-filter-chips .m-chip button",
    );
    if (buttons?.length) buttons[Math.min(index, buttons.length - 1)].focus();
    else root.current?.querySelector("summary")?.focus();
  }, [activeKey]);
  return (
    <section
      id={id}
      ref={root}
      className={cx("m-filters", className)}
      aria-label={label}
    >
      {active.length > 0 && (
        <div
          className="m-filter-chips"
          role="group"
          aria-label="Active filters"
        >
          {active.map((item, index) => (
            <FilterChip
              key={`${item.facet.id}:${item.value}`}
              label={item.label}
              onRemove={() => {
                removedChip.current = index;
                toggle(item.facet.id, item.value, false);
              }}
            />
          ))}
          <button type="button" className="m-filter-clear" onClick={clearAll}>
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
          <Star />
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
  /** Reviewer's photo, shown with `avatars`; without it the Avatar shows initials. */
  avatar?: string;
}

/** Rating summary with a star distribution, followed by individual reviews. */
export function ProductReviews({
  title = "Customer reviews",
  average,
  count,
  distribution,
  reviews,
  action,
  avatars = false,
  headingLevel = 2,
  id,
  className,
}: {
  title?: string;
  average: number;
  count: number;
  distribution: { stars: number; count: number }[];
  reviews: Review[];
  /** E.g. a "Write a review" button. */
  action?: ReactNode;
  /** Shows each reviewer's Avatar (their `avatar` photo or initials) beside their name. */
  avatars?: boolean;
  /** Level of the title; each review's title is one level below. */
  headingLevel?: HeadingLevel;
  id?: string;
  className?: string;
}) {
  const base = useId();
  const Heading = headingTag(headingLevel);
  const ReviewHeading = headingTag(childLevel(headingLevel));
  return (
    <section
      id={id}
      className={cx("m-reviews", className)}
      aria-labelledby={base}
      data-avatars={avatars || undefined}
    >
      <div className="m-reviews-summary">
        <Heading id={base} className="m-reviews-title">
          {title}
        </Heading>
        <div className="m-rating">
          <Stars
            value={average}
            label={`Rated ${average} out of 5 from ${count} reviews`}
          />
          <span aria-hidden="true">Based on {count} reviews</span>
        </div>
        <TermList
          className="m-reviews-distribution"
          items={distribution.map((row) => ({
            key: String(row.stars),
            term: (
              <>
                {row.stars} {row.stars === 1 ? "star" : "stars"}
              </>
            ),
            details: (
              <>
                <meter
                  min={0}
                  max={count}
                  value={row.count}
                  aria-label={`${row.stars} ${row.stars === 1 ? "star" : "stars"}: ${row.count} ${row.count === 1 ? "review" : "reviews"}`}
                />
                <span>{row.count}</span>
              </>
            ),
          }))}
        />
        {action}
      </div>
      <div className="m-review-list">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="m-review"
            aria-labelledby={`${base}-${review.id}`}
          >
            <header>
              {avatars && (
                <Avatar
                  className="m-review-avatar"
                  name={review.author}
                  src={review.avatar}
                  decorative
                />
              )}
              <Stars
                value={review.rating}
                label={`Rated ${review.rating} out of 5`}
              />
              <ReviewHeading
                id={`${base}-${review.id}`}
                className="m-review-title"
              >
                {review.title}
              </ReviewHeading>
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
  /** Order-level controls in the header, e.g. "View invoice" or an actions menu. */
  actions?: ReactNode;
  /**
   * Delivery stages shown as a tracker under the status, e.g. Order placed,
   * Processing, Shipped and Delivered, with the latest stage `current`.
   */
  progress?: ProgressStep[];
  items: {
    id: string;
    name: string;
    image: ProductImage;
    quantity: number;
    price: string;
    href?: string;
    /** Per-item controls, e.g. "Buy again" and "View product". */
    actions?: ReactNode;
  }[];
}

/** Past orders, each with its summary, status and line items. */
export function OrderHistory({
  orders,
  headingLevel = 2,
  empty = {
    title: "No orders yet",
    description: "Orders you place will appear here.",
  },
  id,
  className,
}: {
  orders: Order[];
  /** Level of each order's heading, and of the empty state's title (default 2). */
  headingLevel?: HeadingLevel;
  /** Shown when there are no orders. */
  empty?: EmptyContent;
  id?: string;
  className?: string;
}) {
  const base = useId();
  if (!orders.length)
    return (
      <div id={id} className={cx("m-order-history", className)}>
        <EmptyState
          title={empty.title}
          description={empty.description}
          action={empty.action}
          headingLevel={headingLevel}
        />
      </div>
    );
  const Heading = headingTag(headingLevel);
  return (
    <div id={id} className={cx("m-order-history", className)}>
      {orders.map((order) => {
        const titleId = `${base}-${order.id}`;
        return (
          <section key={order.id} className="m-order" aria-labelledby={titleId}>
            <header className="m-order-header">
              <Heading id={titleId} className="m-order-title">
                Order {order.number}
              </Heading>
              <TermList
                items={[
                  { term: "Date placed", details: order.date },
                  { term: "Total", details: order.total },
                ]}
              />
              <KitLink href={order.href}>
                View order<span className="m-sr-only"> {order.number}</span>
              </KitLink>
              {order.actions && (
                <div className="m-order-actions">{order.actions}</div>
              )}
            </header>
            <p className="m-order-status">{order.status}</p>
            {order.progress && order.progress.length > 0 && (
              <ProgressSteps
                className="m-order-progress"
                steps={order.progress}
                variant="bar"
                navigation={false}
                label={`Order ${order.number} progress`}
              />
            )}
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
                  {item.actions && (
                    <div className="m-order-item-actions">{item.actions}</div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
