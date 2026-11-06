/* Email components for @tonycodes-ui/mortar/email. Built on React Email,
   which renders the table layout and inline styles email clients need; these
   components give it Mortar's tokens, brand and copy. Nothing here uses
   Mortar's stylesheet or app components, which email clients cannot run.
   Requires the optional peer dependency @react-email/components. */

import {
  createContext,
  useContext,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Text,
  render,
} from "@react-email/components";
import type { Tone } from "./primitives.js";
import { emailTheme, type EmailTheme } from "./email-theme.js";

const ShellContext = createContext<
  { theme: EmailTheme; dir: "ltr" | "rtl" } | undefined
>(undefined);
let neutral: EmailTheme | undefined;
/** The theme from the enclosing EmailShell, or Mortar's neutral theme. */
function useTheme(): EmailTheme {
  return useContext(ShellContext)?.theme ?? (neutral ??= emailTheme());
}
/* Email clients don't support logical properties, so the inline start and
   end are worked out from the shell's direction. */
function useSides() {
  const rtl = useContext(ShellContext)?.dir === "rtl";
  return {
    start: rtl ? "right" : "left",
    end: rtl ? "left" : "right",
  } as const;
}

/* Links leave the mail client, so only web and mail addresses are allowed. */
export function assertHref(href: string, component: string, mail = false) {
  if (!(mail ? /^(?:https?:|mailto:)/i : /^https?:\/\//i).test(href.trim()))
    throw new Error(
      `Mortar ${component} needs an absolute ${mail ? "http(s) or mailto" : "http(s)"} URL: "${href}"`,
    );
}

/* A one-cell layout table. Outlook for Windows ignores padding, margins and
   backgrounds on tables, so spacing and fills go on the cell. */
function Cell({
  style,
  children,
}: {
  style: CSSProperties;
  children: ReactNode;
}) {
  return (
    <table
      role="presentation"
      width="100%"
      border={0}
      cellPadding={0}
      cellSpacing={0}
    >
      <tbody>
        <tr>
          <td style={style}>{children}</td>
        </tr>
      </tbody>
    </table>
  );
}

export interface EmailLogo {
  /** An absolute URL: the email is read away from your site. */
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface EmailShellProps {
  /** The inbox preview line shown after the subject. */
  preview: string;
  /** From `emailTheme(brand)`; Mortar's neutral theme by default. */
  theme?: EmailTheme;
  logo?: EmailLogo;
  /** Why the person received the email, and what to do if it wasn't for them. */
  footer?: ReactNode;
  lang?: string;
  dir?: "ltr" | "rtl";
  children: ReactNode;
}
/**
 * The whole email: a card up to 600px wide on the sunken backdrop, with an
 * optional logo above it and footer below. It sets the theme for the email
 * components inside, and marks the email light-only so mail apps don't
 * recolour the brand.
 */
export function EmailShell({
  preview,
  theme: given,
  logo,
  footer,
  lang = "en",
  dir = "ltr",
  children,
}: EmailShellProps) {
  const theme = given ?? emailTheme();
  if (logo) assertHref(logo.src, "EmailShell logo");
  return (
    <ShellContext.Provider value={{ theme, dir }}>
      <Html lang={lang} dir={dir}>
        <Head>
          <meta name="color-scheme" content="light" />
          <meta name="supported-color-schemes" content="light" />
        </Head>
        <Preview>{preview}</Preview>
        <Body
          style={{
            margin: 0,
            padding: "32px 12px",
            backgroundColor: theme.sunken,
            color: theme.ink,
            fontFamily: theme.font,
          }}
        >
          <Container style={{ width: "100%", maxWidth: "600px" }}>
            {logo && (
              <Cell style={{ padding: "0 0 24px" }}>
                <Img
                  src={logo.src}
                  alt={logo.alt}
                  width={logo.width}
                  height={logo.height}
                />
              </Cell>
            )}
            <Cell
              style={{
                backgroundColor: theme.surface,
                border: `1px solid ${theme.line}`,
                borderRadius: "12px",
                padding: "32px",
              }}
            >
              {children}
            </Cell>
            {footer && (
              <Cell style={{ padding: "24px 32px 0" }}>
                <Text
                  style={{
                    margin: 0,
                    fontFamily: theme.font,
                    fontSize: "12px",
                    lineHeight: "18px",
                    color: theme.muted,
                  }}
                >
                  {footer}
                </Text>
              </Cell>
            )}
          </Container>
        </Body>
      </Html>
    </ShellContext.Provider>
  );
}

export interface EmailHeadingProps {
  /** 1 for the email's title (once per email), 2 for a section. */
  level?: 1 | 2;
  children: ReactNode;
}
export function EmailHeading({ level = 1, children }: EmailHeadingProps) {
  const theme = useTheme();
  return (
    <Heading
      as={level === 1 ? "h1" : "h2"}
      style={{
        margin: "0 0 16px",
        fontFamily: theme.fontHeading,
        fontSize: level === 1 ? "24px" : "18px",
        lineHeight: level === 1 ? "32px" : "26px",
        fontWeight: 600,
        letterSpacing: "-0.02em",
        color: theme.ink,
      }}
    >
      {children}
    </Heading>
  );
}

export interface EmailTextProps {
  /** `muted` for secondary details such as an expiry time. */
  tone?: "default" | "muted";
  size?: "md" | "sm";
  children: ReactNode;
}
/** A paragraph. 16px by default: email is read on phones, at arm's length. */
export function EmailText({
  tone = "default",
  size = "md",
  children,
}: EmailTextProps) {
  const theme = useTheme();
  return (
    <Text
      style={{
        margin: "0 0 16px",
        fontFamily: theme.font,
        fontSize: size === "md" ? "16px" : "14px",
        lineHeight: size === "md" ? "24px" : "20px",
        color: tone === "muted" ? theme.muted : theme.ink,
      }}
    >
      {children}
    </Text>
  );
}

export interface EmailButtonProps {
  /** An absolute http(s) URL. */
  href: string;
  children: ReactNode;
}
/**
 * The email's main action, on its own line. Padding is applied in a way
 * Outlook for Windows keeps, so the whole button is clickable there too.
 * Follow it with the URL as an EmailLink for clients that block buttons.
 */
export function EmailButton({ href, children }: EmailButtonProps) {
  const theme = useTheme();
  assertHref(href, "EmailButton");
  return (
    <Cell style={{ padding: "8px 0 24px" }}>
      <Button
        href={href}
        style={{
          display: "inline-block",
          backgroundColor: theme.primary,
          color: theme.onPrimary,
          fontFamily: theme.font,
          fontSize: "16px",
          lineHeight: "24px",
          fontWeight: 600,
          textDecoration: "none",
          padding: "12px 24px",
          borderRadius: "8px",
        }}
      >
        {children}
      </Button>
    </Cell>
  );
}

export interface EmailLinkProps {
  /** An absolute http(s) or mailto URL. */
  href: string;
  /** The URL itself when omitted, for "paste this link" fallbacks. */
  children?: ReactNode;
}
export function EmailLink({ href, children }: EmailLinkProps) {
  const theme = useTheme();
  assertHref(href, "EmailLink", true);
  return (
    <Link
      href={href}
      style={{
        color: theme.link,
        textDecoration: "underline",
        // A bare URL may break anywhere so it can't widen the email.
        wordBreak: children === undefined ? "break-all" : undefined,
      }}
    >
      {children ?? href}
    </Link>
  );
}

export interface EmailCodeProps {
  /** A one-time code, shown large and spaced for reading and copying. */
  code: string;
}
export function EmailCode({ code }: EmailCodeProps) {
  const theme = useTheme();
  return (
    <Cell style={{ padding: "8px 0 24px" }}>
      <Cell
        style={{
          backgroundColor: theme.sunken,
          borderRadius: "8px",
          padding: "16px",
          textAlign: "center",
        }}
      >
        <Text
          style={{
            margin: 0,
            fontFamily: theme.mono,
            fontSize: "28px",
            lineHeight: "36px",
            fontWeight: 600,
            letterSpacing: "0.2em",
            color: theme.ink,
          }}
        >
          {code}
        </Text>
      </Cell>
    </Cell>
  );
}

export interface EmailCalloutProps {
  /** Colours the edge: a status, or `neutral` for an aside such as a quoted message. */
  tone?: Tone;
  title?: string;
  children: ReactNode;
}
/** A highlighted block: a warning, a status or a quoted personal message. */
export function EmailCallout({
  tone = "neutral",
  title,
  children,
}: EmailCalloutProps) {
  const theme = useTheme();
  const { start } = useSides();
  const edge = tone === "neutral" ? theme.line : theme[tone];
  return (
    <Cell style={{ padding: "8px 0 24px" }}>
      <Cell
        style={{
          backgroundColor: theme.sunken,
          [start === "left" ? "borderLeft" : "borderRight"]:
            `4px solid ${edge}`,
          padding: "16px 20px",
          fontFamily: theme.font,
          fontSize: "15px",
          lineHeight: "22px",
          color: theme.ink,
        }}
      >
        {title && (
          <Text
            style={{
              margin: "0 0 4px",
              fontFamily: theme.font,
              fontSize: "15px",
              lineHeight: "22px",
              fontWeight: 600,
              color: theme.ink,
            }}
          >
            {title}
          </Text>
        )}
        {children}
      </Cell>
    </Cell>
  );
}

/** A rule between sections of an email. */
export function EmailDivider() {
  const theme = useTheme();
  return (
    <Hr
      style={{
        margin: "8px 0 24px",
        border: "none",
        borderTop: `1px solid ${theme.line}`,
      }}
    />
  );
}

export interface EmailSummaryItem {
  name: string;
  /** Preformatted, e.g. "£42.00". */
  price: string;
  quantity?: number;
  /** Chosen options, e.g. "Natural · Small". */
  meta?: string;
}
export interface EmailSummaryProps {
  /** Line items, each with its preformatted price. */
  items?: EmailSummaryItem[];
  /** Cost lines under the items, as OrderSummary takes them: subtotal, shipping, tax. */
  lines?: { label: string; value: string }[];
  total: { label: string; value: string };
}
/**
 * A receipt's items, cost lines and total, as a two-column table: labels at
 * the start, amounts at the end. Amounts are preformatted strings, as in
 * Mortar's commerce components.
 */
export function EmailSummary({
  items = [],
  lines = [],
  total,
}: EmailSummaryProps) {
  const theme = useTheme();
  const { start, end } = useSides();
  const cell = (side: "start" | "end", extra: CSSProperties = {}) => ({
    padding: "8px 0",
    textAlign: side === "start" ? start : end,
    verticalAlign: "top",
    fontFamily: theme.font,
    fontSize: "15px",
    lineHeight: "22px",
    color: theme.ink,
    ...extra,
  });
  const rule = `1px solid ${theme.line}`;
  return (
    <Cell style={{ padding: "8px 0 24px" }}>
      <table
        data-summary=""
        role="presentation"
        width="100%"
        border={0}
        cellPadding={0}
        cellSpacing={0}
      >
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td style={cell("start", { borderBottom: rule })}>
                {item.name}
                {item.quantity !== undefined && item.quantity !== 1 && (
                  <span style={{ color: theme.muted }}> × {item.quantity}</span>
                )}
                {item.meta && (
                  <>
                    <br />
                    <span style={{ fontSize: "13px", color: theme.muted }}>
                      {item.meta}
                    </span>
                  </>
                )}
              </td>
              <td
                style={cell("end", {
                  borderBottom: rule,
                  whiteSpace: "nowrap",
                  [start === "left" ? "paddingLeft" : "paddingRight"]: "16px",
                })}
              >
                {item.price}
              </td>
            </tr>
          ))}
          {lines.map((line, i) => (
            <tr key={`line-${i}`}>
              <td style={cell("start", { color: theme.secondary })}>
                {line.label}
              </td>
              <td
                style={cell("end", {
                  color: theme.secondary,
                  whiteSpace: "nowrap",
                })}
              >
                {line.value}
              </td>
            </tr>
          ))}
          <tr>
            <td style={cell("start", { borderTop: rule, fontWeight: 600 })}>
              {total.label}
            </td>
            <td
              style={cell("end", {
                borderTop: rule,
                fontWeight: 600,
                whiteSpace: "nowrap",
              })}
            >
              {total.value}
            </td>
          </tr>
        </tbody>
      </table>
    </Cell>
  );
}

export interface RenderedEmail {
  html: string;
  /** The plain-text alternative: send it with the HTML. */
  text: string;
}
/**
 * An email element as HTML and plain text, ready for a sending service
 * (Resend, SES, Postmark…). Keep the HTML under about 100 KB: Gmail clips
 * longer messages.
 */
export async function renderEmail(element: ReactNode): Promise<RenderedEmail> {
  const [html, text] = await Promise.all([
    render(element),
    render(element, {
      plainText: true,
      htmlToTextOptions: {
        // A summary reads as rows of label and amount, not run together.
        selectors: [
          {
            selector: "table[data-summary]",
            format: "dataTable",
            options: { maxColumnWidth: 48 },
          },
        ],
      },
    }),
  ]);
  return { html, text };
}
