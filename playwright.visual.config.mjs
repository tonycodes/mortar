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
  snapshotPathTemplate:
    process.env.MORTAR_VISUAL_CANDIDATES === "1"
      ? "{testDir}/../../visual-candidates/{platform}/{arg}{ext}"
      : "{testDir}/baselines/{platform}/{arg}{ext}",
  updateSnapshots: "none",
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.002,
    },
  },
});
