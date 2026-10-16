import { test, expect } from "@playwright/test";
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
      page.getByText('import { Button } from "@tony-ui/mortar";', {
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
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    if (width < 900) {
      await page.getByLabel("Find a component").fill("");
      await page
        .getByRole("button", { name: "Open navigation", exact: true })
        .click();
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

const axe = async (page) =>
  (
    await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze()
  ).violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }));
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
    ])
      await expect(page.getByRole("heading", { name: kit })).toBeVisible();
    // Thumbnails are inert decoration: nothing inside them is focusable or announced.
    await expect(page.locator(".pg-thumb[inert]").first()).toBeAttached();
    await expect(page.getByRole("button", { name: "Duplicate" })).toHaveCount(
      0,
    );
    expect(await axe(page)).toEqual([]);
    expect(await pageOverflow(page)).toBeLessThanOrEqual(1);

    await page.getByRole("link", { name: "Form controls" }).click();
    await expect(page).toHaveURL(/category=foundation%2Fforms/);
    await expect(page).toHaveURL(/theme=dark/);
    await expect(
      page.getByRole("heading", { name: "Form controls", level: 1 }),
    ).toBeVisible();
    await expect(page.locator(".pg-example")).toHaveCount(10);
    await page
      .getByRole("group", { name: "Combobox view" })
      .getByRole("button", { name: "Code" })
      .click();
    await expect(page.getByText("ComboboxExample.tsx")).toBeVisible();
    expect(await axe(page)).toEqual([]);
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
    await expect(page.locator(".pg-example")).toHaveCount(10);
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
    'import { Button, Card, Stack, Text } from "@tony-ui/mortar";',
  );
  await expect(code).toContainText('<Card tone="sunken" padding="compact">');
  await expect(code).not.toContainText("UI.");
  await page.reload();
  await expect(code).toContainText("<Card");
  await page.goBack();
  await expect(page.locator('[data-mortar-preview="Card"]')).toBeVisible();
  expect(await axe(page)).toEqual([]);
});
