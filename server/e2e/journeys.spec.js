import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const root = fileURLToPath(new URL('../../', import.meta.url));
const auditMode = process.env.JOB_PORTAL_AUDIT === '1';
const api = auditMode ? 'http://127.0.0.1:5102' : 'http://127.0.0.1:5101';
test.describe.configure({ mode: 'serial' });
let session, candidate, recruiter, candidateContext, recruiterContext, account, project, title;
const errors = [], failures = [];

function watch(page) {
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    // Deliberately rejected anonymous/duplicate/ownership checks produce HTTP console errors.
    // Their status codes are asserted separately; other console errors remain failures.
    if (message.type() === 'error' && !message.text().includes('Failed to load resource')) errors.push(message.text());
  });
  page.on('response', response => { if (response.url().startsWith(api + '/') && response.status() >= 500) errors.push(`API ${new URL(response.url()).pathname}: ${response.status()}`); });
  page.on('requestfailed', request => {
    const url = new URL(request.url());
    if (url.origin === api && !request.failure()?.errorText?.includes('ERR_ABORTED')) failures.push({ path: url.pathname, reason: request.failure()?.errorText });
  });
}
async function shot(page, name) {
  // Dismiss success notifications through their real controls before capturing evidence.
  for (const close of await page.locator('.Toastify__close-button').all()) {
    if (await close.isVisible()) await close.click().catch(() => {});
  }
  await expect(page.locator('.Toastify__toast')).toHaveCount(0);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: path.join(root, 'docs/screenshots', `${auditMode ? 'final-' : ''}${project}-${name}.png`), fullPage: true });
}
function applicationHistory(page) {
  return project === 'mobile' ? page.getByTestId('application-card').filter({ hasText: 'Full Stack Developer' }) : page.getByRole('row').filter({ hasText: 'Full Stack Developer' });
}
async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
}
async function credentials(page, email, password, clerk = false) {
  // Do not let test errors or traces expose generated passwords.
  try {
    await (clerk ? page.locator('input[name=identifier]') : page.getByLabel('Recruiter email')).fill(email);
    await (clerk ? page.locator('input[name=password]') : page.getByLabel('Recruiter password')).fill(password);
  } catch { throw new Error('Credential fields were unavailable; sensitive input details suppressed'); }
}
async function recruiterLogin(page, account) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Recruiter Login', exact: true }).click();
  await credentials(page, account.email, account.password);
  const login = page.waitForResponse(response => response.url() === api + '/api/company/login' && response.request().method() === 'POST');
  await page.getByRole('dialog').getByRole('button', { name: 'Login', exact: true }).click();
  const passwordField = page.getByLabel('Recruiter password');
  if (await passwordField.isVisible()) await passwordField.fill('', { timeout: 1000 }).catch(() => {});
  expect((await login).status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Manage Jobs', exact: true })).toBeVisible();
}
async function candidateApi(pathname, method = 'GET', body) {
  return candidate.evaluate(async ({ pathname, method, body, api }) => {
    const token = await window.Clerk.session.getToken();
    const response = await fetch(api + pathname, { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, data: await response.json() };
  }, { pathname, method, body, api });
}
test.beforeAll(async ({ browser }, info) => {
  project = info.project.name;
  session = JSON.parse(await fs.readFile(path.join(root, auditMode ? '.qa/audit-session.json' : '.qa/demo-session.json')));
  account = session.users.find(user => user.viewport === project);
  // Repeatability: reset only this fixture user's records in the explicitly local disposable DB.
  if (!session.mongoUri?.startsWith('mongodb://127.0.0.1:') || !session.mongoUri.endsWith('/insiderjobs_demo')) throw new Error('Start a fresh isolated demo before running browser tests');
  const fixtureDb = await mongoose.createConnection(session.mongoUri, { autoIndex: false, autoCreate: false }).asPromise();
  await fixtureDb.db.collection('jobapplications').deleteMany({ userId: account.id });
  await fixtureDb.db.collection('users').updateOne({ _id: account.id }, { $set: { savedJobs: [], resume: '', resumeAsset: {}, resumeAnalysis: {}, skills: [], education: '', experience: '', github: '', linkedin: '', portfolio: '' } });
  const owner = await fixtureDb.db.collection('companies').findOne({ email: session.recruiter.email });
  await fixtureDb.db.collection('jobs').deleteMany({ companyId: owner._id, title: { $regex: `^Browser QA ${project} ` } });
  await fixtureDb.close();
  title = `Browser QA ${project} ${Date.now()}`;
  const use = info.project.use;
  candidateContext = await browser.newContext({ viewport: use.viewport, isMobile: use.isMobile, hasTouch: use.hasTouch });
  recruiterContext = await browser.newContext({ viewport: use.viewport, isMobile: use.isMobile, hasTouch: use.hasTouch });
  await setupClerkTestingToken({ context: candidateContext });
  candidate = await candidateContext.newPage(); recruiter = await recruiterContext.newPage();
  watch(candidate); watch(recruiter);
});
test.afterAll(async () => { await candidateContext?.close(); await recruiterContext?.close(); });

test('homepage renders styled content; real API search and advanced filters work', async () => {
  await candidate.goto('/');
  await expect(candidate.getByRole('heading', { name: 'Full Stack Developer', exact: true })).toBeVisible();
  expect(await candidate.locator('aside').evaluate(element => parseFloat(getComputedStyle(element).padding))).toBeGreaterThan(0);
  await noOverflow(candidate); await shot(candidate, 'home');
  if (project !== 'desktop') await candidate.getByRole('button', { name: 'Filters', exact: true }).click().then(async () => {
    // Filters start open; verify close and reopen on mobile.
    await candidate.getByRole('button', { name: 'Filters', exact: true }).click();
  });
  await candidate.getByPlaceholder('Search for jobs', { exact: true }).fill('Full Stack');
  await candidate.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(candidate.getByRole('heading', { name: 'Python Engineer', exact: true })).toHaveCount(0);
  await candidate.getByLabel('Experience level', { exact: true }).selectOption('Intermediate level');
  await candidate.getByLabel('Job type', { exact: true }).selectOption('Full-time');
  await candidate.getByLabel('Work mode', { exact: true }).selectOption('Hybrid');
  await candidate.getByLabel('Min salary', { exact: true }).fill('1000000');
  await candidate.getByLabel('Max salary', { exact: true }).fill('1300000');
  await expect(candidate.getByRole('heading', { name: 'Full Stack Developer', exact: true })).toBeVisible();
  await candidate.getByLabel('Min salary', { exact: true }).fill('2000000');
  await expect(candidate.getByRole('heading', { name: 'No matching opportunities yet' })).toBeVisible();
  await candidate.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await candidate.getByLabel('Remote', { exact: true }).check();
  await expect(candidate.getByRole('heading', { name: 'Python Engineer', exact: true })).toBeVisible();
  await expect(candidate.getByRole('heading', { name: 'Full Stack Developer', exact: true })).toHaveCount(0);
  await candidate.getByRole('button', { name: 'Clear filters', exact: true }).click();
});
test('candidate signs in through REAL Clerk password and test OTP; API verifies the real session', async () => {
  await candidate.getByRole('button', { name: 'Login', exact: true }).click();
  await credentials(candidate, account.email, account.password, true);
  const prepared = candidate.waitForResponse(response => /\/prepare_(?:first|second)_factor(?:\?|$)/.test(response.url()) && response.ok(), { timeout: 15000 }).catch(() => null);
  await candidate.getByRole('button', { name: 'Continue', exact: true }).click();
  const passwordField = candidate.locator('input[name=password]');
  if (await passwordField.isVisible()) await passwordField.fill('', { timeout: 1000 }).catch(() => {});
  await expect(candidate.getByText('Check your email', { exact: true }).or(candidate.getByRole('link', { name: 'Career hub', exact: true }))).toBeVisible({ timeout: 30000 });
  if (await candidate.getByText('Check your email', { exact: true }).isVisible()) {
    if (!await prepared) {
      const resend = candidate.getByRole('button', { name: /Didn't receive a code.*Resend/ });
      await expect(resend).toBeEnabled({ timeout: 40000 });
      const sent = candidate.waitForResponse(response => /\/prepare_(?:first|second)_factor(?:\?|$)/.test(response.url()) && response.ok());
      await resend.click(); await sent;
    }
    const input = candidate.locator('input[autocomplete="one-time-code"], input[data-index="0"], input[inputmode="numeric"]').first();
    await expect(input).toBeVisible();
    await input.pressSequentially('424242');
  }
  await expect(candidate.getByRole('link', { name: 'Career hub', exact: true })).toBeVisible({ timeout: 30000 });
  expect((await candidateApi('/api/users/user')).status).toBe(200);
  const anonymous = await fetch(api + '/api/users/user'); // Fresh request without browser cookies.
  expect(anonymous.status).toBe(401);
  await shot(candidate, 'candidate-signed-in');
});
test('candidate profile updates persist after browser refresh', async () => {
  await candidate.getByRole('link', { name: 'Career hub', exact: true }).click();
  await candidate.getByRole('button', { name: 'Profile', exact: true }).click();
  await candidate.getByLabel('Skills (comma separated)', { exact: true }).fill('React, JavaScript, Node.js, Express, MongoDB');
  await candidate.getByLabel(/^Education$/i).fill('BSc Computer Science — browser QA');
  await candidate.getByLabel(/^Experience$/i).fill('Built a MERN portfolio with 2 years of project experience.');
  await candidate.getByLabel(/^Github$/i).fill('https://github.com/example');
  await candidate.getByLabel(/^Linkedin$/i).fill('https://www.linkedin.com/in/example');
  await candidate.getByLabel(/^Portfolio$/i).fill('https://example.com');
  await candidate.getByRole('button', { name: 'Save profile', exact: true }).click();
  await expect(candidate.getByText(/Profile updated/)).toBeVisible();
  await candidate.reload();
  await candidate.getByRole('button', { name: 'Profile', exact: true }).click();
  await expect(candidate.getByLabel(/^Education$/i)).toHaveValue('BSc Computer Science — browser QA');
  await noOverflow(candidate); await shot(candidate, 'profile');
});
test('candidate saves and removes jobs with persisted browser-visible results', async () => {
  await candidate.getByRole('link', { name: 'InsiderJobs home' }).click();
  const card = candidate.locator('div.card-hover').filter({ has: candidate.getByRole('heading', { name: 'Full Stack Developer', exact: true }) });
  await card.getByRole('button', { name: 'Save job', exact: true }).click();
  await expect(card.getByRole('button', { name: 'Saved', exact: true })).toBeVisible();
  await candidate.getByRole('link', { name: 'Career hub', exact: true }).click();
  await candidate.getByRole('button', { name: 'Saved jobs', exact: true }).click();
  await expect(candidate.getByRole('heading', { name: 'Full Stack Developer', exact: true })).toBeVisible();
  await shot(candidate, 'saved-jobs');
  await candidate.getByRole('button', { name: 'Saved', exact: true }).click();
  await expect(candidate.getByRole('heading', { name: 'Start your shortlist', exact: true })).toBeVisible();
});
test('real PDF upload reaches Cloudinary; analysis, matching and private download work', async () => {
  await candidateApi('/api/users/profile', 'PUT', { skills: [] });
  await candidate.getByRole('link', { name: 'Applied Jobs', exact: true }).click();
  await candidate.locator('#resumeUpload').setInputFiles(path.join(root, 'server/e2e/fixtures/resume.pdf'));
  const upload = candidate.waitForResponse(response => response.url() === api + '/api/users/update-resume' && response.request().method() === 'POST');
  await candidate.getByRole('button', { name: 'Save', exact: true }).click();
  const response = await upload;
  expect(response.status()).toBe(200);
  const parsed = await response.json();
  expect(parsed.processingStatus).toBe('processed');
  expect(parsed.analysis.skills).toEqual(expect.arrayContaining(['React', 'Node.js', 'MongoDB']));
  expect(parsed.analysis.experienceYears).toBe(2);
  await expect(candidate.getByRole('button', { name: 'Get resume link' })).toBeVisible();
  await candidate.getByRole('button', { name: 'Get resume link' }).click();
  const link = candidate.getByRole('link', { name: 'Open resume', exact: true });
  await expect(link).toBeVisible();
  const href = await link.getAttribute('href');
  let download;
  try { download = await candidate.request.get(href); } catch { throw new Error('Signed Cloudinary download failed; URL suppressed'); }
  expect(download.status()).toBe(200);
  expect((await download.body()).subarray(0, 5).toString()).toBe('%PDF-');
  const storage = await mongoose.createConnection(session.mongoUri, { autoIndex: false, autoCreate: false }).asPromise();
  const stored = await storage.db.collection('users').findOne({ _id: account.id }, { projection: { resume: 1 } });
  await storage.close();
  const unsignedCdn = new URL(stored.resume);
  // Cloudinary's upload response already contains a signed CDN URL. Remove that signature too.
  unsignedCdn.pathname = unsignedCdn.pathname.replace(/\/s--[^/]+--\//, '/');
  unsignedCdn.searchParams.delete('signature');
  let direct;
  try { direct = await candidate.request.get(unsignedCdn.href); } catch { throw new Error('Direct private-asset access check failed; URL suppressed'); }
  expect(direct.status()).toBeGreaterThanOrEqual(400);
  const unsigned = new URL(href); unsigned.searchParams.delete('signature');
  let denied;
  try { denied = await candidate.request.get(unsigned.href); } catch { throw new Error('Unsigned Cloudinary access check failed; URL suppressed'); }
  expect(denied.status()).toBeGreaterThanOrEqual(400);
  await expect(candidate.getByRole('region', { name: 'Resume analysis summary' }).getByText('React', { exact: true })).toBeVisible();
  await candidate.getByRole('link', { name: 'Compare skills and find matching jobs', exact: true }).click();
  await expect(candidate.getByText(/Processing: processed/)).toBeVisible();
  await candidate.getByLabel('Compare with a job', { exact: true }).selectOption(session.jobs[0].id);
  await expect(candidate.getByRole('heading', { name: /Full Stack Developer.*skill coverage/ })).toBeVisible();
  await noOverflow(candidate); await shot(candidate, 'resume-analysis');
  await candidate.getByRole('button', { name: 'Matches', exact: true }).click();
  await expect(candidate.getByText('100% skill coverage', { exact: true }).first()).toBeVisible();
  await shot(candidate, 'job-matching');
});
test('recruiter signs in and creates, edits and hides an owned job in the browser', async () => {
  await recruiterLogin(recruiter, session.recruiter);
  await recruiter.getByRole('link', { name: 'Add Job', exact: true }).click();
  await recruiter.getByLabel('Job Title', { exact: true }).fill(title);
  await recruiter.locator('.ql-editor').fill('React JavaScript Node.js Express MongoDB. Build accessible portfolio products.');
  await recruiter.getByLabel('Job Salary', { exact: true }).fill('1500000');
  await recruiter.getByLabel('Job type', { exact: true }).selectOption('Full-time');
  await recruiter.getByLabel('Work mode', { exact: true }).selectOption('Remote');
  await recruiter.getByRole('button', { name: 'ADD', exact: true }).click();
  await expect(recruiter.getByText('Job posted successfully', { exact: true })).toBeVisible();
  await recruiter.getByRole('link', { name: 'Manage Jobs', exact: true }).click();
  const row = recruiter.getByRole('row').filter({ hasText: title });
  await row.getByRole('button', { name: 'Edit job', exact: true }).click();
  await recruiter.getByLabel('Salary (existing CTC units)', { exact: true }).fill('1600000');
  await recruiter.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(recruiter.getByRole('heading', { name: 'Manage Jobs', exact: true })).toBeVisible();
  await row.getByRole('checkbox').click();
  await expect(row.getByRole('checkbox')).not.toBeChecked();
  const jobs = await recruiter.evaluate(async api => (await (await fetch(api + '/api/company/list-jobs', { headers: { token: localStorage.getItem('companyToken') } })).json()).jobsData, api);
  const posted = jobs.find(job => job.title === title);
  expect(posted.salary).toBe(1600000); expect(posted.visible).toBe(false);
  expect((await candidate.request.get(api + '/api/jobs/' + posted._id)).status()).toBe(404);
  await row.getByRole('checkbox').click();
  await expect.poll(async () => (await candidate.request.get(api + '/api/jobs/' + posted._id)).status()).toBe(200);
  await noOverflow(recruiter); await shot(recruiter, 'manage-jobs');
});
test('candidate opens job details, applies once and sees pending history', async () => {
  await candidate.goto('/apply-job/' + session.jobs[0].id);
  await expect(candidate.getByRole('heading', { name: 'Full Stack Developer', exact: true })).toBeVisible();
  await candidate.getByRole('button', { name: 'Apply Now', exact: true }).first().click();
  await expect(candidate.getByRole('button', { name: 'Already Applied', exact: true }).first()).toBeDisabled();
  const duplicate = await candidateApi('/api/users/apply', 'POST', { jobId: session.jobs[0].id });
  expect(duplicate.status).toBe(409);
  await candidate.getByRole('link', { name: 'Applied Jobs', exact: true }).click();
  const row = applicationHistory(candidate);
  await expect(row.getByText('Pending', { exact: true })).toBeVisible();
  await shot(candidate, 'application-pending');
});
test('recruiter reviews real applicant resume, changes status and schedules/updates interview', async () => {
  await recruiter.getByRole('link', { name: 'View Applications', exact: true }).click();
  const row = recruiter.getByRole('row').filter({ hasText: `Demo ${project}` });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Get resume link', exact: true }).click();
  await expect(row.getByRole('link', { name: 'Open resume', exact: true })).toBeVisible();
  let resume;
  try { resume = await recruiter.request.get(await row.getByRole('link', { name: 'Open resume', exact: true }).getAttribute('href')); }
  catch { throw new Error('Recruiter resume download failed; signed URL suppressed'); }
  expect(resume.status()).toBe(200);
  expect((await resume.body()).subarray(0, 5).toString()).toBe('%PDF-');
  await row.getByLabel('Application status', { exact: true }).selectOption('Accepted');
  await expect(recruiter.getByText('Application Accepted', { exact: true })).toBeVisible();
  await row.getByRole('button', { name: 'Schedule interview', exact: true }).click();
  const tomorrow = new Date(Date.now() + 86400000);
  const local = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  await row.getByLabel(/Date & time/).fill(local);
  await row.getByLabel('Meeting details', { exact: true }).fill('QA video interview — original details');
  await row.getByRole('button', { name: 'Save interview', exact: true }).click();
  await expect(row.getByRole('button', { name: 'Update interview', exact: true })).toBeVisible();
  await row.getByRole('button', { name: 'Update interview', exact: true }).click();
  await row.getByLabel('Meeting details', { exact: true }).fill('QA video interview — updated details');
  await row.getByRole('button', { name: 'Save interview', exact: true }).click();
  await expect(row.getByRole('button', { name: 'Update interview', exact: true })).toBeVisible();
  await shot(recruiter, 'applicant-interview');
  await candidate.reload();
  const history = applicationHistory(candidate);
  await expect(history.getByText('Accepted', { exact: true })).toBeVisible();
  await expect(history.getByText('QA video interview — updated details', { exact: true })).toBeVisible();
  await noOverflow(candidate); await shot(candidate, 'candidate-interview');
});
test('analytics charts show real application counts and another recruiter is denied access', async ({ browser }) => {
  await recruiter.getByRole('link', { name: 'Analytics', exact: true }).click();
  await expect(recruiter.getByRole('heading', { name: 'Your hiring, at a glance.' })).toBeVisible();
  const applications = recruiter.locator('.panel').filter({ has: recruiter.getByText('Applications', { exact: true }) });
  const db = await mongoose.createConnection(session.mongoUri, { autoIndex: false, autoCreate: false }).asPromise();
  const owner = await db.db.collection('companies').findOne({ email: session.recruiter.email });
  const total = await db.db.collection('jobapplications').countDocuments({ companyId: owner._id });
  const perJob = await db.db.collection('jobapplications').countDocuments({ companyId: owner._id, jobId: new mongoose.Types.ObjectId(session.jobs[0].id) });
  await db.close();
  expect(total).toBeGreaterThan(0);
  await expect(applications.locator('p').last()).toHaveText(String(total));
  await expect(recruiter.getByRole('heading', { name: 'Applications by job', exact: true })).toBeVisible();
  await expect(recruiter.getByRole('listitem').filter({ hasText: 'Full Stack Developer' }).locator('strong')).toHaveText(String(perJob));
  await noOverflow(recruiter); await shot(recruiter, 'analytics');
  const other = await browser.newPage();
  await recruiterLogin(other, session.otherRecruiter);
  await expect(other.getByRole('heading', { name: 'No Jobs Available or Posted' })).toBeVisible();
  const history = await candidateApi('/api/users/applications');
  const application = history.data.applications[0];
  const checks = await other.evaluate(async ({ api, jobId, applicationId }) => {
    const headers = { token: localStorage.getItem('companyToken'), 'Content-Type': 'application/json' };
    const paths = ['/api/company/jobs/' + jobId, '/api/company/applications/' + applicationId + '/resume'];
    const edit = await fetch(api + paths[0], { method: 'PUT', headers, body: JSON.stringify({ title: 'Unauthorized edit' }) });
    const resume = await fetch(api + paths[1], { headers });
    const applicants = await (await fetch(api + '/api/company/applicants', { headers })).json();
    return { edit: edit.status, resume: resume.status, applicants: applicants.applications.length };
  }, { api, jobId: session.jobs[0].id, applicationId: application._id });
  expect(checks).toEqual({ edit: 404, resume: 404, applicants: 0 });
  await other.close();
});
test('candidate and recruiter sign out; no uncaught errors or failed local network requests', async () => {
  await recruiter.getByRole('button', { name: 'Logout', exact: true }).first().click();
  await expect(recruiter.getByRole('button', { name: 'Recruiter Login', exact: true })).toBeVisible();
  await candidate.getByRole('button', { name: /Open user menu/i }).click();
  await candidate.getByText('Sign out', { exact: true }).click();
  await expect(candidate.getByRole('button', { name: 'Login', exact: true })).toBeVisible();
  await candidate.goto('/career');
  await expect(candidate.getByText('Sign in to open your career hub.', { exact: true })).toBeVisible();
  await noOverflow(candidate); await shot(candidate, 'signed-out');
  expect(errors).toEqual([]); expect(failures).toEqual([]);
});
