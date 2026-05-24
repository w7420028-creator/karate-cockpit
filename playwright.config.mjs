import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'python3 -m http.server 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 10_000
  },
  projects: [
    {
      name: 'Mobile Safari-ish WebKit',
      use: { ...devices['iPhone 14'], browserName: 'webkit' }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 7'], browserName: 'chromium' }
    }
  ]
});
