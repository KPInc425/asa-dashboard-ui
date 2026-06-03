/**
 * Playwright MCP Test Configuration
 *
 * Configuration for Playwright-based regression tests for the ASA dashboard.
 * These tests validate core UI flows and routing.
 *
 * Usage:
 *   npx playwright test --config .playwright-mcp/playwright.config.ts
 *
 * @see https://playwright.dev/docs/test-configuration
 */

import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { outputFolder: "test-results/report" }],
    ["list"],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
