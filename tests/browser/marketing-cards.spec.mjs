import { test, expect } from "@playwright/test";
import { contrast, tokenColor } from "../support/preview.mjs";

async function open(
  page,
  component,
  { theme = "light", width = 1280, state } = {},
) {
  await page.setViewportSize({ width, height: 900 });
  const params = { component, theme, brand: "green" };
  if (state) params.state = state;
  await page.goto("/?" + new URLSearchParams(params));
  const root = page.locator(`[data-mortar-preview="${component}"]`);
  await expect(root).toBeVisible();
  return root;
}

for (const theme of ["light", "dark"])
  test(`section emphasis follows the brand's emphasis font and style (${theme})`, async ({
    page,
  }) => {
    const root = await open(page, "CallToAction", { theme });
    const em = root.locator(".m-cta h2 em.m-emphasis").first();
    await expect(em).toHaveText("next project");
    const link = await tokenColor(page, "--m-link", em);
    const before = await em.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        color: s.color,
        fontStyle: s.fontStyle,
        fontFamily: s.fontFamily,
      };
    });
    expect(before.color).toBe(link);
    expect(before.fontStyle).toBe("normal");
    const heading = await em.evaluate(
      (el) => getComputedStyle(el.parentElement).fontFamily,
    );
    expect(before.fontFamily).toBe(heading);
    // A brand that sets the emphasis tokens restyles the phrase.
    const after = await em.evaluate((el) => {
      const host = el.closest("[data-mortar-brand]");
      host.style.setProperty("--m-brand-font-emphasis", "Georgia, serif");
      host.style.setProperty("--m-brand-font-emphasis-style", "italic");
      const s = getComputedStyle(el);
      return { style: s.fontStyle, family: s.fontFamily };
    });
    expect(after).toEqual({ style: "italic", family: "Georgia, serif" });
  });

for (const theme of ["light", "dark"])
  test(`FeatureGrid engagement cards: linked title, readable meta, focus ring (${theme})`, async ({
    page,
  }) => {
    const root = await open(page, "FeatureGrid", { theme });
    const card = root.locator("article", { hasText: "Northwind Travel" });
    const title = card.getByRole("link", {
      name: "A booking platform rebuilt in twelve weeks",
    });
    await expect(title).toHaveAttribute("href", "#northwind");
    await expect(
      card.getByRole("heading", { level: 3, name: /booking platform/ }),
    ).toBeVisible();
    const brief = card.getByRole("link", { name: "Read the engagement brief" });
    await expect(brief).toBeVisible();
    // Muted card text and the action link keep 4.5:1 on the page.
    const paper = await tokenColor(page, "--m-paper", card);
    for (const locator of [
      card.locator(".m-feature-eyebrow"),
      card.locator(".m-feature-meta"),
      card.locator(".m-feature-footer"),
      brief,
    ]) {
      const color = await locator.evaluate((el) => getComputedStyle(el).color);
      expect(contrast(color, paper)).toBeGreaterThan(4.5);
    }
    // Keyboard focus shows the kit's ring on the title link.
    await title.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(title).toBeFocused();
    const outline = await title.evaluate(
      (el) => getComputedStyle(el).outlineStyle,
    );
    expect(outline).toBe("solid");
  });

test("Hero captioned tiles fit a 390px screen", async ({ page }) => {
  const root = await open(page, "Hero", { width: 390, state: "long" });
  await expect(root.locator("figcaption").first()).toHaveText(
    "The engineer · A studio in a long town name",
  );
  await expect(
    root.getByRole("img", { name: "A portrait in a studio" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(1);
});
