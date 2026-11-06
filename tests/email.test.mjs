import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createElement as h } from "react";
import {
  EmailButton,
  EmailCallout,
  EmailCode,
  EmailDivider,
  EmailSummary,
  Invite,
  MagicLink,
  Notification,
  PasswordReset,
  Receipt,
  EmailHeading,
  EmailLink,
  EmailShell,
  EmailText,
  VerifyEmail,
  emailTheme,
  renderEmail,
} from "../dist/email.js";
import { customProperties, readSource, selectorBody } from "./support/css.mjs";
import { contrast, mixOklab } from "./support/color.mjs";

const LOGO = {
  src: "https://hive.example/logo.png",
  alt: "Hive",
  width: 96,
  height: 32,
};

test("the email theme's defaults are the light tokens in tokens.css", async () => {
  const css = await readSource("src/tokens.css");
  const light = customProperties(
    selectorBody(css, '[data-mortar-appearance="light"]'),
  );
  // A token's literal value, or the default inside its brand var().
  const value = (name) =>
    /^var\(--m-brand-l-[a-z-]+,\s*(#[0-9a-f]+)\)$/i.exec(light[name])?.[1] ??
    light[name];
  const neutral = customProperties(
    selectorBody(css, '[data-mortar-brand="neutral"]'),
  );
  const theme = emailTheme();
  for (const [key, token] of Object.entries({
    paper: "m-paper",
    surface: "m-surface",
    sunken: "m-sunken",
    line: "m-line",
    ink: "m-ink",
    secondary: "m-secondary",
    muted: "m-muted",
    primary: "m-primary",
    onPrimary: "m-on-primary",
    success: "m-success",
    warning: "m-warning",
    danger: "m-danger",
    info: "m-info",
  }))
    assert.equal(theme[key], value(token), `${key} matches --${token}`);
  assert.equal(theme.selected, neutral["m-brand-l-selected"]);
  assert.equal(theme.accent, theme.primary);
  assert.equal(theme.link, theme.primary);
});

test("a brand resolves to literal colours, deriving what it omits", () => {
  const theme = emailTheme({
    light: { primary: "#1d4ed8", paper: "#fafafa" },
    dark: { primary: "var(--ignored)" },
  });
  assert.equal(theme.primary, "#1d4ed8");
  assert.equal(theme.onPrimary, "#ffffff");
  assert.equal(theme.accent, "#1d4ed8");
  assert.equal(theme.onAccent, "#ffffff");
  assert.equal(theme.link, "#1d4ed8");
  // color-mix(in oklab, var(--m-primary) 8%, var(--m-paper)), as in tokens.css
  assert.equal(theme.selected, mixOklab("#1d4ed8", "#fafafa", 8));
  assert.equal(emailTheme({ light: { selected: "#eef" } }).selected, "#eeeeff");
  assert.ok(contrast(theme.onPrimary, theme.primary) >= 4.5);
});

test("modern colour syntax converts to hex as Chromium paints it", () => {
  // Reference values read back from a Chromium canvas.
  for (const [input, expected] of [
    ["oklch(0.5 0.2 260)", "#0559d2"],
    ["oklch(62% 0.19 145)", "#11a22f"],
    ["oklab(0.6 -0.1 0.05)", "#439360"],
    ["hsl(220 70% 45%)", "#2258c3"],
    ["rgb(10 120 200)", "#0a78c8"],
    ["rgba(10, 120, 200, 1)", "#0a78c8"],
    ["oklch(0.7 0.3 30)", "#ff0000"], // out of sRGB gamut: clipped
    ["#ABC", "#aabbcc"],
    ["white", "#ffffff"],
  ])
    assert.equal(emailTheme({ light: { primary: input } }).primary, expected);
});

test("colours that need a browser, or are translucent, are rejected", () => {
  for (const value of [
    "var(--brand)",
    "color-mix(in oklab, red 50%, white)",
    "light-dark(#fff, #000)",
    "rgb(0 0 0 / 0.5)",
    "#0000",
    "transparent",
    "rebeccapurple",
    "linear-gradient(red, blue)",
  ])
    assert.throws(
      () => emailTheme({ light: { primary: value } }),
      /Mortar email colours must be literal and opaque, for light\.primary/,
      value,
    );
});

test("brand fonts drop var() entries and end in fonts every client has", () => {
  const theme = emailTheme({
    fonts: {
      body: "var(--font-inter), Inter, sans-serif",
      heading: "Lora, serif",
    },
  });
  assert.match(theme.font, /^Inter, -apple-system, .*Arial, sans-serif$/);
  assert.doesNotMatch(theme.font, /var\(|Inter, sans-serif/);
  assert.match(theme.fontHeading, /^Lora, Georgia, .*serif$/);
  assert.equal(
    emailTheme({ fonts: { body: "Inter" } }).fontHeading,
    emailTheme({ fonts: { body: "Inter" } }).font,
  );
  assert.throws(
    () => emailTheme({ fonts: { body: "x; color: red" } }),
    /Invalid Mortar brand font/,
  );
});

test("a rendered email is self-contained HTML that clients can read", async () => {
  const theme = emailTheme({ light: { primary: "oklch(0.5 0.2 260)" } });
  const { html, text } = await renderEmail(
    h(VerifyEmail, {
      productName: "Hive",
      code: "482913",
      href: "https://hive.example/verify?t=abc",
      recipient: "ana@example.com",
      expiresIn: "10 minutes",
      theme,
      logo: LOGO,
    }),
  );
  // Inline, literal styles only: no stylesheet, classes or CSS functions
  // that Gmail or Outlook drop.
  assert.doesNotMatch(
    html,
    /<style|rel="stylesheet"|class="|var\(|color-mix\(|oklch\(/,
  );
  // Outlook for Windows ignores spacing and fills on tables: only cells.
  assert.doesNotMatch(
    html,
    /<table[^>]*style="[^"]*(?:padding|margin|background)/,
  );
  assert.match(html, /<html dir="ltr" lang="en">/);
  assert.match(html, /<meta name="color-scheme" content="light"/);
  assert.match(html, /role="presentation"/); // table layout
  assert.match(html, /max-width:600px/);
  assert.match(html, /background-color:#0559d2/);
  assert.match(html, /mso-padding-alt/); // the button keeps its size in Outlook
  assert.match(
    html,
    /<img alt="Hive" height="32" src="https:\/\/hive\.example\/logo\.png"/,
  );
  assert.match(html, /Confirm your email address for Hive/); // preview line
  assert.ok(html.length < 100_000, "under Gmail's clipping size");
  // The plain-text part carries everything needed to act on the email.
  for (const part of [
    "482913",
    "https://hive.example/verify?t=abc",
    "ana@example.com",
    "This code and link expire in 10 minutes.",
    "If that wasn't you, you can ignore it.",
  ])
    assert.ok(text.includes(part), part);
  assert.doesNotMatch(text, /</);
});

test("VerifyEmail adapts its copy to a code, a link or both", async () => {
  const codeOnly = await renderEmail(
    h(VerifyEmail, {
      productName: "Hive",
      code: "123456",
      expiresIn: "10 minutes",
    }),
  );
  assert.match(
    codeOnly.text,
    /Enter this code in Hive to confirm your email address/,
  );
  assert.match(codeOnly.text, /This code expires in 10 minutes\./);
  assert.doesNotMatch(codeOnly.html, /<a /);

  const linkOnly = await renderEmail(
    h(VerifyEmail, {
      productName: "Hive",
      href: "https://hive.example/v",
      expiresIn: "24 hours",
      footer: "Sent by Hive.",
    }),
  );
  assert.match(
    linkOnly.text,
    /Confirm your email address to finish setting up your Hive account\./,
  );
  assert.match(linkOnly.text, /This link expires in 24 hours\./);
  assert.match(linkOnly.text, /Sent by Hive\./);
  assert.doesNotMatch(linkOnly.text, /Enter this code/);

  await assert.rejects(
    renderEmail(h(VerifyEmail, { productName: "Hive" })),
    /needs a `code`, an `href` or both/,
  );
});

test("email links must be absolute web addresses", async () => {
  for (const element of [
    h(EmailButton, { href: "javascript:alert(1)" }, "Go"),
    h(EmailButton, { href: "/verify" }, "Go"),
    h(EmailLink, { href: "//evil.example" }),
    h(EmailShell, { preview: "x", logo: { ...LOGO, src: "/logo.png" } }, "x"),
  ])
    await assert.rejects(renderEmail(element), /needs an absolute/);
  const { html } = await renderEmail(
    h(
      EmailText,
      null,
      h(EmailLink, { href: "mailto:help@hive.example" }, "Email us"),
    ),
  );
  assert.match(html, /href="mailto:help@hive\.example"/);
});

test("components outside a shell use the neutral theme; inside, the shell's", async () => {
  const bare = await renderEmail(h(EmailCode, { code: "1234" }));
  assert.match(bare.html, /background-color:#f5f5f7/);
  const theme = emailTheme({
    light: { primary: "#047857", sunken: "#eef6f2" },
  });
  const { html } = await renderEmail(
    h(
      EmailShell,
      { preview: "Hello", theme },
      h(EmailHeading, { level: 2 }, "Section"),
      h(EmailCode, { code: "1234" }),
      h(EmailButton, { href: "https://hive.example" }, "Open"),
    ),
  );
  assert.match(html, /<h2[^>]*>Section<\/h2>/);
  assert.match(html, /background-color:#eef6f2/);
  assert.match(html, /background-color:#047857/);
});

test("the app entry point never loads React Email", async () => {
  const index = await readFile(
    new URL("../dist/index.js", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(index, /email\.js|@react-email/);
  const pkg = JSON.parse(await readSource("package.json"));
  assert.equal(pkg.exports["./email"].import, "./dist/email.js");
  assert.equal(
    pkg.peerDependenciesMeta["@react-email/components"].optional,
    true,
  );
});

const RECEIPT = {
  productName: "Hive",
  orderNumber: "HV-1042",
  date: "6 November 2026",
  items: [
    { name: "Team plan, annual", price: "£480.00", meta: "5 seats" },
    { name: "Extra storage", quantity: 2, price: "£40.00" },
    { name: "Support", quantity: 1, price: "£0.00" },
  ],
  lines: [
    { label: "Subtotal", value: "£520.00" },
    { label: "VAT (20%)", value: "£104.00" },
  ],
  total: { label: "Total", value: "£624.00" },
  paymentMethod: "Visa ending 4242",
  href: "https://hive.example/orders/1042",
};
const TEMPLATES = {
  MagicLink: h(MagicLink, {
    productName: "Hive",
    href: "https://hive.example/signin?t=x",
    expiresIn: "15 minutes",
    requestedFrom: "Chrome on macOS, near London",
  }),
  PasswordReset: h(PasswordReset, {
    productName: "Hive",
    href: "https://hive.example/reset?t=x",
    recipient: "ana@example.com",
    expiresIn: "1 hour",
  }),
  Invite: h(Invite, {
    productName: "Hive",
    inviterName: "Ana Kovač",
    workspaceName: "Design",
    href: "https://hive.example/join/x",
    message: "Come and join us!",
    expiresIn: "7 days",
  }),
  Receipt: h(Receipt, RECEIPT),
  Notification: h(
    Notification,
    {
      productName: "Hive",
      title: "Deploy failed on production",
      action: { label: "View deploy", href: "https://hive.example/d/9" },
      preferencesHref: "https://hive.example/settings/email",
    },
    "The deploy of main failed at the migrate step.",
  ),
};

for (const [name, element] of Object.entries(TEMPLATES))
  test(`${name} renders self-contained HTML and a complete plain-text part`, async () => {
    const { html, text } = await renderEmail(element);
    assert.doesNotMatch(
      html,
      /<style|rel="stylesheet"|class="|var\(|color-mix\(|oklch\(/,
    );
    assert.doesNotMatch(
      html,
      /<table[^>]*style="[^"]*(?:padding|margin|background)/,
    );
    assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1, "one title");
    assert.match(text, /You received|If you didn't ask/); // says why it came
    assert.ok(html.length < 100_000);
    for (const href of html.matchAll(/href="([^"]+)"/g))
      assert.match(href[1], /^(?:https:|mailto:)/, href[1]);
    // Every link in the HTML is in the text too.
    for (const href of new Set(
      [...html.matchAll(/<a href="([^"]+)"/g)].map((m) =>
        m[1].replaceAll("&amp;", "&"),
      ),
    ))
      assert.ok(text.includes(href), `${href} in text`);
  });

test("templates say why they were sent, and what each link does", async () => {
  const magic = (await renderEmail(TEMPLATES.MagicLink)).text;
  assert.match(magic, /Sign in to Hive https:\/\/hive\.example\/signin\?t=x/);
  assert.match(magic, /This link expires in 15 minutes\./);
  assert.match(magic, /Requested from Chrome on macOS, near London\./);
  assert.match(magic, /If that wasn't you, you can ignore it\./);

  const reset = (await renderEmail(TEMPLATES.PasswordReset)).text;
  assert.match(
    reset,
    /reset the password for the Hive account ana@example\.com\./,
  );
  assert.match(reset, /Your password won't change\./);

  const invite = await renderEmail(TEMPLATES.Invite);
  assert.match(invite.text, /ANA KOVAČ INVITED YOU TO DESIGN/);
  assert.match(invite.text, /Message from Ana Kovač\s+Come and join us!/);
  assert.match(invite.text, /This invitation expires in 7 days\./);
  assert.match(
    invite.html,
    /data-skip-in-text="true">Ana Kovač invited you to Design</,
  ); // preview

  const noWorkspace = await renderEmail(
    h(Invite, {
      productName: "Hive",
      inviterName: "Ana",
      href: "https://hive.example/j",
    }),
  );
  assert.match(
    noWorkspace.text,
    /ANA INVITED YOU TO HIVE\s+Join Ana on Hive\./,
  );

  const note = await renderEmail(TEMPLATES.Notification);
  assert.match(note.html, /<p [^>]*>The deploy of main failed/); // a string body is a paragraph
  assert.match(note.text, /View deploy https:\/\/hive\.example\/d\/9/);
  assert.match(
    note.text,
    /notification settings in Hive\. Manage email preferences https:/,
  );
  const custom = await renderEmail(
    h(
      Notification,
      { productName: "Hive", title: "Hi", footer: "Sent by Hive." },
      "Body",
    ),
  );
  assert.match(custom.text, /Sent by Hive\.$/);
  assert.doesNotMatch(custom.text, /notification settings/);
});

test("a personal message is quoted as text, never as markup", async () => {
  const { html } = await renderEmail(
    h(Invite, {
      productName: "Hive",
      inviterName: "Ana",
      href: "https://hive.example/j",
      message: '<a href="https://evil.example">Claim prize</a>',
    }),
  );
  assert.doesNotMatch(html, /evil\.example">/);
  assert.match(html, /&lt;a href=/);
});

test("template links must be absolute web addresses too", async () => {
  for (const element of [
    h(Invite, {
      productName: "Hive",
      inviterName: "Ana",
      href: "javascript:alert(1)",
    }),
    h(MagicLink, { productName: "Hive", href: "/signin" }),
    h(Receipt, { ...RECEIPT, href: "data:text/html,x" }),
    h(
      Notification,
      { productName: "Hive", title: "x", action: { label: "Go", href: "x" } },
      "x",
    ),
  ])
    await assert.rejects(renderEmail(element), /needs an absolute/);
});

test("EmailSummary lists items, cost lines and total, as rows in plain text", async () => {
  const { html, text } = await renderEmail(h(Receipt, RECEIPT));
  for (const row of [
    /Team plan, annual +£480\.00\n5 seats/,
    /Extra storage × 2 +£40\.00/,
    /Support +£0\.00/, // a quantity of 1 isn't shown
    /Subtotal +£520\.00/,
    /VAT \(20%\) +£104\.00/,
    /Total +£624\.00/,
  ])
    assert.match(text, row);
  assert.doesNotMatch(text, /Support × 1/);
  assert.match(text, /Paid with Visa ending 4242\./);
  // Amounts sit at the end and don't wrap; the total is bold.
  assert.match(html, /text-align:right;[^"]*white-space:nowrap[^"]*">£480\.00/);
  assert.match(html, /font-weight:600[^"]*">Total</);
});

test("right-to-left emails mirror the summary and callout", async () => {
  const ltr = await renderEmail(
    h(EmailShell, { preview: "x" }, h(EmailCallout, { tone: "danger" }, "x")),
  );
  assert.match(ltr.html, /border-left:4px solid #c70014/);
  const rtl = await renderEmail(
    h(Receipt, { ...RECEIPT, dir: "rtl", lang: "ar" }),
  );
  assert.match(rtl.html, /<html dir="rtl" lang="ar">/);
  assert.match(rtl.html, /text-align:right[^"]*">Team plan, annual/);
  assert.match(rtl.html, /text-align:left;[^"]*">£480\.00/);
  const callout = await renderEmail(
    h(
      EmailShell,
      { preview: "x", dir: "rtl" },
      h(EmailCallout, { tone: "danger" }, "x"),
    ),
  );
  assert.match(callout.html, /border-right:4px solid #c70014/);
});

test("callouts take Mortar's tones; neutral is an aside", async () => {
  const theme = emailTheme();
  for (const tone of ["info", "success", "warning", "danger"]) {
    const { html } = await renderEmail(
      h(EmailCallout, { tone, title: "Title" }, "Body"),
    );
    assert.match(html, new RegExp(`border-left:4px solid ${theme[tone]}`));
    assert.ok(contrast(theme.ink, theme.sunken) >= 4.5);
  }
  const { html } = await renderEmail(h(EmailCallout, null, "Aside"));
  assert.match(html, new RegExp(`border-left:4px solid ${theme.line}`));
});

test("EmailDivider is a themed rule; only bare URLs break anywhere", async () => {
  const { html } = await renderEmail(h(EmailDivider));
  assert.match(html, /<hr [^>]*border-top:1px solid #e5e5ea/);
  const named = await renderEmail(
    h(
      EmailLink,
      { href: "https://hive.example/s" },
      "Manage email preferences",
    ),
  );
  assert.doesNotMatch(named.html, /word-break/);
  const bare = await renderEmail(
    h(EmailLink, { href: "https://hive.example/s" }),
  );
  assert.match(bare.html, /word-break:break-all/);
});
