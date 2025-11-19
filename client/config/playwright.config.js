import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Retry failed tests to handle transient network issues
  retries: process.env.CI ? 2 : 1,
  // Reduce workers to avoid overwhelming backend API (was: undefined = all CPUs)
  workers: process.env.CI ? 1 : 3,
  reporter: 'html',
  // Increase timeout for slower operations (file upload, API calls)
  timeout: 45000, // 45 seconds per test (default is 30s)

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Increase action timeout for slow operations
    actionTimeout: 15000, // 15 seconds (default is 10s)
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
