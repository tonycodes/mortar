import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const viteBin = resolve(repo, "node_modules/vite/bin/vite.js");

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

/**
 * Serve the standalone Vite app in tests/browser/fixtures/<name> for the
 * lifetime of a spec file. Call at the top level of the spec; the returned
 * function gives the base URL once beforeAll has run.
 */
export function useFixtureServer(test, name) {
  const root = resolve(repo, "tests/browser/fixtures", name);
  let child;
  let base = "";
  test.describe.configure({ timeout: 120_000 });
  test.beforeAll(async () => {
    const port = await freePort();
    child = spawn(
      process.execPath,
      [viteBin, "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
      { cwd: root, stdio: ["ignore", "pipe", "pipe"] },
    );
    base = await new Promise((resolveUrl, reject) => {
      let output = "";
      let settled = false;
      const finish = (error, url) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (error) reject(error);
        else resolveUrl(url);
      };
      const timer = setTimeout(
        () => finish(new Error(`${name} fixture did not start\n${output}`)),
        60_000,
      );
      const onData = (chunk) => {
        output += chunk.toString();
        // Playwright workers set FORCE_COLOR, so Vite wraps "Local:" in ANSI codes.
        const plain = output.replace(/\x1b\[[0-9;]*m/g, "");
        const match = plain.match(/Local:\s+http:\/\/127\.0\.0\.1:(\d+)/);
        if (match) finish(null, `http://127.0.0.1:${match[1]}`);
      };
      child.stdout.on("data", onData);
      child.stderr.on("data", onData);
      child.on("exit", (code) =>
        finish(new Error(`${name} fixture exited ${code}\n${output}`)),
      );
    });
  });
  test.afterAll(async () => {
    child?.kill("SIGTERM");
  });
  return () => base;
}
