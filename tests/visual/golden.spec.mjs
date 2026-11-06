import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { mount, openers } from "../support/preview.mjs";
import { createElement as h } from "react";
// The source, not dist: the candidates workflow renders without a build.
import * as Email from "../../src/email.ts";
const { components } = JSON.parse(
  await readFile(new URL("../../catalog.json", import.meta.url), "utf8"),
);
// Intentionally small, maintainer-reviewed lists. CI never updates these
// baselines. Components here change often or carry many states; previews with
// dates pin `today`, so the images are stable from day to day.
const golden = [
  "AppShell",
  "DocsShell",
  "PlanComparison",
  "ConfirmDialog",
  "Button",
  "Tabs",
  "TabNav",
  "DataTable",
  "Calendar",
  "Pricing",
  "Hero",
  "ProductOverview",
  "ShoppingCart",
];
const templates = ["saas-landing", "cart-page", "split-landing"];

for (const name of golden)
  for (const theme of ["light", "dark"])
    for (const width of [390, 1280])
      test(`${name} ${theme} ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        const component = components.find((c) => c.export === name);
        const { root, errors } = await mount(page, component, { theme });
        let target = root;
        if (name === "ConfirmDialog") {
          await root
            .getByRole("button", { name: openers[name], exact: true })
            .click();
          target = page.getByRole("dialog").locator(".m-dialog-panel");
        }
        await page.evaluate(() => document.fonts.ready);
        await expect(target).toHaveScreenshot(`${name}-${theme}-${width}.png`);
        expect(errors).toEqual([]);
      });

for (const id of templates)
  for (const width of [390, 1280])
    test(`template ${id} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/?recipe=${id}&theme=light`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.getByRole("main")).toHaveScreenshot(
        `template-${id}-${width}.png`,
      );
    });

// #91: each email template as a mail client shows it, on a desktop reading
// pane (600) and a phone (375). Emails render light only; no logo, so no
// network.
const theme = Email.emailTheme({ light: { primary: "#047857" } });
const base = { productName: "Hive", theme };
const emails = {
  "verify-email": h(Email.VerifyEmail, {
    ...base,
    code: "482913",
    href: "https://hive.example/verify?t=abc",
    recipient: "ana@example.com",
    expiresIn: "10 minutes",
  }),
  "magic-link": h(Email.MagicLink, {
    ...base,
    href: "https://hive.example/signin?t=abc",
    expiresIn: "15 minutes",
    requestedFrom: "Chrome on macOS, near London",
  }),
  "password-reset": h(Email.PasswordReset, {
    ...base,
    href: "https://hive.example/reset?t=abc",
    recipient: "ana@example.com",
    expiresIn: "1 hour",
  }),
  invite: h(Email.Invite, {
    ...base,
    inviterName: "Ana Kovač",
    workspaceName: "Design",
    href: "https://hive.example/join/abc",
    message: "We're moving sprint planning here. Come and join us!",
    expiresIn: "7 days",
  }),
  receipt: h(Email.Receipt, {
    ...base,
    orderNumber: "HV-1042",
    date: "6 November 2026",
    items: [
      { name: "Team plan, annual", price: "£480.00", meta: "5 seats" },
      { name: "Extra storage", quantity: 2, price: "£40.00" },
    ],
    lines: [
      { label: "Subtotal", value: "£520.00" },
      { label: "VAT (20%)", value: "£104.00" },
    ],
    total: { label: "Total", value: "£624.00" },
    paymentMethod: "Visa ending 4242",
    href: "https://hive.example/orders/1042",
  }),
  notification: h(
    Email.Notification,
    {
      ...base,
      title: "Deploy failed on production",
      action: { label: "View deploy", href: "https://hive.example/d/9" },
      preferencesHref: "https://hive.example/settings/email",
    },
    h(Email.EmailText, null, "The deploy of main failed at the migrate step."),
    h(
      Email.EmailCallout,
      { tone: "danger", title: "Error" },
      "Relation already exists",
    ),
  ),
};

for (const [id, element] of Object.entries(emails))
  for (const width of [375, 600])
    test(`email ${id} ${width}`, async ({ page }) => {
      const { html } = await Email.renderEmail(element);
      await page.setViewportSize({ width, height: 900 });
      await page.setContent(html);
      await expect(page).toHaveScreenshot(`email-${id}-${width}.png`, {
        fullPage: true,
      });
    });
