import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  workers: 4,
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["./tests/support/contract-reporter.mjs"],
  ],
  timeout: 30000,
  use: {
    reducedMotion: "reduce",
    screenshot: "on",
    trace: "retain-on-failure",
    baseURL: "http://127.0.0.1:4340",
    launchOptions: process.env.UI_TEST_CHROME
      ? { executablePath: process.env.UI_TEST_CHROME }
      : {},
  },
  // Tests run against a production playground build. Locally each run rebuilds
  // it from the working tree. CI builds it once in `npm run check` and sets
  // MORTAR_PLAYGROUND_PREBUILT=1 so the browser and visual suites serve that
  // same playground-dist instead of rebuilding it.
  webServer: {
    command: `${
      process.env.MORTAR_PLAYGROUND_PREBUILT === "1"
        ? "test -f playground-dist/index.html"
        : "npm run build:playground"
    } && npx vite preview --host 127.0.0.1 --port 4340 --strictPort`,
    url: "http://127.0.0.1:4340",
    reuseExistingServer: false,
  },
});
