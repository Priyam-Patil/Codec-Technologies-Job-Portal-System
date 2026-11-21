# Working features checklist — 21 November 2026

Statuses apply to the named environment/evidence, not an untested production deployment. PASS means the action was actually executed. External blockers remain explicit.

Final regression: **45/45 browser cases passed** across desktop/tablet/mobile; **11/11 unit + 16/16 isolated API tests passed**; lint/build/syntax passed. Three additional real-browser timezone checks passed. Local records survived a backend restart unchanged. The complete application is **not fully verified for production** because the remote database, email, webhook ingress and hosted runtime remain blocked/unexecuted.

| Feature | Implementation | Browser evidence | Backend evidence | External integration | Remaining issue | Final status |
|---|---|---|---|---|---|---|
| Homepage/search/all filters/clear | Existing, synchronized search repaired | Real public jobs; keyword/location/category/salary/level/type/mode/hide-applied | Visible-job queries | Actual local MongoDB | Hosted dataset unverified | PASS |
| Clerk candidate login/session/logout | Existing, first-profile bootstrap added | Actual password and development OTP, reload, sign-out | Real session verified in browser; negative identity seams in integration | Live Clerk development | Production Clerk instance untested | PASS |
| Missing profile initialization | Added safe idempotent initialization | No candidate row seeded by audit helper | Five concurrent reads; edited profile preserved | Actual Clerk identity API in browser workflow | Live webhook delivery separate | PASS |
| Resume upload/extraction after Save | Immediate summary repaired | PDF-only React/Node.js/MongoDB with manual skills cleared; reload | PDF worker + metadata persistence | Real authenticated Cloudinary PDF | OCR absent, vocabulary bounded | PASS |
| Invalid/oversized/damaged PDF | Client + server validation | HTML, >5 MB, damaged PDF rejected | MIME/signature/size/parser tests | Corrupt file rejected before storage | Encrypted PDF fixture not executed | PASS |
| No recognized resume skills | Honest fallback | Existing sample PDF -> no recognized skills -> reload -> valid replacement | Parser/analysis fallback | Actual uploads | No OCR | PASS |
| Resume private retrieval | Short-lived signed URLs | Candidate/recruiter download actual PDF; unsigned denied | Owner checks and transport seam | Real Cloudinary | Legacy public assets not migrated | PASS |
| Matching/analysis/comparison | Explainable vocabulary coverage | Rankings, matching/missing skills; 75% four-requirement comparison | Alias/coverage/ranking tests | Real stored resumes/jobs | No validated ML probability | PASS |
| Profile fields and URL validation | Existing | Save/reload education, experience, skills and URLs; reject unsafe GitHub host | Identity overwrite and cross-user isolation | Local MongoDB | Clerk identity edits use account service | PASS |
| Saved jobs | Existing atomic set semantics | Add twice/list once/reload/remove | Persistence, duplicate prevention, isolation | Local MongoDB | Hidden jobs excluded | PASS |
| Applications/duplicates | Existing strengthened | Actual Apply, disabled Already Applied, API 409; missing resume requirement | Concurrent uniqueness, hidden-job rejection | Local MongoDB | Remote index unverified | PASS |
| Candidate status refresh | Fixed stale state | Recruiter Rejected -> candidate navigation sees Rejected | Accepted/Rejected persist | Local MongoDB | Polling can take up to 30 seconds when idle | PASS |
| Recruiter signup/login/logout | Existing, modal repaired | Actual logo upload/account creation/JWT login, invalid password, logout | bcrypt/JWT negatives | Real Cloudinary logo and local MongoDB | Recovery/email verification not implemented | PASS |
| Post/edit/hide/restore job | Existing | Actual form actions and reload; hidden detail 404 | Ownership, validation, sanitization | Local MongoDB | No external migration | PASS |
| Applicants/status controls | Existing | Actual applicant/resume review and Accepted/Rejected changes | Other recruiter cannot mutate/read | Local MongoDB/Cloudinary | None found in tested local workflow | PASS |
| Schedule/update/view interview | Existing | Recruiter schedule/update; candidate sees updated details | Owner/participant restriction and persistence | Local MongoDB | External calendar/video service not part of app | PASS |
| Interview timezone integrity | Existing conversion independently verified | Actual candidate display and recruiter edit in Asia/Kolkata, America/New_York and UTC | Reopened form round-trips to identical stored ISO instant | Real authenticated local API | Read-only verification uses one known audit participant | PASS |
| Analytics and empty state | Existing | Counts/charts checked against database; new recruiter empty state | Company-scoped aggregation | Local MongoDB | Hosted totals not checked | PASS |
| Critical UI routes/protected access | Guard/error handling repaired | All declared routes, dashboard children, missing page/job, stale token | Unauthorized API negatives | Real local API | Not every third-party Clerk account-settings control exhaustively tested | PASS |
| Error recovery/accessibility/responsive | Repaired | Temporary 503 -> retry real jobs; keyboard modal; desktop/tablet/mobile overflow checks | Appropriate HTTP errors | Fault injection explicitly limited to recovery case | Full accessibility audit not executed | PASS |
| Persistent local startup | Added explicit mode | Normal frontend targets 5000 without env edit | Guarded local MongoDB on disk | Real Clerk/Cloudinary | Development-only runtime; email disabled | PASS |
| Backend restart persistence | Added local development path | Normal browser journeys also refresh records | Digest equality after graceful stop/start across all four collections; zero application/bookmark duplicates | Local MongoDB | Remote database not inspected | PASS |
| Webhook raw signature/replay behavior | Existing corrected implementation | No public ingress test | Signed raw-payload/replay test | Live webhook ingress unavailable | Configure reachable authorized staging endpoint | BLOCKED |
| Email notifications | Optional implementation retained | No live mail sent | Mock transport success/failure tests | Missing authorized sender/recipients | Manual Resend configuration | BLOCKED |
| Configured remote MongoDB/indexes | Existing configuration preserved | Normal remote startup unavailable | Startup exits with sanitized connection error | DNS/connectivity blocker | Authorized test DB and index approval needed | BLOCKED |
| Vercel deployment | Configuration reviewed | Hosted application not executed | Local build/syntax only | No deployment performed | Staging approval/verification needed | NOT TESTED |
| Admin dashboard | Optional, not implemented | Not executed | Not executed | None | Outside implemented repair scope | NOT TESTED |

Details: [audit and API inventory](FINAL_E2E_AUDIT.md), [fixes](BUG_FIX_REPORT.md), [run/demo instructions](DEMO_GUIDE.md), [blockers](REMAINING_BLOCKERS.md). Screenshots are stored in `screenshots/final-*.png`.
