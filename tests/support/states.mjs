import { expect } from "@playwright/test";
import { overflow, tokenColor } from "./preview.mjs";

// Executable assertions for the declared example states. Every state a
// manifest declares (testing.states) must have an entry here, and each entry
// asserts what previews/StateFixture.tsx renders for it. `fixture` is the
// [data-state] wrapper; `scope` is where the component renders (the open
// dialog for ConfirmDialog).

/** A disabled control ignores pointer activation: the callback never runs. */
async function inert({ page, component, fixture, scope }) {
  const target =
    component.export === "ConfirmDialog"
      ? scope.getByRole("button", { name: "Confirm", exact: true })
      : scope.locator("button,input,textarea,select").first();
  await expect(target).toBeDisabled();
  const bounds = await target.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.click(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  await expect(fixture.getByLabel("Callback count")).toHaveText("0");
}

/**
 * The toned element and the document-level colour it must paint. The default
 * tone sets no data-tone, so it is found by its component class instead.
 */
async function toned({ page, fixture }, tone, background, ink) {
  const element =
    tone === "default"
      ? fixture
          .locator('.m-cta, .m-pricing-grid article[data-featured="true"]')
          .first()
      : fixture.locator("[data-tone]").first();
  if (tone === "default")
    await expect(element).not.toHaveAttribute("data-tone");
  else await expect(element).toHaveAttribute("data-tone", tone);
  const painted = await element.evaluate((el) => {
    const s = getComputedStyle(el);
    return [s.backgroundColor, s.color];
  });
  expect(painted).toEqual([
    await tokenColor(page, background),
    await tokenColor(page, ink),
  ]);
}

export const states = Object.freeze({
  disabled: inert,
  async loading(context) {
    const { component, scope } = context;
    if (component.export === "DataTable") {
      await expect(scope.locator(".m-table-state[role=status]")).toHaveText(
        "Loading records…",
      );
      return;
    }
    await inert(context);
    if (component.export === "SignInPanel") {
      await expect(scope.locator("form")).toHaveAttribute("aria-busy", "true");
      await expect(
        scope.getByRole("button", { name: "Email me a sign-in link" }),
      ).toBeDisabled();
    }
  },
  async error({ component, scope }) {
    await expect(scope.getByText("Check this value")).toBeVisible();
    if (component.export !== "DataTable")
      await expect(
        scope.locator("input,textarea,select,button[aria-invalid]"),
      ).toHaveAttribute("aria-invalid", "true");
  },
  async empty({ scope }) {
    await expect(scope.getByText("No records")).toBeVisible();
  },
  async long({ page }) {
    await overflow(page);
  },
  async success({ scope }) {
    await expect(scope.locator(".m-sign-in").getByRole("status")).toHaveText(
      "Check your inbox",
    );
  },
  // The default tone keeps the page surface; tone="inverse" remaps the tokens.
  async surface(context) {
    await toned(context, "default", "--m-surface", "--m-ink");
  },
  async inverse(context) {
    await toned(context, "inverse", "--m-inv-surface", "--m-inv-ink");
  },
  async "coming-soon"({ scope }) {
    const plan = scope.locator('article[data-availability="coming-soon"]');
    // Static availability text, not a live region.
    await expect(plan.locator(".m-pricing-availability")).toHaveText(
      "Coming soon",
    );
    await expect(plan.getByRole("status")).toHaveCount(0);
    await expect(plan.getByRole("link")).toHaveCount(0);
  },
  async "duplicate-links"({ page, scope }) {
    // Two labels share one href; both must render (no key collision drops one).
    await scope.getByRole("button", { name: "Menu", exact: true }).click();
    const nav = scope.getByRole("navigation", { name: "Primary" });
    for (const name of ["Pricing", "Plans"])
      await expect(
        nav.getByRole("link", { name, exact: true }),
      ).toHaveAttribute("href", "#pricing");
    await expect(nav.getByRole("link")).toHaveCount(2);
    await overflow(page);
  },
  async "heading-3"({ scope }) {
    await expect(
      scope.getByRole("heading", { name: "Product", level: 3 }),
    ).toBeVisible();
    await expect(scope.getByRole("heading", { level: 2 })).toHaveCount(0);
  },
  async "scope-container"({ page, fixture }) {
    // Each container paints its own appearance; the document keeps its own.
    const containers = fixture.locator("[data-mortar-appearance]");
    await expect(containers).toHaveCount(2);
    await expect(containers.nth(0)).toHaveAttribute(
      "data-mortar-appearance",
      "light",
    );
    await expect(containers.nth(1)).toHaveAttribute(
      "data-mortar-appearance",
      "dark",
    );
    await expect(page.locator("html")).toHaveAttribute(
      "data-mortar-appearance",
      "light",
    );
    const paper = await Promise.all(
      [0, 1].map((i) => tokenColor(page, "--m-paper", containers.nth(i))),
    );
    expect(paper[0]).toBe(await tokenColor(page, "--m-paper"));
    expect(paper[1]).not.toBe(paper[0]);
  },
  async controlled({ page, scope }) {
    // A controlled AppearanceControl reports through onChange and leaves the
    // document appearance to its owner.
    const dark = scope.getByRole("button", { name: "Dark", exact: true });
    await expect(
      scope.getByRole("button", { name: "Light", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await dark.click();
    await expect(dark).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("html")).toHaveAttribute(
      "data-mortar-appearance",
      "light",
    );
  },
});
