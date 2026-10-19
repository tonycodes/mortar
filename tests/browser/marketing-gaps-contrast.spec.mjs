import { test, expect } from "@playwright/test";
import { contrast } from "../support/preview.mjs";
import { useFixtureServer } from "../support/fixture-server.mjs";

const base = useFixtureServer(test, "contrast");

async function buttonContrast(locator) {
  const colors = await locator.evaluate((el) => {
    const opaque = (value) => {
      if (!value || value === "transparent") return false;
      const parts = value.match(/[\d.]+/g);
      if (!parts || parts.length < 3) return false;
      const alpha = parts.length > 3 ? Number(parts[3]) : 1;
      return alpha > 0;
    };
    let node = el;
    let background = "";
    while (node) {
      const value = getComputedStyle(node).backgroundColor;
      if (opaque(value)) {
        background = value;
        break;
      }
      node = node.parentElement;
    }
    return { color: getComputedStyle(el).color, background };
  });
  return { ...colors, ratio: contrast(colors.color, colors.background) };
}

async function openFixture(page, { theme, brand, tone }) {
  const params = new URLSearchParams({ theme, brand });
  if (tone) params.set("tone", tone);
  await page.goto(`${base()}/?${params}`);
  await expect(page.locator("html")).toHaveAttribute(
    "data-mortar-appearance",
    theme,
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-mortar-brand",
    brand,
  );
}

for (const theme of ["light", "dark"])
  for (const brand of ["neutral", "green"]) {
    for (const tone of ["surface", "inverse"]) {
      test(`CallToAction ${tone} button contrast ${theme} ${brand}`, async ({
        page,
      }) => {
        test.setTimeout(120_000);
        await openFixture(page, {
          theme,
          brand,
          tone: tone === "inverse" ? "inverse" : undefined,
        });
        const cta = page.locator('[data-mortar-preview="CallToAction"] .m-cta');
        await expect(cta).toBeVisible();
        const problems = [];
        if (tone === "inverse") {
          const applied = await cta.getAttribute("data-tone");
          if (applied !== "inverse")
            problems.push(
              `CallToAction tone=inverse did not set data-tone (got ${applied ?? "null"})`,
            );
        }
        for (const variant of ["primary", "secondary"]) {
          const button = cta.locator(`.m-button-${variant}`);
          await expect(button).toBeVisible();
          const { color, background, ratio } = await buttonContrast(button);
          if (ratio < 4.5)
            problems.push(
              `${variant} contrast ${ratio.toFixed(2)} (${color} on ${background || "no opaque background"})`,
            );
        }
        expect(problems).toEqual([]);
      });
    }

    test(`featured Pricing secondary button contrast ${theme} ${brand}`, async ({
      page,
    }) => {
      test.setTimeout(120_000);
      await openFixture(page, { theme, brand });
      const button = page.locator(
        '[data-mortar-preview="Pricing"] article[data-featured="true"] .m-button-secondary',
      );
      await expect(button).toBeVisible();
      const { color, background, ratio } = await buttonContrast(button);
      const sunken = await button.evaluate((el) => {
        const probe = el.ownerDocument.createElement("span");
        probe.style.backgroundColor = "var(--m-sunken)";
        el.appendChild(probe);
        const value = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return value;
      });
      const problems = [];
      if (background !== sunken)
        problems.push(
          `secondary background ${background || "none"} is not --m-sunken ${sunken}`,
        );
      if (ratio < 4.5)
        problems.push(
          `secondary contrast ${ratio.toFixed(2)} (${color} on ${background || "no opaque background"})`,
        );
      expect(problems).toEqual([]);
    });
  }
