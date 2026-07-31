import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["html", { open: "never" }], ["github"]]
    : [["html", { open: "on-failure" }]],
  snapshotPathTemplate:
    "{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}",

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "e2e",
      testDir: "./tests/e2e",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "a11y",
      testDir: "./tests/a11y",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "responsive-webkit",
      testDir: "./tests/e2e",
      testMatch: "responsive-mobile.spec.ts",
      use: { ...devices["iPhone 14"] },
    },
    {
      name: "visual",
      testDir: "./tests/visual",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "visual-mobile",
      testDir: "./tests/visual",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "visual-rtl",
      testDir: "./tests/visual",
      use: {
        ...devices["Desktop Chrome"],
        locale: "he",
      },
    },
  ],

  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
      command: "npm run build && npm run start",
      url: baseURL,
      reuseExistingServer: !process.env.CI && process.env.PORTAL_E2E !== "1",
      timeout: 120_000,
      },
});
