# Resumed browser testing — 21 November 2026

## Exact coverage and counting

The original checklist was recovered from the owner-supplied [shared chat](https://chatgpt.com/s/t_6b013d920d0481918d3536c511320901). It contains **138 criteria in17 sections**. Original titles, expected results and section.case IDs are preserved verbatim in [ORIGINAL_138_CHECKLIST.json](ORIGINAL_138_CHECKLIST.json). The [case-by-case table](CHECKLIST_138_COVERAGE.md) and [machine-readable mapping](CHECKLIST_138_COVERAGE.json) identify evidence for every criterion.

| Scope | PASSED | FAILED | BLOCKED | NOT YET EXECUTED |
|---|---:|---:|---:|---:|
| Original138 unique checklist criteria | **138** | **0** | **0** | **0** |
| Additional external integration prerequisites from previous report, outside138 | 0 | 0 | **5** | 0 |

The138 denominator counts expected behaviors, not Playwright test functions. A long scenario verifies several criteria. Repeated runs and three viewport variants do not multiply checklist coverage. No simulated503, aborted-request, substituted-authentication or mocked service test is counted as a real-browser pass. Coverage uses retained executed evidence plus the new focused gap suite; it does not imply every original criterion was freshly rerun today or at every viewport.

Retained evidence covers48 automated live scenario/viewport executions and3 built-in-browser checks. The new12-scenario real Chrome suite adds12 distinct scenario labels: **60 automated +3 retained built-in checks =63 scenario/check labels** supporting138 criteria. This number is separate from138. The existing five external blockers are not items in the shared138 list.

## Preservation and current runtime

Before editing, fingerprints were recorded for107 existing source/document files and the two existing environment files. Final comparison: **0 missing source files**, exactly four intentionally changed baseline files, and **both environment files unchanged byte-for-byte**. Earlier edits, Git history and origin were preserved. No push, deployment, production connection, persistent index installation or data deletion occurred.

The normal application remains running and its existing Codex browser tab is visible and retained:

- Frontend: http://127.0.0.1:5175/ — HTTP200.
- Backend: http://127.0.0.1:5000/health — HTTP200.
- Separate audit frontend/API:5176/5102 — HTTP200.

Final read-only MongoDB verification (`.qa/resume-final-runtime-checks.json`): persistent local development database has12 users,25 companies,24 jobs and19 applications; disposable audit database has9 users,6 companies,9 jobs and4 applications. Both have the unique `(userId, jobId)` application index and **0 duplicate application groups**. These checks did not write records or indexes. Counts are a timestamped checkpoint and will change with subsequent authorized demonstration actions.

A restricted terminal initially could not see the running localhost processes, incorrectly suggesting an outage. An authorized host-level check confirmed all four services were already healthy. Duplicate launch attempts refused occupied ports without replacing the existing servers or database. The gap suite then ran with the needed local access. This was a tool isolation issue, not an application network regression.

## Repairs and test harness corrections

| Problem | Root cause | Change | Actual verification |
|---|---|---|---|
| Signed-out candidate route did not redirect as original15.1 requires | Existing page displayed a login gate while remaining at the private URL | Added `/candidate-login`, guarded candidate routes and allowlisted same-origin return paths; retains deep link query/hash and Clerk modal | Reproduced before change in `.qa/checklist138-redirect-before.json`; new real Clerk deep-link/unsafe-return test passes; existing guard scenario passes desktop/tablet/mobile |
| Edit-job description lacked a stable accessible name | Wrapping label included changing textarea text | Explicit description aria-label | Actual salary+description save/reload scenario passes |
| Repeated candidate-signup test failed409 | Test reused an email after deleting only its Clerk identity, while MongoDB correctly retained the old identity/profile association | Unique random email nonce per signup execution; no removal of MongoDB records or weakening identity uniqueness | Original targeted registration failed3/3; corrected signup rerun passes3/3 with real Clerk UI and real MongoDB profile creation |
| Initial gap suite could not load image fixture | URL.pathname retained `%20` in workspace path | Use Node fileURLToPath for fixture paths | Real logo signup and PDF upload pass |
| Visibility harness asserted before async mutation completed | Playwright uncheck checks state immediately; controlled checkbox reflects successful API response | Click, await real visibility PUT200, then assert persisted UI state and public404/list exclusion/restoration | New visibility scenario passes |
| Profile success assertion looked for incomplete exact wording | Actual server message includes Clerk identity guidance | Match actual `Profile updated` message prefix and verify reload value | Manual skills persistence and both invalid professional host checks pass |

Intermediate runs were not counted as successful suites. Failure artifacts are retained locally (`checklist138-gap-label-failure.json`, `checklist138-gap-checkbox-attempt.json`, `checklist138-gap-profile-attempt.json` and targeted registration results). The final gap run has12 passed,0 failed,0 skipped,0 flaky in1.6 minutes. No failing workflow was hidden behind mocked success.

## Commands and results

Run commands from `server`, unless a client directory is specified. Output-variable assignment below affects only the test process; no environment file was written.

| Command / scope | Result |
|---|---|
| `npm run test:e2e:live -- --grep "candidate registers\|candidate privacy"` with report `../.qa/live-resume-targeted-results.json` | Initial3 lifecycle passes;3 registration409 failures exposed the fixture issue |
| `npm run test:e2e:live -- --grep "candidate registers"` with report `../.qa/live-resume-registration-results.json` | Corrected real signup **3/3 passed** |
| `npm run test:e2e:live -- --grep "all public and guarded routes"` with report `../.qa/checklist138-guard-regressions.json` | **3/3 passed** after candidate guard change |
| `npx playwright test --config playwright.checklist138.config.js` | **12/12 passed**,0 skipped/flaky; real headed Chrome, real Clerk/JWT/Cloudinary/local MongoDB |
| `npm run check` | PASS;54 backend/test JavaScript files checked |
| Client `npm run lint` | PASS; no lint errors |
| Client `npm run build` | PASS;914 modules built |
| Git diff whitespace check with CRLF-compatible setting | PASS; only Git line-ending conversion notices |
| Read-only runtime/MongoDB verification | All four URLs200; both local databases reachable;0 duplicate groups; unique indexes present |

Unchanged backend unit/network tests (**14**), isolated API integration tests (**18**), frontend transport tests (**3**) and the earlier48 live automated scenario executions were **not needlessly rerun**. Their retained results are documented in NETWORK_REGRESSION_TESTS.md and LIVE_BROWSER_E2E_RESULTS.md. Unit/API suites use explicitly identified test seams and are not real-browser pass evidence. No backend application/controller/model code changed in this resumed work.

The new gap suite covers actual Enter/location/category/all-work-mode search, refreshed filter reset, browser Back, manual-skill persistence, two professional URL validators, real PDF suggestions/coverage, two-user bookmark isolation, hidden-job application rejection, newly posted-job application, recommended-job exclusion, applicant field allowlisting, foreign-owner status/resume/interview denial, actual native window-focus refresh, real30-second polling, changed interview time/timezone, all status analytics against MongoDB and final cross-account logout. Browser pageerror and failed local-request arrays are empty at completion.

## Changed files in this resumed task

Exactly four files from the source baseline changed:

- `client/src/App.jsx` — candidate route/login return handling.
- `client/src/pages/EditJob.jsx` — accessible description label.
- `server/e2e/browser-helpers.js` — optional sign-in button name for private deep-link entry.
- `server/e2e/live-registration.spec.js` — repeatable isolated signup identity.

New reviewable files:

- `server/playwright.checklist138.config.js`.
- `server/e2e/checklist138.spec.js`.
- `docs/ORIGINAL_138_CHECKLIST.json`.
- `docs/CHECKLIST_138_COVERAGE.md`.
- `docs/CHECKLIST_138_COVERAGE.json`.
- `docs/RESUMED_TESTING_REPORT.md`.

Ignored `.qa/`, test output and build artifacts are evidence/runtime files, not publication material. The wider Git working tree contains substantial earlier edits and untracked source that predate this continuation; these were preserved, not replaced. Review the complete working tree before creating any commit.

## Remaining external blockers and readiness

| Check | Status | What is needed |
|---|---|---|
| Google OAuth login | BLOCKED | Authorized isolated Google test account; no personal Google session used |
| Application notification email | BLOCKED | Manual Resend credentials, verified sender and authorized recipient |
| Status notification email | BLOCKED | Same prerequisites; no outbound test to real users |
| Interview notification email | BLOCKED | Same prerequisites; local/audit mode disables outbound email |
| Live Clerk webhook delivery and identity propagation | BLOCKED | Approved public staging ingress, matching webhook secret and actual delivery evidence |

Additional deployment gates remain: configured remote MongoDB previously failed DNS resolution; remote duplicates/index impact and index installation require an authorized database and explicit approval. Existing local database indexes do not prove remote integrity. Hosted PDF worker packaging, request-body limits, exact deployed CORS, Clerk domains, SPA deep links and Vercel function startup are **NOT TESTED**. Legacy public-resume migration and production operations remain follow-ups in REMAINING_BLOCKERS.md. Resume recognition is an explainable fixed-vocabulary text-PDF heuristic; there is no OCR or validated hiring probability.

**New GitHub repository:** the current snapshot is suitable for owner review and an approved source publication. Git-eligible text pattern scan found0 matches for the selected secret formats across236 eligible files at that checkpoint; environment files, `.qa`, dependency/build/test outputs are ignored and untracked by Git. Environment filenames do not appear in existing Git history. This narrow scan is not a comprehensive secret-history audit. Review all earlier changes and only stage intended files. No repository was created and the existing origin was not changed.

**Vercel preview:** not yet deployment-verified or ready to promise a working hosted demonstration. Resolve staging MongoDB access and manually configure the existing required variables, approved Clerk domains/CORS and Cloudinary capabilities. Use frontend root `client`, build `npm run build`, output `dist`; backend root `server` retains its Node handler configuration. Then obtain deployment approval and run hosted workflows, including PDF upload/worker and security checks. No Vercel setting or environment variable was changed. Email is optional for the core local demo but delivery remains blocked until configured. See DEPLOYMENT.md for the existing manual steps.

The core local candidate and recruiter demonstrations are verified. **The whole project is not production-certified and external integrations are not fully verified.**

## Start safely

Both normal servers are already running; reuse the open portal. If intentionally stopped later:

```powershell
Set-Location -LiteralPath 'E:/job_portal - Copy/server'
npm run dev:local:all
```

Wait for the readiness message, then open http://127.0.0.1:5175/ and check http://127.0.0.1:5000/health. This launcher preserves `.qa/local-mongodb`, uses local development MongoDB and existing Clerk/Cloudinary configuration, and seeds no accounts/jobs. Do not substitute configured `npm start` until the remote MongoDB blocker has been resolved. Never run resets against an existing database.

For the saved new tests, reuse the current isolated audit fixture and run `npx playwright test --config playwright.checklist138.config.js` in `server` with normal localhost/browser access. A fresh audit fixture must first have the baseline live candidate/application workflow; the gap suite deliberately builds on that retained state. Existing guards reject nonlocal databases. Keep credentials in ignored manifests, never in commands or published documents.

Screenshots retained from executed flows: [desktop analysis](screenshots/final-desktop-resume-analysis.png), [mobile analysis](screenshots/final-mobile-resume-analysis.png), [analytics](screenshots/final-desktop-analytics.png), [candidate interview](screenshots/final-desktop-candidate-interview.png), [actual network recovery](screenshots/network-recovered-live.png).
