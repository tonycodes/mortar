import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  workers: 4,
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:4340",
    launchOptions: process.env.UI_TEST_CHROME
      ? { executablePath: process.env.UI_TEST_CHROME }
      : {},
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:4340",
    reuseExistingServer: false,
  },
});
