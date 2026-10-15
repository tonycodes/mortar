import { test, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const fixtureRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures/contrast",
);
const viteBin = resolve(repo, "node_modules/vite/bin/vite.js");

test.describe.configure({ timeout: 120_000 });

function contrast(a, b) {
  const channels = (value) => {
    const parts = String(value).match(/[\d.]+/g);
    if (!parts || parts.length < 3) return null;
    return parts.slice(0, 3).map(Number);
  };
  const luminance = (rgb) =>
    rgb
      .map((n) => {
        const v = n / 255;
        return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      })
      .reduce((sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i], 0);
  const left = channels(a);
  const right = channels(b);
  if (!left || !right) return 0;
  const x = luminance(left);
  const y = luminance(right);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

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

let child;
let base = "";

function freePort() {
  return new Promise((resolvePort, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close((error) => (error ? reject(error) : resolvePort(port)));
    });
  });
}

test.beforeAll(async () => {
  const port = await freePort();
  child = spawn(
    process.execPath,
    [viteBin, "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
    { cwd: fixtureRoot, stdio: ["ignore", "pipe", "pipe"] },
  );
  base = await new Promise((resolvePort, reject) => {
    let output = "";
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`contrast fixture did not start\n${output}`));
    }, 60_000);
    const finish = (error, url) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolvePort(url);
    };
    const onData = (chunk) => {
      output += chunk.toString();
      const match = output.match(/Local:\s+http:\/\/127\.0\.0\.1:(\d+)/);
      if (match) finish(null, `http://127.0.0.1:${match[1]}`);
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("exit", (code) => {
      finish(new Error(`contrast fixture exited ${code}\n${output}`));
    });
  });
});

test.afterAll(async () => {
  child?.kill("SIGTERM");
});

async function openFixture(page, { theme, brand, tone }) {
  const params = new URLSearchParams({ theme, brand });
  if (tone) params.set("tone", tone);
  await page.goto(`${base}/?${params}`);
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
