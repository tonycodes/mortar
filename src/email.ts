/* @tonycodes-ui/mortar/email: transactional email built on React Email
   (the optional peer dependency @react-email/components). See docs/email.md. */

export { emailTheme } from "./email-theme.js";
export type { EmailTheme } from "./email-theme.js";
export {
  EmailShell,
  EmailHeading,
  EmailText,
  EmailButton,
  EmailLink,
  EmailCode,
  EmailCallout,
  EmailDivider,
  EmailSummary,
  renderEmail,
} from "./email-components.js";
export type {
  EmailLogo,
  EmailShellProps,
  EmailHeadingProps,
  EmailTextProps,
  EmailButtonProps,
  EmailLinkProps,
  EmailCodeProps,
  EmailCalloutProps,
  EmailSummaryItem,
  EmailSummaryProps,
  RenderedEmail,
} from "./email-components.js";
export {
  VerifyEmail,
  MagicLink,
  PasswordReset,
  Invite,
  Receipt,
  Notification,
} from "./email-templates.js";
export type {
  EmailTemplateProps,
  VerifyEmailProps,
  MagicLinkProps,
  PasswordResetProps,
  InviteProps,
  ReceiptProps,
  NotificationProps,
} from "./email-templates.js";
