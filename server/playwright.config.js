import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e', fullyParallel: false, workers: 1, retries: 0, timeout: 120000,
  expect: { timeout: 15000 }, globalSetup: './e2e/global-setup.js',
  outputDir: './test-results',
  reporter: [['list'], ['json', { outputFile: '../.qa/e2e-results.json' }], ['html', { outputFolder: './playwright-report', open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:5173', browserName: 'chromium', channel: 'chrome', headless: true,
    trace: 'off', screenshot: 'only-on-failure', video: 'off', actionTimeout: 20000 },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: { command: 'node scripts/demo.js', url: 'http://127.0.0.1:5173', reuseExistingServer: true, timeout: 120000 },
});
