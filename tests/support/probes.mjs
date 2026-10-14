import { expect } from "@playwright/test";
import { openOverlay } from "./preview.mjs";
export const implementations = {
  async button({ page, root }) {
    const button = root.getByRole("button", { name: "Save changes" });
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(root.getByLabel("Action result")).toHaveText("saved");
    await expect(root.getByRole("button", { name: "Saving" })).toBeDisabled();
  },
  async link({ page, root }) {
    const link = root.getByRole("link", { name: "Explore" });
    await link.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#example$/);
  },
  async input({ root }) {
    const field = root.getByLabel("Project name");
    await field.fill("Changed");
    await expect(field).toHaveValue("Changed");
  },
  async textarea({ root }) {
    const field = root.getByLabel("Description");
    await field.fill("Changed\nSecond line");
    await expect(field).toHaveValue("Changed\nSecond line");
  },
  async select({ root }) {
    const select = root.getByLabel("Environment", { exact: true });
    await select.selectOption("second");
    await expect(select).toHaveValue("second");
    await expect(root.getByLabel("Unavailable environment")).toBeDisabled();
  },
  async checkbox({ page, root }) {
    const input = root.getByRole("checkbox");
    await input.focus();
    await page.keyboard.press("Space");
    await expect(input).toBeChecked();
    await input.click();
    await expect(input).not.toBeChecked();
  },
  async switch({ page, root }) {
    const input = root.getByRole("switch");
    await input.focus();
    await page.keyboard.press("Space");
    await expect(input).toBeChecked();
    await input.click();
    await expect(input).not.toBeChecked();
  },
  async radio({ page, root }) {
    const radios = root.getByRole("radio");
    await radios.first().focus();
    await page.keyboard.press("ArrowDown");
    await expect(radios.nth(1)).toBeChecked();
    await radios.first().click();
    await expect(radios.first()).toBeChecked();
  },
  async tabs({ page, root }) {
    const tabs = root.getByRole("tab");
    await tabs.first().focus();
    await page.keyboard.press("ArrowRight");
    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(root.getByRole("tabpanel")).toContainText("Activity");
    await tabs.first().click();
    await expect(root.getByRole("tabpanel")).toContainText("Overview");
  },
  async segmented({ page, root }) {
    const button = root.getByRole("button", { name: "Activity" });
    await button.focus();
    await page.keyboard.press("Space");
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await root.getByRole("button", { name: "Overview" }).click();
    await expect(button).toHaveAttribute("aria-pressed", "false");
  },
  async appearance({ page, root }) {
    await root.getByRole("button", { name: "Dark", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-mortar-appearance",
      "dark",
    );
    const light = root.getByRole("button", { name: "Light", exact: true });
    await light.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("html")).toHaveAttribute(
      "data-mortar-appearance",
      "light",
    );
  },
  async menu({ page, root }) {
    const opener = root.getByRole("button", { name: "Actions" });
    await opener.focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(opener).toBeFocused();
  },
  async dialog({ page, component, root }) {
    await openOverlay(page, component, root);
  },
  async chip({ page, root }) {
    const chip = root.getByRole("button", { name: /Status/ });
    await chip.focus();
    await page.keyboard.press("Space");
    await expect(chip).toHaveAttribute("aria-pressed", "true");
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "false");
  },
  async feedback({ page, root }) {
    const yes = root.getByRole("button", { name: "Yes", exact: true });
    await yes.focus();
    await page.keyboard.press("Enter");
    await expect(yes).toHaveAttribute("aria-pressed", "true");
    await root.getByRole("button", { name: "No", exact: true }).click();
    await expect(yes).toHaveAttribute("aria-pressed", "false");
  },
  async "code-tabs"({ page, root }) {
    const tabs = root.getByRole("tab");
    await tabs.first().focus();
    await page.keyboard.press("ArrowRight");
    await expect(tabs.nth(1)).toBeFocused();
    await expect(root.getByRole("tabpanel")).toContainText("pnpm add");
    await tabs.first().click();
    await expect(root.getByRole("tabpanel")).toContainText("npm i");
  },
  async save({ page, root }) {
    const button = root.getByRole("button", { name: "Save changes" });
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(root.locator(".m-save-bar")).toHaveCount(0);
  },
  async toast({ root, component }) {
    if (component.export === "Toast") {
      await root.getByRole("button", { name: "Update", exact: true }).click();
      await expect(root.getByLabel("Action result")).toHaveText("completed");
    } else {
      await root.getByRole("button", { name: "Show toast" }).click();
      await expect(root.locator(".m-toast")).toHaveCount(2);
      await root.getByRole("button", { name: "Dismiss Copied URL" }).click();
      await expect(root.locator(".m-toast")).toHaveCount(1);
    }
  },
  async pagination({ page, root }) {
    await expect(root.getByRole("button", { name: "Previous" })).toBeDisabled();
    const next = root.getByRole("button", { name: "Next" });
    await next.focus();
    await page.keyboard.press("Enter");
    await expect(root).toContainText("Page 2 of 5");
    await root.getByRole("button", { name: "Previous" }).click();
    await expect(root).toContainText("Page 1 of 5");
  },
  async faq({ page, root }) {
    const summary = root.locator("summary");
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(root.locator("details")).toHaveAttribute("open", "");
    await summary.click();
    await expect(root.locator("details")).not.toHaveAttribute("open");
  },
  async pricing({ root }) {
    await root.getByRole("button", { name: "Annual" }).click();
    await expect(root).toContainText("$16");
    await root.getByRole("button", { name: "Monthly" }).click();
    await expect(root).toContainText("$20");
  },
  async newsletter({ root }) {
    await root.getByLabel("Email address").fill("reader@example.com");
    await root.getByRole("button", { name: "Subscribe" }).click();
    await expect(root.getByLabel("Action result")).toHaveText("completed");
  },
  async "sign-in"({ page, root }) {
    const provider = root.getByRole("button", { name: "Continue with GitHub" });
    await provider.focus();
    await page.keyboard.press("Enter");
    await expect(root.getByLabel("Action result")).toHaveText("completed");
    const field = root.getByLabel("Email address");
    await field.fill("person@example.com");
    await expect(field).toHaveValue("person@example.com");
    await field.press("Enter");
    await expect(root.getByLabel("Submitted email")).toHaveText(
      "person@example.com",
    );
  },
  async navigation({ page, root, component }) {
    await page.setViewportSize({ width: 390, height: 900 });
    if (component.export === "MarketingHeader") {
      const opener = root.getByRole("button", { name: "Menu", exact: true });
      await opener.focus();
      await page.keyboard.press("Enter");
      await expect(opener).toHaveAttribute("aria-expanded", "true");
      await root.getByRole("link", { name: "Features", exact: true }).click();
      await expect(opener).toHaveAttribute("aria-expanded", "false");
    } else {
      const opener = root.getByRole("button", { name: "Open navigation" });
      await opener.focus();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(opener).toBeFocused();
    }
  },
};
