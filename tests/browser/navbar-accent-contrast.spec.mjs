import { test, expect } from "@playwright/test";
import { accessibility, contrast } from "../support/preview.mjs";

// Navbar tone="accent" paints --m-sunken on the open mobile menu's current
// item (and on hovers). The suite's axe pass uses the neutral brand, where a
// wash towards the on-accent text still clears 4.5:1. Green light does not:
// #ffffff falls from 5.48:1 on the fill to #278b6f, about 4.2:1, on that layer.
test("accent navbar sunken contrast, green light, open menu", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/?component=Navbar&theme=light&brand=green");
  await expect(page.locator("html")).toHaveAttribute(
    "data-mortar-appearance",
    "light",
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-mortar-brand",
    "green",
  );
  const accent = page.locator('.m-navbar[data-tone="accent"]');
  await accent.getByRole("button", { name: "Menu", exact: true }).click();
  const current = accent.getByRole("link", { name: "Home", exact: true });
  await expect(current).toBeVisible();
  await expect(current).toHaveAttribute("aria-current", "page");

  const problems = [];
  const rest = await paintedContrast(current);
  if (rest.ratio < 4.5)
    problems.push(
      `current item ${rest.ratio.toFixed(2)} (${rest.color} on ${rest.background || "no sunken layer"}; own background ${rest.own})`,
    );

  const billing = accent.getByRole("link", { name: "Billing", exact: true });
  await billing.hover();
  const hovered = await paintedContrast(billing);
  if (hovered.ratio < 4.5)
    problems.push(
      `hovered item ${hovered.ratio.toFixed(2)} (${hovered.color} on ${hovered.background || "no sunken layer"}; own background ${hovered.own})`,
    );

  const help = accent.getByRole("button", { name: "Help", exact: true });
  await help.hover();
  const secondary = await paintedContrast(help);
  if (secondary.ratio < 4.5)
    problems.push(
      `secondary hover ${secondary.ratio.toFixed(2)} (${secondary.color} on ${secondary.background || "no sunken layer"}; own background ${secondary.own})`,
    );

  expect(problems).toEqual([]);
  await accessibility(page, '[data-mortar-preview="Navbar"]');
});

/** Text colour against the element's background. A translucent --m-sunken
    (often serialized as oklab(... / 0.14)) is composited over the opaque
    ancestor, which is how the bar actually paints it. */
async function paintedContrast(locator) {
  const colors = await locator.evaluate((el) => {
    const alpha = (value) => {
      const raw = value.trim();
      if (raw === "transparent") return 0;
      const slash = raw.match(/\/\s*([\d.]+%?)\s*\)\s*$/);
      if (slash) {
        const n = slash[1];
        return n.endsWith("%") ? Number(n.slice(0, -1)) / 100 : Number(n);
      }
      const parts = raw.match(/^rgba?\(([^)]+)\)$/i)?.[1].split(/[,\s/]+/);
      if (parts && parts.length >= 4) {
        const n = parts[3];
        return n.endsWith("%") ? Number(n.slice(0, -1)) / 100 : Number(n);
      }
      return 1;
    };
    const canvas = el.ownerDocument.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d", {
      colorSpace: "srgb",
      willReadFrequently: true,
    });
    const hex = (color, under) => {
      ctx.clearRect(0, 0, 1, 1);
      if (under) {
        ctx.fillStyle = under;
        ctx.fillRect(0, 0, 1, 1);
      }
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
    };
    const style = getComputedStyle(el);
    const own = style.backgroundColor;
    const color = hex(style.color);
    if (alpha(own) === 0) return { color, background: "", own };
    if (alpha(own) >= 1) return { color, background: hex(own), own };
    let under = "";
    for (let node = el.parentElement; node; node = node.parentElement) {
      const bg = getComputedStyle(node).backgroundColor;
      if (alpha(bg) >= 1) {
        under = bg;
        break;
      }
    }
    if (!under) return { color, background: "", own };
    return { color, background: hex(own, under), own };
  });
  return {
    ...colors,
    ratio: colors.background ? contrast(colors.color, colors.background) : 0,
  };
}
