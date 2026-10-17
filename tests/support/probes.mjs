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
  async "button-group"({ page, root }) {
    const group = root.getByRole("group", { name: "Record actions" });
    const duplicate = group.getByRole("button", { name: "Duplicate" });
    await group.getByRole("button", { name: "Copy" }).focus();
    await page.keyboard.press("Tab");
    await expect(duplicate).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(root.getByLabel("Last action")).toHaveText("Duplicate");
    await expect(group.getByRole("button", { name: "Archive" })).toBeDisabled();
    await root.getByRole("button", { name: "Next", exact: true }).click();
    await expect(root.getByLabel("Last action")).toHaveText("Next");
    await root.getByRole("link", { name: "Docs" }).click();
    await expect(page).toHaveURL(/#docs$/);
  },
  async link({ page, root }) {
    const link = root.getByRole("link", { name: "Explore" });
    await link.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#example$/);
  },
  async input({ page, root }) {
    const field = root.getByLabel("Project name");
    await field.fill("Changed");
    await expect(field).toHaveValue("Changed");
    // Input groups: icons are decorative, the attached action is its own control.
    const search = root.getByRole("searchbox", { name: "Search candidates" });
    await search.fill("ana");
    await expect(search).toHaveValue("ana");
    const sort = root.getByRole("button", { name: "Sort" });
    await page.keyboard.press("Tab");
    await expect(sort).toBeFocused();
    await page.keyboard.press("Space");
    await expect(sort).toHaveAttribute("aria-pressed", "true");
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
  async listbox({ page, root }) {
    const button = root.getByRole("button", { name: /^Assigned to/ });
    await expect(button).toHaveAccessibleName(/Wade Cooper/);
    await expect(button).toHaveAccessibleDescription(/Only people/);
    await button.focus();
    // Like a native select: Space or ArrowDown opens; Enter submits the form.
    await page.keyboard.press("Space");
    const list = page.getByRole("listbox");
    await expect(list).toBeVisible();
    await expect(
      list.getByRole("option", { name: "Devon Webb Support" }),
    ).toHaveAttribute("aria-disabled", "true");
    await page.keyboard.press("Escape");
    await expect(list).toHaveCount(0);
    await expect(button).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(
      list.getByRole("option", { name: /Wade Cooper/ }),
    ).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(root.getByLabel("Selected value")).toHaveText("arlene");
    await expect(button).toBeFocused();
    await button.click();
    await page.getByRole("option", { name: /Tom Cook/ }).click();
    await expect(root.getByLabel("Selected value")).toHaveText("tom");
    await expect(button).toHaveAccessibleName(/Tom Cook/);
  },
  async combobox({ page, root }) {
    const input = root.getByRole("combobox", { name: "Assigned to" });
    await expect(input).toHaveValue("Wade Cooper");
    await expect(input).toHaveAccessibleDescription(/Only people/);
    await input.fill("lind");
    await expect(page.getByRole("option")).toHaveCount(1);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(root.getByLabel("Selected value")).toHaveText("lindsay");
    await expect(input).toHaveValue("Lindsay Walton");
    await input.fill("zzz");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await expect(root.getByRole("status").first()).toHaveText("No matches");
    await page.keyboard.press("Escape");
    await input.blur();
    await expect(input).toHaveValue("Lindsay Walton");
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
    await root.getByRole("button", { name: "Email me a sign-in link" }).click();
    await expect(root.getByLabel("Submitted email")).toHaveText("none");
    await field.fill("not-an-email");
    await field.press("Enter");
    await expect(root.getByLabel("Submitted email")).toHaveText("none");
    await expect(field).toBeFocused();
    await field.fill("person@example.com");
    await expect(field).toHaveValue("person@example.com");
    await field.press("Enter");
    await expect(root.getByLabel("Submitted email")).toHaveText(
      "person@example.com",
    );
  },
  async "table-sort"({ page, root }) {
    const names = root.locator("tbody th[scope=row]");
    const header = root.getByRole("columnheader", { name: "Name" });
    await expect(header).toHaveAttribute("aria-sort", "ascending");
    await expect(names).toHaveText(["Acme", "Northwind", "Zephyr"]);
    const sortName = root.getByRole("button", { name: "Name", exact: true });
    await sortName.focus();
    await page.keyboard.press("Enter");
    await expect(header).toHaveAttribute("aria-sort", "descending");
    await expect(names).toHaveText(["Zephyr", "Northwind", "Acme"]);
    await root.getByRole("button", { name: "Requests", exact: true }).click();
    await expect(header).toHaveAttribute("aria-sort", "none");
    await expect(
      root.getByRole("columnheader", { name: "Requests" }),
    ).toHaveAttribute("aria-sort", "ascending");
    await expect(names).toHaveText(["Acme", "Zephyr", "Northwind"]);
    const select = root.getByRole("checkbox", { name: "Select Zephyr" });
    await select.click();
    await expect(select).toBeChecked();
    await expect(root.getByText("1 selected")).toBeVisible();
    const edit = root.getByRole("button", { name: "Edit Acme", exact: true });
    await edit.click();
    await expect(root.getByText("Page 2 of 3")).toBeVisible();
    await expect(page).not.toHaveURL(/#project-acme$/);
    await root.getByRole("button", { name: "Previous" }).click();
    await edit.focus();
    await page.keyboard.press("Enter");
    await expect(root.getByText("Page 2 of 3")).toBeVisible();
    await root.getByRole("link", { name: "Acme" }).click();
    await expect(page).toHaveURL(/#project-acme$/);
  },
  async navbar({ page, root }) {
    const nav = root.getByRole("navigation", { name: "Primary" });
    await expect(nav.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await page.setViewportSize({ width: 390, height: 900 });
    const opener = root.getByRole("button", { name: "Menu", exact: true });
    await expect(nav).toBeHidden();
    await opener.focus();
    await page.keyboard.press("Enter");
    await expect(opener).toHaveAttribute("aria-expanded", "true");
    await expect(nav).toBeVisible();
    await nav.getByRole("link", { name: "Team" }).click();
    await expect(page).toHaveURL(/#team$/);
    await expect(opener).toHaveAttribute("aria-expanded", "false");
    await expect(nav).toBeHidden();
  },
  async banner({ page, root }) {
    const banner = root.getByRole("region", { name: "Announcement" });
    await expect(
      banner.getByRole("link", { name: /Read the release notes/ }),
    ).toHaveAttribute("href", "#release");
    await expect(
      root
        .getByRole("region", { name: "Maintenance notice" })
        .getByRole("button"),
    ).toHaveCount(0);
    await banner.getByRole("button", { name: "Dismiss announcement" }).focus();
    await page.keyboard.press("Enter");
    await expect(banner).toHaveCount(0);
    await expect(root.getByLabel("Banner state")).toHaveText("dismissed");
    await root.getByRole("button", { name: "Show announcement" }).click();
    await expect(banner).toBeVisible();
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
