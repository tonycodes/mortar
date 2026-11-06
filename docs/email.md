# Transactional email

`@tonycodes-ui/mortar/email` renders emails that match your app: the same tokens, the same brand and copy that follows the [auth flows](auth-flows.md). It is built on [React Email](https://react.email), which produces the table layout and inline styles that email clients need.

Mortar's app components can't be used in email. Gmail strips stylesheets and CSS variables, and Outlook for Windows renders with Word, so an email needs its own markup. The email components take literal colours and fonts resolved from your brand instead.

## Install

React Email is an optional peer dependency. Install it only in the app or service that sends email:

```sh
npm install @react-email/components
```

## Render and send

```tsx
import {
  VerifyEmail,
  emailTheme,
  renderEmail,
} from "@tonycodes-ui/mortar/email";

const theme = emailTheme(tenant.brand); // the same BrandDefinition as ThemeProvider's brandTokens

const { html, text } = await renderEmail(
  <VerifyEmail
    productName="Hive"
    code="482913"
    recipient="ana@example.com"
    expiresIn="10 minutes"
    theme={theme}
    logo={{
      src: "https://hive.example/logo.png",
      alt: "Hive",
      width: 96,
      height: 32,
    }}
  />,
);

await mailer.send({ to, subject: "Confirm your email address", html, text });
```

`renderEmail` returns the HTML and its plain-text alternative. Send both. Sending is up to your app: Resend, SES, Postmark or any SMTP service.

## The theme

`emailTheme(brand?)` resolves a brand to literal values for the **light** appearance, as `tokens.css` does:

- Omitted colours keep Mortar's defaults or derive from `primary`, as in the app. Derived tints such as `selected` (`color-mix(in oklab, …)`) are computed in JS.
- Brand colours must be literal and opaque: hex, `white`, `black`, `rgb()`, `hsl()`, `oklab()` or `oklch()`. Each is converted to `#rrggbb` exactly as Chromium paints it. `var()`, `color-mix()` and `light-dark()` need a browser, so they throw, as does a translucent colour.
- `accentGradient` is not used, because most clients can't paint a gradient.
- Brand fonts drop `var()` entries (from `next/font` and similar loaders) and end in a stack every client has: sans-serif, or serif or monospace when that is the brand's generic family. Web fonts load only in some clients, so the fallback is what most people see.
- Without a brand, you get Mortar's neutral theme.

Emails render light. Most clients either ignore a dark design or recolour it themselves, so the shell marks the email `color-scheme: light`.

## Components

| Component      | Use                                                                                                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EmailShell`   | The whole email: the inbox `preview` line, an optional `logo`, a card up to 600px wide and a `footer`. It sets the theme for the components inside it.                           |
| `EmailHeading` | `level={1}` is the email's title (once per email); `level={2}` is a section.                                                                                                     |
| `EmailText`    | A paragraph, 16px. `tone="muted"` and `size="sm"` are for details such as an expiry time.                                                                                        |
| `EmailButton`  | The main action. It keeps its padding in Outlook for Windows. Follow it with the URL as an `EmailLink`, for clients that block buttons.                                          |
| `EmailLink`    | An inline link. Without children it shows the URL itself.                                                                                                                        |
| `EmailCode`    | A one-time code, large and spaced.                                                                                                                                               |
| `EmailCallout` | A highlighted block with an optional `title`. `tone` (`info`, `success`, `warning`, `danger`) colours its edge; `neutral`, the default, is an aside such as a quoted message.    |
| `EmailDivider` | A rule between sections.                                                                                                                                                         |
| `EmailSummary` | A receipt's `items` (name, preformatted `price`, optional `quantity` and `meta`), cost `lines` and `total`, as OrderSummary takes them. In the plain-text part it reads as rows. |

`EmailShell` takes `dir="rtl"`, and the components that place things at the start or end follow it: the callout's edge and the summary's amounts.

Links and the logo need absolute `http://` or `https://` URLs (`EmailLink` also takes `mailto:`), because the email is read away from your site. Anything else, such as a relative or `javascript:` URL, throws.

Compose your own email from these:

```tsx
<EmailShell
  preview="3 tasks are due this week"
  theme={theme}
  footer="You get this summary every Monday."
>
  <EmailHeading>Your week in Hive</EmailHeading>
  <EmailText>3 tasks are due this week.</EmailText>
  <EmailCallout tone="warning" title="Overdue">
    Launch checklist, due Friday
  </EmailCallout>
  <EmailButton href={tasksUrl}>Open your tasks</EmailButton>
</EmailShell>
```

## Templates

Every template takes `productName`, and optionally `theme`, `logo`, `footer` (replacing its "why you got this" line), `lang` and `dir`. Times and amounts are preformatted strings, so you choose the locale.

| Template        | Use                                               | Props                                                                                                                   |
| --------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `VerifyEmail`   | The [verify-email step](auth-flows.md#steps)      | A `code`, an `href` or both; optional `recipient`, `expiresIn`                                                          |
| `MagicLink`     | A passwordless sign-in link, as SignInPanel sends | `href`; optional `expiresIn`, `requestedFrom` (e.g. "Chrome on macOS, near London")                                     |
| `PasswordReset` | The [reset-password step](auth-flows.md#steps)    | `href`; optional `recipient`, `expiresIn`, `requestedFrom`                                                              |
| `Invite`        | An invitation to a workspace                      | `inviterName`, `href`; optional `workspaceName`, `message` (the inviter's note, quoted), `expiresIn`                    |
| `Receipt`       | An order confirmation or receipt                  | `orderNumber`, `date`, `items`, `total`; optional `lines`, `paymentMethod`, `href` ("View order"), `title`              |
| `Notification`  | A product notification                            | `title`, `children` (a string becomes a paragraph); optional `action` (`{ label, href }`), `preview`, `preferencesHref` |

Send a password reset only to an address that has an account, and show the same "check your email" page either way, so the form never reveals whether an account exists.

## Rules

- Say why the person got the email and what to do if it wasn't for them: the `footer`. The templates have one.
- Never put a one-time code in the `preview` line or the subject. Notifications show those on a locked screen.
- Give every image an absolute URL, `width`, `height` and `alt`.
- Don't rely on hover, scripts or forms. Email clients remove them.
- Keep each email under about 100 KB of HTML. Gmail clips longer messages behind a "View entire message" link.
- Before a release, check new emails in real clients (Gmail, Outlook for Windows, Apple Mail) with a service such as Litmus or Email on Acid.

## Checks

`npx mortar audit` (or the MCP `audit_app` tool) treats a file that imports `@tonycodes-ui/mortar/email` or React Email as an email:

- **`email-app-import`** reports an app component or `styles.css` imported into an email, and names the email component to use (`Button` → `EmailButton`, `Notice` → `EmailCallout`, `OrderSummary` → `EmailSummary`).
- **`email-peer-missing`** reports a project that imports the email entry without `@react-email/components` in its package.json.
- Named imports from `@tonycodes-ui/mortar/email` are checked against what it exports.
- Raw `<table>` and other elements in an email are not reported, because email layout is tables.
- A service that only sends email isn't asked for `styles.css` or a ThemeProvider.
