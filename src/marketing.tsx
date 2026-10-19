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
  DialogPanel,
  DialogTitle,
  Popover,
  PopoverButton,
  PopoverPanel,
} from "@headlessui/react";
import { ActionLink, Button, type LinkAction } from "./primitives.js";
import { BrandMark, Prose, type SectionTone } from "./layout.js";
import { SegmentedControl } from "./inspection.js";
import { ChevronDown } from "./icons.js";
import { StatGroup } from "./marketing-sections.js";
import { childLevel, headingTag, type HeadingLevel } from "./heading.js";
import {
  ActionLinks,
  DialogFrame,
  TermList,
  TitledIntro,
  cx,
  componentRoot,
  titledIntroSlots,
  sectionTone,
  useDomId,
} from "./internal.js";

export type FlyoutItem = Pick<
  LinkItem,
  "label" | "href" | "description" | "icon"
>;
/** A header link, or a labelled group that opens a flyout panel. */
export type HeaderLink =
  | LinkAction
  | (ItemGroup<FlyoutItem> & {
      footer?: LinkAction[];
      /** list: one column. columns: a wider panel in two columns. full: as wide as the viewport allows, up to four columns. */
      layout?: "list" | "columns" | "full";
    });

function Flyout({
  label,
  items,
  footer = [],
  layout = "list",
  onNavigate,
}: {
  label: string;
  items: FlyoutItem[];
  footer?: LinkAction[];
  layout?: "list" | "columns" | "full";
  onNavigate: () => void;
}) {
  const dataLayout = layout === "list" ? undefined : layout;
  return (
    <Popover className="m-flyout" data-layout={dataLayout}>
      <PopoverButton className="m-flyout-trigger">
        {label}
        <ChevronDown />
      </PopoverButton>
      {/* Anchored panels render in a portal, so headers inside clipped containers never cut them off. */}
      <PopoverPanel
        anchor="bottom"
        className="m-flyout-panel"
        data-layout={dataLayout}
      >
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
  layout = "inline",
  mobileMenu = "inline",
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
  /** inline: brand, links and actions in one row. center: links at the start, the brand centred, actions at the end. */
  layout?: "inline" | "center";
  /** How narrow screens show the links. inline: the menu button expands them under the header. panel: it opens a full-screen dialog. */
  mobileMenu?: "inline" | "panel";
  className?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  // Generated so two headers on one page keep distinct, valid references.
  const navId = useDomId("m-marketing-nav");
  const panel = mobileMenu === "panel";
  const close = () => setOpen(false);
  const brandLink = (
    <KitLink className="m-brand" href={homeHref}>
      <BrandMark logo={logo} />
      {brand}
    </KitLink>
  );
  const menuButton = (
    <Button
      variant="ghost"
      className="m-menu-trigger"
      aria-haspopup={panel ? "dialog" : undefined}
      aria-expanded={open}
      aria-controls={panel ? undefined : navId}
      onClick={() => setOpen(!open)}
    >
      Menu
    </Button>
  );
  const nav = (
    <nav
      id={navId}
      aria-label="Primary"
      data-open={(open && !panel) || undefined}
    >
      {links.map((link, index) =>
        "items" in link ? (
          <Flyout
            key={`${link.label}:flyout:${index}`}
            label={link.label}
            items={link.items}
            footer={link.footer}
            layout={link.layout}
            onNavigate={close}
          />
        ) : (
          <KitLink
            key={`${link.label}:${link.href}:${index}`}
            href={link.href}
            onClick={close}
          >
            {link.label}
          </KitLink>
        ),
      )}
    </nav>
  );
  const actions = (controls || action) && (
    <>
      {controls}
      {action && <ActionLink {...action} />}
    </>
  );
  return (
    <header
      id={id}
      className={cx("m-marketing-header", className)}
      {...componentRoot("MarketingHeader")}
      data-layout={layout === "center" ? "center" : undefined}
      data-menu={panel ? "panel" : undefined}
    >
      {/* Centred, the DOM follows the visual order so focus moves from start to end. */}
      {layout === "center" ? (
        <>
          {menuButton}
          {nav}
          {brandLink}
        </>
      ) : (
        <>
          {brandLink}
          {menuButton}
          {nav}
        </>
      )}
      <div className="m-actions">{actions}</div>
      {panel && (
        <DialogFrame open={open} onClose={close}>
          <DialogPanel className="m-marketing-panel">
            <div className="m-dialog-heading">
              <DialogTitle className="m-brand">
                <BrandMark logo={logo} />
                {brand}
              </DialogTitle>
              <Button variant="ghost" onClick={close}>
                Close menu
              </Button>
            </div>
            <PanelLinks links={links} onNavigate={close} />
            {actions && <div className="m-actions">{actions}</div>}
          </DialogPanel>
        </DialogFrame>
      )}
    </header>
  );
}
/** The header's links in the full-screen mobile panel; flyout groups become disclosures. */
function PanelLinks({
  links,
  onNavigate,
}: {
  links: HeaderLink[];
  onNavigate: () => void;
}) {
  return (
    <nav aria-label="Primary" className="m-marketing-panel-nav">
      {links.map((link, index) =>
        "items" in link ? (
          <details key={`${link.label}:group:${index}`}>
            <summary>
              {link.label}
              <ChevronDown />
            </summary>
            {[...link.items, ...(link.footer ?? [])].map((item, i) => (
              <KitLink
                key={`${item.label}:${item.href}:${i}`}
                href={item.href}
                onClick={onNavigate}
              >
                {item.label}
              </KitLink>
            ))}
          </details>
        ) : (
          <KitLink
            key={`${link.label}:${link.href}:${index}`}
            href={link.href}
            onClick={onNavigate}
          >
            {link.label}
          </KitLink>
        ),
      )}
    </nav>
  );
}
export function Hero({
  id,
  className,
  eyebrow,
  title,
  description,
  actions = [],
  children,
  layout = "center",
  headingLevel = 1,
  background,
  images = [],
}: {
  id?: string;
  className?: string;
  eyebrow?: string;
  title: string;
  description: string;
  actions?: LinkAction[];
  children?: ReactNode;
  /** center: copy above the preview. split: copy beside the preview. angled: copy beside an image that fills the end half to the edge, cut on a slant (pass one img or video as children). */
  layout?: "center" | "split" | "angled";
  headingLevel?: HeadingLevel;
  /** Decorative full-cover image or video behind the copy. The hero switches to the inverse tone with a scrim so text keeps its contrast. */
  background?: ReactNode;
  /** Image tiles shown as a staggered collage beside (split) or below (center) the copy. Use instead of children; give each image its own alt text, or alt="" when decorative. */
  images?: ReactNode[];
}) {
  return (
    <section
      id={id}
      className={cx("m-hero", `m-hero-${layout}`, className)}
      {...componentRoot("Hero")}
      data-background={background ? true : undefined}
      data-tone={background ? "inverse" : undefined}
    >
      {background && (
        <div className="m-hero-background" aria-hidden="true">
          {background}
        </div>
      )}
      <div>
        <TitledIntro
          eyebrow={eyebrow}
          title={title}
          headingLevel={headingLevel}
        />
        <p className="m-hero-description">{description}</p>
        <ActionLinks actions={actions} />
      </div>
      {images.length > 0 && (
        <div className="m-hero-tiles">
          {images.map((image, index) => (
            <div key={index}>{image}</div>
          ))}
        </div>
      )}
      {children && <div className="m-hero-preview">{children}</div>}
    </section>
  );
}
export function FeatureGrid({
  id,
  className,
  eyebrow,
  title,
  description,
  items,
  marker = "auto",
  columns,
  tone = "default",
  headingLevel = 2,
}: {
  id?: string;
  className?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  items: { title: string; description: string; icon?: ReactNode }[];
  /** auto: show icons when supplied, otherwise no marker. number: for sequences. */
  marker?: "auto" | "icon" | "number" | "none";
  /** Defaults to a balanced count for the number of items. */
  columns?: 2 | 3 | 4;
  tone?: SectionTone;
  /** The section title's level; item titles sit one level below. */
  headingLevel?: HeadingLevel;
}) {
  const ItemHeading = headingTag(childLevel(headingLevel));
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
      className={cx("m-marketing-section", className)}
      data-tone={sectionTone(tone)}
      {...componentRoot("FeatureGrid")}
    >
      {...titledIntroSlots({ eyebrow, title, description, headingLevel })}
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
              <ItemHeading>{item.title}</ItemHeading>
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
  className,
  eyebrow,
  title,
  description,
  details,
  children,
  reverse = false,
  tone = "default",
  framed = true,
  offset = false,
  headingLevel = 2,
}: {
  id?: string;
  className?: string;
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
  /** Let a wide screenshot run past the section's end edge and crop there (wide screens only). */
  offset?: boolean;
  headingLevel?: HeadingLevel;
}) {
  const [eyebrowSlot, headingSlot] = titledIntroSlots({
    eyebrow,
    title,
    headingLevel,
  });
  return (
    <section
      id={id}
      className={cx("m-feature-section", className)}
      data-reverse={reverse || undefined}
      data-offset={offset || undefined}
      data-tone={sectionTone(tone)}
      {...componentRoot("FeatureSection")}
    >
      <div>
        {eyebrowSlot}
        {headingSlot}
        <p>{description}</p>
        {details && <div className="m-feature-details">{details}</div>}
      </div>
      <div className="m-feature-preview" data-framed={framed || undefined}>
        {children}
      </div>
    </section>
  );
}
/** Numbered, connected sequence for marketing "how it works" sections. */
export function ProcessSteps({
  id,
  className,
  eyebrow,
  title,
  description,
  items,
  tone = "default",
  headingLevel = 2,
}: {
  id?: string;
  className?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  items: { title: string; description: string }[];
  tone?: SectionTone;
  headingLevel?: HeadingLevel;
}) {
  const ItemHeading = headingTag(childLevel(headingLevel));
  return (
    <section
      id={id}
      className={cx("m-marketing-section", className)}
      data-tone={sectionTone(tone)}
      {...componentRoot("ProcessSteps")}
    >
      {...titledIntroSlots({ eyebrow, title, description, headingLevel })}
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
  id,
  className,
  quote,
  name,
  role,
  logo,
  avatar,
}: {
  id?: string;
  className?: string;
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
    <figure
      id={id}
      className={cx("m-testimonial", className)}
      {...componentRoot("Testimonial")}
    >
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
  id,
  className,
  label,
  items,
  layout = "inline",
  title,
  description,
  actions = [],
  headingLevel = 2,
}: {
  id?: string;
  className?: string;
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
  /** Level of the split layout's title. */
  headingLevel?: HeadingLevel;
}) {
  const Heading = headingTag(headingLevel);
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
        id={id}
        className={cx("m-logo-cloud", className)}
        aria-label={label}
        {...componentRoot("LogoCloud")}
        data-layout="split"
      >
        <div className="m-logo-cloud-copy">
          {title ? (
            <Heading className="m-section-title">{title}</Heading>
          ) : (
            <p>{label}</p>
          )}
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
      id={id}
      className={cx("m-logo-cloud", className)}
      aria-label={label}
      {...componentRoot("LogoCloud")}
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
/** A full-width tier band under the pricing plans. */
export interface PricingExtra {
  name: string;
  description: string;
  /** Optional price, e.g. "$9" or "Custom". */
  price?: string;
  unit?: string;
  action: LinkAction;
}
export function Pricing({
  id,
  className,
  title,
  description,
  plans,
  tone = "default",
  billingToggle,
  layout = "cards",
  featuresLabel = "What’s included",
  headingLevel = 2,
  extra,
}: {
  id?: string;
  className?: string;
  title: string;
  description?: string;
  plans: PricingPlan[];
  /** Applied only to featured cards. Other plans keep the page surface. */
  tone?: SectionTone;
  billingToggle?: boolean;
  /** cards: side-by-side tiers. detailed: one full-width row per plan, features beside a price panel (single-price pages). */
  layout?: "cards" | "detailed";
  /** Heading above the feature list in the detailed layout. */
  featuresLabel?: string;
  /** The section title's level; plan names sit one level below. */
  headingLevel?: HeadingLevel;
  /** A full-width tier band under the plans, such as an enterprise or discount row. */
  extra?: PricingExtra;
}) {
  const [annualChoice, setAnnual] = useState(true);
  const showToggle =
    billingToggle ??
    (plans.length > 0 && plans.every((plan) => Boolean(plan.annual)));
  // Annual prices show only while the toggle that switches them is visible,
  // so the page never mixes units the visitor cannot change.
  const annual = showToggle && annualChoice;
  const PlanHeading = headingTag(childLevel(headingLevel));
  return (
    <section
      id={id}
      className={cx("m-marketing-section m-pricing", className)}
      {...componentRoot("Pricing")}
    >
      <TitledIntro
        title={title}
        description={description}
        headingLevel={headingLevel}
      />
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
        data-columns={layout === "cards" && plans.length === 4 ? 4 : undefined}
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
          // Static text, not a live region: nothing changes after render.
          const purchase = blocked ? (
            <p className="m-pricing-availability">
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
              data-tone={plan.featured ? sectionTone(tone) : undefined}
              data-availability={blocked ? availability : undefined}
            >
              {layout === "detailed" ? (
                <>
                  <div className="m-pricing-detail">
                    <PlanHeading>{plan.name}</PlanHeading>
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
                  <PlanHeading>{plan.name}</PlanHeading>
                  <p>{plan.description}</p>
                  {price}
                  {features}
                  {purchase}
                </>
              )}
            </article>
          );
        })}
        {extra && (
          <article className="m-pricing-extra">
            <div>
              <PlanHeading>{extra.name}</PlanHeading>
              <p>{extra.description}</p>
            </div>
            {extra.price && (
              <div className="m-price">
                <strong>{extra.price}</strong>
                {extra.unit && <span>{extra.unit}</span>}
              </div>
            )}
            <ActionLink {...extra.action} variant="secondary" />
          </article>
        )}
      </div>
    </section>
  );
}
export function FAQ({
  id,
  className,
  title,
  description,
  items,
  layout = "split",
  headingLevel = 2,
}: {
  id?: string;
  className?: string;
  title: string;
  description?: ReactNode;
  items: { question: string; answer: ReactNode }[];
  /** split: heading beside an accordion. center: heading above a narrow accordion. grid: every answer visible in columns. */
  layout?: "split" | "center" | "grid";
  headingLevel?: HeadingLevel;
}) {
  const Heading = headingTag(headingLevel);
  const head = (
    <div>
      <Heading className="m-section-title">{title}</Heading>
      {description && <div>{description}</div>}
    </div>
  );
  if (layout === "grid") {
    return (
      <section
        id={id}
        className={cx("m-faq", className)}
        {...componentRoot("FAQ")}
        data-layout="grid"
      >
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
      id={id}
      className={cx("m-faq", className)}
      {...componentRoot("FAQ")}
      data-layout={layout === "center" ? "center" : undefined}
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
  id,
  className,
  title,
  description,
  actions,
  tone = "default",
  media,
  headingLevel = 2,
}: {
  id?: string;
  className?: string;
  title: string;
  description?: string;
  actions: LinkAction[];
  /** default: the page surface. muted: the sunken band. inverse: the inverse token remap. */
  tone?: SectionTone;
  /** Image or screenshot beside the copy (promo layout). */
  media?: ReactNode;
  headingLevel?: HeadingLevel;
}) {
  const copy = (
    <>
      <TitledIntro
        title={title}
        description={description}
        descriptionClassName={null}
        headingLevel={headingLevel}
      />
      <ActionLinks actions={actions} />
    </>
  );
  return (
    <section
      id={id}
      className={cx("m-cta", className)}
      {...componentRoot("CallToAction")}
      data-tone={sectionTone(tone)}
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
  id,
  className,
  brand,
  logo,
  description,
  note,
  columns,
  copyright,
  legal = [],
  itemHeadingLevel = 2,
  social = [],
  layout = "columns",
  newsletter,
}: {
  id?: string;
  className?: string;
  brand: string;
  logo?: ReactNode;
  description: string;
  note?: ReactNode;
  /** Link columns; each label is the column's visible heading and its navigation name. Centred, the label only names the navigation. */
  columns: ItemGroup<LinkAction>[];
  copyright: string;
  legal?: LinkAction[];
  /** Level of the column headings. */
  itemHeadingLevel?: HeadingLevel;
  /** Social profiles, usually icon-only; each label names its link. */
  social?: IconLink[];
  /** columns: the brand beside headed link columns. center: brand, a row of links and social links, all centred. */
  layout?: "columns" | "center";
  /** A signup row above the copyright, usually a Newsletter; the footer removes its section padding. */
  newsletter?: ReactNode;
}) {
  const Heading = headingTag(itemHeadingLevel);
  const center = layout === "center";
  const identity = (
    <>
      <strong className="m-brand">
        <BrandMark logo={logo} />
        {brand}
      </strong>
      <p>{description}</p>
      {note && <p>{note}</p>}
    </>
  );
  const socialLinks = social.length > 0 && (
    <IconLinks label="Social media" links={social} />
  );
  const navs = columns.map((column) => (
    <nav key={column.label} aria-label={column.label}>
      {/* Centred, the links sit in one row and the label only names the navigation. */}
      {!center && <Heading>{column.label}</Heading>}
      {column.items.map((link, index) => (
        <KitLink href={link.href} key={`${link.label}:${link.href}:${index}`}>
          {link.label}
        </KitLink>
      ))}
    </nav>
  ));
  return (
    <footer
      id={id}
      className={cx("m-footer", className)}
      {...componentRoot("Footer")}
      data-layout={center ? "center" : undefined}
    >
      {center ? (
        <div className="m-footer-center">
          {identity}
          {navs}
          {socialLinks}
        </div>
      ) : (
        <div className="m-footer-grid">
          <div>
            {identity}
            {socialLinks}
          </div>
          {navs}
        </div>
      )}
      {newsletter && <div className="m-footer-newsletter">{newsletter}</div>}
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
  id,
  className,
  eyebrow,
  title,
  description,
  links = [],
  stats = [],
  tone = "default",
  align = "start",
  headingLevel = 1,
}: {
  id?: string;
  className?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  links?: LinkAction[];
  stats?: { label: string; value: string }[];
  tone?: SectionTone;
  align?: "start" | "center";
  headingLevel?: HeadingLevel;
}) {
  const headingId = useId();
  return (
    <section
      id={id}
      className={cx("m-marketing-section m-header-section", className)}
      data-tone={sectionTone(tone)}
      data-align={align === "start" ? undefined : align}
      aria-labelledby={headingId}
      {...componentRoot("HeaderSection")}
    >
      {...titledIntroSlots({
        eyebrow,
        title,
        description,
        id: headingId,
        headingLevel,
      })}
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
  id,
  className,
  eyebrow,
  title,
  description,
  media,
  mediaPosition = "end",
  tone = "default",
  headingLevel = 2,
  stats = [],
  testimonial,
  children,
}: {
  id?: string;
  className?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  /** Image, figure or illustration shown beside the copy. */
  media?: ReactNode;
  mediaPosition?: "start" | "end";
  tone?: SectionTone;
  headingLevel?: HeadingLevel;
  /** Figures under the copy, shown as a StatGroup named by the title. */
  stats?: { label: string; value: string; description?: string }[];
  /** A customer quote under the copy, shown as a Testimonial. */
  testimonial?: {
    quote: string;
    name: string;
    role?: string;
    avatar?: ReactNode;
  };
  children?: ReactNode;
}) {
  const headingId = useId();
  return (
    <section
      id={id}
      className={cx("m-marketing-section m-content-section", className)}
      data-tone={sectionTone(tone)}
      data-media={media ? mediaPosition : undefined}
      aria-labelledby={headingId}
      {...componentRoot("ContentSection")}
    >
      <div className="m-content-copy">
        {...titledIntroSlots({
          eyebrow,
          title,
          description,
          id: headingId,
          headingLevel,
        })}
        {children && <Prose>{children}</Prose>}
        {testimonial && (
          <Testimonial className="m-content-quote" {...testimonial} />
        )}
        {stats.length > 0 && (
          <StatGroup className="m-content-stats" label={title} items={stats} />
        )}
      </div>
      {media && <figure className="m-content-media">{media}</figure>}
    </section>
  );
}
