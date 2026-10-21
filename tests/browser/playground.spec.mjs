import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { accessibility } from "../support/preview.mjs";
import AxeBuilder from "@axe-core/playwright";
for (const width of [320, 768, 1280]) {
  test(`playground browsing and settings at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/?component=ActionLink&theme=dark");
    await page.getByLabel("Find a component").fill("nonesuch");
    await expect(page.getByRole("status")).toContainText("0 matching");
    await page.getByLabel("Find a component").fill("Button");
    await page
      .getByRole("group", { name: "Search results" })
      .getByRole("link", { name: "Button", exact: true })
      .click();
    await expect(page).toHaveURL(/component=Button/);
    await expect(page.locator('[data-mortar-preview="Button"]')).toBeVisible();
    await page.getByLabel("Brand", { exact: true }).selectOption("green");
    await expect(page.locator("html")).toHaveAttribute(
      "data-mortar-brand",
      "green",
    );
    await expect(page.locator("html")).toHaveAttribute(
      "data-mortar-appearance",
      "dark",
    );
    await page.getByLabel("Example state").selectOption("disabled");
    await expect(
      page
        .locator("[data-mortar-preview]")
        .getByRole("button", { name: "Save", exact: true }),
    ).toBeDisabled();
    await page.getByLabel("Example state").selectOption("default");
    await expect(
      page
        .locator("[data-mortar-preview]")
        .getByRole("button", { name: "Save changes" }),
    ).toBeEnabled();
    await page.getByLabel("Density", { exact: true }).selectOption("compact");
    await expect(page.locator("html")).toHaveAttribute(
      "data-mortar-density",
      "compact",
    );
    await page
      .getByText("Usage and component contract", { exact: true })
      .click();
    await expect(
      page.getByText('import { Button } from "@tonycodes-ui/mortar";', {
        exact: true,
      }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(1);
    await accessibility(page);
    if (width < 900) {
      await page.getByLabel("Find a component").fill("");
      await page.getByRole("button", { name: "Menu", exact: true }).click();
      await page
        .getByRole("dialog")
        .getByRole("link", { name: "ActionLink", exact: true })
        .click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(
        page.locator('[data-mortar-preview="ActionLink"]'),
      ).toBeVisible();
    }
  });
}

test("shared shell skip links target separate content regions", async ({
  page,
}) => {
  await page.goto("/?component=DocsShell");
  await expect(
    page.locator("[data-mortar-preview] .m-docs-shell"),
  ).toBeVisible();
  const targets = await page
    .locator(".m-skip")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(new Set(targets).size).toBe(targets.length);
  await page.keyboard.press("Tab");
  await expect(page.locator(".m-skip").first()).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.locator('.m-docs-shell[data-layout="wide"] > .m-docs-body > main'),
  ).toBeFocused();
});

test("navigation and preview settings preserve the document and support history", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/?component=ActionLink&theme=light");
  await page.evaluate(() => {
    window.__navigationMarker = "original";
  });
  await page.getByLabel("Find a component").fill("Button");
  await page
    .getByRole("group", { name: "Search results" })
    .getByRole("link", { name: "Button", exact: true })
    .click();
  await expect(page.locator('[data-mortar-preview="Button"]')).toBeVisible();
  await expect(page.getByLabel("Find a component")).toHaveValue("Button");
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-mortar-appearance",
    "dark",
  );
  await page.getByLabel("Brand", { exact: true }).selectOption("green");
  await page.getByLabel("Density", { exact: true }).selectOption("compact");
  await page.getByLabel("Example state").selectOption("disabled");
  await expect(
    page
      .locator("[data-mortar-preview]")
      .getByRole("button", { name: "Save", exact: true }),
  ).toBeDisabled();
  await page.goBack();
  await expect(page.getByLabel("Example state")).toHaveValue("default");
  await page.goBack();
  await expect(page.locator("html")).toHaveAttribute(
    "data-mortar-density",
    "comfortable",
  );
  await page.goForward();
  await expect(page.locator("html")).toHaveAttribute(
    "data-mortar-density",
    "compact",
  );
  expect(await page.evaluate(() => window.__navigationMarker)).toBe("original");
  await page.getByLabel("Find a component").fill("");
  await page
    .getByRole("navigation", { name: "Component catalogue" })
    .getByRole("link", { name: "Input", exact: true })
    .click();
  await expect(page.locator('[data-mortar-preview="Input"]')).toBeVisible();
  expect(await page.evaluate(() => window.__navigationMarker)).toBe("original");
  await page.goBack();
  await expect(page.locator('[data-mortar-preview="Button"]')).toBeVisible();
});

const { kits } = JSON.parse(
  readFileSync(
    new URL("../../playground/taxonomy.json", import.meta.url),
    "utf8",
  ),
);
const formControls = kits
  .find((k) => k.id === "foundation")
  .categories.find((c) => c.id === "forms").components.length;
const pageOverflow = (page) =>
  page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );

for (const width of [390, 1280])
  test(`kit overview leads to categories and components at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/?theme=dark");
    await expect(
      page.getByRole("heading", { name: "Components", level: 1 }),
    ).toBeVisible();
    for (const kit of [
      "Foundation",
      "Application UI",
      "Marketing UI",
      "Documentation",
      "Ecommerce",
    ])
      await expect(page.getByRole("heading", { name: kit })).toBeVisible();
    // Thumbnails are inert decoration: nothing inside them is focusable or announced.
    // Wait for the lazily loaded thumbnail to render, or a count of 0 passes vacuously.
    const thumb = page.locator(".pg-thumb[inert]").first();
    await expect(thumb.locator(".m-button-group").first()).toBeAttached();
    await expect(page.getByRole("button", { name: "Duplicate" })).toHaveCount(
      0,
    );
    await expect(thumb.locator("button").first()).not.toBeFocused();
    await accessibility(page);
    expect(await pageOverflow(page)).toBeLessThanOrEqual(1);

    await page.getByRole("link", { name: "Form controls" }).click();
    await expect(page).toHaveURL(/category=foundation%2Fforms/);
    await expect(page).toHaveURL(/theme=dark/);
    await expect(
      page.getByRole("heading", { name: "Form controls", level: 1 }),
    ).toBeVisible();
    await expect(page.locator(".pg-example")).toHaveCount(formControls);
    await page
      .getByRole("group", { name: "Combobox view" })
      .getByRole("button", { name: "Code" })
      .click();
    await expect(page.getByText("ComboboxExample.tsx")).toBeVisible();
    await accessibility(page);
    expect(await pageOverflow(page)).toBeLessThanOrEqual(1);

    await page
      .getByRole("link", { name: "Listbox", exact: true })
      .last()
      .click();
    await expect(page.locator('[data-mortar-preview="Listbox"]')).toBeVisible();
    const crumbs = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(crumbs).toContainText("Foundation");
    await expect(crumbs).toContainText("Form controls");
    await page
      .getByRole("link", { name: /Combobox/, exact: false })
      .last()
      .click();
    await expect(page).toHaveURL(/component=Combobox/);
    await crumbs.getByRole("link", { name: "Form controls" }).click();
    await expect(page.locator(".pg-example")).toHaveCount(formControls);
    await crumbs.getByRole("link", { name: "Components" }).click();
    await expect(
      page.getByRole("heading", { name: "Components", level: 1 }),
    ).toBeVisible();
  });

test("component code view shows the example source and is shareable", async ({
  page,
}) => {
  await page.goto("/?component=Card");
  await page
    .getByRole("group", { name: "Card view" })
    .getByRole("button", { name: "Code" })
    .click();
  await expect(page).toHaveURL(/view=code/);
  const code = page.locator(".pg-example-code");
  await expect(code).toContainText(
    'import { Button, Card, Stack, Text } from "@tonycodes-ui/mortar";',
  );
  await expect(code).toContainText('<Card tone="muted" padding="compact">');
  await expect(code).not.toContainText("UI.");
  await page.reload();
  await expect(code).toContainText("<Card");
  await page.goBack();
  await expect(page.locator('[data-mortar-preview="Card"]')).toBeVisible();
  await accessibility(page);
});

for (const width of [390, 1280])
  test(`multi-column workspace recipe at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/?recipe=project-workspace&theme=dark");
    const aside = page.getByRole("complementary", {
      name: "Schedule and activity",
    });
    await expect(aside).toBeVisible();
    await expect(
      aside.getByRole("grid", { name: "October 2026" }),
    ).toBeVisible();
    const main = await page.getByRole("main").boundingBox();
    const side = await aside.boundingBox();
    // Side by side on wide screens, stacked below the main column on narrow ones.
    if (width >= 1280) expect(side.x).toBeGreaterThan(main.x + main.width - 1);
    else expect(side.y).toBeGreaterThan(main.y + main.height - 1);
    await accessibility(page);
    expect(await pageOverflow(page)).toBeLessThanOrEqual(1);
  });

test("full-bleed section bands stay inside the preview frame", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/?component=FeatureGrid");
  const band = page.locator(
    '[data-mortar-preview] .m-marketing-section[data-tone="muted"]',
  );
  await band.scrollIntoViewIfNeeded();
  const canvas = await page.locator(".pg-canvas").boundingBox();
  const box = await band.boundingBox();
  // A pixel just left of the frame, level with the band, must show the page, not the band.
  const point = { x: canvas.x - 6, y: box.y + box.height / 2 };
  const shot = await page.screenshot({
    clip: { x: point.x, y: point.y, width: 1, height: 1 },
  });
  const sample = await page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const context = new OffscreenCanvas(1, 1).getContext("2d");
    context.drawImage(image, 0, 0);
    return [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)];
  }, shot.toString("base64"));
  const paper = await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.color = "var(--m-paper)";
    document.body.append(probe);
    const value = getComputedStyle(probe).color.match(/\d+/g).slice(0, 3);
    probe.remove();
    return value.map(Number);
  });
  for (let i = 0; i < 3; i++)
    expect(Math.abs(sample[i] - paper[i])).toBeLessThanOrEqual(2);
});

// The overview lists `templates` from playground/templates.tsx in order; read
// their ids from its source so a new template is tested without editing this file.
const templateIds = (() => {
  const file = new URL("../../playground/templates.tsx", import.meta.url);
  const tree = ts.createSourceFile(
    file.pathname,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  for (const statement of tree.statements)
    if (ts.isVariableStatement(statement))
      for (const d of statement.declarationList.declarations)
        if (
          d.name.getText() === "templates" &&
          d.initializer &&
          ts.isArrayLiteralExpression(d.initializer)
        )
          return d.initializer.elements.map((element) => {
            const id = element.properties.find(
              (p) => p.name?.getText() === "id",
            );
            if (!id || !ts.isStringLiteral(id.initializer))
              throw Error("Every page template needs a literal string id.");
            return id.initializer.text;
          });
  throw Error("playground/templates.tsx no longer exports a templates array.");
})();
for (const id of templateIds)
  for (const width of [390, 1280])
    test(`page template ${id} at ${width}`, async ({ page }) => {
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/?recipe=${id}&theme=${width < 900 ? "dark" : "light"}`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByRole("main")).toHaveCount(1);
      await accessibility(page);
      expect(await pageOverflow(page)).toBeLessThanOrEqual(1);
      expect(errors).toEqual([]);
    });

// Shop templates keep a gapless outline below their single h1 (the cart page
// used to jump from h1 to the bag lines' h3).
for (const id of [
  "product-page",
  "cart-page",
  "category-page",
  "checkout-page",
  "order-history",
])
  test(`page template ${id} keeps its heading order`, async ({ page }) => {
    await page.goto(`/?recipe=${id}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    const result = await new AxeBuilder({ page })
      .include("main")
      .withRules(["heading-order"])
      .analyze();
    expect(
      result.violations.flatMap((v) => v.nodes.map((n) => n.html)),
    ).toEqual([]);
  });

test("overview links every page template", async ({ page }) => {
  await page.goto("/");
  const section = page.getByRole("region", { name: "Page templates" });
  // Role queries skip the aria-hidden thumbnails, whose pages link to each other.
  const links = section.getByRole("link");
  await expect(links).toHaveCount(templateIds.length);
  for (const [index, id] of templateIds.entries())
    await expect(links.nth(index)).toHaveAttribute(
      "href",
      new RegExp(`recipe=${id}`),
    );
  await section.getByRole("link", { name: "Pricing page" }).click();
  await expect(
    page.getByRole("heading", { name: "Pricing that grows with you" }),
  ).toBeVisible();
});

test("settings template shows and clears unsaved changes", async ({ page }) => {
  await page.goto("/?recipe=settings");
  const name = page.getByLabel("Workspace name");
  await name.fill("Northwind Labs");
  // The bar's status region stays mounted (empty) so its message is announced.
  const bar = page.getByRole("region", { name: "You have unsaved changes" });
  await expect(bar).toBeVisible();
  await page.getByRole("button", { name: "Discard" }).click();
  await expect(name).toHaveValue("Northwind");
  await expect(bar).toBeHidden();
});

test("category template filters products", async ({ page }) => {
  await page.goto("/?recipe=category-page");
  const list = page.getByRole("list", { name: "Products" });
  await expect(list.getByRole("listitem")).toHaveCount(4);
  await page.getByRole("checkbox", { name: /Black/ }).check();
  await expect(list.getByRole("listitem")).toHaveCount(1);
  await page.getByRole("checkbox", { name: /Kitchen/ }).check();
  await expect(page.getByText("No matching products")).toBeVisible();
  await page.getByRole("button", { name: "Clear all" }).click();
  await expect(list.getByRole("listitem")).toHaveCount(4);
});

test("sign-in template focuses an error summary, then signs in", async ({
  page,
}) => {
  await page.goto("/?recipe=sign-in");
  const email = page.getByRole("textbox", { name: "Email address" });
  const password = page.locator("#sign-in-password");
  await expect(email).toHaveAttribute("autocomplete", "username");
  await expect(password).toHaveAttribute("autocomplete", "current-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const summary = page
    .getByRole("alert")
    .filter({ hasText: "There is a problem" });
  await expect(summary).toBeVisible();
  await expect(page.locator(":focus")).toContainText("There is a problem");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await summary.getByRole("link", { name: "Enter your password" }).click();
  await expect(password).toBeFocused();
  await email.fill("ana@example.com");
  await password.fill("wrong");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "don’t match" }),
  ).toBeVisible();
  await password.fill("correct horse battery");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Signed in as ana@example.com",
  );
});

test("sign-up and reset templates check password rules and the match", async ({
  page,
}) => {
  await page.goto("/?recipe=sign-up");
  await expect(
    page.getByRole("textbox", { name: "Full name" }),
  ).toHaveAttribute("autocomplete", "name");
  const password = page.locator("#sign-up-password");
  await expect(password).toHaveAttribute("autocomplete", "new-password");
  // Every rule is listed before anything is typed.
  const rules = page.getByRole("list", { name: "Password requirements" });
  await expect(rules.getByRole("listitem")).toHaveCount(3);
  await password.fill("short");
  await page.getByRole("button", { name: "Create account" }).click();
  const summary = page
    .getByRole("alert")
    .filter({ hasText: "There is a problem" });
  await expect(summary).toContainText(
    "Choose a password that meets every requirement",
  );
  await expect(summary).toContainText(
    "Agree to the terms to create an account",
  );
  await expect(
    page.getByRole("checkbox", { name: /I agree to the terms/ }),
  ).toHaveAttribute("aria-invalid", "true");

  await page.goto("/?recipe=reset-password");
  await page.locator("#reset-password").fill("Correct-horse-1");
  await page.locator("#reset-confirm").fill("Correct-horse-2");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.locator("#reset-confirm")).toHaveAccessibleDescription(
    "The passwords don’t match",
  );
  await page.locator("#reset-confirm").fill("Correct-horse-1");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByRole("status").first()).toContainText(
    "Password updated",
  );
});

test("code templates: paste, wrong code, resend cooldown and recovery codes", async ({
  page,
}) => {
  await page.goto("/?recipe=verify-email");
  const code = page.getByRole("textbox", { name: "Verification code" });
  await expect(code).toHaveAttribute("autocomplete", "one-time-code");
  await code.focus();
  await page.keyboard.insertText("000 000");
  await expect(code).toHaveValue("000000");
  // Without onComplete, a full code waits for the button.
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.getByRole("button", { name: "Verify email" }).click();
  await expect(code).toHaveAccessibleDescription(/incorrect or has expired/);
  const resend = page.getByRole("button", { name: /Resend code/ });
  await resend.click();
  await expect(page.getByText("We sent a new code.")).toBeVisible();
  await expect(resend).toHaveAttribute("aria-disabled", "true");
  await expect(resend).toBeFocused();
  await expect(resend).toHaveText(/Resend code in \d+s/);

  await page.goto("/?recipe=two-factor");
  const app = page.getByRole("textbox", { name: "Authentication code" });
  await app.focus();
  // The two-factor step opts in to submitting a complete code.
  await page.keyboard.insertText("123456");
  await expect(page.getByRole("status").first()).toContainText("Signed in");
  await page.getByRole("button", { name: "Use a recovery code" }).click();
  const recovery = page.getByRole("textbox", { name: "Recovery code" });
  await expect(recovery).toBeFocused();
  await page.keyboard.insertText("ab12-cd34");
  await expect(recovery).toHaveValue("AB12CD34");
});
