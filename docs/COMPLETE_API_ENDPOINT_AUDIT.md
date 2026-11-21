# Complete API endpoint audit — 21 November 2026

Generated from actual `app.js` and mounted router declarations, not from README assumptions. Run `node scripts/discover-api-endpoints.js` from `server` to reproduce discovery.

**Explicit endpoints: 28. Business API endpoints: 24. Integration endpoints actually exercised: 28. Local contract results: 28 PASS, 0 FAIL, 0 BLOCKED; 0 NOT TESTED.** Automatic OPTIONS responses, unknown-route fallbacks and frontend SPA routes are excluded from the explicit-endpoint count.

Coverage is recorded in ignored `.qa/network-integration-endpoints.json`: normalized method/route and HTTP status only, with no tokens, applicant IDs, connection strings or response bodies. All endpoint tests run against isolated local MongoDB. Candidate identity and external storage are mocked in this integration suite. Real Clerk/Cloudinary browser verification is reported separately; local contract PASS does not imply hosted-service verification.

| Endpoint | Authorization | Controller | Data / external boundary | Observed integration statuses | Local result |
|---|---|---|---|---|---|
| GET /api/company/analytics | Recruiter JWT + ownership | analytics | Company-scoped Job/Application aggregation | 200, 401 | PASS |
| GET /api/company/applicants | Recruiter JWT + ownership | getCompanyJobApplicants | Owned Company/Job/Application queries | 200 | PASS |
| GET /api/company/applications/:id/resume | Recruiter JWT + ownership | applicantResume | Owned application + private Cloudinary URL | 404 | PASS |
| PUT /api/company/change-status | Recruiter JWT + ownership | ChangeJobApplicationsStatus | Owned application status update | 200, 400, 404 | PASS |
| PUT /api/company/change-visibility | Recruiter JWT + ownership | changeVisibility | Owned Company/Job/Application queries | 200, 404 | PASS |
| GET /api/company/company | Recruiter JWT + ownership | getCompanyData | Owned Company/Job/Application queries | 200 | PASS |
| PUT /api/company/interviews/:id | Recruiter JWT + ownership | scheduleInterview | Owned application interview update | 200, 404 | PASS |
| PUT /api/company/jobs/:id | Recruiter JWT + ownership | editJob | Owned Company/Job/Application queries | 200, 404 | PASS |
| GET /api/company/list-jobs | Recruiter JWT + ownership | getCompanyPostedJobs | Owned Company/Job/Application queries | 200 | PASS |
| POST /api/company/login | Public, rate limited | loginCompany | Company lookup; bcrypt; JWT | 200, 400, 401 | PASS |
| POST /api/company/post-job | Recruiter JWT + ownership | postJob | Owned Company/Job/Application queries | 201, 400 | PASS |
| POST /api/company/register | Public, rate limited | registerCompany | Company create; bcrypt; logo Cloudinary upload | 400 | PASS |
| GET /api/jobs/:id | Public / production guard | getJobById | Visible Job + public Company fields | 200, 400, 404 | PASS |
| GET /api/jobs | Public / production guard | getJobs | Visible Job + public Company fields | 200 | PASS |
| GET /api/users/applications | Verified Clerk candidate | getUserJobApplications | Own applications; populated job/company/interview | 200 | PASS |
| POST /api/users/apply | Verified Clerk candidate | applyForJob | Resume + visible Job; unique application create | 201, 400, 404, 409 | PASS |
| PUT /api/users/profile | Verified Clerk candidate | updateProfile | Own User lookup/upsert or validated profile update | 200, 400 | PASS |
| GET /api/users/recommendations | Verified Clerk candidate | recommendations | Own skills + visible unapplied Jobs; heuristic coverage | 200 | PASS |
| GET /api/users/resume | Verified Clerk candidate | getResume | Own User metadata; local PDF worker; authenticated Cloudinary | 200, 404 | PASS |
| DELETE /api/users/saved-jobs/:id | Verified Clerk candidate | saveJob/removeSavedJob | Own User set/pull; visible Job lookup | 200 | PASS |
| PUT /api/users/saved-jobs/:id | Verified Clerk candidate | saveJob/removeSavedJob | Own User set/pull; visible Job lookup | 200, 404 | PASS |
| GET /api/users/saved-jobs | Verified Clerk candidate | getSavedJobs | Own User set/pull; visible Job lookup | 200 | PASS |
| POST /api/users/update-resume | Verified Clerk candidate | updateUserResume | Own User metadata; local PDF worker; authenticated Cloudinary | 200, 400, 401, 413 | PASS |
| GET /api/users/user | Verified Clerk candidate | getUserData | Own User lookup/upsert or validated profile update | 200, 401 | PASS |
| GET /debug-sentry | Public / production guard | createApp production debug guard | No application record mutation | 404 | PASS |
| GET / | Public / production guard | createApp root | No application record mutation | 200 | PASS |
| GET /health | Public / production guard | createApp database state | Mongoose connection state | 200 | PASS |
| POST /webhooks | Svix raw signature | clerkWebhooks | Clerk identity User synchronization | 200, 400 | PASS |

## Interpreting the results

- Expected 400/401/404/409/413 results verify validation, privacy, hidden-resource and duplicate protection; they are not failed tests. The production debug route intentionally returns 404.
- Recruiter registration has a negative integration case; real successful registration/logo upload is exercised by the normal-application browser journey. Job creation and public detail now also have positive isolated integration cases.
- The signed webhook handler is tested locally with valid, repeated and altered raw payloads. Public delivery from Clerk remains BLOCKED. No endpoint for email delivery exists; notifications are side effects, and live Resend checks remain BLOCKED.
- The configured remote `npm start` runtime cannot bind after database DNS startup failure: its endpoints are BLOCKED in that environment. This is separate from the 28 local endpoint contracts that were actually executed. No production endpoint or deployment was changed or claimed verified.

## Frontend entry points

`/` calls public job discovery; `/apply-job/:id` calls details/apply; `/applications` calls profile, history and resume upload/download; `/career` calls profile, saved jobs and recommendations. The recruiter modal calls registration/login. Dashboard pages call company session, list/post/edit/visibility, applicants/status/interviews/private resumes and analytics. All 11 Axios-using context/page/component modules now use `client/src/lib/api.js`, retaining their original URLs and authentication headers. Clerk SDK requests continue through Clerk and are not intercepted by the application transport.

See [root causes](NETWORK_ERROR_ROOT_CAUSE.md) and [regression evidence](NETWORK_REGRESSION_TESTS.md).
