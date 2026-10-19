import {
  IconLinks,
  KitLink,
  type IconLink,
  type ItemGroup,
  type LinkItem,
} from "./navigation.js";
import { useId, useState, type CSSProperties, type ReactNode } from "react";
import {
  CloseButton,
  Popover,
  PopoverButton,
  PopoverPanel,
} from "@headlessui/react";
import { ActionLink, Button, type LinkAction } from "./primitives.js";
import { BrandMark, Prose, type SectionTone } from "./layout.js";
import { SegmentedControl } from "./inspection.js";
import { ChevronDown } from "./icons.js";
import { childLevel, headingTag } from "./heading.js";
import {
  ActionLinks,
  SectionIntro,
  TermList,
  cx,
  introSlots,
} from "./internal.js";

export type MarketingTone = "surface" | "inverse";

export type FlyoutItem = Pick<
  LinkItem,
  "label" | "href" | "description" | "icon"
>;
/** A header link, or a labelled group that opens a flyout panel. */
export type HeaderLink =
  LinkAction | (ItemGroup<FlyoutItem> & { footer?: LinkAction[] });

function Flyout({
  label,
  items,
  footer = [],
  onNavigate,
}: {
  label: string;
  items: FlyoutItem[];
  footer?: LinkAction[];
  onNavigate: () => void;
}) {
  return (
    <Popover className="m-flyout">
      <PopoverButton className="m-flyout-trigger">
        {label}
        <ChevronDown />
      </PopoverButton>
      {/* Anchored panels render in a portal, so headers inside clipped containers never cut them off. */}
      <PopoverPanel anchor="bottom" className="m-flyout-panel">
        <ul>
          {items.map((item, index) => (
            <li key={`${item.label}:${item.href}:${index}`}>
              <CloseButton as={KitLink} href={item.href} onClick={onNavigate}>
                {item.icon && (
                  <span className="m-flyout-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                <span className="m-flyout-text">
                  <strong>{item.label}</strong>
                  {item.description && <span>{item.description}</span>}
                </span>
              </CloseButton>
            </li>
          ))}
        </ul>
        {footer.length > 0 && (
          <div className="m-flyout-footer">
            {footer.map((link, index) => (
              <CloseButton
                as={KitLink}
                key={`${link.label}:${link.href}:${index}`}
                href={link.href}
                onClick={onNavigate}
              >
                {link.label}
              </CloseButton>
            ))}
          </div>
        )}
      </PopoverPanel>
    </Popover>
  );
}
export function MarketingHeader({
  brand,
  homeHref = "/",
  logo,
  links,
  action,
  controls,
  className,
  id,
}: {
  brand: string;
  logo?: ReactNode;
  homeHref?: string;
  /** Links, or groups of items that open a flyout panel. */
  links: HeaderLink[];
  action?: LinkAction;
  controls?: ReactNode;
  className?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <header
      id={id}
      className={cx("m-marketing-header", className)}
      data-m-component="MarketingHeader"
    >
      <KitLink className="m-brand" href={homeHref}>
        <BrandMark logo={logo} />
        {brand}
      </KitLink>
      <Button
        variant="ghost"
        className="m-menu-trigger"
        aria-expanded={open}
        aria-controls="m-marketing-nav"
        onClick={() => setOpen(!open)}
      >
        Menu
      </Button>
      <nav id="m-marketing-nav" aria-label="Primary" data-open={open}>
        {links.map((link, index) =>
          "items" in link ? (
            <Flyout
              key={`${link.label}:flyout:${index}`}
              label={link.label}
              items={link.items}
              footer={link.footer}
              onNavigate={() => setOpen(false)}
            />
          ) : (
            <KitLink
              key={`${link.label}:${link.href}:${index}`}
              href={link.href}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </KitLink>
          ),
        )}
      </nav>
      <div className="m-actions">
        {controls}
        {action && <ActionLink {...action} />}
      </div>
    </header>
  );
}
export function Hero({
  eyebrow,
  title,
  description,
  actions = [],
  children,
  align = "center",
  headingLevel = 1,
  background,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: LinkAction[];
  children?: ReactNode;
  align?: "center" | "split";
  headingLevel?: 1 | 2;
  /** Decorative full-cover image or video behind the copy. The hero switches to the inverse tone with a scrim so text keeps its contrast. */
  background?: ReactNode;
}) {
  return (
    <section
      className={`m-hero m-hero-${align}`}
      data-m-component="Hero"
      data-background={background ? true : undefined}
      data-tone={background ? "inverse" : undefined}
    >
      {background && (
        <div className="m-hero-background" aria-hidden="true">
          {background}
        </div>
      )}
      <div>
        <SectionIntro
          eyebrow={eyebrow}
          title={title}
          headingLevel={headingLevel}
        />
        <p className="m-hero-description">{description}</p>
        <ActionLinks actions={actions} />
      </div>
      {children && <div className="m-hero-preview">{children}</div>}
    </section>
  );
}
export function FeatureGrid({
  id,
  eyebrow,
  title,
  description,
  items,
  marker = "auto",
  columns,
  tone = "default",
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  items: { title: string; description: string; icon?: ReactNode }[];
  /** auto: show icons when supplied, otherwise no marker. number: for sequences. */
  marker?: "auto" | "icon" | "number" | "none";
  /** Defaults to a balanced count for the number of items. */
  columns?: 2 | 3 | 4;
  tone?: SectionTone;
}) {
  const cols =
    columns ??
    (items.length === 2 || items.length === 4
      ? 2
      : items.length % 3 === 0 || items.length > 4
        ? 3
        : Math.min(items.length, 3));
  return (
    <section
      id={id}
      className="m-marketing-section"
      data-tone={tone}
      data-m-component="FeatureGrid"
    >
      {...introSlots({ eyebrow, title, description })}
      <div className="m-feature-grid" data-columns={cols}>
        {items.map((item, i) => {
          const content =
            marker === "number"
              ? String(i + 1).padStart(2, "0")
              : marker !== "none"
                ? item.icon
                : null;
          return (
            <article key={item.title}>
              {content && (
                <span
                  className="m-feature-icon"
                  data-marker={marker === "number" ? "number" : "icon"}
                  aria-hidden="true"
                >
                  {content}
                </span>
              )}
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
export function FeatureSection({
  id,
  eyebrow,
  title,
  description,
  details,
  children,
  reverse = false,
  tone = "default",
  framed = true,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description: string;
  /** Supporting content under the description, such as a CheckList or actions. */
  details?: ReactNode;
  children: ReactNode;
  reverse?: boolean;
  tone?: SectionTone;
  /** Wrap the preview in the sunken frame. Disable when the child brings its own frame. */
  framed?: boolean;
}) {
  const [eyebrowSlot, headingSlot] = introSlots({ eyebrow, title });
  return (
    <section
      id={id}
      className="m-feature-section"
      data-reverse={reverse}
      data-tone={tone}
      data-m-component="FeatureSection"
    >
      <div>
        {eyebrowSlot}
        {headingSlot}
        <p>{description}</p>
        {details && <div className="m-feature-details">{details}</div>}
      </div>
      <div className="m-feature-preview" data-framed={framed}>
        {children}
      </div>
    </section>
  );
}
/** Numbered, connected sequence for marketing "how it works" sections. */
export function ProcessSteps({
  id,
  eyebrow,
  title,
  description,
  items,
  tone = "default",
  headingLevel = 2,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  items: { title: string; description: string }[];
  tone?: SectionTone;
  headingLevel?: 2 | 3 | 4;
}) {
  const ItemHeading = headingTag(childLevel(headingLevel, 4));
  return (
    <section
      id={id}
      className="m-marketing-section"
      data-tone={tone}
      data-m-component="ProcessSteps"
    >
      {...introSlots({ eyebrow, title, description, headingLevel })}
      <ol
        className="m-process-steps"
        style={{ "--m-steps": items.length } as CSSProperties}
      >
        {items.map((item, i) => (
          <li key={`${item.title}:${i}`}>
            <span className="m-process-number" aria-hidden="true">
              {i + 1}
            </span>
            <ItemHeading>{item.title}</ItemHeading>
            <p>{item.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
export function Testimonial({
  quote,
  name,
  role,
  logo,
  avatar,
}: {
  quote: string;
  name: string;
  role?: string;
  /** Company logo above the quote; give the image its company name as alt text. */
  logo?: ReactNode;
  /** Photo or avatar beside the name (decorative). */
  avatar?: ReactNode;
}) {
  const person = (
    <>
      <strong>{name}</strong>
      {role && <span>{role}</span>}
    </>
  );
  return (
    <figure className="m-testimonial" data-m-component="Testimonial">
      {logo && <div className="m-testimonial-logo">{logo}</div>}
      <blockquote>{quote}</blockquote>
      <figcaption>
        {avatar ? (
          <>
            <span className="m-testimonial-avatar" aria-hidden="true">
              {avatar}
            </span>
            <span className="m-testimonial-person">{person}</span>
          </>
        ) : (
          person
        )}
      </figcaption>
    </figure>
  );
}
export function LogoCloud({
  label,
  items,
  layout = "inline",
  title,
  description,
  actions = [],
}: {
  label: string;
  items: { name: string; image?: string }[];
  /** inline: a centred row. grid: logos in bordered tiles. split: copy beside a logo grid. */
  layout?: "inline" | "grid" | "split";
  /** Split layout heading; the label still names the section. */
  title?: string;
  /** Split layout supporting copy. */
  description?: string;
  /** Split layout links, e.g. a case-studies link. */
  actions?: LinkAction[];
}) {
  const list = (
    <ul>
      {items.map((item) => (
        <li key={item.name}>
          {item.image ? (
            <img src={item.image} alt={item.name} />
          ) : (
            <span>{item.name}</span>
          )}
        </li>
      ))}
    </ul>
  );
  if (layout === "split") {
    return (
      <section
        className="m-logo-cloud"
        aria-label={label}
        data-m-component="LogoCloud"
        data-layout="split"
      >
        <div className="m-logo-cloud-copy">
          {title ? <h2>{title}</h2> : <p>{label}</p>}
          {description && (
            <p className="m-section-description">{description}</p>
          )}
          {actions.length > 0 && <ActionLinks actions={actions} />}
        </div>
        {list}
      </section>
    );
  }
  return (
    <section
      className="m-logo-cloud"
      aria-label={label}
      data-m-component="LogoCloud"
      data-layout={layout === "grid" ? "grid" : undefined}
    >
      <p>{label}</p>
      {list}
    </section>
  );
}
export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthly: string;
  annual?: string;
  unit?: string;
  annualUnit?: string;
  features: string[];
  action: LinkAction;
  featured?: boolean;
  availability?: "available" | "coming-soon" | "unavailable";
  availabilityLabel?: string;
}
export function Pricing({
  title,
  description,
  plans,
  tone,
  billingToggle,
  layout = "cards",
  featuresLabel = "What’s included",
}: {
  title: string;
  description?: string;
  plans: PricingPlan[];
  /** Applied only to featured cards. Omitted plans keep the page surface. */
  tone?: MarketingTone;
  billingToggle?: boolean;
  /** cards: side-by-side tiers. detailed: one full-width row per plan, features beside a price panel (single-price pages). */
  layout?: "cards" | "detailed";
  /** Heading above the feature list in the detailed layout. */
  featuresLabel?: string;
}) {
  const [annual, setAnnual] = useState(true);
  const showToggle =
    billingToggle ??
    (plans.length > 0 && plans.every((plan) => Boolean(plan.annual)));
  return (
    <section
      className="m-marketing-section m-pricing"
      data-m-component="Pricing"
    >
      <SectionIntro title={title} description={description} />
      {showToggle && (
        <SegmentedControl
          label="Billing interval"
          value={annual ? "annual" : "monthly"}
          options={[
            { value: "annual", label: "Annual" },
            { value: "monthly", label: "Monthly" },
          ]}
          onChange={(value) => setAnnual(value === "annual")}
        />
      )}
      <div
        className="m-pricing-grid"
        data-layout={layout === "detailed" ? "detailed" : undefined}
      >
        {plans.map((plan) => {
          const availability = plan.availability ?? "available";
          const blocked = availability !== "available";
          const showAnnual = annual && Boolean(plan.annual);
          const suffix = showAnnual ? plan.annualUnit : plan.unit;
          const price = (
            <div className="m-price">
              <strong>{showAnnual ? plan.annual : plan.monthly}</strong>
              {suffix && <span>{suffix}</span>}
            </div>
          );
          const features = (
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          );
          const purchase = blocked ? (
            <p role="status">
              {plan.availabilityLabel ??
                (availability === "coming-soon"
                  ? "Coming soon"
                  : "Unavailable")}
            </p>
          ) : (
            <ActionLink
              {...plan.action}
              variant={layout === "detailed" ? "primary" : "secondary"}
            />
          );
          return (
            <article
              key={plan.id}
              data-featured={plan.featured || undefined}
              data-tone={plan.featured && tone ? tone : undefined}
              data-availability={blocked ? availability : undefined}
            >
              {layout === "detailed" ? (
                <>
                  <div className="m-pricing-detail">
                    <h3>{plan.name}</h3>
                    <p>{plan.description}</p>
                    <p className="m-pricing-features-label">{featuresLabel}</p>
                    {features}
                  </div>
                  <div className="m-pricing-offer">
                    {price}
                    {purchase}
                  </div>
                </>
              ) : (
                <>
                  <h3>{plan.name}</h3>
                  <p>{plan.description}</p>
                  {price}
                  {features}
                  {purchase}
                </>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
export function FAQ({
  title,
  description,
  items,
  layout = "split",
}: {
  title: string;
  description?: ReactNode;
  items: { question: string; answer: ReactNode }[];
  /** split: heading beside an accordion. centered: heading above a narrow accordion. grid: every answer visible in columns. */
  layout?: "split" | "centered" | "grid";
}) {
  const head = (
    <div>
      <h2>{title}</h2>
      {description && <div>{description}</div>}
    </div>
  );
  if (layout === "grid") {
    return (
      <section className="m-faq" data-m-component="FAQ" data-layout="grid">
        {head}
        <TermList
          className="m-faq-grid"
          items={items.map((item) => ({
            term: item.question,
            details: item.answer,
          }))}
        />
      </section>
    );
  }
  return (
    <section
      className="m-faq"
      data-m-component="FAQ"
      data-layout={layout === "centered" ? "centered" : undefined}
    >
      {head}
      <div>
        {items.map((item) => (
          <details key={item.question}>
            <summary>
              {item.question}
              <span aria-hidden="true">+</span>
            </summary>
            <div>{item.answer}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
export function CallToAction({
  title,
  description,
  actions,
  tone,
  media,
}: {
  title: string;
  description?: string;
  actions: LinkAction[];
  tone?: MarketingTone;
  /** Image or screenshot beside the copy (promo layout). */
  media?: ReactNode;
}) {
  const copy = (
    <>
      <SectionIntro
        title={title}
        description={description}
        descriptionClassName={null}
      />
      <ActionLinks actions={actions} />
    </>
  );
  return (
    <section
      className="m-cta"
      data-m-component="CallToAction"
      data-tone={tone}
      data-layout={media ? "split" : undefined}
    >
      {media ? (
        <>
          <div className="m-cta-copy">{copy}</div>
          <div className="m-cta-media">{media}</div>
        </>
      ) : (
        copy
      )}
    </section>
  );
}
export function Footer({
  brand,
  logo,
  description,
  note,
  columns,
  copyright,
  legal = [],
  headingLevel = 2,
  social = [],
}: {
  brand: string;
  logo?: ReactNode;
  description: string;
  note?: ReactNode;
  columns: { title: string; links: LinkAction[] }[];
  copyright: string;
  legal?: LinkAction[];
  headingLevel?: 2 | 3 | 4;
  /** Social profiles, usually icon-only; each label names its link. */
  social?: IconLink[];
}) {
  const Heading = headingTag(headingLevel);
  return (
    <footer className="m-footer" data-m-component="Footer">
      <div className="m-footer-grid">
        <div>
          <strong className="m-brand">
            <BrandMark logo={logo} />
            {brand}
          </strong>
          <p>{description}</p>
          {note && <p>{note}</p>}
          {social.length > 0 && (
            <IconLinks label="Social media" links={social} />
          )}
        </div>
        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <Heading>{column.title}</Heading>
            {column.links.map((link, index) => (
              <KitLink
                href={link.href}
                key={`${link.label}:${link.href}:${index}`}
              >
                {link.label}
              </KitLink>
            ))}
          </nav>
        ))}
      </div>
      <div className="m-footer-bottom">
        <span>{copyright}</span>
        <div>
          {legal.map((link, index) => (
            <KitLink
              key={`${link.label}:${link.href}:${index}`}
              href={link.href}
            >
              {link.label}
            </KitLink>
          ))}
        </div>
      </div>
    </footer>
  );
}

/** Intro band for inner pages (about, pricing, careers), with optional links and stats. */
export function HeaderSection({
  eyebrow,
  title,
  description,
  links = [],
  stats = [],
  tone = "default",
  align = "start",
  headingLevel = 1,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  links?: LinkAction[];
  stats?: { label: string; value: string }[];
  tone?: SectionTone;
  align?: "start" | "center";
  headingLevel?: 1 | 2;
}) {
  const id = useId();
  return (
    <section
      className="m-marketing-section m-header-section"
      data-tone={tone}
      data-align={align}
      aria-labelledby={id}
      data-m-component="HeaderSection"
    >
      {...introSlots({ eyebrow, title, description, id, headingLevel })}
      {links.length > 0 && (
        <div className="m-header-links">
          {links.map((link, index) => (
            <KitLink
              key={`${link.label}:${link.href}:${index}`}
              href={link.href}
            >
              {link.label}
              <span aria-hidden="true"> →</span>
            </KitLink>
          ))}
        </div>
      )}
      {stats.length > 0 && (
        <TermList
          className="m-header-stats"
          items={stats.map((stat) => ({
            term: stat.label,
            details: stat.value,
          }))}
        />
      )}
    </section>
  );
}

/** Long-form copy with optional media beside it, e.g. an about-page story. */
export function ContentSection({
  eyebrow,
  title,
  description,
  media,
  mediaPosition = "end",
  tone = "default",
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Image, figure or illustration shown beside the copy. */
  media?: ReactNode;
  mediaPosition?: "start" | "end";
  tone?: SectionTone;
  children?: ReactNode;
}) {
  const id = useId();
  return (
    <section
      className="m-marketing-section m-content-section"
      data-tone={tone}
      data-media={media ? mediaPosition : undefined}
      aria-labelledby={id}
      data-m-component="ContentSection"
    >
      <div className="m-content-copy">
        {...introSlots({ eyebrow, title, description, id })}
        {children && <Prose>{children}</Prose>}
      </div>
      {media && <figure className="m-content-media">{media}</figure>}
    </section>
  );
}
