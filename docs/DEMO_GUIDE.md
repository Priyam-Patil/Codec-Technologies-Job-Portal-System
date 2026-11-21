# InsiderJobs demo and regression guide

Updated 21 November 2026. Use the persistent local application below for your own demonstration. It runs the existing React components, Express controllers, real Clerk development authentication and real authenticated Cloudinary uploads. It does not connect to the configured remote database.

## Start the persistent local application

Choose one launch method. The combined launcher was added and verified during the [network investigation](NETWORK_ERROR_ROOT_CAUSE.md):

```powershell
Set-Location -LiteralPath 'E:/job_portal - Copy/server'
npm run dev:local:all
```

It starts both services on 5175/5000 and keeps local MongoDB records across graceful `stop` and restart. Keep that terminal open. Do not also start the separate processes below on the same ports. The following two-terminal method remains a compatible alternative.

Use PowerShell with Node 22.13+ (22.x) or Node 24+, and Google Chrome for browser tests. Dependencies are already installed in this workspace. On a fresh checkout run `npm ci` in `server` and `client`. Do not run tools that generate or rewrite environment files.

Terminal 1:

```powershell
Set-Location -LiteralPath 'E:/job_portal - Copy/server'
npm run dev:local
```

Terminal 2:

```powershell
Set-Location -LiteralPath 'E:/job_portal - Copy/client'
npm run dev:local
```

Open <http://127.0.0.1:5175>. Backend: <http://127.0.0.1:5000/health>; public jobs: <http://127.0.0.1:5000/api/jobs>. Use the same hostname consistently. The existing frontend API variable already selects port 5000; its file was not changed. On Windows use a normal local terminal if a restricted sandbox isolates loopback networking.

`server/scripts/dev-local.js` starts a localhost-only MongoDB process using **`.qa/local-mongodb` on disk**, database `insiderjobs_development`. No jobs or accounts are seeded. Recruiter-created jobs, profiles, applications and resume metadata survive browser refresh and graceful server restart. Type `stop` in the backend terminal to close it cleanly; keep `.qa/local-mongodb` if you want to retain your local data. Do not run two local backend processes against that directory. The first run can download the official MongoDB binary.

Email and Sentry are disabled only in this explicit local process. Real uploads use a separate `insiderjobs/local-development` Cloudinary folder; do not upload confidential resumes for demonstrations. Old uploaded assets are retained when resumes are replaced. This mode requires development Clerk credentials and refuses live Clerk keys. It does not replace the production server entry point.

## Environment names and accounts

Existing environment files are confidential and unchanged. No additional variable is required for this local mode.

- Client: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_BACKEND_URL`.
- API: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `JWT_SECRET`, `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_SECRET_KEY`.
- Normal remote `npm start`: additionally uses `MONGODB_URI`; webhook delivery needs `CLERK_WEBHOOK_SECRET`. Optional `ALLOWED_ORIGINS`, `PORT`, `SENTRY_DSN` depend on the existing deployment configuration.
- Optional email: `RESEND_API_KEY`, `EMAIL_FROM`, verified sender and authorized test recipients. Configure these manually only when needed.

Use your authorized Clerk **development** test account through the actual Login form. On first verified login the API initializes the MongoDB profile from Clerk; no localhost webhook or pre-seeded candidate row is required. Clerk identity/name changes remain managed through the account menu and signed webhooks. Register a recruiter using the visible Recruiter Login -> Sign up form and a PNG/JPEG/WebP logo. Choose test addresses and keep passwords private. Candidate and recruiter roles have separate sessions; separate browser windows/contexts make the demo clearer.

For automated tests the audit helper creates three temporary Clerk users with the reserved `+clerk_test` address convention. Generated details are stored only in ignored `.qa/audit-session.json`; inspect privately in an editor, never print or commit it. These users log in with a real password and development test email code `424242` when requested. The official Clerk testing token only avoids bot challenges. The automation never fabricates a live candidate token. Locally registered test recruiter credentials are in ignored `.qa/local-recruiter-{desktop,tablet,mobile}.json`. Those recruiter records belong to the local development database, and remain after testing.

## Safe demonstration data

In the persistent application, register a recruiter, then create a job titled `Demo Full Stack Developer`, description mentioning React, Node.js, MongoDB and Kubernetes, valid category/location/level, salary, job type and work mode. Every displayed job and chart count comes from MongoDB. This mode deliberately has no fake or mocked responses.

For a non-confidential upload use `server/e2e/fixtures/resume.pdf`. It contains explicit React, Node.js, MongoDB and a two-year experience mention. Skills are extracted from PDF text, independently of manual profile skills. The experience number is an unverified text hint. A job requiring exactly those three skills plus Kubernetes shows **75% recognized-skill coverage**, with Kubernetes missing. This is an explainable heuristic, not hiring probability or validated ML accuracy. Scanned PDFs have no OCR; a valid PDF without recognized skills shows a fallback rather than invented results. Damaged/encrypted PDFs are rejected. Uploads must be PDF and no larger than 5 MB.

## Candidate walkthrough and expected outcomes

1. Login using Clerk. Career hub and Applied Jobs appear; refresh preserves the actual Clerk session.
2. Browse jobs, search by title/location, select salary/experience/type/work-mode filters. Results narrow; Enter submits search, Clear resets both hero and sidebar fields.
3. Open job details. Apply before uploading a resume leads to Applied Jobs with an upload prompt. While identity/profile load, Apply waits.
4. Select the fixture PDF and Save. The same screen immediately shows extracted skills and experience hint. Refresh retains them. Invalid type/size/damaged PDF shows an error without fake success.
5. Follow Compare skills and find matching jobs. Choose the demonstration job and inspect coverage, matching/missing skills and suggestions. Manual profile skills can supplement recommendations; the extracted-skills panel remains PDF-only.
6. Save a job, open Career hub -> Saved jobs, refresh and remove it. No duplicate bookmarks appear.
7. Edit profile skills, education, experience and professional URLs; Save and refresh. Invalid GitHub/LinkedIn host URLs are rejected by the API.
8. Apply once. Already Applied becomes disabled; repeated API submission is rejected with 409. Hide applied excludes the job; Clear restores listings.
9. Applied Jobs shows Pending, then recruiter updates. Re-enter history, focus the window, click Refresh applications or wait up to 30 seconds for updates.
10. After an interview is scheduled, history shows local date/time and updated meeting details only to its participants.
11. Sign out with Clerk's user menu. Private pages require sign-in again.

## Recruiter walkthrough and expected outcomes

1. Register or login through Recruiter Login; a real JWT session is validated before the dashboard renders. Wrong credentials show a real error.
2. Add a job; required fields validate. Manage Jobs lists the persisted record. Refresh and edit salary/description/fields; Save retains changes.
3. Toggle visibility off. The job disappears from public listings and its public detail endpoint returns 404. Restore visibility.
4. View Applications after the candidate applies. Get resume link then Open resume retrieves a real private PDF using a short-lived signed link.
5. Change Pending to Accepted or Rejected; reload to confirm persistence and check the candidate window.
6. Schedule an interview with a future local date/time and meeting details, save, update it and confirm the candidate sees the new details. Stored date is an instant; each browser formats its local timezone.
7. Analytics shows actual job totals, application/status totals and applications per job. A new recruiter has a useful empty state. Another recruiter's resources cannot be read or changed.
8. Logout; protected dashboard routes return to the homepage.

## Automated checks and evidence

```powershell
Set-Location -LiteralPath 'E:/job_portal - Copy/server'
npm test
npm run test:integration
npm run check
npm run test:e2e:audit
Set-Location -LiteralPath 'E:/job_portal - Copy/client'
npm run lint
npm run build
```

The full audit configuration starts or reuses localhost 5000/5175 and a **separate** disposable audit application on 5102/5176. Its own test users/jobs are isolated. For a repeatable full run, start with a fresh disposable audit process; repeated login-heavy runs against one process retain its normal rate-limit counters. Stop only that audit process gracefully and clean its recorded manifest before starting a fresh one. Do not weaken production throttles. Existing `npm run demo` remains available on 5101/5173 and is not the persistent mode. Close stale processes before starting another instance on the same ports. Do not use automated tests against production. The normal-application test checks the local server marker and database URI before any fixture changes.

Backend integration tests use real isolated MongoDB and actual controllers, with Clerk identity, Cloudinary and email seams mocked. Browser journeys use real Clerk/Cloudinary/local MongoDB; only the explicit recovery test injects a temporary jobs 503, then retries the real API. Screenshots are in `docs/screenshots/final-*.png`; machine results in ignored `.qa/final-e2e-results.json`. Credentials/traces/videos are not included in screenshots or reports.

To independently check restart persistence, run `node scripts/verify-local-persistence.js` in `server`, stop the local backend gracefully, start it again, then run `node scripts/verify-local-persistence.js --compare`. Do not edit records between the baseline and comparison. Only the guarded localhost development database is read; output reports counts and equality without printing account details.

Optional read-only timezone verification: with a manually started `node scripts/demo.js --audit` process still running after the main journeys, run `node scripts/verify-interview-timezone.js` in `server`. It checks candidate rendering and the recruiter edit input against the same stored interview instant in India, New York and UTC. It does not save changes. The audit manifest and completed desktop application/interview must still exist.

Graceful audit shutdown removes only its generated Clerk users and scoped QA assets. If interrupted, stop the audit processes first, then run `npm run demo:cleanup -- --audit` to clean its recorded resources. Do not run cleanup while tests or their accounts are in use. The normal demo has its own cleanup manifest. Removing temporary Clerk identities invalidates those particular candidate sessions; use your own test account for a lasting personal demonstration.

## Limitations

The configured remote MongoDB still prevents ordinary `npm start`; this is not disguised as a production fix. Email delivery, live webhook ingress and hosted Vercel behavior remain blocked/unexecuted. See `REMAINING_BLOCKERS.md` and `FINAL_E2E_AUDIT.md`. No environment values, production records, Git history, remote, push or deployment was changed. This is a verified local development demonstration, not a production-readiness guarantee.
