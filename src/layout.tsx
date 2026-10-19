import { useId, type ElementType, type ReactNode } from "react";
import { type HeadingLevel } from "./heading.js";
import {
  componentRoot,
  cx,
  classedIntroSlots,
  titledIntroSlots,
} from "./internal.js";

type Space = "none" | "xs" | "sm" | "md" | "lg" | "xl";

export interface StackProps {
  as?: ElementType;
  gap?: Space;
  direction?: "column" | "row";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between";
  wrap?: boolean;
  children: ReactNode;
  className?: string;
}
/** Vertical or horizontal rhythm without consumer flex/gap utilities. */
export function Stack({
  as: Tag = "div",
  gap = "md",
  direction = "column",
  align,
  justify,
  wrap = false,
  children,
  className,
}: StackProps) {
  return (
    <Tag
      {...componentRoot("Stack")}
      className={cx("m-layout-stack", className)}
      data-gap={gap === "md" ? undefined : gap}
      data-direction={direction === "column" ? undefined : direction}
      data-align={align}
      data-justify={justify}
      data-wrap={wrap || undefined}
    >
      {children}
    </Tag>
  );
}

export interface ContainerProps {
  as?: ElementType;
  size?: "sm" | "md" | "lg" | "xl";
  padded?: boolean;
  children: ReactNode;
  className?: string;
}
/** Centred page width with the shared gutters used by marketing and application pages. */
export function Container({
  as: Tag = "div",
  size = "lg",
  padded = true,
  children,
  className,
}: ContainerProps) {
  return (
    <Tag
      {...componentRoot("Container")}
      className={cx("m-container", className)}
      data-size={size === "lg" ? undefined : size}
      data-padded={padded || undefined}
    >
      {children}
    </Tag>
  );
}

export interface TextProps {
  as?: ElementType;
  /** Text colour; `data-tone` stays reserved for status and surface tones. */
  color?: "default" | "secondary" | "muted";
  size?: "sm" | "md" | "lg";
  weight?: "regular" | "medium" | "semibold";
  children: ReactNode;
  className?: string;
}
/** Body copy with semantic colour and size, instead of text-muted/text-ink utilities. */
export function Text({
  as: Tag = "p",
  color = "default",
  size = "md",
  weight = "regular",
  children,
  className,
}: TextProps) {
  return (
    <Tag
      {...componentRoot("Text")}
      className={cx("m-text", className)}
      data-color={color === "default" ? undefined : color}
      data-size={size === "md" ? undefined : size}
      data-weight={weight === "regular" ? undefined : weight}
    >
      {children}
    </Tag>
  );
}

export type SectionTone = "default" | "muted" | "inverse";

export interface SectionProps {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  tone?: SectionTone;
  align?: "start" | "center";
  headingLevel?: HeadingLevel;
  children?: ReactNode;
  className?: string;
}
/** Full-bleed marketing band for content that is not a grid or split feature. */
export function Section({
  id,
  eyebrow,
  title,
  description,
  tone = "default",
  align = "start",
  headingLevel = 2,
  children,
  className,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cx("m-marketing-section m-section", className)}
      data-tone={tone === "default" ? undefined : tone}
      data-align={align === "start" ? undefined : align}
      {...componentRoot("Section")}
    >
      {...titledIntroSlots({
        eyebrow,
        title: title || undefined,
        description,
        headingLevel,
      })}
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

export interface DividerProps {
  label?: string;
  soft?: boolean;
  spacing?: "none" | "sm" | "md" | "lg";
  className?: string;
}
/** Horizontal rule between groups; a label names the break for assistive technology. */
export function Divider({
  label,
  soft = false,
  spacing = "md",
  className,
}: DividerProps) {
  const attributes = {
    ...componentRoot("Divider"),
    className: cx("m-divider", className),
    "data-soft": soft || undefined,
    "data-spacing": spacing === "md" ? undefined : spacing,
  };
  return label ? (
    <div {...attributes} role="separator" aria-label={label}>
      <span aria-hidden="true">{label}</span>
    </div>
  ) : (
    <hr {...attributes} />
  );
}

export interface CardProps {
  as?: "div" | "section" | "article";
  title?: string;
  description?: string;
  headingLevel?: HeadingLevel;
  actions?: ReactNode;
  footer?: ReactNode;
  padding?: "default" | "compact" | "none";
  /** `muted` sets the card on the sunken surface. */
  tone?: "default" | "muted";
  children?: ReactNode;
  id?: string;
  className?: string;
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
  id,
  className,
}: CardProps) {
  const headingId = useId();
  return (
    <Tag
      id={id}
      {...componentRoot("Card")}
      className={cx("m-card", className)}
      data-padding={padding === "default" ? undefined : padding}
      data-tone={tone === "default" ? undefined : tone}
      aria-labelledby={title && Tag !== "div" ? headingId : undefined}
    >
      {(title || actions) && (
        <header className="m-card-header">
          {title && (
            <div className="m-card-heading">
              {...classedIntroSlots(
                {
                  title,
                  description,
                  id: headingId,
                  headingLevel,
                  descriptionClassName: null,
                },
                "m-card-title",
              )}
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

export interface MediaObjectProps {
  media: ReactNode;
  title?: string;
  align?: "start" | "center";
  reverse?: boolean;
  children?: ReactNode;
  className?: string;
}
/** Image, avatar or icon beside text, e.g. comments and list rows. */
export function MediaObject({
  media,
  title,
  align = "start",
  reverse = false,
  children,
  className,
}: MediaObjectProps) {
  return (
    <div
      {...componentRoot("MediaObject")}
      className={cx("m-media-object", className)}
      data-align={align === "start" ? undefined : align}
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

export interface SectionHeadingProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  headingLevel?: HeadingLevel;
  divider?: boolean;
  /** Page tabs (e.g. TabNav) below the title row; their underline replaces the divider. */
  tabs?: ReactNode;
  id?: string;
  className?: string;
}
/** Heading for a section within a page, with optional description and actions. */
export function SectionHeading({
  title,
  description,
  actions,
  headingLevel = 2,
  divider = true,
  tabs,
  id,
  className,
}: SectionHeadingProps) {
  return (
    <div
      id={id}
      {...componentRoot("SectionHeading")}
      className={cx("m-section-heading", className)}
      data-divider={divider || undefined}
    >
      <div className="m-section-heading-text">
        {...classedIntroSlots(
          {
            title,
            description,
            headingLevel,
            descriptionClassName: null,
          },
          "m-section-heading-title",
        )}
      </div>
      {actions && <div className="m-actions">{actions}</div>}
      {tabs && <div className="m-section-heading-tabs">{tabs}</div>}
    </div>
  );
}

export interface ProseProps {
  children: ReactNode;
  className?: string;
}
/** Long-form copy with the kit's typographic rhythm. */
export function Prose({ children, className }: ProseProps) {
  return (
    <div {...componentRoot("Prose")} className={cx("m-prose", className)}>
      {children}
    </div>
  );
}
