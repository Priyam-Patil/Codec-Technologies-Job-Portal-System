# Strict live browser E2E results — 21 November 2026

## Exact results

| Scope | PASSED | FAILED | BLOCKED |
|---|---|---|---|
| Automated real Chrome workflows | 48 | 0 | 0 |
| Built-in Codex browser checks | 3 | 0 | 0 |
| Google OAuth end-to-end login | 0 | 0 | 1 |
| Live email/webhook delivery checks | 0 | 0 | 4 |
| Total planned verification cases | **51** | **0** | **5** |

The 51 passes are executed browser cases. The five BLOCKED cases were stopped at missing external prerequisites; they are not claimed as executed successes. For a browser-only count: **51 PASSED, 0 FAILED, 1 BLOCKED (Google OAuth)**; the other four blockers concern external delivery. No mocked test result is counted here.

## What actually ran

The main live-only run passed 45 cases in 8.0 minutes. A separate supplemental run passed three additional lifecycle/privacy cases in 1.1 minutes. Both had zero skipped or flaky cases. Each automated scenario executes at desktop 1440x1000, tablet 820x1180 and mobile 390x844.

The built-in Codex browser stayed open at http://127.0.0.1:5175. I used it for real search, salary filtering/clear, job details and home navigation. Its console error log was empty after those actions. Authenticated automation ran in separate isolated Chrome contexts so it did not replace the user session in the built-in browser.

The real application uses real Clerk development identity/session verification, actual recruiter bcrypt/JWT authentication, actual MongoDB queries and real authenticated Cloudinary PDF upload/download. `mongodb-memory-server` launches a real isolated MongoDB process; it is not a mocked Mongoose model. Candidate signup was completed through the actual Clerk form, not an admin create-user API. The official Clerk testing helper suppresses bot challenges only. Reserved development emails and code 424242 exercise Clerk development verification; this does **not** verify delivery of real email.

## No-mock boundary

`playwright.live.config.js` excludes `network.spec.js` and the simulated-503 recovery case. There are no response stubs, substituted authentication middleware or fake API success responses in the counted cases. Fixture setup creates isolated test records; it does not replace application requests. Earlier 54-case network-regression results included deliberate fault injection and are deliberately not reused as the strict live count.

## Executed automated cases

| Viewport | Scenario | Result |
|---|---|---|
| desktop | all public and guarded routes, stale recruiter session and missing job recovery | PASS |
| tablet | all public and guarded routes, stale recruiter session and missing job recovery | PASS |
| mobile | all public and guarded routes, stale recruiter session and missing job recovery | PASS |
| desktop | recruiter modal keyboard, invalid credentials, required fields and recovery controls | PASS |
| tablet | recruiter modal keyboard, invalid credentials, required fields and recovery controls | PASS |
| mobile | recruiter modal keyboard, invalid credentials, required fields and recovery controls | PASS |
| desktop | saved jobs survive reload without duplicates; profile rejects unsafe links; unrecognized resume skills are reported honestly | PASS |
| tablet | saved jobs survive reload without duplicates; profile rejects unsafe links; unrecognized resume skills are reported honestly | PASS |
| mobile | saved jobs survive reload without duplicates; profile rejects unsafe links; unrecognized resume skills are reported honestly | PASS |
| desktop | homepage renders styled content; real API search and advanced filters work | PASS |
| tablet | homepage renders styled content; real API search and advanced filters work | PASS |
| mobile | homepage renders styled content; real API search and advanced filters work | PASS |
| desktop | candidate signs in through REAL Clerk password and test OTP; API verifies the real session | PASS |
| tablet | candidate signs in through REAL Clerk password and test OTP; API verifies the real session | PASS |
| mobile | candidate signs in through REAL Clerk password and test OTP; API verifies the real session | PASS |
| desktop | candidate profile updates persist after browser refresh | PASS |
| tablet | candidate profile updates persist after browser refresh | PASS |
| mobile | candidate profile updates persist after browser refresh | PASS |
| desktop | candidate saves and removes jobs with persisted browser-visible results | PASS |
| tablet | candidate saves and removes jobs with persisted browser-visible results | PASS |
| mobile | candidate saves and removes jobs with persisted browser-visible results | PASS |
| desktop | real PDF upload reaches Cloudinary; analysis, matching and private download work | PASS |
| tablet | real PDF upload reaches Cloudinary; analysis, matching and private download work | PASS |
| mobile | real PDF upload reaches Cloudinary; analysis, matching and private download work | PASS |
| desktop | recruiter signs in and creates, edits and hides an owned job in the browser | PASS |
| tablet | recruiter signs in and creates, edits and hides an owned job in the browser | PASS |
| mobile | recruiter signs in and creates, edits and hides an owned job in the browser | PASS |
| desktop | candidate opens job details, applies once and sees pending history | PASS |
| tablet | candidate opens job details, applies once and sees pending history | PASS |
| mobile | candidate opens job details, applies once and sees pending history | PASS |
| desktop | recruiter reviews real applicant resume, changes status and schedules/updates interview | PASS |
| tablet | recruiter reviews real applicant resume, changes status and schedules/updates interview | PASS |
| mobile | recruiter reviews real applicant resume, changes status and schedules/updates interview | PASS |
| desktop | analytics charts show real application counts and another recruiter is denied access | PASS |
| tablet | analytics charts show real application counts and another recruiter is denied access | PASS |
| mobile | analytics charts show real application counts and another recruiter is denied access | PASS |
| desktop | candidate and recruiter sign out; no uncaught errors or failed local network requests | PASS |
| tablet | candidate and recruiter sign out; no uncaught errors or failed local network requests | PASS |
| mobile | candidate and recruiter sign out; no uncaught errors or failed local network requests | PASS |
| desktop | candidate registers through real Clerk UI, verifies email, persists profile and signs out | PASS |
| tablet | candidate registers through real Clerk UI, verifies email, persists profile and signs out | PASS |
| mobile | candidate registers through real Clerk UI, verifies email, persists profile and signs out | PASS |
| desktop | normal application: real registration, unseeded candidate, resume edge cases and persisted workflow | PASS |
| tablet | normal application: real registration, unseeded candidate, resume edge cases and persisted workflow | PASS |
| mobile | normal application: real registration, unseeded candidate, resume edge cases and persisted workflow | PASS |
| desktop | candidate privacy and complete application/interview lifecycle persist through real browser controls | PASS |
| tablet | candidate privacy and complete application/interview lifecycle persist through real browser controls | PASS |
| mobile | candidate privacy and complete application/interview lifecycle persist through real browser controls | PASS |

## Built-in browser evidence

- **CUA-01 — Built-in browser keyword search: PASS.** mobile search narrowed 21 jobs to 6 matching mobile listings.
- **CUA-02 — Built-in salary filter and Clear filters: PASS.** Minimum salary 3000000 showed zero jobs; Clear restored 21 and cleared both inputs.
- **CUA-03 — Built-in job details and home navigation: PASS.** Learn more opened the correct live job title/company/salary/description; Home restored the homepage; console error list empty.

## Persistence, authorization and browser health

Profile fields survive actual browser refresh. Resume processing is verified immediately after upload and after reload with manual skills cleared. Applications persist and duplicates return 409. Hidden jobs return 404. Another recruiter cannot edit/read owned resources. Extra live checks prove a candidate cannot select another user through query/body fields, and changing Pending/Rejected/Accepted plus Scheduled/Completed/Cancelled states reaches the candidate UI and persists in MongoDB. Profile experience/GitHub/LinkedIn/portfolio fields were checked after reload. Analytics counts are compared with database counts. Main journeys check uncaught errors, unexpected API 5xx, failed local API requests and representative horizontal overflow. Expected validation/auth/ownership errors are asserted separately.

Direct read-only checks of the guarded persistent development database confirmed all three new candidate/recruiter fixture workflows retained resume skills, company/job records and Rejected applications. Duplicate application groups: **0**. Evidence: ignored `.qa/live-persistence-checks.json`. Neither main server was stopped or restarted during this run.

## Blocked cases and remaining issues

| ID | Planned check | Why BLOCKED |
|---|---|---|
| BLOCKED-OAUTH | Google OAuth login | No authorized isolated Google test account was supplied; no personal Google session was used. |
| BLOCKED-EMAIL-APPLICATION | Application submission email delivery | Resend transport is unconfigured and outbound email is disabled in local/audit mode. |
| BLOCKED-EMAIL-STATUS | Accepted/rejected status email delivery | No configured transport, verified sender or authorized delivery recipient. |
| BLOCKED-EMAIL-INTERVIEW | Interview notification email delivery | No configured transport, verified sender or authorized delivery recipient. |
| BLOCKED-WEBHOOK | Live Clerk webhook delivery and identity-update propagation | No approved externally reachable staging webhook endpoint/delivery evidence; localhost ingress is not a live webhook test. |

No personal Google session was used and no real-user email was sent. Configure an authorized OAuth test account, verified email sender/transport/recipients and approved staging webhook ingress before those checks. The existing configured remote MongoDB DNS issue and hosted Vercel verification remain separate deployment limitations; these local passes do not establish production readiness. No admin dashboard or recruiter password-recovery implementation exists to test. Third-party account security settings were not changed.

## Changes made

No new reproducible application defect was found in these executed workflows. Application pages/controllers/models and working features were not changed. Added strict live-only configuration and actual UI signup/lifecycle tests: `server/playwright.live.config.js`, `server/e2e/live-registration.spec.js`, `server/e2e/live-additional.spec.js`, plus the `test:e2e:live` package script. Documentation and ignored evidence files were added. Existing environment files, production records, Git history/remotes and deployment settings were not changed. No push or deployment occurred.

## Repeat safely

Keep the normal application running with `npm run dev:local:all` from `E:/job_portal - Copy/server`. Its frontend is http://127.0.0.1:5175 and health is http://127.0.0.1:5000/health. The user-facing Codex tab is retained as a deliverable.

For a fresh complete mock-free automated run, start/reuse a fresh isolated audit fixture and run `npm run test:e2e:live` in `server`. The current configuration includes all 48 automated cases. This session executed the original 45 then the three added lifecycle cases with:

```powershell
npm run test:e2e:live
$env:JOB_PORTAL_LIVE_REPORT = "../.qa/live-lifecycle-results.json"
npm run test:e2e:live -- --grep "candidate privacy"
```

The second line selects only an output artifact in the test process; it does not modify an environment file. Do not weaken auth/rate limits or run tests against production. Generated credentials stay in ignored `.qa` files and are never printed. New signup-test identities are deleted using exact ownership guards after each case.

Machine evidence: `.qa/live-e2e-results.json`, `.qa/live-lifecycle-results.json`, `.qa/live-combined-results.json`, `.qa/live-codex-browser-checks.json`. Screenshots: [signup form](screenshots/live-candidate-signup-form.png), [resume analysis](screenshots/final-desktop-resume-analysis.png), [mobile resume analysis](screenshots/final-mobile-resume-analysis.png), [analytics](screenshots/final-desktop-analytics.png), [interview](screenshots/final-desktop-candidate-interview.png).
