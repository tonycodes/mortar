// Behaviour regressions for the foundation controls, run against a small
// standalone app (tests/browser/fixtures/controls) so each case controls its
// own document: container themes and portals, focus after removal, busy
// buttons, live regions, tabs and hydration.
import { test, expect } from "@playwright/test";
import { useFixtureServer } from "../support/fixture-server.mjs";
import { tokenColor } from "../support/preview.mjs";

const base = useFixtureServer(test, "controls");
const open = (page, scenario) => page.goto(`${base()}/?case=${scenario}`);
const background = (locator) =>
  locator.evaluate((el) => getComputedStyle(el).backgroundColor);
const activeText = (page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    return el === document.body
      ? "<body>"
      : el?.getAttribute("aria-label") ||
          el?.textContent?.trim() ||
          el?.tagName;
  });

for (const appearance of ["dark", "light"])
  test(`portalled overlays keep a ${appearance} container's theme and focus ring`, async ({
    page,
  }) => {
    await open(page, `container-${appearance}`);
    const wrapper = page.locator("[data-mortar-appearance]:not(html)").first();
    await expect(wrapper).toHaveAttribute("data-mortar-appearance", appearance);
    const surface = await tokenColor(page, "--m-surface", wrapper);
    // The document is the other appearance, so inheriting it would show.
    expect(surface).not.toBe(
      await tokenColor(page, "--m-surface", page.locator("html")),
    );

    const trigger = page.getByRole("button", { name: "Actions" });
    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    expect(await background(menu)).toBe(surface);
    // Overlays render outside the wrapper but inside a matching theme scope.
    expect(await menu.evaluate((el) => !!el.closest("[data-mortar]"))).toBe(
      true,
    );
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: /Owner/ }).click();
    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();
    expect(await background(listbox)).toBe(surface);
    await page.keyboard.press("Escape");

    const opener = page.getByRole("button", { name: "Open dialog" });
    await opener.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    expect(await background(dialog.locator(".m-dialog-panel"))).toBe(surface);
    // The kit focus ring needs a [data-mortar] ancestor.
    await page.keyboard.press("Tab");
    const ring = await page.evaluate(() => {
      const s = getComputedStyle(document.activeElement);
      return [s.outlineStyle, s.outlineColor];
    });
    expect(ring[0]).toBe("solid");
    expect(ring[1]).toBe(await tokenColor(page, "--m-focus", wrapper));
  });

test("a nested provider without navigate keeps the outer router", async ({
  page,
}) => {
  await open(page, "navigation");
  const url = page.url();
  await page.getByRole("link", { name: "Next page" }).click();
  await expect(page.getByLabel("Routes")).toHaveText("/next");
  expect(page.url()).toBe(url);
});

test("a loading button keeps focus and ignores activation", async ({
  page,
}) => {
  await open(page, "loading");
  const save = page.getByRole("button", { name: "Save" });
  await save.focus();
  await page.keyboard.press("Enter");
  await expect(save).toHaveAttribute("aria-busy", "true");
  await expect(save).toHaveAttribute("aria-disabled", "true");
  await expect(save).toBeFocused();
  await page.keyboard.press("Enter");
  // Playwright refuses to click an aria-disabled button; a pointer still can.
  const box = await save.boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByLabel("Saves")).toHaveText("1");
  await expect(save).toBeFocused();
});

test("dismissing toasts moves focus to the next toast, then the region", async ({
  page,
}) => {
  await open(page, "toaster");
  const region = page.getByRole("region", { name: "Notifications" });
  await region.getByRole("button", { name: "Dismiss First toast" }).focus();
  await page.keyboard.press("Enter");
  await expect(region.getByText("First toast")).toHaveCount(0);
  expect(await activeText(page)).toBe("Dismiss Second toast");
  await page.keyboard.press("Enter");
  await expect(region.getByText("Second toast")).toHaveCount(0);
  await expect(region).toBeFocused();
});

test("new toasts are announced once through persistent regions", async ({
  page,
}) => {
  await open(page, "toaster");
  const region = page.getByRole("region", { name: "Notifications" });
  await expect(region.locator("[aria-live]")).toHaveCount(0);
  await expect(region.locator("li[role]")).toHaveCount(0);
  const status = region.getByRole("status");
  const alert = region.getByRole("alert");
  await expect(status).toHaveText("");
  await page.getByRole("button", { name: "Add polite" }).click();
  await expect(status).toHaveText("Copied URL");
  await expect(alert).toHaveText("");
  await page.getByRole("button", { name: "Add danger" }).click();
  await expect(alert).toHaveText("Payment failed");
});

test("dismissing a notice moves focus to the next control", async ({
  page,
}) => {
  await open(page, "notice");
  await page.getByRole("button", { name: "Dismiss Heads up" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Heads up")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "After" })).toBeFocused();
});

test("an announcing notice changes its status region after mounting", async ({
  page,
}) => {
  await open(page, "notice");
  await page.evaluate(() => {
    const added = [];
    window.__added = added;
    new MutationObserver((records) => {
      for (const record of records)
        if (
          record.target instanceof Element &&
          record.target.getAttribute("role") === "status"
        )
          for (const node of record.addedNodes)
            added.push(`${node.nodeName}:${node.textContent}`);
    }).observe(document.body, { childList: true, subtree: true });
  });
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByRole("status")).toContainText("Settings saved");
  // A screen reader only hears changes inside a region already present.
  await expect
    .poll(() => page.evaluate(() => window.__added))
    .toContain("STRONG:Settings saved");
});

test("the save bar's status region exists before the bar opens", async ({
  page,
}) => {
  await open(page, "savebar");
  const status = page.getByRole("status");
  await expect(status).toHaveCount(1);
  await expect(status).toHaveText("");
  await page.getByRole("button", { name: "Edit" }).click();
  await expect(status).toHaveText("You have unsaved changes.");
  await expect(
    page.getByRole("region", { name: "You have unsaved changes." }),
  ).toBeVisible();
});

test("tabs follow reading direction in right-to-left text", async ({
  page,
}) => {
  await open(page, "tabs-rtl");
  await page.getByRole("tab", { name: "One" }).focus();
  await page.keyboard.press("ArrowLeft");
  const two = page.getByRole("tab", { name: "Two" });
  await expect(two).toHaveAttribute("aria-selected", "true");
  await expect(two).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "One" })).toBeFocused();
});

test("tabs stay reachable when the value matches no tab", async ({ page }) => {
  await open(page, "tabs-missing");
  await page.getByRole("button", { name: "Before tabs" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("tab", { name: "One" })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Two" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("a container provider hydrates server markup without a mismatch", async ({
  page,
}) => {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ colorScheme: "dark" });
  await open(page, "hydrate");
  const wrapper = page.locator("#root > [data-mortar-appearance]");
  await expect(wrapper).toHaveText("Hydrated");
  // Server snapshot is light; after hydration it follows the system.
  await expect(wrapper).toHaveAttribute("data-mortar-appearance", "dark");
  expect(errors).toEqual([]);
});

// A runtime brand (ThemeProvider brandTokens) reaches the provider's own
// content, inverse bands and the overlays it portals out of its wrapper.
const BLUE = "rgb(29, 78, 216)";
const LIGHT_BLUE = "rgb(147, 197, 253)";
test("a runtime brand reaches a container's content and its overlays", async ({
  page,
}) => {
  await open(page, "brand-container");
  const wrapper = page.locator("[data-mortar-brand='acme']").first();
  await expect(wrapper).toHaveAttribute("data-mortar-appearance", "dark");
  expect(await tokenColor(page, "--m-primary", wrapper)).toBe(LIGHT_BLUE);
  expect(
    await background(
      page.getByRole("button", { name: "Primary", exact: true }),
    ),
  ).toBe(LIGHT_BLUE);
  // One stylesheet for the brand, rendered with the provider.
  await expect(
    page.locator("style[data-mortar-brand-style='acme']"),
  ).toHaveCount(1);

  const trigger = page.getByRole("button", { name: "Actions" });
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  expect(await tokenColor(page, "--m-primary", menu)).toBe(LIGHT_BLUE);
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Open dialog" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  // The theme scope sits inside Headless UI's root, around the panel.
  expect(
    await tokenColor(page, "--m-primary", dialog.locator(".m-dialog-panel")),
  ).toBe(LIGHT_BLUE);
});

test("a runtime brand themes the document and flips in inverse bands", async ({
  page,
}) => {
  await open(page, "brand-document");
  await expect(page.locator("html")).toHaveAttribute(
    "data-mortar-brand",
    "acme",
  );
  expect(
    await background(
      page.getByRole("button", { name: "Primary", exact: true }),
    ),
  ).toBe(BLUE);
  // Inverse bands use the brand's dark values.
  expect(
    await background(page.getByRole("button", { name: "Inverse primary" })),
  ).toBe(LIGHT_BLUE);
});
