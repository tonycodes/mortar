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
