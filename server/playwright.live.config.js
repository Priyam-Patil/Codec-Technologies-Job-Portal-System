import audit from './playwright.audit.config.js';
import { defineConfig } from '@playwright/test';
process.env.JOB_PORTAL_LIVE_ONLY = '1';
export default defineConfig({ ...audit,
  testMatch: ['edge-cases.spec.js', 'journeys.spec.js', 'normal-application.spec.js', 'live-registration.spec.js', 'live-additional.spec.js'],
  // Fault injection belongs to regression testing, not this live E2E pass count.
  grepInvert: /network error is displayed/,
  reporter: [['list'], ['json', { outputFile: process.env.JOB_PORTAL_LIVE_REPORT || '../.qa/live-e2e-results.json' }]],
});
