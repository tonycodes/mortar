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
  webServer: {
    command:
      "npm run build:playground && npx vite preview --host 127.0.0.1 --port 4340 --strictPort",
    url: "http://127.0.0.1:4340",
    reuseExistingServer: false,
  },
});
