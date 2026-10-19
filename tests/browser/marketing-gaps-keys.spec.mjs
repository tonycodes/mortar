import { test, expect } from "@playwright/test";
import { useFixtureServer } from "../support/fixture-server.mjs";

const base = useFixtureServer(test, "duplicate-keys");

const labels = [
  "Docs",
  "Guide",
  "Start",
  "Tour",
  "Primary",
  "Secondary",
  "Pricing",
  "Plans",
  "Terms",
  "Privacy",
];

test("duplicate href actions and links render without a same-key warning", async ({
  page,
}) => {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => {
    errors.push(error.message);
  });
  await page.goto(`${base()}/`);
  const problems = [
    ...new Set(
      errors
        .filter((error) => /same key/i.test(error))
        .map((error) => `console.error: ${error}`),
    ),
  ];
  for (const label of labels) {
    const locator = page.getByText(label, { exact: true });
    if ((await locator.count()) < 1)
      problems.push(`missing rendered label ${label}`);
    else await expect(locator.first()).toBeVisible();
  }
  expect(problems).toEqual([]);
});
