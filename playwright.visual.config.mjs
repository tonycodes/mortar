import { defineConfig } from "@playwright/test";
import base from "./playwright.config.mjs";
export default defineConfig({
  ...base,
  testDir: "tests/visual",
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "visual-report" }],
  ],
  outputDir: "visual-results",
  snapshotPathTemplate: "{testDir}/baselines/{platform}/{arg}{ext}",
  updateSnapshots: "none",
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.002,
    },
  },
});
