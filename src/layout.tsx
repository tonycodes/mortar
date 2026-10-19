import { useId, type ElementType, type ReactNode } from "react";
import { SectionIntro, introSlots } from "./internal.js";

type Space = "none" | "xs" | "sm" | "md" | "lg" | "xl";

/** Vertical or horizontal rhythm without consumer flex/gap utilities. */
export function Stack({
  as: Tag = "div",
  gap = "md",
  direction = "column",
  align,
  justify,
  wrap = false,
  children,
}: {
  as?: ElementType;
  gap?: Space;
  direction?: "column" | "row";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between";
  wrap?: boolean;
  children: ReactNode;
}) {
  return (
    <Tag
      className="m-layout-stack"
      data-gap={gap}
      data-direction={direction}
      data-align={align}
      data-justify={justify}
      data-wrap={wrap || undefined}
    >
      {children}
    </Tag>
  );
}

/** Centred page width with the shared gutters used by marketing and application pages. */
export function Container({
  as: Tag = "div",
  size = "lg",
  padded = true,
  children,
}: {
  as?: ElementType;
  size?: "sm" | "md" | "lg" | "xl";
  padded?: boolean;
  children: ReactNode;
}) {
  return (
    <Tag className="m-container" data-size={size} data-padded={padded}>
      {children}
    </Tag>
  );
}

/** Body copy with semantic tone and size, instead of text-muted/text-ink utilities. */
export function Text({
  as: Tag = "p",
  tone = "default",
  size = "md",
  weight = "regular",
  children,
}: {
  as?: ElementType;
  tone?: "default" | "secondary" | "muted";
  size?: "sm" | "md" | "lg";
  weight?: "regular" | "medium" | "semibold";
  children: ReactNode;
}) {
  return (
    <Tag
      className="m-text"
      data-tone={tone}
      data-size={size}
      data-weight={weight}
    >
      {children}
    </Tag>
  );
}

export type SectionTone = "default" | "muted" | "inverse";

/** Full-bleed marketing band for content that is not a grid or split feature. */
export function Section({
  id,
  eyebrow,
  title,
  description,
  tone = "default",
  align = "start",
  children,
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  tone?: SectionTone;
  align?: "start" | "center";
  children?: ReactNode;
}) {
  return (
    <section
      id={id}
      className="m-marketing-section m-section"
      data-tone={tone}
      data-align={align}
      data-m-component="Section"
    >
      {...introSlots({ eyebrow, title: title || undefined, description })}
      {children && <div className="m-section-body">{children}</div>}
    </section>
  );
}

/** Brand mark: a supplied logo node, or the neutral placeholder square. */
export function BrandMark({ logo }: { logo?: ReactNode }) {
  return logo ? (
    <span className="m-logo" aria-hidden="true">
      {logo}
    </span>
  ) : (
    <span className="m-mark" aria-hidden="true" />
  );
}

/** Horizontal rule between groups; a label names the break for assistive technology. */
export function Divider({
  label,
  soft = false,
  spacing = "md",
}: {
  label?: string;
  soft?: boolean;
  spacing?: "none" | "sm" | "md" | "lg";
}) {
  return label ? (
    <div
      className="m-divider"
      role="separator"
      aria-label={label}
      data-soft={soft || undefined}
      data-spacing={spacing}
    >
      <span aria-hidden="true">{label}</span>
    </div>
  ) : (
    <hr
      className="m-divider"
      data-soft={soft || undefined}
      data-spacing={spacing}
    />
  );
}

/** Bordered surface with optional heading, header actions and footer. */
export function Card({
  as: Tag = "div",
  title,
  description,
  headingLevel = 2,
  actions,
  footer,
  padding = "default",
  tone = "default",
  children,
}: {
  as?: "div" | "section" | "article";
  title?: string;
  description?: string;
  headingLevel?: 2 | 3 | 4;
  actions?: ReactNode;
  footer?: ReactNode;
  padding?: "default" | "compact" | "none";
  tone?: "default" | "sunken";
  children?: ReactNode;
}) {
  const id = useId();
  return (
    <Tag
      className="m-card"
      data-padding={padding}
      data-tone={tone}
      aria-labelledby={title && Tag !== "div" ? id : undefined}
    >
      {(title || actions) && (
        <header className="m-card-header">
          {title && (
            <div className="m-card-heading">
              <SectionIntro
                title={title}
                description={description}
                id={id}
                headingLevel={headingLevel}
                descriptionClassName={null}
              />
            </div>
          )}
          {actions && <div className="m-card-actions">{actions}</div>}
        </header>
      )}
      {children && <div className="m-card-body">{children}</div>}
      {footer && <footer className="m-card-footer">{footer}</footer>}
    </Tag>
  );
}

/** Image, avatar or icon beside text, e.g. comments and list rows. */
export function MediaObject({
  media,
  title,
  align = "start",
  reverse = false,
  children,
}: {
  media: ReactNode;
  title?: string;
  align?: "start" | "center";
  reverse?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className="m-media-object"
      data-align={align}
      data-reverse={reverse || undefined}
    >
      <div className="m-media-object-media">{media}</div>
      <div className="m-media-object-body">
        {title && <p className="m-media-object-title">{title}</p>}
        {children}
      </div>
    </div>
  );
}

/** Heading for a section within a page, with optional description and actions. */
export function SectionHeading({
  title,
  description,
  actions,
  headingLevel = 2,
  divider = true,
  tabs,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  headingLevel?: 2 | 3 | 4;
  divider?: boolean;
  /** Page tabs (e.g. TabNav) below the title row; their underline replaces the divider. */
  tabs?: ReactNode;
}) {
  return (
    <div className="m-section-heading" data-divider={divider}>
      <div className="m-section-heading-text">
        <SectionIntro
          title={title}
          description={description}
          headingLevel={headingLevel}
          descriptionClassName={null}
        />
      </div>
      {actions && <div className="m-actions">{actions}</div>}
      {tabs && <div className="m-section-heading-tabs">{tabs}</div>}
    </div>
  );
}

/** Long-form copy with the kit's typographic rhythm. */
export function Prose({ children }: { children: ReactNode }) {
  return <div className="m-prose">{children}</div>;
}
