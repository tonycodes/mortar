import { test, expect } from "@playwright/test";
import { accessibility, overflow } from "../support/preview.mjs";

// The playground's email preview (?page=email).
async function open(page, query) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(`/?${query}`);
  return errors;
}

for (const theme of ["light", "dark"])
  for (const width of [390, 1280]) {
    test(`email preview passes axe in ${theme} at ${width}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      const errors = await open(page, `page=email&theme=${theme}`);
      await expect(
        page.getByRole("heading", { name: "Email preview", level: 1 }),
      ).toBeVisible();
      await expect(
        page
          .frameLocator('iframe[title="Verify email email, HTML"]')
          .getByRole("heading", { name: "Confirm your email address" }),
      ).toBeVisible();
      await accessibility(page);
      await overflow(page);
      expect(errors).toEqual([]);
    });
  }

test("the email preview renders every template and its plain text", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const errors = await open(page, "page=email&email-brand=green");
  const template = page.getByLabel("Template", { exact: true });
  await expect(template).toBeVisible();
  for (const [id, heading] of [
    ["verify", "Confirm your email address"],
    ["magic-link", "Sign in to Hive"],
    ["password-reset", "Reset your password"],
    ["invite", "Grace Hopper invited you to Compilers"],
    ["receipt", "Thanks for your order"],
    ["notification", "Grace mentioned you in Roadmap"],
  ]) {
    await template.selectOption(id);
    await expect(
      page
        .locator("iframe")
        .contentFrame()
        .getByRole("heading", { name: heading }),
    ).toBeVisible();
    await expect(
      page.getByRole("figure", { name: "Plain text" }),
    ).toContainText(heading.toUpperCase());
  }
  // The green brand's primary fills the notification's button.
  const button = page
    .locator("iframe")
    .contentFrame()
    .getByRole("link", { name: "Open the comment" });
  await expect(button).toHaveCSS("background-color", "rgb(4, 120, 87)");
  await page
    .getByRole("group", { name: "Width" })
    .getByRole("button", { name: "Desktop, 600px" })
    .click();
  await expect(page.locator("iframe")).toHaveCSS("width", "600px");
  await expect(page).toHaveURL(/email=notification/);
  await expect(page).toHaveURL(/width=desktop/);
  expect(errors).toEqual([]);
});

test("the email preview is in the playground navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Component catalogue" });
  await nav.getByRole("link", { name: "Email preview" }).click();
  await expect(page).toHaveURL(/page=email/);
  await expect(
    page.getByRole("heading", { name: "Email preview", level: 1 }),
  ).toBeVisible();
});
