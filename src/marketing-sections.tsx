import { IconLinks, KitLink, type IconLink } from "./navigation.js";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { ActionLink, Button, Input, type LinkAction } from "./primitives.js";
import { Avatar } from "./display.js";
import type { SectionTone } from "./layout.js";
import { childLevel, headingTag, type HeadingLevel } from "./heading.js";
import {
  ActionLinks,
  TermList,
  TitledIntro,
  cx,
  sectionTone,
} from "./internal.js";

export function BentoGrid({
  id,
  className,
  eyebrow,
  title,
  description,
  items,
  headingLevel = 2,
}: {
  id?: string;
  className?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  items: {
    title: string;
    description: string;
    visual?: ReactNode;
    span?: 1 | 2;
    /** The tile's surface; inverse remaps it to the inverse tokens. */
    tone?: SectionTone;
  }[];
  /** The section title's level; tile titles sit one level below. */
  headingLevel?: HeadingLevel;
}) {
  const ItemHeading = headingTag(childLevel(headingLevel));
  return (
    <section
      id={id}
      className={cx("m-marketing-section", className)}
      data-m-component="BentoGrid"
    >
      <TitledIntro
        eyebrow={eyebrow}
        title={title}
        description={description}
        headingLevel={headingLevel}
      />
      <ul className="m-bento">
        {items.map((item, index) => (
          <li key={`${item.title}:${index}`} data-span={item.span || 1}>
            <article data-tone={sectionTone(item.tone)}>
              {item.visual && (
                <div className="m-bento-visual">{item.visual}</div>
              )}
              <ItemHeading>{item.title}</ItemHeading>
              <p>{item.description}</p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function StatGroup({
  id,
  className,
  label,
  items,
}: {
  id?: string;
  className?: string;
  label: string;
  /** description: optional supporting sentence under the value. */
  items: { value: string; label: string; description?: string }[];
}) {
  return (
    <TermList
      id={id}
      className={cx("m-stat-group", className)}
      aria-label={label}
      data-m-component="StatGroup"
      items={items.map((item) => ({
        term: item.label,
        details: item.value,
        after: item.description && (
          <dd className="m-stat-description">{item.description}</dd>
        ),
      }))}
    />
  );
}

export function TestimonialGrid({
  id,
  className,
  title,
  items,
  headingLevel = 2,
  layout = "masonry",
}: {
  id?: string;
  className?: string;
  title?: string;
  items: {
    quote: string;
    name: string;
    role?: string;
    avatar?: string;
    /** A larger quote that spans the grid's middle columns, or every column in masonry. */
    featured?: boolean;
  }[];
  headingLevel?: HeadingLevel;
  /** masonry: quotes flow down balanced columns at their own heights. grid: rows of equal height. */
  layout?: "masonry" | "grid";
}) {
  const Heading = headingTag(headingLevel);
  return (
    <section
      id={id}
      className={cx("m-marketing-section", className)}
      aria-label={title ? undefined : "Testimonials"}
      data-m-component="TestimonialGrid"
    >
      {title && <Heading className="m-section-title">{title}</Heading>}
      <div
        className="m-testimonial-grid"
        data-layout={layout === "grid" ? "grid" : undefined}
      >
        {items.map((item) => (
          <figure
            key={item.name}
            data-featured={item.featured ? "true" : undefined}
          >
            <blockquote>{item.quote}</blockquote>
            <figcaption>
              <Avatar decorative name={item.name} src={item.avatar} size="sm" />
              <span>
                <strong>{item.name}</strong>
                {item.role && <span>{item.role}</span>}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function PlanComparison({
  id,
  className,
  title,
  description,
  plans,
  featuredPlan,
  groups,
  headingLevel = 2,
}: {
  id?: string;
  className?: string;
  title: string;
  description?: string;
  plans: string[];
  featuredPlan?: string;
  groups: {
    label: string;
    rows: { feature: string; values: (boolean | string)[] }[];
  }[];
  headingLevel?: HeadingLevel;
}) {
  const headingId = useId();
  return (
    <section
      id={id}
      className={cx("m-marketing-section", className)}
      aria-labelledby={headingId}
      data-m-component="PlanComparison"
    >
      <TitledIntro
        id={headingId}
        title={title}
        description={description}
        headingLevel={headingLevel}
      />
      <div
        className="m-table-scroll m-comparison"
        role="region"
        aria-label={`${title} table`}
        tabIndex={0}
      >
        <table>
          <thead>
            <tr>
              <td />
              {plans.map((plan) => (
                <th
                  key={plan}
                  scope="col"
                  data-featured={plan === featuredPlan || undefined}
                >
                  {plan}
                </th>
              ))}
            </tr>
          </thead>
          {groups.map((group) => (
            <tbody key={group.label}>
              <tr className="m-comparison-group">
                <th scope="colgroup" colSpan={plans.length + 1}>
                  {group.label}
                </th>
              </tr>
              {group.rows.map((row) => (
                <tr key={row.feature}>
                  <th scope="row">{row.feature}</th>
                  {row.values.map((value, i) => (
                    <td
                      key={plans[i]}
                      data-featured={plans[i] === featuredPlan || undefined}
                    >
                      {typeof value === "boolean" ? (
                        // The glyph is decoration; the cell's text is the meaning.
                        <>
                          <span
                            aria-hidden="true"
                            className={value ? undefined : "m-comparison-no"}
                          >
                            {value ? "✓" : "—"}
                          </span>
                          <span className="m-sr-only">
                            {value ? "Included" : "Not included"}
                          </span>
                        </>
                      ) : (
                        value
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </section>
  );
}

export function PostList({
  id,
  className,
  title,
  description,
  posts,
  action,
  headingLevel = 2,
  itemHeadingLevel,
}: {
  id?: string;
  className?: string;
  title: string;
  description?: string;
  posts: {
    href: string;
    title: string;
    excerpt: string;
    date: string;
    dateLabel: string;
    category?: string;
    image?: ReactNode;
    /** Spans the full row with the image beside a larger title; usually the first post. */
    featured?: boolean;
  }[];
  action?: LinkAction;
  headingLevel?: HeadingLevel;
  /** Level of each post title; defaults to one below `headingLevel`. */
  itemHeadingLevel?: HeadingLevel;
}) {
  const PostHeading = headingTag(itemHeadingLevel ?? childLevel(headingLevel));
  return (
    <section
      id={id}
      className={cx("m-marketing-section", className)}
      data-m-component="PostList"
    >
      <div className="m-section-heading-row">
        <div>
          <TitledIntro
            title={title}
            description={description}
            headingLevel={headingLevel}
          />
        </div>
        {action && <ActionLink {...action} variant="secondary" />}
      </div>
      <ul className="m-post-list">
        {posts.map((post, index) => (
          <li
            key={`${post.title}:${post.href}:${index}`}
            data-featured={post.featured ? "true" : undefined}
          >
            <article>
              {post.image && <div className="m-post-image">{post.image}</div>}
              <p className="m-post-meta">
                {post.category && <span>{post.category}</span>}
                <time dateTime={post.date}>{post.dateLabel}</time>
              </p>
              <PostHeading className="m-post-title">
                <KitLink href={post.href}>{post.title}</KitLink>
              </PostHeading>
              <p>{post.excerpt}</p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TeamGrid({
  id,
  className,
  title,
  description,
  members,
  headingLevel = 2,
  layout = "grid",
}: {
  id?: string;
  className?: string;
  title: string;
  description?: string;
  members: {
    name: string;
    role: string;
    image?: ReactNode;
    bio?: string;
    /** Profile links, e.g. icon-only social links named "Ana on LinkedIn". */
    links?: IconLink[];
  }[];
  headingLevel?: HeadingLevel;
  /** grid: small square portraits. large: fewer columns of tall portraits. list: each portrait beside the name, role and bio. */
  layout?: "grid" | "large" | "list";
}) {
  return (
    <section
      id={id}
      className={cx("m-marketing-section", className)}
      data-m-component="TeamGrid"
    >
      <TitledIntro
        title={title}
        description={description}
        headingLevel={headingLevel}
      />
      <ul
        className="m-team-grid"
        data-layout={layout === "grid" ? undefined : layout}
      >
        {members.map((member) => (
          <li key={member.name}>
            <div className="m-team-portrait">
              {member.image || (
                <Avatar
                  decorative
                  name={member.name}
                  size="lg"
                  shape="square"
                />
              )}
            </div>
            <strong>{member.name}</strong>
            <span>{member.role}</span>
            {member.bio && <p className="m-team-bio">{member.bio}</p>}
            {member.links?.length ? (
              <IconLinks label={`${member.name} links`} links={member.links} />
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ContactSection({
  id,
  className,
  title,
  description,
  details = [],
  headingLevel = 2,
  media,
  offices = [],
  children,
}: {
  id?: string;
  className?: string;
  title: string;
  description?: string;
  details?: { label: string; value: ReactNode }[];
  headingLevel?: HeadingLevel;
  /** An image filling one half of a split layout, beside the intro and form; give it alt text or alt="" if decorative. */
  media?: ReactNode;
  /** Office locations in a grid below; each name is a heading one level below the title. */
  offices?: { name: string; address: ReactNode }[];
  /** The consumer's form. Compose with Input, Select, TextArea and Button. Optional when the section lists offices. */
  children?: ReactNode;
}) {
  const OfficeHeading = headingTag(childLevel(headingLevel));
  const intro = (
    <>
      <TitledIntro
        title={title}
        description={description}
        headingLevel={headingLevel}
      />
      {details.length > 0 && (
        <TermList
          items={details.map((d) => ({ term: d.label, details: d.value }))}
        />
      )}
    </>
  );
  const form = children && <div className="m-contact-form">{children}</div>;
  return (
    <section
      id={id}
      className={cx("m-contact", className)}
      data-m-component="ContactSection"
      data-media={media ? "true" : undefined}
    >
      {media ? (
        <>
          <div className="m-contact-media">{media}</div>
          <div className="m-contact-body">
            <div>{intro}</div>
            {form}
          </div>
        </>
      ) : (
        <>
          <div>{intro}</div>
          {form}
        </>
      )}
      {offices.length > 0 && (
        <ul className="m-contact-offices">
          {offices.map((office, index) => (
            <li key={`${office.name}:${index}`}>
              <OfficeHeading>{office.name}</OfficeHeading>
              <address>{office.address}</address>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Newsletter({
  id,
  className,
  title,
  description,
  onSubmit,
  submitLabel = "Subscribe",
  status = "idle",
  message,
  headingLevel = 2,
  layout = "split",
  variant = "plain",
}: {
  id?: string;
  className?: string;
  title: string;
  description?: string;
  onSubmit: (email: string) => void;
  submitLabel?: string;
  /** submitting: busy and inert. success: announces `message`. error: shows `message` on the field. */
  status?: "idle" | "submitting" | "success" | "error";
  message?: string;
  headingLevel?: HeadingLevel;
  /** split: the copy beside the form. center: the copy above a centred form. */
  layout?: "split" | "center";
  /** plain: a section divided by a top rule. panel: a rounded, sunken card. */
  variant?: "plain" | "panel";
}) {
  const [email, setEmail] = useState("");
  const submitting = status === "submitting";
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!submitting) onSubmit(email);
  };
  return (
    <section
      id={id}
      className={cx("m-newsletter", className)}
      data-m-component="Newsletter"
      data-layout={layout === "split" ? undefined : layout}
      data-variant={variant === "plain" ? undefined : variant}
    >
      <div>
        <TitledIntro
          title={title}
          description={description}
          descriptionClassName={null}
          headingLevel={headingLevel}
        />
      </div>
      <form onSubmit={submit} aria-busy={submitting || undefined}>
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={status === "error" ? message : undefined}
          disabled={submitting}
        />
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
        {/* Mounted empty so the success text is announced when it arrives. */}
        <p role="status" className="m-newsletter-status">
          {status === "success" ? message || "Thanks for subscribing." : ""}
        </p>
      </form>
    </section>
  );
}

export function NotFound({
  id,
  className,
  code = "404",
  title,
  description,
  actions,
  illustration,
  headingLevel = 1,
}: {
  id?: string;
  className?: string;
  code?: string;
  title: string;
  description: string;
  actions: LinkAction[];
  /** Decorative artwork above the code. */
  illustration?: ReactNode;
  headingLevel?: HeadingLevel;
}) {
  const Heading = headingTag(headingLevel);
  return (
    <section
      id={id}
      className={cx("m-not-found", className)}
      data-m-component="NotFound"
    >
      {illustration && (
        <div className="m-not-found-art" aria-hidden="true">
          {illustration}
        </div>
      )}
      <p className="m-eyebrow">{code}</p>
      <Heading className="m-section-title">{title}</Heading>
      <p>{description}</p>
      <ActionLinks actions={actions} />
    </section>
  );
}
