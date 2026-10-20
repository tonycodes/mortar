import { test, expect } from "@playwright/test";
for (const brand of ["neutral", "green"])
  for (const density of ["compact", "comfortable", "spacious"]) {
    test(`provider ${brand}/${density} observes system appearance`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: "light" });
      await page.goto(
        "/?" +
          new URLSearchParams({
            component: "ThemeProvider",
            theme: "system",
            brand,
            density,
          }),
      );
      const html = page.locator("html");
      await expect(html).toHaveAttribute("data-mortar-brand", brand);
      await expect(html).toHaveAttribute("data-mortar-density", density);
      await expect(html).toHaveAttribute("data-mortar-appearance", "light");
      const token = (name) =>
        html.evaluate(
          (el, name) =>
            getComputedStyle(el)
              .getPropertyValue(name)
              .trim()
              .replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i, "#$1$1$2$2$3$3"),
          name,
        );
      expect(await token("--m-primary")).toBe(
        brand === "green" ? "#047857" : "#000000",
      );
      expect(await token("--m-control")).toBe(
        { compact: "30px", comfortable: "36px", spacious: "44px" }[density],
      );
      await page.emulateMedia({ colorScheme: "dark" });
      await expect(html).toHaveAttribute("data-mortar-appearance", "dark");
      // Each brand has one dark-side primary; green's is mint.
      expect(await token("--m-primary")).toBe(
        brand === "green" ? "#6ee7b7" : "#ffffff",
      );
      await expect(html).toHaveAttribute("data-mortar-brand", brand);
      const root = page.locator("[data-mortar-preview]");
      await root.getByRole("button", { name: "Light", exact: true }).click();
      await expect(html).toHaveAttribute("data-mortar-appearance", "light");
    });
  }

for (const name of ["Button", "Input", "Tabs", "AppShell"])
  for (const theme of ["light", "dark"]) {
    test(`green ${name} ${theme}`, async ({ page }) => {
      const { readFile } = await import("node:fs/promises");
      const { mount, accessibility } = await import("../support/preview.mjs");
      const { components } = JSON.parse(
        await readFile(new URL("../../catalog.json", import.meta.url), "utf8"),
      );
      const component = components.find((c) => c.export === name);
      const { errors } = await mount(page, component, {
        brand: "green",
        theme,
      });
      await expect(page.locator("html")).toHaveAttribute(
        "data-mortar-brand",
        "green",
      );
      await accessibility(page, `[data-mortar-preview="${name}"]`);
      expect(errors).toEqual([]);
    });
  }
