import base from './playwright.config.js';
import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
process.env.JOB_PORTAL_AUDIT = '1';
export default defineConfig({ ...base,
  reporter: [['list'], ['json', { outputFile: '../.qa/final-e2e-results.json' }]],
  use: { ...base.use, baseURL: 'http://127.0.0.1:5176' },
  projects: [base.projects[0], { name: 'tablet', use: { viewport: { width: 820, height: 1180 }, hasTouch: true } }, base.projects[1]],
  webServer: [
    { command: 'npm run dev:local', url: 'http://127.0.0.1:5000/health', reuseExistingServer: true, timeout: 120000 },
    { command: 'npm run dev:local', cwd: fileURLToPath(new URL('../client', import.meta.url)), url: 'http://127.0.0.1:5175', reuseExistingServer: true, timeout: 120000 },
    { command: 'node scripts/demo.js --audit', url: 'http://127.0.0.1:5176', reuseExistingServer: true, timeout: 120000 },
  ],
});
