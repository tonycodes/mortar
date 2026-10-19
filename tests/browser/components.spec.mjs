import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { mount, accessibility, overflow } from "../support/preview.mjs";
import { implementations } from "../support/probes.mjs";
import { states } from "../support/states.mjs";
import { obligations } from "../../scripts/test-contract.mjs";
const { components } = JSON.parse(
  await readFile(new URL("../../catalog.json", import.meta.url), "utf8"),
);
for (const component of components) {
  for (const theme of ["light", "dark"]) {
    test(`${component.export} ${theme}`, async ({ page }, info) => {
      const { root, errors } = await mount(page, component, { theme });
      await expect(page.locator("html")).toHaveAttribute(
        "data-mortar-appearance",
        theme,
      );
      await accessibility(page, `[data-mortar-preview="${component.export}"]`);
      const t = component.testing;
      if (t.probe) await implementations[t.probe]({ page, root, component });
      if (t.profile === "composite") {
        for (const width of [390, 1280]) {
          await page.setViewportSize({ width, height: 900 });
          await overflow(page);
        }
      }
      expect(errors).toEqual([]);
      await info.attach("contract-evidence", {
        body: JSON.stringify({
          component: component.id,
          theme,
          obligations: obligations(component).filter(
            (o) => !o.startsWith("state:"),
          ),
        }),
        contentType: "application/json",
      });
    });
  }
  for (const state of component.testing.states) {
    test(`${component.export} state:${state}`, async ({ page }, info) => {
      // A declared state without a registered assertion would pass vacuously.
      const assertState = states[state];
      expect(assertState, `register an assertion for state ${state}`).toEqual(
        expect.any(Function),
      );
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.setViewportSize({ width: 390, height: 900 });
      await page.goto(
        "/?" +
          new URLSearchParams({
            component: component.export,
            theme: "light",
            state,
          }),
      );
      const fixture = page.locator(
        `[data-mortar-preview="${component.export}"] [data-state="${state}"]`,
      );
      await expect(fixture).toBeAttached();
      const scope =
        component.export === "ConfirmDialog"
          ? page.getByRole("dialog")
          : fixture;
      await assertState({ page, component, fixture, scope });
      await accessibility(
        page,
        component.export === "ConfirmDialog"
          ? '[role="dialog"]'
          : `[data-mortar-preview="${component.export}"]`,
      );
      expect(errors).toEqual([]);
      await info.attach("contract-evidence", {
        body: JSON.stringify({
          component: component.id,
          state,
          obligations: [`state:${state}`],
        }),
        contentType: "application/json",
      });
    });
  }
}
