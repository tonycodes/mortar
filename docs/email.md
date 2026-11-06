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

| Component      | Use                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `EmailShell`   | The whole email: the inbox `preview` line, an optional `logo`, a card up to 600px wide and a `footer`. It sets the theme for the components inside it. |
| `EmailHeading` | `level={1}` is the email's title (once per email); `level={2}` is a section.                                                                           |
| `EmailText`    | A paragraph, 16px. `tone="muted"` and `size="sm"` are for details such as an expiry time.                                                              |
| `EmailButton`  | The main action. It keeps its padding in Outlook for Windows. Follow it with the URL as an `EmailLink`, for clients that block buttons.                |
| `EmailLink`    | An inline link. Without children it shows the URL itself.                                                                                              |
| `EmailCode`    | A one-time code, large and spaced.                                                                                                                     |

Links and the logo need absolute `https://` URLs (`EmailLink` also takes `mailto:`), because the email is read away from your site. Anything else throws.

Compose your own email from these:

```tsx
<EmailShell
  preview="Ana invited you to Hive"
  theme={theme}
  footer="Sent by Hive."
>
  <EmailHeading>Join Ana on Hive</EmailHeading>
  <EmailText>Ana invited you to the Design workspace.</EmailText>
  <EmailButton href={inviteUrl}>Accept invitation</EmailButton>
</EmailShell>
```

## Templates

| Template      | Auth step                           | Props                                                                                               |
| ------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| `VerifyEmail` | [Verify email](auth-flows.md#steps) | `productName`, and a `code`, an `href` or both; optional `recipient`, `expiresIn`, `logo`, `footer` |

More templates (magic link, password reset, invite, receipt and notification) are planned in [#91](https://github.com/tonycodes/mortar/issues/91).

## Rules

- Say why the person got the email and what to do if it wasn't for them: the `footer`. The templates have one.
- Never put a one-time code in the `preview` line or the subject. Notifications show those on a locked screen.
- Give every image an absolute URL, `width`, `height` and `alt`.
- Don't rely on hover, scripts or forms. Email clients remove them.
- Keep each email under about 100 KB of HTML. Gmail clips longer messages behind a "View entire message" link.
- Before a release, check new emails in real clients (Gmail, Outlook for Windows, Apple Mail) with a service such as Litmus or Email on Acid.
