import { test, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const fixtureRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures/duplicate-keys",
);
const viteBin = resolve(repo, "node_modules/vite/bin/vite.js");

test.describe.configure({ timeout: 120_000 });

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
      reject(new Error(`duplicate-keys fixture did not start\n${output}`));
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
      finish(new Error(`duplicate-keys fixture exited ${code}\n${output}`));
    });
  });
});

test.afterAll(async () => {
  child?.kill("SIGTERM");
});

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
  await page.goto(`${base}/`);
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
