import { expect } from "@playwright/test";
import { openOverlay } from "./preview.mjs";
export const implementations = {
  async composer({ page, root }) {
    const field = root.getByLabel("Add your comment", { exact: true });
    const send = root.getByRole("button", { name: "Comment", exact: true });
    const posted = root.getByRole("list", { name: "Posted comments" });
    await expect(send).toBeDisabled();
    await expect(
      root.getByRole("button", { name: "Attach a file" }),
    ).toBeVisible();
    await field.fill("   ");
    await expect(send).toBeDisabled();
    await field.fill("Looks good");
    await expect(root.getByText("10 / 280")).toBeVisible();
    await expect(send).toBeEnabled();
    // Ctrl+Enter submits and clears the uncontrolled composer.
    await field.press("Control+Enter");
    await expect(posted.getByRole("listitem")).toHaveText(["Looks good"]);
    await expect(field).toHaveValue("");
    await field.fill("Ship it");
    await root.getByRole("tab", { name: "Preview" }).click();
    await expect(root.getByRole("tabpanel")).toHaveText("Ship it");
    await root.getByRole("tab", { name: "Write" }).click();
    await expect(field).toHaveValue("Ship it");
    await send.click();
    await expect(posted.getByRole("listitem")).toHaveText([
      "Looks good",
      "Ship it",
    ]);
  },
  async notice({ page, root }) {
    const notice = root.getByText("Payment failed");
    await expect(
      root.getByRole("link", { name: "Update billing" }),
    ).toBeVisible();
    const dismiss = root.getByRole("button", {
      name: "Dismiss Payment failed",
    });
    await dismiss.focus();
    await page.keyboard.press("Enter");
    await expect(notice).toHaveCount(0);
    await root.getByRole("button", { name: "Show payment notice" }).click();
    await expect(notice).toBeVisible();
  },
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
    await expect(
      root.getByRole("checkbox", { name: "Comments" }),
    ).toHaveAccessibleDescription(
      "Get notified when someone comments on your post.",
    );
    const input = root.getByRole("checkbox", { name: "Email notifications" });
    await input.focus();
    await page.keyboard.press("Space");
    await expect(input).toBeChecked();
    await input.click();
    await expect(input).not.toBeChecked();
  },
  async switch({ page, root }) {
    await expect(
      root.getByRole("switch", { name: "Annual billing" }),
    ).toHaveAccessibleDescription("Save 10% when you pay for a year up front.");
    const input = root.getByRole("switch", { name: "Automatic updates" });
    await input.focus();
    await page.keyboard.press("Space");
    await expect(input).toBeChecked();
    await input.click();
    await expect(input).not.toBeChecked();
  },
  async radio({ page, root }) {
    const chosen = root.getByLabel("Chosen options");
    const memory = root.getByRole("group", { name: "Memory" });
    await expect(memory.getByRole("radio", { name: /64 GB/ })).toBeDisabled();
    await memory.getByRole("radio", { name: /32 GB/ }).check();
    await expect(chosen).toHaveText("32 · slate");
    const colour = root.getByRole("group", { name: "Colour" });
    await colour.getByRole("radio", { name: "Slate" }).focus();
    await page.keyboard.press("ArrowLeft");
    await expect(colour.getByRole("radio", { name: "Sky" })).toBeChecked();
    await expect(chosen).toHaveText("32 · sky");
    const radios = root.getByRole("group", { name: "Plan" }).getByRole("radio");
    await radios.first().focus();
    await page.keyboard.press("ArrowDown");
    await expect(radios.nth(1)).toBeChecked();
    await radios.first().click();
    await expect(radios.first()).toBeChecked();
  },
  async tabs({ page, root }) {
    await expect(root.getByRole("tab", { name: "Activity 12" })).toBeVisible();
    const tabs = root.getByRole("tab");
    await tabs.first().focus();
    await page.keyboard.press("ArrowRight");
    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(root.getByRole("tabpanel").first()).toContainText("Activity");
    await tabs.first().click();
    await expect(root.getByRole("tabpanel").first()).toContainText("Overview");
    const pills = root.getByRole("tablist", { name: "Account sections" });
    await pills.getByRole("tab", { name: "Billing" }).click();
    await expect(root.getByRole("tabpanel", { name: "Billing" })).toBeVisible();
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
    // Icon-only trigger keeps its label as the accessible name; sections are labelled groups.
    const more = root.getByRole("button", { name: "More options" });
    await more.click();
    const menu = page.getByRole("menu");
    await expect(menu.getByRole("group", { name: "Project" })).toBeVisible();
    await expect(menu.getByRole("separator")).toHaveCount(1);
    await menu.getByRole("menuitem", { name: /Edit/ }).click();
    await expect(root.getByLabel("Menu choice")).toHaveText("edit");
    await expect(menu).toHaveCount(0);
    await more.click();
    await menu.getByRole("menuitem", { name: "Documentation" }).click();
    await expect(page).toHaveURL(/#docs$/);
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
    const simple = root.getByRole("navigation", { name: "Pagination" });
    await expect(
      simple.getByRole("button", { name: "Previous" }),
    ).toBeDisabled();
    const next = simple.getByRole("button", { name: "Next" });
    await next.focus();
    await page.keyboard.press("Enter");
    await expect(simple).toContainText("Page 2 of 5");
    // Reaching the first page keeps focus on Previous instead of the body.
    const previous = simple.getByRole("button", { name: "Previous" });
    await previous.focus();
    await page.keyboard.press("Enter");
    await expect(simple).toContainText("Page 1 of 5");
    await expect(previous).toBeFocused();
    await expect(previous).toHaveAttribute("aria-disabled", "true");
    await page.keyboard.press("Enter");
    await expect(simple).toContainText("Page 1 of 5");
    const results = root.getByRole("navigation", { name: "Results pages" });
    await expect(
      results.getByRole("button", { name: "Page 6" }),
    ).toHaveAttribute("aria-current", "page");
    await results.getByRole("button", { name: "Page 12" }).click();
    await expect(results).toContainText("Showing 111 to 114 of 114 results");
    await expect(results.getByRole("button", { name: "Next" })).toBeDisabled();
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
  async newsletter({ root: preview }) {
    // The preview also shows the centred panel; exercise the first form.
    const root = preview.locator(".m-newsletter").first();
    // The status region is mounted before the message so it is announced.
    const status = root.getByRole("status");
    await expect(status).toHaveText("");
    await root.getByLabel("Email address").fill("reader@example.com");
    await root.getByRole("button", { name: "Subscribe" }).click();
    await expect(preview.getByLabel("Action result")).toHaveText("completed");
    await expect(status).toHaveText("Thanks. Check your inbox to confirm.");
    // The panel variant keeps the same labelled field and status region.
    const panel = preview.locator('.m-newsletter[data-variant="panel"]');
    await expect(panel.getByLabel("Email address")).toBeVisible();
    await expect(panel.getByRole("status")).toHaveText("");
  },
  async providers({ page, root }) {
    const group = root.getByRole("group", { name: "Sign in with" });
    const google = group.getByRole("button", { name: "Continue with Google" });
    await group.getByRole("button", { name: "Continue with GitHub" }).focus();
    await page.keyboard.press("Tab");
    await expect(google).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(root.getByLabel("Chosen provider")).toHaveText("google");
    await root.getByRole("button", { name: "SSO", exact: true }).click();
    await expect(root.getByLabel("Chosen provider")).toHaveText("sso");
  },
  async password({ page, root }) {
    const field = root.getByLabel("Password", { exact: true });
    const toggle = root
      .locator(".m-password")
      .first()
      .getByRole("button", { name: "Show password" });
    await expect(field).toHaveAttribute("type", "password");
    await expect(field).toHaveAttribute("autocomplete", "current-password");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await field.fill("hunter2");
    // A pointer press shows the password and leaves focus in the field.
    await toggle.click();
    await expect(field).toHaveAttribute("type", "text");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(field).toBeFocused();
    await page.keyboard.type("!");
    await expect(field).toHaveValue("hunter2!");
    // From the keyboard, the toggle keeps its own focus.
    await page.keyboard.press("Tab");
    await expect(toggle).toBeFocused();
    await page.keyboard.press("Space");
    await expect(field).toHaveAttribute("type", "password");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(toggle).toBeFocused();
    // New password: requirements are listed up front and update as you type.
    const created = root.getByLabel("New password");
    await expect(created).toHaveAttribute("autocomplete", "new-password");
    const rules = root.getByRole("list", { name: "Password requirements" });
    await expect(rules.getByRole("listitem")).toHaveText([
      "At least 12 characters, not met",
      "Upper and lower case letters, not met",
      "A number or symbol, not met",
    ]);
    const status = root.locator(".m-password").nth(1).getByRole("status");
    await expect(status).toHaveText("");
    await created.fill("Abc");
    await expect(rules.getByRole("listitem").nth(1)).toHaveText(
      "Upper and lower case letters, met",
    );
    // Partial progress is not announced.
    await expect(status).toHaveText("");
    await created.pressSequentially("defghij9k");
    await expect(rules.getByRole("listitem")).toHaveText([
      "At least 12 characters, met",
      "Upper and lower case letters, met",
      "A number or symbol, met",
    ]);
    await expect(status).toHaveText("All password requirements met.");
    await expect(
      root.getByRole("meter", { name: "Password strength" }),
    ).toHaveAttribute("aria-valuetext", "Strong");
    await created.press("Backspace");
    await created.press("Backspace");
    await expect(status).toHaveText(
      "Password no longer meets every requirement.",
    );
    // Paste is never blocked.
    await created.fill("");
    await created.focus();
    await page.keyboard.insertText("Pasted-Password-1");
    await expect(created).toHaveValue("Pasted-Password-1");
  },
  async code({ page, root }) {
    const field = root.getByLabel("Verification code");
    const cells = root.locator(".m-code-input").first().locator(".m-code-cell");
    await expect(field).toHaveAttribute("autocomplete", "one-time-code");
    await expect(field).toHaveAttribute("inputmode", "numeric");
    await expect(field).toHaveAccessibleDescription(
      "Enter the 6-digit code we sent to ana@example.com.",
    );
    await expect(cells).toHaveCount(6);
    await field.focus();
    // Digits only: letters are dropped as you type.
    await page.keyboard.type("1a2b3");
    await expect(field).toHaveValue("123");
    await expect(cells.nth(2)).toHaveText("3");
    await expect(cells.nth(3)).toHaveAttribute("data-active", "true");
    await page.keyboard.press("Backspace");
    await expect(field).toHaveValue("12");
    await expect(cells.nth(2)).toHaveText("");
    await expect(root.getByLabel("Completed code")).toHaveText("none");
    // Pasting a formatted code fills every cell and completes once.
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.insertText("987 654");
    await expect(field).toHaveValue("987654");
    await expect(cells).toHaveText(["9", "8", "7", "6", "5", "4"]);
    await expect(root.getByLabel("Completed code")).toHaveText("987654");
    // Extra characters beyond the length are ignored.
    await page.keyboard.type("3");
    await expect(field).toHaveValue("987654");
    // Recovery codes accept letters and are upper-cased.
    const recovery = root.getByLabel("Recovery code");
    await expect(recovery).toHaveAttribute("inputmode", "text");
    await recovery.focus();
    await page.keyboard.insertText("ab12-cd34");
    await expect(recovery).toHaveValue("AB12CD34");
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
  async "table-sort"({ page, root: preview }) {
    // The preview also shows a grouped table; exercise the first (paginated) one.
    const root = preview.locator(".m-data-table").first();
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
    // Grouped rows: groups keep first-appearance order and sort within themselves.
    const grouped = preview.locator(".m-data-table").nth(1);
    const people = grouped.locator("tbody th[scope=row]");
    await expect(grouped.locator(".m-table-group th")).toHaveText([
      "Edinburgh",
      "London",
    ]);
    await expect(people).toHaveText([
      "Courtney Henry",
      "Lindsay Walton",
      "Leonard Krasner",
      "Tom Cook",
      "Whitney Francis",
    ]);
    await grouped.getByRole("button", { name: "Name", exact: true }).click();
    await expect(people).toHaveText([
      "Lindsay Walton",
      "Courtney Henry",
      "Whitney Francis",
      "Tom Cook",
      "Leonard Krasner",
    ]);
    await grouped.getByRole("checkbox", { name: "Select all rows" }).click();
    await expect(grouped.getByText("5 selected")).toBeVisible();
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
  async calendar({ page, root }) {
    const calendar = root.locator(".m-calendar").first();
    const day = (name) =>
      calendar.getByRole("button", { name: new RegExp(`^${name}`) });
    await expect(calendar.locator('[tabindex="0"]')).toHaveCount(1);
    await expect(
      calendar.getByRole("gridcell", { selected: true }),
    ).toHaveCount(1);
    await day("Tuesday, 20 October 2026").focus();
    await page.keyboard.press("ArrowRight");
    await expect(day("Wednesday, 21 October 2026")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(day("Wednesday, 28 October 2026")).toBeFocused();
    await page.keyboard.press("End");
    await expect(day("Sunday, 1 November 2026")).toBeFocused();
    await expect(
      calendar.getByRole("heading", { name: "November 2026" }),
    ).toBeVisible();
    await page.keyboard.press("PageUp");
    await expect(day("Thursday, 1 October 2026")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(root.getByLabel("Selected date")).toHaveText("2026-10-01");
    await expect(day("Thursday, 1 October 2026")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await calendar.getByRole("button", { name: "Next month" }).click();
    await expect(
      calendar.getByRole("heading", { name: "November 2026" }),
    ).toBeVisible();
    await expect(calendar.locator('[tabindex="0"]')).toHaveCount(1);
    // A changed `selected` prop brings its month into view with the day focusable.
    await root.getByRole("button", { name: "Select 3 December" }).click();
    await expect(
      calendar.getByRole("heading", { name: "December 2026" }),
    ).toBeVisible();
    await expect(day("Thursday, 3 December 2026")).toHaveAttribute(
      "tabindex",
      "0",
    );
    // The full variant names each day's events through aria-describedby.
    const busy = root
      .locator(".m-calendar")
      .nth(1)
      .getByRole("button", { name: "Tuesday, 20 October 2026, 3 events" });
    await expect(busy).toHaveAccessibleDescription(
      /10:00 Customer call.*15:00 Team retro.*\+1 more/,
    );
    // Week view: labelled day sections, selectable events, paging and the view switcher.
    const week = root.locator(".m-calendar").nth(2);
    // The header (title, switcher, arrows) must stay within the calendar on phones.
    await page.setViewportSize({ width: 390, height: 900 });
    const next = week.getByRole("button", { name: "Next week" });
    const [box, nextBox] = await Promise.all([
      week.boundingBox(),
      next.boundingBox(),
    ]);
    expect(nextBox.x + nextBox.width).toBeLessThanOrEqual(
      box.x + box.width + 1,
    );
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(week.getByRole("heading", { level: 2 })).toHaveText(
      /19\s.\s25 October 2026/,
    );
    // Days are named groups, not seven landmarks.
    await expect(week.getByRole("region")).toHaveCount(0);
    const tuesday = week.getByRole("group", {
      name: "Tuesday, 20 October 2026",
    });
    await expect(tuesday.getByRole("listitem")).toHaveCount(3);
    // Title and time are separate words in the event's name.
    await tuesday
      .getByRole("button", { name: "Design review 10:30–12:00", exact: true })
      .click();
    await expect(root.getByLabel("Opened event")).toHaveText("Design review");
    await expect(
      week.getByRole("heading", { name: "Wednesday, 21 October 2026" }),
    ).toHaveAttribute("aria-current", "date");
    await week.getByRole("button", { name: "Next week" }).click();
    await expect(week.getByRole("heading", { level: 2 })).toHaveText(
      /26 October\s.\s1 November 2026/,
    );
    await expect(
      week.getByRole("button", { name: /Board prep/ }),
    ).toBeVisible();
    await week.getByRole("button", { name: "Previous week" }).click();
    await week
      .getByRole("group", { name: "Calendar view" })
      .getByRole("button", { name: "Day" })
      .click();
    await expect(week.getByRole("heading", { level: 2 })).toHaveText(
      "Tuesday, 20 October 2026",
    );
    await week.getByRole("button", { name: "Next day" }).click();
    await expect(week.getByRole("heading", { level: 2 })).toHaveText(
      "Wednesday, 21 October 2026",
    );
    await expect(
      week.getByRole("list", { name: "All day" }).getByText("Offsite"),
    ).toBeVisible();
    // Year view: twelve months, one tab stop, arrows cross month boundaries.
    await week
      .getByRole("group", { name: "Calendar view" })
      .getByRole("button", { name: "Year" })
      .click();
    await expect(week.getByRole("heading", { level: 2 })).toHaveText("2026");
    await expect(week.getByRole("heading", { level: 3 })).toHaveCount(12);
    await expect(week.locator('[tabindex="0"]')).toHaveCount(1);
    const yearDay = (name) =>
      week.getByRole("button", { name: new RegExp(`^${name}`) });
    await expect(yearDay("Tuesday, 20 October 2026")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await yearDay("Saturday, 31 October 2026").focus();
    await page.keyboard.press("ArrowRight");
    await expect(yearDay("Sunday, 1 November 2026")).toBeFocused();
    await page.keyboard.press("PageDown");
    await expect(yearDay("Tuesday, 1 December 2026")).toBeFocused();
    await week.getByRole("button", { name: "Next year" }).click();
    await expect(week.getByRole("heading", { level: 2 })).toHaveText("2027");
    await expect(week.locator('[tabindex="0"]')).toHaveCount(1);
    // One current date across views: months paged in the month view carry
    // over to the week view (it used to show the week it started on).
    const switchTo = (name) =>
      week
        .getByRole("group", { name: "Calendar view" })
        .getByRole("button", { name })
        .click();
    await switchTo("Month");
    await expect(week.getByRole("heading", { level: 2 })).toHaveText(
      "December 2027",
    );
    for (let i = 0; i < 3; i++)
      await week.getByRole("button", { name: "Next month" }).click();
    await expect(week.getByRole("heading", { level: 2 })).toHaveText(
      "March 2028",
    );
    await switchTo("Week");
    await expect(week.getByRole("heading", { level: 2 })).toHaveText(
      /28 February\s.\s5 March 2028/,
    );
    await switchTo("Year");
    await expect(week.getByRole("heading", { level: 2 })).toHaveText("2028");
    // Agenda: the selected day's meetings, in time order, follow the selection.
    const small = root.locator(".m-calendar").nth(3);
    const agenda = small.getByRole("region", { name: /^Schedule for/ });
    await expect(agenda).toHaveAccessibleName(
      "Schedule for Wednesday, 21 October 2026",
    );
    await expect(agenda.getByRole("listitem")).toHaveCount(2);
    await expect(agenda.getByRole("button").first()).toHaveAccessibleName(
      "Michael Foster 09:00–10:00",
    );
    // Wide: the agenda sits beside the month; narrow: below it.
    const [monthBox, agendaBox] = await Promise.all([
      small.locator(".m-calendar-main").boundingBox(),
      agenda.boundingBox(),
    ]);
    expect(agendaBox.x).toBeGreaterThan(monthBox.x + monthBox.width - 1);
    await small
      .getByRole("button", { name: /^Thursday, 22 October 2026/ })
      .click();
    await expect(agenda).toHaveAccessibleName(
      "Schedule for Thursday, 22 October 2026",
    );
    await agenda.getByRole("button", { name: /Dries Vincent/ }).click();
    await expect(root.getByLabel("Opened event")).toHaveText("Dries Vincent");
    await small
      .getByRole("button", { name: /^Friday, 23 October 2026/ })
      .focus();
    await page.keyboard.press("Enter");
    await expect(agenda.getByText("No events")).toBeVisible();
    await page.setViewportSize({ width: 390, height: 900 });
    const [narrowMonth, narrowAgenda] = await Promise.all([
      small.locator(".m-calendar-main").boundingBox(),
      agenda.boundingBox(),
    ]);
    expect(narrowAgenda.y).toBeGreaterThan(
      narrowMonth.y + narrowMonth.height - 1,
    );
    await page.setViewportSize({ width: 1280, height: 900 });
  },
  async product({ page, root }) {
    const bag = root.getByLabel("Bag", { exact: true });
    const thumbs = root.getByRole("group", { name: "Product images" });
    const second = thumbs.getByRole("button", { name: /Show image 2 of 3/ });
    await second.click();
    await expect(second).toHaveAttribute("aria-pressed", "true");
    await expect(
      root.locator(
        ".m-product-gallery:not([data-gallery]) > .m-product-image img",
      ),
    ).toHaveAttribute("alt", "Natural canvas tote bag, in use");
    // Options are native radio groups: arrow keys move the choice.
    const sizes = root.getByRole("group", { name: "Size" });
    await sizes.getByRole("radio", { name: "Large" }).focus();
    await page.keyboard.press("ArrowLeft");
    await expect(sizes.getByRole("radio", { name: "Small" })).toBeChecked();
    await expect(sizes.getByRole("radio", { name: "Travel" })).toBeDisabled();
    // Black swaps the gallery to the black tote's photos, from the first one.
    await root.getByRole("radio", { name: "Black" }).check();
    await expect(
      root.locator(
        ".m-product-gallery:not([data-gallery]) > .m-product-image img",
      ),
    ).toHaveAttribute("alt", "Black canvas tote bag, front");
    await expect(
      thumbs.getByRole("button", { name: /Show image 1 of 2/ }),
    ).toHaveAttribute("aria-pressed", "true");
    const add = root.getByRole("button", { name: "Add to bag" });
    await expect(add).toHaveAttribute("type", "submit");
    await add.click();
    await expect(bag).toHaveText("1 added · black · small");
  },
  async filters({ page, root }) {
    const applied = root.getByLabel("Applied filters");
    await expect(applied).toHaveText("colour: black");
    const colour = root.getByRole("group", { name: "Colour" });
    const sage = colour.getByRole("checkbox", { name: /Sage/ });
    await sage.focus();
    await page.keyboard.press("Space");
    await expect(applied).toHaveText("colour: black, sage");
    const chips = root.getByRole("group", { name: "Active filters" });
    await chips.getByRole("button", { name: "Remove Black" }).click();
    await expect(applied).toHaveText("colour: sage");
    // Focus moves to the chip that took the removed one's place.
    await expect(
      chips.getByRole("button", { name: "Remove Sage" }),
    ).toBeFocused();
    await expect(
      colour.getByRole("checkbox", { name: /Black/ }),
    ).not.toBeChecked();
    // Clear all is one change: a consumer that replaces its state with the
    // value it receives clears every facet, not just the last one.
    await root.getByRole("checkbox", { name: /Kitchen/ }).check();
    await expect(applied).toHaveText("colour: sage; category: kitchen");
    await root.getByRole("button", { name: "Clear all" }).click();
    await expect(applied).toHaveText("none");
    await expect(chips).toHaveCount(0);
    await expect(root.locator("summary").first()).toBeFocused();
    // Facets are native disclosures.
    await root.locator("summary", { hasText: "Category" }).click();
    await expect(root.getByRole("checkbox", { name: /Kitchen/ })).toBeHidden();
  },
  async cart({ root }) {
    const count = root.getByLabel("Bag count");
    await expect(count).toHaveText("3");
    await root.getByLabel("Quantity, Stoneware mug").selectOption("4");
    await expect(count).toHaveText("5");
    await root.getByRole("button", { name: "Remove Canvas tote" }).click();
    await expect(root.getByRole("link", { name: "Canvas tote" })).toHaveCount(
      0,
    );
    await expect(count).toHaveText("4");
    // Focus stays in the cart: on the line that moved up, then the empty state.
    const removeMug = root.getByRole("button", {
      name: "Remove Stoneware mug",
    });
    await expect(removeMug).toBeFocused();
    await removeMug.click();
    await expect(root.getByText("Your bag is empty")).toBeVisible();
    await expect(root.locator(".m-cart-empty")).toBeFocused();
    await expect(
      root.getByRole("link", { name: "Continue shopping" }),
    ).toBeVisible();
    // The bag with a summary column and related products.
    const layout = root.locator(".m-cart-layout");
    const related = layout.getByRole("region", { name: "You may also like" });
    await expect(
      related
        .getByRole("list", { name: "You may also like" })
        .getByRole("heading", { level: 3 }),
    ).toHaveCount(4);
    const summary = layout.getByRole("region", { name: "Your order" });
    await expect(
      summary.getByRole("link", { name: "How shipping is worked out" }),
    ).toBeVisible();
    await layout.getByLabel("Quantity, Organic tee").selectOption("2");
    await expect(layout.getByLabel("Quantity, Organic tee")).toHaveValue("2");
    const [lines, side] = await Promise.all([
      layout.locator(".m-cart").boundingBox(),
      summary.boundingBox(),
    ]);
    expect(side.x).toBeGreaterThan(lines.x + lines.width - 1);
  },
  async sidebar({ page, root }) {
    const reports = root.locator("summary", { hasText: "Reports" });
    const revenue = root.getByRole("link", { name: "Revenue" });
    await expect(revenue).toBeHidden();
    await reports.focus();
    await page.keyboard.press("Enter");
    await expect(revenue).toBeVisible();
    await revenue.click();
    await expect(page).toHaveURL(/#revenue$/);
    await reports.click();
    await expect(revenue).toBeHidden();
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
    // The bottom banner is fixed (inside the example frame) and always has a way out.
    const notice = root.getByRole("region", { name: "Cookie notice" });
    await expect(notice).toHaveCSS("position", "fixed");
    const dismiss = notice.getByRole("button", {
      name: "Dismiss cookie notice",
    });
    await dismiss.focus();
    await page.keyboard.press("Enter");
    await expect(notice).toHaveCount(0);
    // Focus moves on to the next control, not the page body.
    expect(
      await page.evaluate(() => document.activeElement !== document.body),
    ).toBe(true);
    await root.getByRole("button", { name: "Show cookie notice" }).click();
    await expect(notice).toBeVisible();
  },
  async navigation({ page, root: preview, component }) {
    await page.setViewportSize({ width: 390, height: 900 });
    // The MarketingHeader preview also shows a centred header; its own checks follow.
    const root =
      component.export === "MarketingHeader"
        ? preview.locator(".m-marketing-header").first()
        : preview;
    if (component.export === "MarketingHeader") {
      // Flyout groups are disclosures: keyboard opens, Escape closes and returns focus.
      await page.setViewportSize({ width: 1280, height: 900 });
      const product = root.getByRole("button", { name: "Product" });
      await product.focus();
      await page.keyboard.press("Enter");
      await expect(product).toHaveAttribute("aria-expanded", "true");
      await expect(page.getByRole("link", { name: /Analytics/ })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(product).toHaveAttribute("aria-expanded", "false");
      await expect(product).toBeFocused();
      await product.click();
      await page.getByRole("link", { name: /Inbox/ }).click();
      await expect(page).toHaveURL(/#inbox$/);
      await expect(product).toHaveAttribute("aria-expanded", "false");
      await page.setViewportSize({ width: 390, height: 900 });
      const opener = root.getByRole("button", { name: "Menu", exact: true });
      await opener.focus();
      await page.keyboard.press("Enter");
      await expect(opener).toHaveAttribute("aria-expanded", "true");
      await root.getByRole("link", { name: "Features", exact: true }).click();
      await expect(opener).toHaveAttribute("aria-expanded", "false");

      // Centred header: the brand sits between the links and the actions.
      const atlas = preview.locator(".m-marketing-header").nth(1);
      await page.setViewportSize({ width: 1280, height: 900 });
      const [links, brand, actions] = await Promise.all(
        ["nav", ".m-brand", ".m-actions"].map((selector) =>
          atlas.locator(`:scope > ${selector}`).boundingBox(),
        ),
      );
      expect(links.x + links.width).toBeLessThanOrEqual(brand.x);
      expect(brand.x + brand.width).toBeLessThanOrEqual(actions.x);
      // A full-width flyout spans the viewport less its padding; a two-column one lays out in two columns.
      const solutions = atlas.getByRole("button", { name: "Solutions" });
      await solutions.click();
      const full = page.locator('.m-flyout-panel[data-layout="full"]');
      await expect(full.getByRole("link", { name: /Retail/ })).toBeVisible();
      const fullBox = await full.boundingBox();
      expect(fullBox.width).toBeGreaterThanOrEqual(1240);
      expect(fullBox.x).toBeGreaterThanOrEqual(0);
      expect(fullBox.x + fullBox.width).toBeLessThanOrEqual(1280);
      await expect(
        full.getByRole("link", { name: "Book a demo" }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(solutions).toBeFocused();
      await atlas.getByRole("button", { name: "Resources" }).click();
      const columns = page.locator('.m-flyout-panel[data-layout="columns"]');
      const [guides, api] = await Promise.all(
        [/Guides/, /API/].map((name) =>
          columns.getByRole("link", { name }).boundingBox(),
        ),
      );
      expect(Math.abs(guides.y - api.y)).toBeLessThanOrEqual(1);
      await expect(columns.getByRole("link", { name: "Status" })).toBeVisible();
      await page.keyboard.press("Escape");

      // Panel menu: a full-screen dialog that traps focus and returns it.
      await page.setViewportSize({ width: 390, height: 900 });
      const menu = atlas.getByRole("button", { name: "Menu", exact: true });
      await expect(menu).toHaveAttribute("aria-haspopup", "dialog");
      await menu.focus();
      await page.keyboard.press("Enter");
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      const box = await dialog.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(389);
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(menu).toBeFocused();
      await menu.click();
      await dialog.locator("summary", { hasText: "Resources" }).click();
      await dialog.getByRole("link", { name: "Guides" }).click();
      await expect(page).toHaveURL(/#guides$/);
      await expect(dialog).toHaveCount(0);
      await expect(menu).toHaveAttribute("aria-expanded", "false");
    } else {
      // Both shells name the opener by its visible text (label in name) and
      // announce the dialog it opens.
      const opener = root.getByRole("button", { name: "Menu", exact: true });
      await expect(opener).not.toHaveAttribute("aria-label");
      await expect(opener).toHaveAttribute("aria-haspopup", "dialog");
      await expect(opener).toHaveAttribute("aria-expanded", "false");
      await opener.focus();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(opener).toBeFocused();
    }
  },
};
