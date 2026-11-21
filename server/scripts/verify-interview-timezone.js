// Read-only browser verification against the isolated audit run after its journeys finish.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
import setup from '../e2e/global-setup.js';
import { signInCandidate, signedRequest } from '../e2e/browser-helpers.js';
const session = JSON.parse(await fs.readFile(new URL('../../.qa/audit-session.json', import.meta.url)));
if (!session.mongoUri.startsWith('mongodb://127.0.0.1:') || !session.mongoUri.endsWith('/insiderjobs_demo')) throw new Error('Isolated audit guard failed');
await setup();
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const [viewport, timezoneId] of [['desktop', 'Asia/Kolkata'], ['tablet', 'America/New_York'], ['mobile', 'UTC']]) {
    const context = await browser.newContext({ timezoneId, viewport: viewport === 'mobile' ? { width: 390, height: 844 } : { width: 1280, height: 900 } });
    const employerContext = await browser.newContext({ timezoneId });
    try {
      const candidate = await context.newPage();
      await candidate.goto('http://127.0.0.1:5176');
      await signInCandidate(candidate, session.users.find(user => user.viewport === 'desktop'));
      const response = await signedRequest(candidate, 'http://127.0.0.1:5102', '/api/users/applications');
      assert.equal(response.status, 200);
      const application = response.data.applications.find(item => item.jobId?.title === 'Full Stack Developer');
      assert.ok(application?.interview?.scheduledAt, 'Run the complete audit journeys before this read-only check');
      await candidate.getByRole('link', { name: 'Applied Jobs', exact: true }).click();
      const localDisplay = await candidate.evaluate(value => new Date(value).toLocaleString(), application.interview.scheduledAt);
      const history = viewport === 'mobile' ? candidate.getByTestId('application-card').filter({ hasText: 'Full Stack Developer' }) : candidate.getByRole('row').filter({ hasText: 'Full Stack Developer' });
      await expect(history).toContainText(localDisplay);
      const recruiter = await employerContext.newPage();
      await recruiter.goto('http://127.0.0.1:5176');
      await recruiter.getByRole('button', { name: 'Recruiter Login', exact: true }).click();
      try { await recruiter.getByLabel('Recruiter email').fill(session.recruiter.email); await recruiter.getByLabel('Recruiter password').fill(session.recruiter.password); }
      catch { throw new Error('Recruiter fields unavailable; sensitive input suppressed'); }
      await recruiter.getByRole('dialog').getByRole('button', { name: 'Login', exact: true }).click();
      if (await recruiter.getByLabel('Recruiter password').isVisible()) await recruiter.getByLabel('Recruiter password').fill('').catch(() => {});
      await recruiter.getByRole('link', { name: 'View Applications', exact: true }).click();
      const row = recruiter.getByRole('row').filter({ hasText: 'Demo desktop' });
      await row.getByRole('button', { name: 'Update interview', exact: true }).click();
      const input = await row.getByLabel(/Date & time/).inputValue();
      const roundTrip = await recruiter.evaluate(value => new Date(value).toISOString(), input);
      assert.equal(roundTrip, new Date(application.interview.scheduledAt).toISOString());
      console.log(`PASS: ${timezoneId} candidate display and recruiter edit preserve the stored interview instant.`);
    } finally { await context.close(); await employerContext.close(); }
  }
} finally { await browser.close(); }
