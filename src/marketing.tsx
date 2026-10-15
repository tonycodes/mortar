import { KitLink } from "./navigation.js";
import { useState, type CSSProperties, type ReactNode } from "react";
import { ActionLink, Button, type LinkAction } from "./primitives.js";
import { BrandMark, type SectionTone } from "./layout.js";
export function MarketingHeader({
  brand,
  homeHref = "/",
  logo,
  links,
  action,
  controls,
}: {
  brand: string;
  logo?: ReactNode;
  homeHref?: string;
  links: LinkAction[];
  action?: LinkAction;
  controls?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <header className="m-marketing-header">
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
        {links.map((link) => (
          <KitLink
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
          >
            {link.label}
          </KitLink>
        ))}
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
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: LinkAction[];
  children?: ReactNode;
  align?: "center" | "split";
  headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <section className={`m-hero m-hero-${align}`}>
      <div>
        {eyebrow && <p className="m-eyebrow">{eyebrow}</p>}
        <Heading>{title}</Heading>
        <p className="m-hero-description">{description}</p>
        <div className="m-actions">
          {actions.map((action, i) => (
            <ActionLink
              key={action.href}
              {...action}
              variant={i === 0 ? "primary" : "secondary"}
            />
          ))}
        </div>
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
    <section id={id} className="m-marketing-section" data-tone={tone}>
      {eyebrow && <p className="m-eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {description && <p className="m-section-description">{description}</p>}
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
  return (
    <section
      id={id}
      className="m-feature-section"
      data-reverse={reverse}
      data-tone={tone}
    >
      <div>
        {eyebrow && <p className="m-eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
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
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  items: { title: string; description: string }[];
  tone?: SectionTone;
}) {
  return (
    <section id={id} className="m-marketing-section" data-tone={tone}>
      {eyebrow && <p className="m-eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {description && <p className="m-section-description">{description}</p>}
      <ol
        className="m-process-steps"
        style={{ "--m-steps": items.length } as CSSProperties}
      >
        {items.map((item, i) => (
          <li key={item.title}>
            <span className="m-process-number" aria-hidden="true">
              {i + 1}
            </span>
            <h3>{item.title}</h3>
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
}: {
  quote: string;
  name: string;
  role?: string;
}) {
  return (
    <figure className="m-testimonial">
      <blockquote>{quote}</blockquote>
      <figcaption>
        <strong>{name}</strong>
        {role && <span>{role}</span>}
      </figcaption>
    </figure>
  );
}
export function LogoCloud({
  label,
  items,
}: {
  label: string;
  items: { name: string; image?: string }[];
}) {
  return (
    <section className="m-logo-cloud" aria-label={label}>
      <p>{label}</p>
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
  features: string[];
  action: LinkAction;
  featured?: boolean;
}
export function Pricing({
  title,
  description,
  plans,
}: {
  title: string;
  description?: string;
  plans: PricingPlan[];
}) {
  const [annual, setAnnual] = useState(true),
    toggle = plans.some((p) => p.annual);
  return (
    <section className="m-marketing-section m-pricing">
      <h2>{title}</h2>
      {description && <p className="m-section-description">{description}</p>}
      {toggle && (
        <div className="m-segmented" role="group" aria-label="Billing interval">
          <button
            type="button"
            aria-pressed={annual}
            onClick={() => setAnnual(true)}
          >
            Annual
          </button>
          <button
            type="button"
            aria-pressed={!annual}
            onClick={() => setAnnual(false)}
          >
            Monthly
          </button>
        </div>
      )}
      <div className="m-pricing-grid">
        {plans.map((plan) => (
          <article key={plan.id} data-featured={plan.featured}>
            <h3>{plan.name}</h3>
            <p>{plan.description}</p>
            <div className="m-price">
              <strong>
                {annual && plan.annual ? plan.annual : plan.monthly}
              </strong>
              {plan.unit && <span>{plan.unit}</span>}
            </div>
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <ActionLink {...plan.action} variant="secondary" />
          </article>
        ))}
      </div>
    </section>
  );
}
export function FAQ({
  title,
  description,
  items,
}: {
  title: string;
  description?: ReactNode;
  items: { question: string; answer: ReactNode }[];
}) {
  return (
    <section className="m-faq">
      <div>
        <h2>{title}</h2>
        {description && <div>{description}</div>}
      </div>
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
}: {
  title: string;
  description?: string;
  actions: LinkAction[];
}) {
  return (
    <section className="m-cta">
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      <div className="m-actions">
        {actions.map((action, i) => (
          <ActionLink
            key={action.href}
            {...action}
            variant={i === 0 ? "primary" : "secondary"}
          />
        ))}
      </div>
    </section>
  );
}
export function Footer({
  brand,
  logo,
  description,
  columns,
  copyright,
  legal = [],
}: {
  brand: string;
  logo?: ReactNode;
  description: string;
  columns: { title: string; links: LinkAction[] }[];
  copyright: string;
  legal?: LinkAction[];
}) {
  return (
    <footer className="m-footer">
      <div className="m-footer-grid">
        <div>
          <strong className="m-brand">
            <BrandMark logo={logo} />
            {brand}
          </strong>
          <p>{description}</p>
        </div>
        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2>{column.title}</h2>
            {column.links.map((link) => (
              <KitLink href={link.href} key={link.href}>
                {link.label}
              </KitLink>
            ))}
          </nav>
        ))}
      </div>
      <div className="m-footer-bottom">
        <span>{copyright}</span>
        <div>
          {legal.map((link) => (
            <KitLink key={link.href} href={link.href}>
              {link.label}
            </KitLink>
          ))}
        </div>
      </div>
    </footer>
  );
}
