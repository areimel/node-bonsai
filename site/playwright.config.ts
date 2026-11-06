import { defineConfig, devices } from '@playwright/test';

// Own port, so a leftover dev/preview server on another port is never reused.
const PORT = 4401;
const projects = [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  // WebKit cannot launch on the dev machine (missing system libraries); opt in elsewhere.
  ...(process.env.E2E_WEBKIT === '1' ? [{ name: 'webkit', use: { ...devices['Desktop Safari'] } }] : []),
];

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: 'retain-on-failure' },
  projects,
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${PORT} --ignore-lock`,
    url: `http://127.0.0.1:${PORT}/node-bonsai/`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
