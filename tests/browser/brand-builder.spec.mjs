import { test, expect } from "@playwright/test";
import { accessibility, overflow } from "../support/preview.mjs";

// The playground's brand builder (?page=brand): inputs for the brand contract,
// live light and dark previews, contrast checks and copyable output.
const sample = (page, mode) => page.locator(`[data-pg-sample="${mode}"]`);
const background = (locator) =>
  locator.evaluate((el) => getComputedStyle(el).backgroundColor);
const save = (page, mode) =>
  sample(page, mode).getByRole("button", { name: "Save", exact: true });
const cssOutput = (page) =>
  page.getByRole("figure", { name: "CSS", exact: true });

async function open(page, query = "") {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(`/?page=brand${query}`);
  await expect(
    page.getByRole("heading", { name: "Brand builder", level: 1 }),
  ).toBeVisible();
  await expect(page.locator("[data-check]").first()).toBeVisible();
  return errors;
}

for (const theme of ["light", "dark"])
  for (const width of [390, 1280])
    test(`brand builder passes axe in ${theme} at ${width}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      const errors = await open(page, `&theme=${theme}`);
      await page.getByText("Advanced: interaction", { exact: false }).click();
      await expect(
        page.getByLabel("Dark selected", { exact: true }),
      ).toBeVisible();
      await expect(sample(page, "light")).toBeVisible();
      await expect(sample(page, "dark")).toBeVisible();
      await accessibility(page);
      await overflow(page);
      expect(errors).toEqual([]);
    });

test("the brand builder is in the playground navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/?theme=dark");
  await page
    .getByRole("navigation", { name: "Component catalogue" })
    .getByRole("link", { name: "Brand builder" })
    .click();
  await expect(page).toHaveURL(/page=brand/);
  await expect(page).toHaveURL(/theme=dark/);
  await expect(
    page.getByRole("heading", { name: "Brand builder", level: 1 }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Component catalogue" })
      .getByRole("link", { name: "Brand builder" }),
  ).toHaveAttribute("aria-current", "page");
  // Leaving the page drops its parameters.
  await page
    .getByRole("navigation", { name: "Component catalogue" })
    .getByRole("link", { name: "Button", exact: true })
    .click();
  await expect(page.locator('[data-mortar-preview="Button"]')).toBeVisible();
  expect(page.url()).not.toMatch(/page=|l-primary|name=/);
});

test("changing light primary updates the preview, the CSS and the URL", async ({
  page,
}) => {
  const errors = await open(page);
  await page.getByLabel("Light primary", { exact: true }).fill("#ff0000");
  await expect
    .poll(() => background(save(page, "light")))
    .toBe("rgb(255, 0, 0)");
  await expect(cssOutput(page)).toContainText("--m-brand-l-primary: #ff0000;");
  await expect(page).toHaveURL(/l-primary=%23ff0000/);
  // The dark preview keeps its own primary.
  expect(await background(save(page, "dark"))).toBe("rgb(147, 197, 253)");
  // Revisiting an earlier value still wins over the stylesheets added since.
  await page.getByLabel("Light primary", { exact: true }).fill("#00ff00");
  await expect
    .poll(() => background(save(page, "light")))
    .toBe("rgb(0, 255, 0)");
  await page.getByLabel("Light primary", { exact: true }).fill("#ff0000");
  await expect
    .poll(() => background(save(page, "light")))
    .toBe("rgb(255, 0, 0)");
  // Derived hover is resolved by the browser and reported in the hint.
  await page.getByText("Advanced: interaction", { exact: false }).click();
  await expect(
    page
      .getByText(
        /Empty: derived from primary mixed 85% with ink \(#[0-9a-f]{6}\)/,
      )
      .first(),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("the URL restores a shared brand", async ({ page }) => {
  await open(page);
  await page.getByLabel("Brand name").fill("acme");
  await page.getByLabel("Light primary", { exact: true }).fill("#7c3aed");
  await page.getByLabel("Dark on primary", { exact: true }).fill("#1e1b4b");
  await expect(cssOutput(page)).toContainText('[data-mortar-brand="acme"]');
  const shared = page.url();
  const other = await page.context().newPage();
  await other.goto(shared);
  await expect(other.getByLabel("Brand name")).toHaveValue("acme");
  await expect(other.getByLabel("Light primary", { exact: true })).toHaveValue(
    "#7c3aed",
  );
  await expect(
    other.getByLabel("Dark on primary", { exact: true }),
  ).toHaveValue("#1e1b4b");
  await expect
    .poll(() => background(save(other, "light")))
    .toBe("rgb(124, 58, 237)");
  await expect(
    other.locator('[data-m-component="ThemeProvider"]').first(),
  ).toHaveAttribute("data-mortar-brand", "acme");
  await expect(cssOutput(other)).toContainText(
    "--m-brand-d-on-primary: #1e1b4b;",
  );
  await other.close();
});

test("contrast checks flag a bad pair with text and an icon", async ({
  page,
}) => {
  await open(page);
  const check = page.locator('[data-check="light-page-primary"]');
  await expect(check).toContainText("Pass");
  await page.getByLabel("Light primary", { exact: true }).fill("#ffff00");
  await page.getByLabel("Light on primary", { exact: true }).fill("#ffffff");
  await expect(check).toContainText("Fail");
  await expect(check.locator("svg")).toHaveCount(1);
  await expect(page.locator('[data-check="light-page-hover"]')).toContainText(
    "Fail",
  );
  // Light values drive the inverse band on dark pages too.
  await expect(
    page.locator('[data-check="dark-inverse-primary"]'),
  ).toContainText("Fail");
  await expect(page.locator('[data-check="dark-page-primary"]')).toContainText(
    "Pass",
  );
  await expect(page.getByText(/checks fail/)).toBeVisible();
});

test("invalid values show a field error instead of breaking the preview", async ({
  page,
}) => {
  const errors = await open(page);
  const field = page.getByLabel("Light primary", { exact: true });
  await field.fill("red; color: blue");
  await expect(field).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText(/Use colour syntax only/)).toBeVisible();
  await expect(cssOutput(page)).not.toContainText("color: blue");
  await expect(page.getByText("Some values are left out")).toBeVisible();
  await expect(save(page, "light")).toBeVisible();
  // A gradient where a colour belongs is not colour syntax.
  await field.fill("linear-gradient(90deg, #ff6a00, #ffb300)");
  await expect(page.getByText(/Use colour syntax only/)).toBeVisible();
  await field.fill("rgb(1 2)");
  await expect(
    page.getByText("This is not a colour the browser recognises."),
  ).toBeVisible();
  await field.fill("#1d4ed8");
  await expect(field).not.toHaveAttribute("aria-invalid", "true");
  const name = page.getByLabel("Brand name");
  await name.fill("my brand!");
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(cssOutput(page)).toContainText('[data-mortar-brand="custom"]');
  expect(errors).toEqual([]);
});

const advanced = (page) =>
  page.getByText("Advanced: interaction", { exact: false }).click();

test("surfaces, the accent gradient and fonts round-trip through the URL", async ({
  page,
}) => {
  const errors = await open(page);
  await advanced(page);
  await page.getByLabel("Dark page", { exact: true }).fill("#0b1f3a");
  await page.getByLabel("Light sunken", { exact: true }).fill("#eef2f7");
  await page.getByLabel("Light accent", { exact: true }).fill("#c2410c");
  await page
    .getByLabel("Light accent gradient", { exact: true })
    .fill("linear-gradient(90deg, #c2410c, #9a3412)");
  await page.getByLabel("Heading font", { exact: true }).fill("Georgia, serif");
  await expect(page).toHaveURL(/d-paper=%230b1f3a/);
  await expect(page).toHaveURL(/l-accent-gradient=linear-gradient/);
  await expect(page).toHaveURL(/font-heading=Georgia/);
  // The previews paint them: tinted page, gradient accent button and band,
  // and the heading font.
  await expect
    .poll(() => background(sample(page, "dark").locator("..")))
    .toBe("rgb(11, 31, 58)");
  const accent = sample(page, "light").getByRole("button", {
    name: "Upgrade",
  });
  await expect
    .poll(() => accent.evaluate((el) => getComputedStyle(el).backgroundImage))
    .toBe("linear-gradient(90deg, rgb(194, 65, 12), rgb(154, 52, 18))");
  await expect(
    sample(page, "light").locator('.m-cta[data-tone="accent"]'),
  ).toHaveCSS(
    "background-image",
    "linear-gradient(90deg, rgb(194, 65, 12), rgb(154, 52, 18))",
  );
  await expect(sample(page, "light").locator("h4").first()).toHaveCSS(
    "font-family",
    "Georgia, serif",
  );
  await expect(cssOutput(page)).toContainText(
    "--m-brand-l-accent-gradient: linear-gradient(90deg, #c2410c, #9a3412);",
  );
  await expect(cssOutput(page)).toContainText(
    "--m-brand-font-heading: Georgia, serif;",
  );
  await expect(
    page.locator('[data-check="light-page-gradient-2"]'),
  ).toContainText("Pass");

  const other = await page.context().newPage();
  await other.goto(page.url());
  await other.getByText("Advanced: interaction", { exact: false }).click();
  await expect(other.getByLabel("Dark page", { exact: true })).toHaveValue(
    "#0b1f3a",
  );
  await expect(other.getByLabel("Light sunken", { exact: true })).toHaveValue(
    "#eef2f7",
  );
  await expect(
    other.getByLabel("Light accent gradient", { exact: true }),
  ).toHaveValue("linear-gradient(90deg, #c2410c, #9a3412)");
  await expect(other.getByLabel("Heading font", { exact: true })).toHaveValue(
    "Georgia, serif",
  );
  await other.close();
  expect(errors).toEqual([]);
});

test("a gradient stop that fails on-accent contrast is flagged", async ({
  page,
}) => {
  await open(page);
  await advanced(page);
  await page.getByLabel("Light accent", { exact: true }).fill("#c2410c");
  await page.getByLabel("Light on accent", { exact: true }).fill("#ffffff");
  await page
    .getByLabel("Light accent gradient", { exact: true })
    .fill("linear-gradient(90deg, #c2410c, #ffb300)");
  await expect(
    page.locator('[data-check="light-page-gradient-1"]'),
  ).toContainText("Pass");
  await expect(
    page.locator('[data-check="light-page-gradient-2"]'),
  ).toContainText("Fail");
  // Light values drive the inverse band on dark pages, gradient included.
  await expect(
    page.locator('[data-check="dark-inverse-gradient-2"]'),
  ).toContainText("Fail");
  await expect(
    page.getByText(/On accent on gradient stop 2/).first(),
  ).toBeVisible();
});

test("an invalid gradient or font shows a field error", async ({ page }) => {
  const errors = await open(page);
  await advanced(page);
  const gradient = page.getByLabel("Dark accent gradient", { exact: true });
  for (const value of [
    "#ff6a00",
    "linear-gradient(90deg, url(x), #ffb300)",
    "image-set(url(x) 1x)",
  ]) {
    await gradient.fill(value);
    await expect(gradient).toHaveAttribute("aria-invalid", "true");
    await expect(
      page.getByText(/Use linear-gradient\(\), radial-gradient\(\)/),
    ).toBeVisible();
  }
  await expect(cssOutput(page)).not.toContainText("accent-gradient");
  const font = page.getByLabel("Body font", { exact: true });
  await font.fill("Inter; color: red");
  await expect(font).toHaveAttribute("aria-invalid", "true");
  await expect(cssOutput(page)).not.toContainText("color: red");
  await font.fill('"Inter", sans-serif');
  await expect(font).not.toHaveAttribute("aria-invalid", "true");
  expect(errors).toEqual([]);
});

test("presets load a brand", async ({ page }) => {
  await open(page);
  const presets = page.getByRole("group", { name: "Start from a preset" });
  await expect(presets.getByRole("button", { name: "Blue" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await presets.getByRole("button", { name: "Green" }).click();
  await expect(page.getByLabel("Light primary", { exact: true })).toHaveValue(
    "#047857",
  );
  await expect
    .poll(() => background(save(page, "dark")))
    .toBe("rgb(110, 231, 183)");
  await presets.getByRole("button", { name: "Neutral" }).click();
  await expect.poll(() => background(save(page, "light"))).toBe("rgb(0, 0, 0)");
});

test("overlays opened in the preview use the brand", async ({ page }) => {
  await open(page);
  await page.getByLabel("Light primary", { exact: true }).fill("#b91c1c");
  await sample(page, "light")
    .getByRole("button", { name: "Open dialog" })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect
    .poll(() => background(dialog.getByRole("button", { name: "Publish" })))
    .toBe("rgb(185, 28, 28)");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toHaveCount(0);

  await sample(page, "dark")
    .getByRole("button", { name: "Open dialog" })
    .click();
  await expect
    .poll(() =>
      background(
        page.getByRole("dialog").getByRole("button", { name: "Publish" }),
      ),
    )
    .toBe("rgb(147, 197, 253)");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await sample(page, "light").getByRole("button", { name: "Actions" }).click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  const primary = await menu.evaluate((el) => {
    const scope = el.closest("[data-mortar-brand]");
    const probe = document.createElement("span");
    probe.style.backgroundColor = "var(--m-primary)";
    el.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return [scope?.getAttribute("data-mortar-appearance"), value];
  });
  expect(primary).toEqual(["light", "rgb(185, 28, 28)"]);
});

test("output can be copied", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await open(page);
  await page.getByRole("button", { name: "Copy CSS" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "copied" }),
  ).toHaveText("CSS copied to the clipboard.");
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toContain('[data-mortar-brand="custom"]');
  expect(text).toContain("--m-brand-l-primary: #1d4ed8;");
  await page.getByRole("button", { name: "Copy JSON" }).click();
  expect(
    JSON.parse(await page.evaluate(() => navigator.clipboard.readText())),
  ).toEqual({
    light: { primary: "#1d4ed8", onPrimary: "#ffffff" },
    dark: { primary: "#93c5fd", onPrimary: "#0b1f4d" },
  });
});
