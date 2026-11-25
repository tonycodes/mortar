// A rendered audit of a running application that uses Mortar. It opens each
// URL in a headless browser at a phone and a desktop width, in light and dark,
// and checks what actually rendered: problems a source scan cannot see, such as
// controls in one row with different heights or a label that inherits a
// parent's alignment. It only reads the page; it never clicks or types.
//
// Playwright is not a dependency of the kit. The audit loads it from the
// application (or the kit's own install) and explains how to add it if absent.
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const RENDER_RULES = {
  "render-error":
    "The page logs a console error or throws while rendering, in light or dark.",
  "render-missing-styles":
    "Mortar components render without Mortar's stylesheet (no --m-* tokens).",
  "render-box-sizing":
    "Mortar controls render with content-box sizing, usually because Tailwind is not imported before Mortar's styles.",
  "render-row-height":
    "Mortar controls side by side in one row render at different heights.",
  "render-label-align":
    "A Mortar field label is not aligned to the start of its field, usually inherited from a parent's text-align.",
  "render-overflow": "The page scrolls sideways at a phone width (390px).",
};

const WIDTHS = [390, 1280];
const SCHEMES = ["light", "dark"];

/** Load Playwright from the application first, then from the kit's install. */
async function loadPlaywright(appRoot) {
  const require = createRequire(resolve(appRoot, "package.json"));
  for (const name of ["playwright", "@playwright/test"]) {
    try {
      return await import(pathToFileURL(require.resolve(name)).href);
    } catch {}
    try {
      return await import(name);
    } catch {}
  }
  throw Error(
    "audit --render needs Playwright: npm install -D playwright && npx playwright install chromium",
  );
}

// Runs in the page. Returns raw observations; the node side turns them into
// findings so rules and wording live in one place.
function inspect() {
  const name = (el) => {
    const marker = el.closest("[data-m-component]");
    const label =
      el.querySelector?.("label")?.textContent?.trim() ||
      el.getAttribute?.("aria-label") ||
      el.textContent?.trim().slice(0, 40) ||
      "";
    return `${marker?.dataset.mComponent ?? el.tagName.toLowerCase()}${label ? ` "${label}"` : ""}`;
  };
  const tokens = getComputedStyle(document.documentElement)
    .getPropertyValue("--m-control")
    .trim();
  const components = document.querySelectorAll("[data-m-component]").length;

  // The visible control of each Mortar field, and default-size buttons.
  const controls = [];
  // Single-line fields only: a TextArea is meant to be taller than its neighbours.
  for (const field of document.querySelectorAll(
    ".m-field[data-m-component]:not(:has(textarea))",
  )) {
    const box = [...field.children].find(
      (child) =>
        child.tagName !== "LABEL" &&
        !child.matches("p, [role=alert], .m-field-feedback") &&
        child.getBoundingClientRect().height > 0,
    );
    if (box) controls.push({ el: box, owner: field });
  }
  for (const button of document.querySelectorAll(
    "button[data-m-component=Button]:not([data-size])",
  ))
    controls.push({ el: button, owner: button });

  // Group controls by the nearest row container (a horizontal flex or a grid)
  // and by the line they sit on when the row wraps.
  const rowOf = (el) => {
    for (let node = el.parentElement; node; node = node.parentElement) {
      const cs = getComputedStyle(node);
      if (
        (cs.display.endsWith("flex") && cs.flexDirection.startsWith("row")) ||
        cs.display.endsWith("grid")
      )
        return node;
    }
    return null;
  };
  const rows = new Map();
  for (const control of controls) {
    const row = rowOf(control.owner);
    const rect = control.el.getBoundingClientRect();
    if (!row || !rect.width) continue;
    const list = rows.get(row) ?? [];
    list.push({ ...control, rect });
    rows.set(row, list);
  }
  const mismatched = [];
  for (const list of rows.values()) {
    const lines = [];
    for (const item of list) {
      const line = lines.find((l) =>
        l.some(
          (other) =>
            item.rect.top < other.rect.bottom &&
            other.rect.top < item.rect.bottom,
        ),
      );
      if (line) line.push(item);
      else lines.push([item]);
    }
    for (const line of lines) {
      if (line.length < 2) continue;
      const heights = line.map((i) => Math.round(i.rect.height));
      if (Math.max(...heights) - Math.min(...heights) > 1)
        mismatched.push(
          line.map((i) => `${name(i.owner)} ${Math.round(i.rect.height)}px`),
        );
    }
  }

  const contentBox = [];
  for (const { el, owner } of controls) {
    const input = el.matches("input, select, button")
      ? el
      : el.querySelector("input, select, button");
    if (input && getComputedStyle(input).boxSizing === "content-box")
      contentBox.push(name(owner));
  }

  const misaligned = [];
  for (const label of document.querySelectorAll(
    ".m-field[data-m-component] > label",
  )) {
    const cs = getComputedStyle(label);
    const rtl = cs.direction === "rtl";
    const start = rtl ? ["right", "start"] : ["left", "start"];
    if (!start.includes(cs.textAlign))
      misaligned.push(
        `${name(label.parentElement)} (text-align: ${cs.textAlign})`,
      );
  }

  return {
    components,
    tokens: tokens !== "",
    mismatched,
    contentBox,
    misaligned,
    overflow:
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  };
}

/**
 * Audit the rendered pages. Returns findings in the static audit's shape, with
 * the URL in place of a file and no line.
 */
export async function renderAudit(
  urls,
  { appRoot = ".", executablePath } = {},
) {
  const playwright = await loadPlaywright(appRoot);
  // An ES import of the CommonJS package puts its exports on default.
  const chromium = playwright.chromium ?? playwright.default?.chromium;
  const browser = await chromium.launch(
    executablePath || process.env.MORTAR_CHROME
      ? { executablePath: executablePath || process.env.MORTAR_CHROME }
      : {},
  );
  // One finding per problem; the widths and appearances it showed in are
  // listed together instead of repeating it.
  const found = new Map();
  const add = (rule, severity, url, message, fix, where) => {
    const key = `${rule}|${url}|${message}`;
    const entry = found.get(key) ?? {
      rule,
      severity,
      file: url,
      line: null,
      message,
      fix,
      where: [],
    };
    if (where && !entry.where.includes(where)) entry.where.push(where);
    found.set(key, entry);
  };
  const views = SCHEMES.length * WIDTHS.length;
  try {
    for (const url of urls)
      for (const scheme of SCHEMES)
        for (const width of WIDTHS) {
          const page = await browser.newPage({
            viewport: { width, height: 900 },
            colorScheme: scheme,
          });
          const errors = [];
          page.on("pageerror", (e) => errors.push(e.message));
          page.on("console", (m) => {
            if (m.type() !== "error") return;
            // Name the resource a failed load refers to; the browser's own
            // favicon request is not the app's error.
            const resource = m.location()?.url;
            if (/^Failed to load resource/.test(m.text()) && resource) {
              if (!/\/favicon\.ico$/.test(resource))
                errors.push(`${m.text()}: ${resource}`);
            } else errors.push(m.text());
          });
          try {
            await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
          } catch (error) {
            add(
              "render-error",
              "error",
              url,
              `Could not load the page: ${error.message.split("\n")[0]}`,
              "Start the app and pass the URL it serves.",
            );
            await page.close();
            continue;
          }
          await page.evaluate(() => document.fonts?.ready);
          const seenAt = `${scheme} ${width}px`;
          const r = await page.evaluate(inspect);
          for (const message of errors)
            add(
              "render-error",
              "error",
              url,
              message,
              "Fix the error the page reports; it may hide other problems.",
              seenAt,
            );
          if (r.components && !r.tokens)
            add(
              "render-missing-styles",
              "error",
              url,
              `${r.components} Mortar components render without Mortar's tokens.`,
              'Import "@tonycodes-ui/mortar/styles.css" after Tailwind in your CSS entry.',
              seenAt,
            );
          for (const control of r.contentBox)
            add(
              "render-box-sizing",
              "error",
              url,
              `${control} uses content-box sizing, so it renders taller than its neighbours.`,
              'Import Tailwind before Mortar (@import "tailwindcss"; then @import "@tonycodes-ui/mortar/styles.css").',
              seenAt,
            );
          for (const line of r.mismatched)
            add(
              "render-row-height",
              "warning",
              url,
              `Controls in one row have different heights: ${line.join(", ")}.`,
              "Use the same control kind and size in a row, and do not set heights on Mortar controls. If every control is a Mortar default, report it to the kit.",
              seenAt,
            );
          for (const label of r.misaligned)
            add(
              "render-label-align",
              "warning",
              url,
              `${label} is not start-aligned.`,
              "Remove text-align from the field's container and set alignment on your own text. If the container is a Mortar component, report it to the kit.",
              seenAt,
            );
          if (width === 390 && r.overflow > 1)
            add(
              "render-overflow",
              "warning",
              url,
              `The page is ${r.overflow}px wider than a 390px screen.`,
              "Find the element wider than the screen; let it wrap, scroll inside its own container, or use responsive props.",
              seenAt,
            );
          await page.close();
        }
  } finally {
    await browser.close();
  }
  return [...found.values()].map(({ where, ...finding }) => ({
    ...finding,
    message:
      where.length && where.length < views
        ? `${finding.message} Seen in ${where.join(", ")}.`
        : finding.message,
  }));
}
