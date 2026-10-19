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
    await simple.getByRole("button", { name: "Previous" }).click();
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
    await calendar.getByRole("button", { name: "Next month" }).click();
    await expect(
      calendar.getByRole("heading", { name: "November 2026" }),
    ).toBeVisible();
    await expect(calendar.locator('[tabindex="0"]')).toHaveCount(1);
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
    const tuesday = week.getByRole("region", {
      name: "Tuesday, 20 October 2026",
    });
    await expect(tuesday.getByRole("listitem")).toHaveCount(3);
    await tuesday.getByRole("button", { name: /Design review/ }).click();
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
    await root.getByRole("radio", { name: "Black" }).check();
    await root.getByRole("button", { name: "Add to bag" }).click();
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
    await expect(
      colour.getByRole("checkbox", { name: /Black/ }),
    ).not.toBeChecked();
    await root.getByRole("checkbox", { name: /Kitchen/ }).check();
    await root.getByRole("button", { name: "Clear all" }).click();
    await expect(applied).toHaveText("none");
    await expect(chips).toHaveCount(0);
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
    await root.getByRole("button", { name: "Remove Stoneware mug" }).click();
    await expect(root.getByText("Your bag is empty")).toBeVisible();
    await expect(
      root.getByRole("link", { name: "Continue shopping" }),
    ).toBeVisible();
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
  },
  async navigation({ page, root, component }) {
    await page.setViewportSize({ width: 390, height: 900 });
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
    } else {
      // DocsShell's visible "Menu" is its accessible name (label in name).
      // AppShell keeps "Open navigation" until its family adopts the same fix.
      const docs = component.export === "DocsShell";
      const opener = root.getByRole("button", {
        name: docs ? "Menu" : /^(Menu|Open navigation)$/,
        exact: docs || undefined,
      });
      if (docs) await expect(opener).toHaveAttribute("aria-haspopup", "dialog");
      await opener.focus();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(opener).toBeFocused();
    }
  },
};
