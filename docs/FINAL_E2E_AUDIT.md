# Final end-to-end audit — 21 November 2026

This report independently verifies the existing application. Previous pass counts were not accepted as evidence. The baseline reproduction logged in through real Clerk, then received **404 from `/api/users/user`** after removing only a generated demo profile. A later normal-browser run reproduced stale Pending status and authentication/restoration timing defects. See [bug fixes](BUG_FIX_REPORT.md).

**Scope:** existing MERN code, real Chrome, Clerk development identity, Cloudinary authenticated PDF storage and isolated/local persistent MongoDB. No production records or hosted settings were changed. No push or deployment occurred. Environment files were preserved. The configured remote database remains blocked; this is not a production-readiness certification.

## Architecture and complete feature inventory

The frontend uses React 19/Vite 8/Tailwind/React Router/Clerk React/Axios/Quill. Express 5 exposes existing company, job and candidate routers. Mongoose stores users, companies, jobs and applications. Clerk verifies candidates; bcrypt/JWT verifies recruiters. Cloudinary stores authenticated raw PDFs. A bounded PDF.js worker extracts embedded text; deterministic vocabulary matching produces explainable skill coverage. Optional Resend notification code exists.

| Feature / frontend entry | API endpoint | Controller / operation | Database / external dependency | Expected outcome |
|---|---|---|---|---|
| Homepage `/`, Hero/JobListing | GET `/api/jobs` | jobController.getJobs | Job find visible + public Company fields | Actual public jobs; combined title/location/category/salary/level/type/mode filters; pagination; clear and hide applied |
| Job details `/apply-job/:id` | GET `/api/jobs/:id` | getJobById | Visible Job + Company | Visible details; missing/hidden job 404 and recovery |
| Login, Clerk account menu | Clerk SDK; GET `/api/users/user` | protectUser, getUserData, ensureCandidateProfile | Clerk session; User find/upsert from server identity | Real login/logout; first-login profile without waiting for webhook; session restored before UI |
| Applied Jobs `/applications`, upload | POST `/api/users/update-resume` | updateUserResume | User metadata/analysis save; PDF.js + private Cloudinary | Validate size/type/bytes; immediate extracted skills; persisted metadata; honest no-skill fallback |
| Candidate/recruiter resume controls | GET `/api/users/resume`; GET `/api/company/applications/:id/resume` | getResume, applicantResume | Own User or owned application; Cloudinary | Authorized short-lived signed download; other recruiter denied |
| Career hub `/career`, Matches/analysis | GET `/api/users/recommendations?jobId=...` | recommendations | Own analysis/profile; visible Job query excluding applied | Ranked real jobs, matching/missing skills, documented score and experience hint |
| Career hub Profile | PUT `/api/users/profile` | updateProfile | User validated update | Skills, education, experience, GitHub/LinkedIn/portfolio persist; identity fields protected |
| Save/list/remove jobs | GET/PUT/DELETE `/api/users/saved-jobs[/id]` | getSavedJobs/saveJob/removeSavedJob | User `$addToSet`/`$pull`, visible Job population | Persistent unique shortlist, own-user isolation |
| Apply buttons/details | POST `/api/users/apply` | applyForJob | Resume requirement; visible Job; unique JobApplication insert | 201 once; duplicate 409; no missing-resume/hidden-job application |
| Applied Jobs history/status/interview | GET `/api/users/applications` | getUserJobApplications | Own JobApplication + safe Job/Company population | Persisted Pending/Accepted/Rejected; participant interview; refresh on entry/focus/30 seconds/manual |
| Recruiter modal | POST `/api/company/register`, `/login` | registerCompany/loginCompany | Company bcrypt save/find; Cloudinary logo; JWT | Validated signup/login, wrong credentials denied; accessible keyboard modal |
| Protected dashboard `/dashboard` | GET `/api/company/company` | protectCompany/getCompanyData | Verified JWT + Company find | Validated company before rendering nested pages; invalid token removed |
| `/dashboard/add-job` | POST `/api/company/post-job` | postJob | Validated/sanitized owned Job create | Real persisted posting |
| `/dashboard/manage-jobs` | GET `/api/company/list-jobs`; PUT `/change-visibility` | getCompanyPostedJobs/changeVisibility | Owned Job/Application counts | List actual jobs; visibility persists and public access restricted |
| `/dashboard/edit-job/:id` | PUT `/api/company/jobs/:id` | editJob | Owned validated/sanitized Job update | Changes survive reload; ownership enforced; request cancellation/error recovery |
| `/dashboard/view-applications` | GET `/api/company/applicants`; PUT `/change-status` | getCompanyJobApplicants/ChangeJobApplicationsStatus | Owned JobApplication; safe User fields | Own applicants; valid status persists and reaches candidate |
| Interview form in applicants | PUT `/api/company/interviews/:id` | scheduleInterview | Owned application embedded interview | Future instant, details/status save and update; only participant access |
| `/dashboard/analytics` | GET `/api/company/analytics` | analytics | Company-scoped Job counts/Application aggregation | Actual totals, status counts and per-job chart; empty state |
| Optional event emails | Application/status/interview operations | notifyApplication | Resend | Real delivery only when manually configured and test recipients authorized |
| Clerk synchronization | POST `/webhooks` | clerkWebhooks | Svix raw-byte validation, User upsert/update/delete | Authentic idempotent delivery preserves profile fields |
| Health, missing route, recovery | `/health`, unknown UI/API routes | createApp + React fallback | No private data | Health response, meaningful 404/retry/navigation |

No admin dashboard exists. No administrator privileges were assigned. All existing implemented navigation routes above were opened by the browser regression suites, including signed-out dashboard subroutes and the edit route through the recruiter workflow.

## Initial problem, fix and final evidence

| Feature | Initial Problem | Root Cause | Fix Applied | Test Evidence | Final Status |
|---|---|---|---|---|---|
| First candidate login | Authenticated profile 404 | Missing webhook-provisioned MongoDB row | Verified Clerk identity bootstrap | Real unseeded sign-in; concurrent bootstrap integration | PASS |
| Resume skill extraction | No immediate visible extraction summary | Upload screen omitted extracted skills and needed follow-up fetch | Return updated user and render PDF-only summary | Cleared manual skills; real PDF upload; immediate React/Node.js/MongoDB and reload assertions | PASS |
| Invalid resume | Damaged PDF treated as generic fallback | Parser collapsed failures | Invalid/encrypted classification and pre-upload 422 | Actual damaged-PDF form submission; unit parser check | PASS |
| Apply timing | Valid session briefly behaved as anonymous | Profile/auth not restored before clicking | Session gate and profile-ready disabled state | Normal-application hard-navigation regression | PASS |
| Filters after refresh | Checkbox selection reset | Identity restoration remounted application | Await Clerk restoration before mounting UI | Normal hide-applied/Clear regression | PASS |
| Candidate status | Pending after recruiter rejected | Stale initial context snapshot | Entry/focus/manual/periodic refresh | Browser recruiter rejection + candidate navigation | PASS |
| Job management | Rechecked independently | Existing controllers and UI | Request-specific edit/error recovery | Actual create/edit/hide/restore and database assertions | PASS |
| Interview/analytics | Prior report alone insufficient | Needed live database evidence | Retained existing implementation | Schedule/update, candidate view, aggregate counts compared to MongoDB | PASS |
| Error recovery/navigation | Ambiguous empty/loading states | Missing error state and validated route entry | Retry panels, guarded routes, missing-job navigation | All route guards; injected 503 followed by actual API retry | PASS |
| Recruiter modal | Focus/logo/mobile feedback gaps | Missing keyboard containment | Focus trap, Escape/restoration, size/type feedback | Browser keyboard/validation and real signup | PASS |
| Normal local startup | API port 5000 unavailable | Configured remote DB cannot connect; old demo uses 5101 | Explicit persistent local MongoDB mode on existing API port | Actual normal-client recruitment/candidate workflow | PASS |
| Configured remote DB/index audit | `npm start` exits with safe database error | External DNS/connectivity | Configuration preserved; local path provided | Actual startup attempted; no remote data changed | BLOCKED |
| Email delivery | No authorized configured live transport | Missing sender/recipient configuration | Retained optional transport | Unit success/failure seams only; no live email sent | BLOCKED |
| Hosted webhook delivery | Localhost not externally reachable | External ingress configuration | Signed handler retained; first login independent | Raw-signature/replay integration tests, no live ingress | BLOCKED |
| Hosted Vercel runtime | No approved deployment | Hosted access/approval needed | Reviewed configuration only | Client build is local evidence; no hosted test executed | NOT TESTED |

## Commands and test boundaries

**Final combined browser run: PASS — 45 passed, 0 failed, 0 skipped, exit 0, 5.8 minutes.** Each viewport passed all 15 cases. This run used a fresh disposable audit process and the separately preserved local development database. Earlier combined attempts had 44 passes/one test setup race, then 37 passes/three login failures/five serial cases not run in a reused QA process. Those attempts are not represented as successes; the final clean run independently reran every case. Login helpers now assert the actual HTTP status and remove submitted password values from later failure captures.

| Actual command | Final evidence | Status |
|---|---|---|
| Server `npm test` | 11 tests passed, zero failures | PASS |
| Server `npm run test:integration` | 16 isolated MongoDB/API tests passed, zero failures | PASS |
| Server `npm run check` | 45 JavaScript files checked | PASS |
| Client `npm run lint` | Exit 0; zero errors/warnings | PASS |
| Client `npm run build` | Exit 0; 913 modules transformed | PASS |
| Server `npm run test:e2e:audit` | 45/45 Chrome tests passed in 5.8 minutes | PASS |
| Server `node scripts/verify-interview-timezone.js` | Three actual browser timezone checks passed, exit 0 | PASS |
| Server `node scripts/verify-local-persistence.js --compare` after stop/start | Identical records in all four local collections | PASS |
| Configured server `npm start` | Sanitized database connection failure | BLOCKED |

There are **42 final screenshots** in `docs/screenshots/final-*.png`, including desktop, tablet, mobile, immediate upload summaries and normal persistent-app histories. Desktop and mobile resume-analysis screenshots were visually inspected after capture; no horizontal overflow or obscuring sticky-header capture remained in those images.

Actual checks executed from `server`: `npm start` (configured database startup failed), `npm test` (11/11), `npm run test:integration` (16/16), `npm run check` (45 JavaScript files), `npm run test:e2e:audit`. Client: `npm run lint` (zero warnings/errors), `npm run build` (913 modules, success). A targeted five-case desktop regression passed before the final combined browser run. The initial two-case baseline had one pass and one genuine candidate-profile failure. Intermediate reruns found and repaired status/timing defects and test selector/setup errors; they are not counted as passing final results.

Browser projects use Chrome at 1440x1000 desktop, 820x1180 tablet and 390x844 mobile. Each has ten main journey cases, four recovery/edge cases and one persistent normal-application journey. The main journeys assert no uncaught errors, no unexpected API 5xx and no failed local network requests, and check horizontal overflow on representative pages. Tests exercise actual forms, real Clerk credentials/OTP, signed API requests, real Cloudinary storage/download and real MongoDB persistence. Only the explicit 503 recovery case injects a failed network response. No mocked success result is used to demonstrate a live integration.

Backend integration tests use real isolated MongoDB/controllers but **mock candidate identity and external transports**. Their authorization tests are useful regressions, not substitutes for browser Clerk evidence. Webhook signature tests use generated local signing inputs. Email transport tests do not send mail. Arbitrary/encrypted/scanned user resumes and hosted worker behavior have not been exhaustively tested.

Machine browser results: ignored `.qa/final-e2e-results.json`; screenshots: [upload summary](screenshots/final-upload-summary-desktop.png), [mobile resume analysis](screenshots/final-mobile-resume-analysis.png), [recruiter analytics](screenshots/final-desktop-analytics.png), [candidate interview](screenshots/final-desktop-candidate-interview.png), and viewport-specific `final-*.png` siblings. Screenshots demonstrate test data only, not production activity.

## Database and safety

Candidate User profiles, Company accounts, Job records and JobApplication status/interview data are tested against isolated/local databases. Bookmarks use atomic set semantics. Concurrent duplicate applications are rejected under a compound unique index; normal startup disables automatic indexes and collection creation. The audit test refuses a nonlocal database before fixture changes. Persistent database migrations require separate impact review and approval; no duplicates were deleted from an external database.

New local mode: frontend <http://127.0.0.1:5175>, API <http://127.0.0.1:5000>. Separate disposable audit: 5176/5102. Original demo remains separate on 5173/5101; do not confuse its transient records with the persistent local database. See [exact start instructions](DEMO_GUIDE.md) and [remaining blockers](REMAINING_BLOCKERS.md).

**Executed restart verification:** `node scripts/verify-local-persistence.js` recorded a confidential digest of each local collection; the backend was gracefully stopped and restarted with `npm run dev:local`; `node scripts/verify-local-persistence.js --compare` printed `PASS: all four collections retained identical records across backend restart.` At that checkpoint it verified 3 candidate profiles, 12 recruiters, 12 jobs and 7 applications, including unchanged resume metadata/statuses. Later browser runs create additional safe test records. Digests and account data remain ignored and are not published.

**Environment verification:** SHA-256 comparison against the task-start baseline confirmed both existing environment files unchanged; Git reports zero tracked environment files. No variable name/value on disk was changed. Local-mode isolation is process-only. No production data, existing remote, history, push or deployment was changed.

**Read-only local integrity check:** direct guarded MongoDB aggregation reported `Local duplicate application groups: 0`, `Local unique application index: true`, and `Local duplicate bookmark groups: 0`. This inspected only `insiderjobs_development` on localhost and did not install indexes, delete or update any record. Equivalent remote inspection remains blocked.

**Additional live browser timezone check:** `node scripts/verify-interview-timezone.js` exited 0 and printed PASS for `Asia/Kolkata`, `America/New_York` and `UTC`. Each actual Clerk-authenticated candidate page displayed the stored instant in its browser timezone. In a separate recruiter session, reopening the interview's datetime input round-tripped to exactly the same stored ISO instant. These three read-only checks used the isolated audit's desktop candidate record at wide and mobile widths and did not modify interview data. They supplement the 45-case suite rather than replacing a failed case.
