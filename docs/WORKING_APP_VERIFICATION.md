# Working application verification

> Historical snapshot. The [independent final audit](FINAL_E2E_AUDIT.md), [feature checklist](WORKING_FEATURES_CHECKLIST.md) and [updated demo guide](DEMO_GUIDE.md) supersede the earlier counts, URLs and seeded-profile assumptions below. The persistent local application runs on **5175/5000**; 5173/5101 is the separate disposable demo.

Date: 21 November 2026. Scope: existing InsiderJobs implementation, real Chrome desktop/mobile browser journeys, live Clerk development authentication and Cloudinary QA assets, isolated local MongoDB, no production database writes or deployment.

## Result and running URLs

- Frontend: <http://127.0.0.1:5173>
- Backend: <http://127.0.0.1:5101>
- Health: <http://127.0.0.1:5101/health>
- Startup: `cd server` then `npm run demo` (see [DEMO_GUIDE.md](DEMO_GUIDE.md)). The helper starts MongoDB, Express and Vite together, using the existing app factory/controllers and normal Clerk middleware.
- Browser runner: installed Google Chrome **158.0.8127.37**, headless Playwright. Desktop **1440×1000**, mobile **390×844** with touch/mobile emulation. Physical devices and Safari were not exercised.

Classifications below describe the evidence precisely:

- **WORKING — Verified in a real browser:** the action was actually executed through rendered controls, with real application API/database operations.
- **TESTED WITH MOCKS:** automated behavior passed using a substituted identity or external transport; not a live-service claim.
- **BLOCKED:** missing credentials, permissions, connectivity or external configuration.
- **FAILED:** an executed check remains broken.
- **NOT TESTED:** no execution evidence exists for the stated boundary.

## Feature evidence

| Feature | Implementation status | Browser-tested status | Backend-tested status | External integration status | Remaining issue | Evidence or test result |
|---|---|---|---|---|---|---|
| Homepage and API connection | Implemented; startup/CSS fixed | WORKING, desktop/mobile | WORKING, real local API | No external database used | Normal persistent database DNS blocked | Styled card rendering and actual job responses asserted |
| Candidate Clerk sign-in | Existing; real workflow verified | WORKING, password + test OTP | WORKING, actual Clerk session JWT accepted | WORKING, Clerk development service | Production-instance auth not tested | UI credentials/OTP, authenticated profile 200, anonymous request 401 |
| Protected route and logout | Implemented | WORKING, both sizes | WORKING | WORKING, real Clerk sign-out | No physical-device tests | Account menu sign-out; career hub sign-in prompt; unauthenticated API denied |
| Search and advanced filters | Implemented; accessible select labels fixed | WORKING, both sizes | Jobs served from actual local MongoDB | Not applicable | Currency/pay-period semantics remain existing CTC | Title + salary + level + type + work-mode filters and empty state asserted; location checkbox tested |
| Candidate profile | Implemented; stable textarea names fixed | WORKING, both sizes | WORKING, real DB persistence | Identity remains Clerk-managed | Identity edits through Clerk account UI not tested | Update education/experience/links/skills and browser refresh/readback |
| Saved jobs | Implemented | WORKING, both sizes | WORKING, addToSet/pull and owner scope | Not applicable | None found in executed path | Save from listing, verify hub shortlist, remove and verify empty state |
| PDF upload | Implemented; live service verified | WORKING, both sizes | WORKING, actual parser and DB metadata | WORKING, real Cloudinary QA folder | Malware scanning/OCR/DOCX absent | Browser file input + HTTP 200, processed status, known extracted skills and two-year hint |
| Resume analysis | Implemented; PDF skills distinguished from profile skills | WORKING, both sizes | WORKING | PDF processed locally; no AI service | Heuristic extraction, not verified qualifications | Synthetic PDF text extraction checked independently of manual profile skills |
| Job matching | Implemented | WORKING, both sizes | WORKING, ranked actual jobs | Not applicable | Heuristic score; no trained accuracy claim | Matching/missing skill comparison and 100% coverage for a fixture with all recognized requirements |
| Private resume access | Implemented | WORKING, prepared link shown in UI | WORKING, scoped signing endpoint | WORKING, real signed download 200; unsigned CDN 401 | Legacy public uploads require separate approved migration | Download bytes begin with `%PDF-`; removing API signature is denied; stripping signed CDN path is denied |
| Job details and application | Implemented | WORKING, both sizes | WORKING, real inserts/statuses | Clerk auth verified | Persistent DB uniqueness index remains unverified | Open details, apply once, disabled Already Applied, history Pending |
| Duplicate applications | Implemented with unique-index declaration | WORKING, duplicate response asserted after browser submission | WORKING, local index and five concurrent request test | Persistent DB BLOCKED | Real persistent index requires review/approval | One insert/four conflicts in isolated API tests; browser second submission returns 409 |
| Recruiter login/logout | Existing; visible logout fixed | WORKING, both sizes | WORKING, real bcrypt and JWT | Local accounts; no mocked JWT | Password recovery absent | Real login form and logout; no token/localStorage injection |
| Job posting/editing | Implemented; form labels fixed | WORKING, both sizes | WORKING | Not applicable | None found in executed path | Create via Quill form, edit salary, inspect persisted value |
| Job visibility | Implemented; in-place saving feedback fixed | WORKING, both sizes | WORKING | Not applicable | None found in executed path | Hide + public detail 404; restore + detail 200 |
| Applicant review/resumes | Implemented | WORKING, both sizes | WORKING, recruiter-scoped records | WORKING, signed Cloudinary PDF download | Legacy public assets remain a separate migration | UI applicant row, generated link and downloaded PDF bytes |
| Status updates | Implemented | WORKING, both sizes | WORKING | Email BLOCKED | Resend unconfigured | Accepted set in recruiter UI, visible in refreshed candidate history |
| Interviews | Implemented; mobile candidate cards added | WORKING, both sizes | WORKING | Email BLOCKED | External calendar integration not implemented | Schedule, update meeting details, verify candidate date/timezone/status/details |
| Recruiter analytics | Implemented; retry handling fixed | WORKING, both sizes | WORKING, actual aggregates | Not applicable | Not load-tested at scale | Displayed total and chart count compared independently with local MongoDB counts |
| Cross-recruiter isolation | Implemented | WORKING, second recruiter login in real browser | WORKING | Not applicable | None found in tested resources | Other account sees no jobs/applicants; prohibited edit/resume requests return 404 |
| Signed Clerk webhooks | Implemented | NOT TESTED live ingress | TESTED WITH MOCKS for signed fixture events and local DB | NOT TESTED, no public localhost tunnel | Local demo explicitly mirrors generated test identities | Raw signed bytes accepted, tampering rejected, duplicate delivery preserves profile |
| Configured persistent MongoDB | Existing configuration preserved | BLOCKED | BLOCKED | BLOCKED, system DNS ENOTFOUND | Owner must resolve hostname/network availability | Read-only attempt failed; no record listing, duplicate count or persistent index installation performed |
| Email notifications | Optional implementation exists | BLOCKED | TESTED WITH MOCKS, disabled/success/failure paths | BLOCKED, RESEND_API_KEY and EMAIL_FROM absent | Verified sender/test recipient required | No application/status/interview emails sent; demo explicitly disables transport |
| Recruiter registration | Implemented | NOT TESTED in this browser suite | Validation covered; positive live registration NOT TESTED | Logo upload flow NOT TESTED | Suite uses authorized seeded test recruiters | Do not infer signup success from login success |
| Vercel deployment | Local readiness work retained | NOT TESTED | Local build/syntax pass | NOT TESTED | Approval and staged hosting checks required | No push, deployment or hosting variables changed |

## Browser tests and artifacts

`server/e2e/journeys.spec.js` contains ten ordered journeys per viewport:

1. Styled homepage, search and combined filters.
2. Real Clerk password/OTP sign-in and protected API checks.
3. Profile editing and persistence after reload.
4. Saved-job add/remove.
5. Actual PDF upload, extraction, matching and Cloudinary privacy checks.
6. Recruiter login, posting, editing and visibility.
7. Candidate application, duplicate rejection and Pending history.
8. Recruiter resume access, acceptance, interview creation/update and candidate readback.
9. Database-backed analytics and second-recruiter authorization denial.
10. Both sign-outs, signed-out route, page/console/network checks.

The suite uses Clerk's official testing token only to avoid automated-bot challenges. It still types the real generated credentials into Clerk's rendered sign-in form, waits for code preparation, enters the reserved test OTP, and receives a genuine Clerk session. It does **not** inject a fabricated user, session or JWT. Recruiter credentials are also typed into the real form; JWTs come from the actual login endpoint.

The demo runs actual MongoDB locally. Fixtures are synthetic records, not mocked API responses. Browser tests reset only validated run-owned local fixture data. Cloudinary receives an actual synthetic PDF under a unique QA prefix. No real person receives a test email. Full signed URLs, passwords, tokens, hostnames and connection strings are not printed. Traces/videos are disabled; private run credentials and reports are Git-ignored.

Unexpected page errors and non-resource console errors fail the suite. Unexpected local API 5xx responses and failed local requests also fail it. Explicitly expected anonymous/duplicate/ownership/unsigned requests produce 401/404/409-style responses and are asserted as such. Clerk's development-mode warning is expected. Mobile checks assert no document-wide horizontal overflow; candidate interview details now use readable cards instead of a clipped table.

## Defects found and fixed during browser testing

- **Loopback timeout:** sandboxed Windows server processes were unreachable from Chrome. Running local QA outside the sandbox resolved it; no firewall, proxy or public DNS configuration was changed.
- **Missing Tailwind styling:** the server-launched Vite instance resolved Tailwind relative to `server`. PostCSS now explicitly points to the client config, and content files resolve relative to that config.
- **Unstable accessible labels:** nested select options and saved textarea contents interfered with exact control names; fields now have stable accessible labels.
- **Stale retry errors:** analytics and resume insights now clear prior errors after a successful response.
- **Visibility checkbox flicker:** an async controlled checkbox reverted and the entire table reloaded. It now updates the returned row in place and disables that checkbox while saving.
- **Unreachable recruiter logout:** the old hover-only menu overlapped the visible logout control. The duplicate hover surface was replaced with a normal visible button.
- **Notifications blocking navigation:** notifications moved away from top navigation; empty notification-container areas no longer intercept pointer events.
- **Mobile navigation/critical details:** navigation wraps without overflow, recruiter sidebar controls have accessible names, and candidate interview details render as mobile cards.
- **Misleading hero count:** replaced the hardcoded “10,000+” claim with the actual fetched opportunity count.
- **Ambiguous resume skills:** the analysis screen now labels skills extracted from the PDF separately from profile skills used for matching.
- **Test-only races/state:** synchronized Clerk OTP preparation/auto-submission; anonymous checks use no browser cookies; reused demo fixtures are explicitly reset. These were test corrections, not reasons to weaken authentication.
- **Cloudinary test interpretation:** upload responses already include a signed CDN URL. A proper anonymous test strips both CDN and API signatures; the unsigned CDN path returns 401. No asset was made public to satisfy a test.

## Commands and final results

| Command | Result |
|---|---|
| `cd server; npm run test:e2e` | PASS, 20/20 tests in 113.15 seconds; 0 failed, 0 skipped, 0 flaky, no retries |
| `cd server; npm test` | PASS, 11 unit tests |
| `cd server; npm run test:integration` | PASS, 15 isolated MongoDB/API tests |
| `cd server; npm run check` | PASS, 37 JavaScript files |
| `cd client; npm run lint` | PASS |
| `cd client; npm run build` | PASS |
| `git diff --check` | PASS at handoff |
| Environment preservation | Both existing files matched this task's initial SHA-256 baseline |
| Interrupted-demo cleanup | PASS: recorded temporary Clerk users and five QA resume assets removed before clean restart |

The redacted, shareable [BROWSER_TEST_RESULTS.json](BROWSER_TEST_RESULTS.json) preserves the final runner statistics and each case's project, result and duration without authentication state. After testing, `npm run demo:reset` cleared only disposable candidate actions and test-created postings for a fresh manual walkthrough. A new browser check confirmed two starter job cards and HTTP 200 from both frontend and backend health. The local demo was left running for handoff; its database is intentionally temporary.

Earlier browser runs failed while discovering the defects and correcting test assumptions described above; skipped dependent cases in those intermediate serial runs are not counted as passes. Final executed results are reported independently, without automatic retries hiding failures.

## Screenshot evidence

| Screen | Desktop | Mobile |
|---|---|---|
| Homepage | [Desktop](screenshots/desktop-home.png) | [Mobile](screenshots/mobile-home.png) |
| Candidate profile | [Desktop](screenshots/desktop-profile.png) | [Mobile](screenshots/mobile-profile.png) |
| Saved jobs | [Desktop](screenshots/desktop-saved-jobs.png) | [Mobile](screenshots/mobile-saved-jobs.png) |
| Resume analysis | [Desktop](screenshots/desktop-resume-analysis.png) | [Mobile](screenshots/mobile-resume-analysis.png) |
| Job matching | [Desktop](screenshots/desktop-job-matching.png) | [Mobile](screenshots/mobile-job-matching.png) |
| Job management | [Desktop](screenshots/desktop-manage-jobs.png) | [Mobile](screenshots/mobile-manage-jobs.png) |
| Applicant/interview controls | [Desktop](screenshots/desktop-applicant-interview.png) | [Mobile](screenshots/mobile-applicant-interview.png) |
| Candidate interview | [Desktop](screenshots/desktop-candidate-interview.png) | [Mobile](screenshots/mobile-candidate-interview.png) |
| Analytics | [Desktop](screenshots/desktop-analytics.png) | [Mobile](screenshots/mobile-analytics.png) |
| Signed-out state | [Desktop](screenshots/desktop-signed-out.png) | [Mobile](screenshots/mobile-signed-out.png) |

These contain only synthetic QA data and development-instance identity. They are actual browser captures, not design mockups.

## Remaining manual work

1. Resolve the configured MongoDB hostname/network issue. A public-resolver diagnostic was rejected by automatic approval review because it would disclose the private hostname; that query was not run. No persistent data or index was changed. Use your provider/internal network diagnostics or explicitly authorize an appropriate further diagnostic.
2. Once that database is reachable, run the read-only duplicate/index report. Review results and obtain approval before `--apply`; never auto-delete duplicates.
3. Configure Resend and a verified sender only if email is required; authorize test recipients before real delivery tests.
4. Verify actual Clerk webhook delivery in a dedicated staging environment, rather than assuming localhost fixture mirroring proves ingress.
5. Approve and verify a staging deployment before production, including runtime, request-size limits, PDF worker bundling and operational controls.

No unresolved feature failure should be inferred as a pass from a build alone. The working demo is a verified local demonstration with real authentication/storage services and a disposable database; it is not a production deployment certification.
# Current verification

This file records an earlier development session. The independent 21 November 2026 [final end-to-end audit](FINAL_E2E_AUDIT.md), [bug-fix report](BUG_FIX_REPORT.md) and [feature checklist](WORKING_FEATURES_CHECKLIST.md) supersede earlier pass counts and seeded-profile assumptions. Use the updated [demo guide](DEMO_GUIDE.md) for the persistent local application on 5175/5000.
