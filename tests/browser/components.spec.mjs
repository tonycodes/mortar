import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { mount, accessibility, overflow } from "../support/preview.mjs";
import { implementations } from "../support/probes.mjs";
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
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.setViewportSize({ width: 390, height: 900 });
      await page.goto(
        "/?" + new URLSearchParams({ component: component.export, state }),
      );
      const fixture = page.locator(
        `[data-mortar-preview="${component.export}"] [data-state="${state}"]`,
      );
      await expect(fixture).toBeAttached();
      const scope =
        component.export === "ConfirmDialog"
          ? page.getByRole("dialog")
          : fixture;
      if (
        state === "disabled" ||
        (state === "loading" &&
          ["Button", "ConfirmDialog"].includes(component.export))
      ) {
        const controls = scope.locator("button,input,textarea,select");
        const target =
          component.export === "ConfirmDialog"
            ? scope.getByRole("button", { name: "Confirm", exact: true })
            : controls.first();
        await expect(target).toBeDisabled();
        const bounds = await target.boundingBox();
        expect(bounds).not.toBeNull();
        await page.mouse.click(
          bounds.x + bounds.width / 2,
          bounds.y + bounds.height / 2,
        );
        await expect(fixture.getByLabel("Callback count")).toHaveText("0");
      } else if (state === "error") {
        await expect(scope.getByText("Check this value")).toBeVisible();
        if (component.export !== "DataTable")
          await expect(scope.locator("input,textarea,select")).toHaveAttribute(
            "aria-invalid",
            "true",
          );
      } else if (state === "empty")
        await expect(scope.getByText("No records")).toBeVisible();
      else if (state === "loading")
        await expect(
          scope.locator(".m-table-state[role=status]"),
        ).toBeVisible();
      if (state === "long") await overflow(page);
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
