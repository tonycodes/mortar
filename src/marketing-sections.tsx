import { IconLinks, KitLink, type IconLink } from "./navigation.js";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { ActionLink, Button, Input, type LinkAction } from "./primitives.js";
import { Avatar } from "./display.js";

type HeadingLevel = 2 | 3 | 4;

function headingTag(level: HeadingLevel) {
  return `h${level}` as "h2" | "h3" | "h4";
}

function SectionIntro({
  eyebrow,
  title,
  description,
  id,
  headingLevel = 2,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  id?: string;
  headingLevel?: HeadingLevel;
}) {
  const Heading = headingTag(headingLevel);
  return (
    <>
      {eyebrow && <p className="m-eyebrow">{eyebrow}</p>}
      <Heading id={id}>{title}</Heading>
      {description && <p className="m-section-description">{description}</p>}
    </>
  );
}

export function BentoGrid({
  eyebrow,
  title,
  description,
  items,
  headingLevel = 2,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  items: {
    title: string;
    description: string;
    visual?: ReactNode;
    span?: 1 | 2;
    inverse?: boolean;
  }[];
  headingLevel?: HeadingLevel;
}) {
  const ItemHeading = headingTag(headingLevel === 2 ? 3 : 4);
  return (
    <section className="m-marketing-section" data-m-component="BentoGrid">
      <SectionIntro
        eyebrow={eyebrow}
        title={title}
        description={description}
        headingLevel={headingLevel}
      />
      <ul className="m-bento">
        {items.map((item, index) => (
          <li key={`${item.title}:${index}`} data-span={item.span || 1}>
            <article
              data-inverse={item.inverse || undefined}
              data-tone={item.inverse ? "inverse" : undefined}
            >
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
  label,
  items,
}: {
  label: string;
  items: { value: string; label: string }[];
}) {
  return (
    <dl
      className="m-stat-group"
      aria-label={label}
      data-m-component="StatGroup"
    >
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function TestimonialGrid({
  title,
  items,
}: {
  title?: string;
  items: { quote: string; name: string; role?: string; avatar?: string }[];
}) {
  return (
    <section
      className="m-marketing-section"
      aria-label={title ? undefined : "Testimonials"}
      data-m-component="TestimonialGrid"
    >
      {title && <h2>{title}</h2>}
      <div className="m-testimonial-grid">
        {items.map((item) => (
          <figure key={item.name}>
            <blockquote>{item.quote}</blockquote>
            <figcaption>
              <Avatar name={item.name} src={item.avatar} size="sm" />
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
  title,
  description,
  plans,
  featuredPlan,
  groups,
}: {
  title: string;
  description?: string;
  plans: string[];
  featuredPlan?: string;
  groups: {
    label: string;
    rows: { feature: string; values: (boolean | string)[] }[];
  }[];
}) {
  const id = useId();
  return (
    <section
      className="m-marketing-section"
      aria-labelledby={id}
      data-m-component="PlanComparison"
    >
      <SectionIntro id={id} title={title} description={description} />
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
                      {value === true ? (
                        <span aria-label="Included">✓</span>
                      ) : value === false ? (
                        <span
                          aria-label="Not included"
                          className="m-comparison-no"
                        >
                          —
                        </span>
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
  title,
  description,
  posts,
  action,
}: {
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
  }[];
  action?: LinkAction;
}) {
  return (
    <section className="m-marketing-section" data-m-component="PostList">
      <div className="m-section-heading-row">
        <div>
          <SectionIntro title={title} description={description} />
        </div>
        {action && <ActionLink {...action} variant="secondary" />}
      </div>
      <ul className="m-post-list">
        {posts.map((post, index) => (
          <li key={`${post.title}:${post.href}:${index}`}>
            <article>
              {post.image && <div className="m-post-image">{post.image}</div>}
              <p className="m-post-meta">
                {post.category && <span>{post.category}</span>}
                <time dateTime={post.date}>{post.dateLabel}</time>
              </p>
              <h3>
                <KitLink href={post.href}>{post.title}</KitLink>
              </h3>
              <p>{post.excerpt}</p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TeamGrid({
  title,
  description,
  members,
}: {
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
}) {
  return (
    <section className="m-marketing-section" data-m-component="TeamGrid">
      <SectionIntro title={title} description={description} />
      <ul className="m-team-grid">
        {members.map((member) => (
          <li key={member.name}>
            <div className="m-team-portrait">
              {member.image || (
                <Avatar name={member.name} size="lg" shape="square" />
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
  title,
  description,
  details = [],
  children,
}: {
  title: string;
  description?: string;
  details?: { label: string; value: ReactNode }[];
  /** The consumer's form. Compose with Input, Select, TextArea and Button. */
  children: ReactNode;
}) {
  return (
    <section className="m-contact" data-m-component="ContactSection">
      <div>
        <SectionIntro title={title} description={description} />
        {details.length > 0 && (
          <dl>
            {details.map((d) => (
              <div key={d.label}>
                <dt>{d.label}</dt>
                <dd>{d.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <div className="m-contact-form">{children}</div>
    </section>
  );
}

export function Newsletter({
  title,
  description,
  onSubmit,
  submitLabel = "Subscribe",
  status = "idle",
  message,
}: {
  title: string;
  description?: string;
  onSubmit: (email: string) => void;
  submitLabel?: string;
  status?: "idle" | "submitting" | "success" | "error";
  message?: string;
}) {
  const [email, setEmail] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(email);
  };
  return (
    <section className="m-newsletter" data-m-component="Newsletter">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      <form onSubmit={submit} noValidate>
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={status === "error" ? message : undefined}
          hint={status === "success" ? message : undefined}
        />
        <Button type="submit" loading={status === "submitting"}>
          {submitLabel}
        </Button>
      </form>
    </section>
  );
}

export function NotFound({
  code = "404",
  title,
  description,
  actions,
  illustration,
}: {
  code?: string;
  title: string;
  description: string;
  actions: LinkAction[];
  /** Decorative artwork above the code. */
  illustration?: ReactNode;
}) {
  return (
    <section className="m-not-found" data-m-component="NotFound">
      {illustration && (
        <div className="m-not-found-art" aria-hidden="true">
          {illustration}
        </div>
      )}
      <p className="m-eyebrow">{code}</p>
      <h1>{title}</h1>
      <p>{description}</p>
      <div className="m-actions">
        {actions.map((action, i) => (
          <ActionLink
            key={`${action.label}:${action.href}:${i}`}
            {...action}
            variant={i === 0 ? "primary" : "secondary"}
          />
        ))}
      </div>
    </section>
  );
}
