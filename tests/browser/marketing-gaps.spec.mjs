import { test, expect } from "@playwright/test";

async function paint(page, selector) {
  const target = page.locator(selector);
  await expect(target).toBeVisible();
  return target.evaluate((node) => {
    const token = (name) => {
      const probe = node.ownerDocument.createElement("span");
      probe.style.backgroundColor = `var(${name})`;
      node.appendChild(probe);
      const value = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return value;
    };
    const style = getComputedStyle(node);
    return {
      background: style.backgroundColor,
      color: style.color,
      surface: token("--m-surface"),
      sunken: token("--m-sunken"),
      paper: token("--m-paper"),
      ink: token("--m-ink"),
    };
  });
}

function surfaceProblems(name, colors) {
  const surfaces = [colors.surface, colors.sunken, colors.paper];
  const problems = [];
  if (!surfaces.includes(colors.background))
    problems.push(
      `${name} background ${colors.background} is not a dark surface token (surface ${colors.surface}, sunken ${colors.sunken}, paper ${colors.paper})`,
    );
  if (colors.background === colors.ink)
    problems.push(`${name} background uses the ink token ${colors.ink}`);
  if (colors.color !== colors.ink)
    problems.push(
      `${name} color ${colors.color} is not the ink token ${colors.ink}`,
    );
  return problems;
}

for (const brand of ["neutral", "green"]) {
  test(`dark ${brand} CallToAction and featured pricing stay on surface tokens`, async ({
    page,
  }) => {
    const problems = [];
    await page.goto(
      "/?" +
        new URLSearchParams({
          component: "CallToAction",
          theme: "dark",
          brand,
        }),
    );
    await expect(page.locator("html")).toHaveAttribute(
      "data-mortar-appearance",
      "dark",
    );
    await expect(page.locator("html")).toHaveAttribute(
      "data-mortar-brand",
      brand,
    );
    problems.push(
      ...surfaceProblems(
        "CallToAction",
        await paint(page, '[data-mortar-preview="CallToAction"] .m-cta'),
      ),
    );
    await page.goto(
      "/?" +
        new URLSearchParams({ component: "Pricing", theme: "dark", brand }),
    );
    await expect(page.locator("html")).toHaveAttribute(
      "data-mortar-appearance",
      "dark",
    );
    problems.push(
      ...surfaceProblems(
        "featured Pricing",
        await paint(
          page,
          '[data-mortar-preview="Pricing"] article[data-featured="true"]',
        ),
      ),
    );
    expect(problems).toEqual([]);
  });
}
