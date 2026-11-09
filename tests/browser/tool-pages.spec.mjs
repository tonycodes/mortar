import { test, expect } from "@playwright/test";
import { accessibility, overflow } from "../support/preview.mjs";

// The playground's native gallery (?page=native) and email preview
// (?page=email).
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
    test(`native gallery passes axe in ${theme} at ${width}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      const errors = await open(page, `page=native&theme=${theme}`);
      await expect(
        page.getByRole("heading", { name: "Native gallery", level: 1 }),
      ).toBeVisible();
      await expect(
        page.getByRole("img", { name: /^SwiftUI snapshot/ }),
      ).toBeVisible();
      await accessibility(page);
      await overflow(page);
      expect(errors).toEqual([]);
    });

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

test("every native gallery entry has a SwiftUI and a Compose reference", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page, "page=native");
  const select = page.getByLabel("Component", { exact: true });
  await expect(select).toBeVisible();
  const ids = await select
    .locator("option")
    .evaluateAll((options) => options.map((o) => o.value));
  expect(ids.length).toBe(17);
  for (const id of ids) {
    await select.selectOption(id);
    const variants = page
      .getByRole("group", { name: "Variant" })
      .getByRole("button");
    await expect(variants.first()).toBeVisible();
    const count = await variants.count();
    expect(count, `${id} variants`).toBe(
      id === "tablet" ? 2 : id.startsWith("app-shell") ? 1 : 3,
    );
    for (const variant of await variants.all()) {
      await variant.click();
      await expect(variant).toHaveAttribute("aria-pressed", "true");
      for (const platform of ["SwiftUI", "Compose"]) {
        const image = page.getByRole("img", {
          name: new RegExp(`^${platform} snapshot`),
        });
        await expect(image, `${id} ${platform}`).toBeVisible();
        await expect
          .poll(() => image.evaluate((img) => img.naturalWidth), {
            message: `${id} ${platform} loads`,
          })
          .toBeGreaterThan(0);
      }
    }
  }
  await expect(page).toHaveURL(/native=tablet/);
});

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

test("both pages are in the playground navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Component catalogue" });
  await nav.getByRole("link", { name: "Native gallery" }).click();
  await expect(page).toHaveURL(/page=native/);
  await expect(
    nav.getByRole("link", { name: "Native gallery" }),
  ).toHaveAttribute("aria-current", "page");
  await nav.getByRole("link", { name: "Email preview" }).click();
  await expect(page).toHaveURL(/page=email/);
  await expect(
    page.getByRole("heading", { name: "Email preview", level: 1 }),
  ).toBeVisible();
});
