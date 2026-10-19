import { test, expect } from "@playwright/test";
import { useFixtureServer } from "../support/fixture-server.mjs";

const base = useFixtureServer(test, "docs-keys");

/** Collect page errors, including unhandled promise rejections. */
function watchErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test("SearchTrigger shortcut opens once and leaves fields and dialogs alone", async ({
  page,
}) => {
  const errors = watchErrors(page);
  await page.goto(`${base()}/`);
  const opened = page.getByLabel("Opened");
  await expect(opened).toHaveText("0");
  // Two triggers on one page: one press opens one search, not both.
  await page.locator("body").press("Control+k");
  await expect(opened).toHaveText("1");
  await page.locator("body").press("Meta+k");
  await expect(opened).toHaveText("2");
  // A text field keeps its own shortcut.
  await page.getByLabel("Notes").press("Control+k");
  // So does an open dialog.
  await page.getByRole("button", { name: "Inside dialog" }).press("Control+k");
  await expect(opened).toHaveText("2");
  expect(errors).toEqual([]);
});

for (const [platform, hint] of [
  ["MacIntel", "⌘K"],
  ["Win32", "Ctrl K"],
  ["Linux x86_64", "Ctrl K"],
])
  test(`SearchTrigger shows ${hint} on ${platform}`, async ({ page }) => {
    await page.addInitScript((value) => {
      Object.defineProperty(Navigator.prototype, "platform", {
        get: () => value,
      });
    }, platform);
    await page.goto(`${base()}/`);
    await expect(
      page.getByRole("button", { name: /Search docs/ }).locator("kbd"),
    ).toHaveText(hint);
  });

test("CodeTabs follow the tabs keyboard pattern with Home and End", async ({
  page,
}) => {
  await page.goto(`${base()}/`);
  const tabs = page.getByRole("tab");
  const panel = page.getByRole("tabpanel");
  // Each tab controls the panel, which is labelled by the selected tab.
  const panelId = await panel.getAttribute("id");
  expect(panelId).toBeTruthy();
  for (let i = 0; i < 3; i++)
    await expect(tabs.nth(i)).toHaveAttribute("aria-controls", panelId);
  await tabs.first().focus();
  await page.keyboard.press("End");
  await expect(tabs.nth(2)).toBeFocused();
  await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "true");
  await expect(panel).toContainText("yarn add");
  await expect(panel).toHaveAttribute(
    "aria-labelledby",
    (await tabs.nth(2).getAttribute("id")) ?? "",
  );
  await page.keyboard.press("Home");
  await expect(tabs.first()).toBeFocused();
  await expect(panel).toContainText("npm i");
  await page.keyboard.press("ArrowLeft");
  await expect(tabs.nth(2)).toBeFocused();
  // The keys are handled, so they do not also scroll the page.
  const handled = await tabs.nth(2).evaluate((tab) => {
    const event = new KeyboardEvent("keydown", {
      key: "Home",
      bubbles: true,
      cancelable: true,
    });
    tab.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(handled).toBe(true);
});

test("CodeTabs copy reports a rejected clipboard write instead of throwing", async ({
  page,
}) => {
  const errors = watchErrors(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("denied")) },
    });
  });
  await page.goto(`${base()}/`);
  const copy = page.getByRole("button", { name: "Copy" });
  await copy.click();
  await expect(page.getByRole("button", { name: "Copy failed" })).toBeVisible();
  expect(errors).toEqual([]);
});
