import { useState, type ReactNode } from "react";
import { ActionLink, Button, type LinkAction } from "./primitives.js";
export function MarketingHeader({
  brand,
  homeHref = "/",
  links,
  action,
  controls,
}: {
  brand: string;
  homeHref?: string;
  links: LinkAction[];
  action?: LinkAction;
  controls?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <header className="m-marketing-header">
      <a className="m-brand" href={homeHref}>
        <span className="m-mark" aria-hidden="true" />
        {brand}
      </a>
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
          <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
            {link.label}
          </a>
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
  eyebrow,
  title,
  description,
  items,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  items: { title: string; description: string; icon?: ReactNode }[];
}) {
  return (
    <section className="m-marketing-section">
      {eyebrow && <p className="m-eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {description && <p className="m-section-description">{description}</p>}
      <div className="m-feature-grid">
        {items.map((item, i) => (
          <article key={item.title}>
            <span className="m-feature-icon" aria-hidden="true">
              {item.icon || String(i + 1).padStart(2, "0")}
            </span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
export function FeatureSection({
  title,
  description,
  children,
  reverse = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  reverse?: boolean;
}) {
  return (
    <section className="m-feature-section" data-reverse={reverse}>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="m-feature-preview">{children}</div>
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
  description,
  columns,
  copyright,
  legal = [],
}: {
  brand: string;
  description: string;
  columns: { title: string; links: LinkAction[] }[];
  copyright: string;
  legal?: LinkAction[];
}) {
  return (
    <footer className="m-footer">
      <div className="m-footer-grid">
        <div>
          <strong>{brand}</strong>
          <p>{description}</p>
        </div>
        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2>{column.title}</h2>
            {column.links.map((link) => (
              <a href={link.href} key={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        ))}
      </div>
      <div className="m-footer-bottom">
        <span>{copyright}</span>
        <div>
          {legal.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
