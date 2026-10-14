import type { ElementType, ReactNode } from "react";

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
    >
      {eyebrow && <p className="m-eyebrow">{eyebrow}</p>}
      {title && <h2>{title}</h2>}
      {description && <p className="m-section-description">{description}</p>}
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
