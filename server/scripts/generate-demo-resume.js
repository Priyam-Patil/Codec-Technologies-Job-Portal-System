import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
  await page.setContent(await fs.readFile(new URL('../e2e/fixtures/resume.html', import.meta.url), 'utf8'));
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: fileURLToPath(new URL('../e2e/fixtures/resume.pdf', import.meta.url)), format: 'A4', printBackground: true });
  await page.screenshot({ path: fileURLToPath(new URL('../../docs/screenshots/resume-fixture.png', import.meta.url)), fullPage: true });
  console.log('Synthetic resume fixture generated');
} finally { await browser.close(); }
