/* Email templates for @tonycodes-ui/mortar/email: the transactional emails
   most products send, composed only from the email components. Copy follows
   docs/auth-flows.md: say why the email came and what to do if it wasn't
   expected, and never reveal more than the link or code needs. */

import type { ReactNode } from "react";
import type { EmailTheme } from "./email-theme.js";
import {
  EmailButton,
  EmailCallout,
  EmailCode,
  EmailHeading,
  EmailLink,
  EmailShell,
  EmailSummary,
  EmailText,
  type EmailLogo,
  type EmailSummaryItem,
} from "./email-components.js";

/** Props every template takes. */
export interface EmailTemplateProps {
  /** Your product, as the person knows it. */
  productName: string;
  /** From `emailTheme(brand)`; Mortar's neutral theme by default. */
  theme?: EmailTheme;
  logo?: EmailLogo;
  /** Replaces the template's footer, which says why the email was sent. */
  footer?: ReactNode;
  lang?: string;
  dir?: "ltr" | "rtl";
}

/* The main action, then its URL for clients that block buttons. */
function Action({ href, label }: { href: string; label: string }) {
  return (
    <>
      <EmailButton href={href}>{label}</EmailButton>
      <EmailText tone="muted" size="sm">
        If the button doesn't work, paste this link into your browser:{" "}
        <EmailLink href={href} />
      </EmailText>
    </>
  );
}

function Detail({ children }: { children: ReactNode }) {
  return (
    <EmailText tone="muted" size="sm">
      {children}
    </EmailText>
  );
}

export interface VerifyEmailProps extends EmailTemplateProps {
  /** A one-time code to type in, shown large. */
  code?: string;
  /** A confirmation link, shown as a button. Give `code`, `href` or both. */
  href?: string;
  /** The address being confirmed. */
  recipient?: string;
  /** Preformatted, e.g. "10 minutes". */
  expiresIn?: string;
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
  footer,
  ...shell
}: VerifyEmailProps) {
  if (!code && !href)
    throw new Error("Mortar VerifyEmail needs a `code`, an `href` or both.");
  const address = recipient ?? "your email address";
  return (
    <EmailShell
      {...shell}
      preview={`Confirm your email address for ${productName}`}
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
          <Action href={href} label="Confirm email address" />
        </>
      )}
      {expiresIn && (
        <Detail>
          {code && href
            ? `This code and link expire in ${expiresIn}.`
            : `This ${code ? "code" : "link"} expires in ${expiresIn}.`}
        </Detail>
      )}
    </EmailShell>
  );
}

export interface MagicLinkProps extends EmailTemplateProps {
  /** The sign-in link. */
  href: string;
  /** Preformatted, e.g. "15 minutes". */
  expiresIn?: string;
  /** Where the request came from, e.g. "Chrome on macOS, near London". */
  requestedFrom?: string;
}
/** A passwordless sign-in link: the email behind SignInPanel. */
export function MagicLink({
  productName,
  href,
  expiresIn,
  requestedFrom,
  footer,
  ...shell
}: MagicLinkProps) {
  return (
    <EmailShell
      {...shell}
      preview={`Your sign-in link for ${productName}`}
      footer={
        footer ??
        `You received this email because someone asked to sign in to ${productName} with this address. If that wasn't you, you can ignore it.`
      }
    >
      <EmailHeading>Sign in to {productName}</EmailHeading>
      <EmailText>Use the link below to sign in to {productName}.</EmailText>
      <Action href={href} label={`Sign in to ${productName}`} />
      {expiresIn && <Detail>This link expires in {expiresIn}.</Detail>}
      {requestedFrom && <Detail>Requested from {requestedFrom}.</Detail>}
    </EmailShell>
  );
}

export interface PasswordResetProps extends EmailTemplateProps {
  /** The reset link. */
  href: string;
  /** The account's address, shown so the person knows which account. */
  recipient?: string;
  /** Preformatted, e.g. "1 hour". */
  expiresIn?: string;
  /** Where the request came from, e.g. "Firefox on Windows". */
  requestedFrom?: string;
}
/**
 * The link for the auth flow's reset-password step. Send it only to an
 * address that has an account, and show the same "check your email" page
 * either way, so the form never reveals whether an account exists.
 */
export function PasswordReset({
  productName,
  href,
  recipient,
  expiresIn,
  requestedFrom,
  footer,
  ...shell
}: PasswordResetProps) {
  return (
    <EmailShell
      {...shell}
      preview={`Reset your ${productName} password`}
      footer={
        footer ??
        "If you didn't ask to reset your password, you can ignore this email. Your password won't change."
      }
    >
      <EmailHeading>Reset your password</EmailHeading>
      <EmailText>
        We received a request to reset the password for{" "}
        {recipient
          ? `the ${productName} account ${recipient}`
          : `your ${productName} account`}
        . To choose a new password, use the link below.
      </EmailText>
      <Action href={href} label="Reset password" />
      {expiresIn && <Detail>This link expires in {expiresIn}.</Detail>}
      {requestedFrom && <Detail>Requested from {requestedFrom}.</Detail>}
    </EmailShell>
  );
}

export interface InviteProps extends EmailTemplateProps {
  /** Who sent the invitation. */
  inviterName: string;
  /** The team or workspace; the product when omitted. */
  workspaceName?: string;
  /** The link to accept. */
  href: string;
  /** The inviter's own note, shown quoted. */
  message?: string;
  /** Preformatted, e.g. "7 days". */
  expiresIn?: string;
}
/** An invitation to join a workspace. */
export function Invite({
  productName,
  inviterName,
  workspaceName,
  href,
  message,
  expiresIn,
  footer,
  ...shell
}: InviteProps) {
  const target = workspaceName ?? productName;
  return (
    <EmailShell
      {...shell}
      preview={`${inviterName} invited you to ${target}`}
      footer={
        footer ??
        `You received this email because ${inviterName} invited this address to ${productName}. If you weren't expecting it, you can ignore it.`
      }
    >
      <EmailHeading>
        {inviterName} invited you to {target}
      </EmailHeading>
      <EmailText>
        {workspaceName
          ? `Join the ${workspaceName} workspace on ${productName} to work with ${inviterName}.`
          : `Join ${inviterName} on ${productName}.`}
      </EmailText>
      {message && (
        <EmailCallout title={`Message from ${inviterName}`}>
          {message}
        </EmailCallout>
      )}
      <Action href={href} label="Accept invitation" />
      {expiresIn && <Detail>This invitation expires in {expiresIn}.</Detail>}
    </EmailShell>
  );
}

export interface ReceiptProps extends EmailTemplateProps {
  orderNumber: string;
  /** Preformatted, e.g. "6 November 2026". */
  date: string;
  items: EmailSummaryItem[];
  /** Subtotal, shipping, tax, discounts. */
  lines?: { label: string; value: string }[];
  total: { label: string; value: string };
  /** e.g. "Visa ending 4242". */
  paymentMethod?: string;
  /** The order in your app. */
  href?: string;
  /** Defaults to "Thanks for your order". */
  title?: string;
}
/** An order confirmation or receipt, with items, costs and total. */
export function Receipt({
  productName,
  orderNumber,
  date,
  items,
  lines,
  total,
  paymentMethod,
  href,
  title = "Thanks for your order",
  footer,
  ...shell
}: ReceiptProps) {
  return (
    <EmailShell
      {...shell}
      preview={`Your ${productName} receipt for order ${orderNumber}`}
      footer={
        footer ??
        `You received this receipt for order ${orderNumber} from ${productName}. Keep it for your records.`
      }
    >
      <EmailHeading>{title}</EmailHeading>
      <Detail>
        Order {orderNumber}, {date}
      </Detail>
      <EmailSummary items={items} lines={lines} total={total} />
      {paymentMethod && <Detail>Paid with {paymentMethod}.</Detail>}
      {href && <EmailButton href={href}>View order</EmailButton>}
    </EmailShell>
  );
}

export interface NotificationProps extends EmailTemplateProps {
  title: string;
  /** The inbox preview line; the title when omitted. */
  preview?: string;
  children: ReactNode;
  /** One main action. */
  action?: { label: string; href: string };
  /** Where the person can change which emails they get. */
  preferencesHref?: string;
}
/** A product notification: a title, a message and at most one action. */
export function Notification({
  productName,
  title,
  preview,
  children,
  action,
  preferencesHref,
  footer,
  ...shell
}: NotificationProps) {
  return (
    <EmailShell
      {...shell}
      preview={preview ?? title}
      footer={
        footer ?? (
          <>
            You received this email because of your notification settings in{" "}
            {productName}.
            {preferencesHref && (
              <>
                {" "}
                <EmailLink href={preferencesHref}>
                  Manage email preferences
                </EmailLink>
              </>
            )}
          </>
        )
      }
    >
      <EmailHeading>{title}</EmailHeading>
      {typeof children === "string" ? (
        <EmailText>{children}</EmailText>
      ) : (
        children
      )}
      {action && <EmailButton href={action.href}>{action.label}</EmailButton>}
    </EmailShell>
  );
}
