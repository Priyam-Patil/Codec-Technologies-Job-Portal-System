import live from './playwright.live.config.js';
import { defineConfig } from '@playwright/test';
export default defineConfig({ ...live,
  testMatch: ['checklist138.spec.js'],
  grepInvert: undefined,
  projects: [live.projects[0]],
  // Actual tab/window focus is part of the checklist, not a synthetic focus event.
  use: { ...live.use, headless: false },
  reporter: [['list'], ['json', { outputFile: '../.qa/checklist138-gap-results.json' }]],
});
