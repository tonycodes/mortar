/* Transactional email: @tonycodes-ui/mortar/email. Built on React Email,
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
  Html,
  Img,
  Link,
  Preview,
  Text,
  render,
} from "@react-email/components";
import { emailTheme, type EmailTheme } from "./email-theme.js";

export { emailTheme } from "./email-theme.js";
export type { EmailTheme } from "./email-theme.js";

const ThemeContext = createContext<EmailTheme | undefined>(undefined);
let neutral: EmailTheme | undefined;
/** The theme from the enclosing EmailShell, or Mortar's neutral theme. */
function useTheme(): EmailTheme {
  return useContext(ThemeContext) ?? (neutral ??= emailTheme());
}

/* Links leave the mail client, so only web and mail addresses are allowed. */
function assertHref(href: string, component: string, mail = false) {
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
    <ThemeContext.Provider value={theme}>
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
    </ThemeContext.Provider>
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
        wordBreak: "break-all",
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
    render(element, { plainText: true }),
  ]);
  return { html, text };
}

/* Templates */

export interface VerifyEmailProps {
  /** Your product, as the person knows it. */
  productName: string;
  /** A one-time code to type in, shown large. */
  code?: string;
  /** A confirmation link, shown as a button. Give `code`, `href` or both. */
  href?: string;
  /** The address being confirmed. */
  recipient?: string;
  /** Preformatted, e.g. "10 minutes". */
  expiresIn?: string;
  theme?: EmailTheme;
  logo?: EmailLogo;
  /** Replaces the default "if this wasn't you" footer. */
  footer?: ReactNode;
  lang?: string;
}
/**
 * Confirms an email address with a code, a link or both: the email for the
 * auth flow's verify-email step.
 */
export function VerifyEmail({
  productName,
  code,
  href,
  recipient,
  expiresIn,
  theme,
  logo,
  footer,
  lang,
}: VerifyEmailProps) {
  if (!code && !href)
    throw new Error("Mortar VerifyEmail needs a `code`, an `href` or both.");
  const address = recipient ?? "your email address";
  return (
    <EmailShell
      preview={`Confirm your email address for ${productName}`}
      theme={theme}
      logo={logo}
      lang={lang}
      footer={
        footer ??
        `You received this email because this address was used to sign up for ${productName}. If that wasn't you, you can ignore it.`
      }
    >
      <EmailHeading>Confirm your email address</EmailHeading>
      {code && (
        <>
          <EmailText>
            Enter this code in {productName} to confirm {address}:
          </EmailText>
          <EmailCode code={code} />
        </>
      )}
      {href && (
        <>
          <EmailText>
            {code
              ? "Or confirm with one click:"
              : `Confirm ${address} to finish setting up your ${productName} account.`}
          </EmailText>
          <EmailButton href={href}>Confirm email address</EmailButton>
          <EmailText tone="muted" size="sm">
            If the button doesn't work, paste this link into your browser:{" "}
            <EmailLink href={href} />
          </EmailText>
        </>
      )}
      {expiresIn && (
        <EmailText tone="muted" size="sm">
          {code && href
            ? `This code and link expire in ${expiresIn}.`
            : `This ${code ? "code" : "link"} expires in ${expiresIn}.`}
        </EmailText>
      )}
    </EmailShell>
  );
}
