# Network regression tests — 21 November 2026

## Environment and evidence rules

Real Chrome is available. Persistent development frontend/API: 5175/5000; separate disposable audit frontend/API: 5176/5102. MongoDB tests use local isolated databases. Candidate browser journeys use real Clerk development sign-in and authenticated API tokens; recruiter browser journeys use actual registration/JWT login. Real browser upload/download uses Cloudinary. Email is disabled in local/audit modes. No production database or deployment was tested or changed.

Transport/CORS/database failure fixtures are explicitly identified below. Their success paths retry the actual local API; they do not return mocked jobs or fake application success. Browser integration failures must be marked BLOCKED if Chrome, required development credentials or the runtime cannot start.

## Executed automated checks

| Command | Evidence | Status |
|---|---|---|
| Client `npm test` | 3 real local HTTP/configuration/refused-connection/timeout cases passed | PASS |
| Client `npm run lint` | Exit 0, zero warnings/errors | PASS |
| Client `npm run build` | Exit 0, 914 modules transformed | PASS |
| Server `npm test` | 14 unit/network cases passed, including CORS-readable DB failure | PASS |
| Server `npm run test:integration` | 18 isolated MongoDB/API cases passed | PASS |
| Server `npm run check` | 49 JavaScript files checked | PASS |
| Server `npm run test:e2e:audit` | 54 passed; 0 failed/skipped/flaky; exit 0; 7.9 minutes | PASS |
| Server `npm start` with existing remote configuration | Exit 1; `DATABASE_DNS_UNAVAILABLE` | BLOCKED |

TypeScript is not configured; no TypeScript compiler result is claimed. The frontend now has its own Node-based test command rather than relying only on build/lint.

The browser total is **18 cases per viewport** at desktop 1440x1000, tablet 820x1180 and mobile 390x844. It includes 45 existing candidate/recruiter/recovery cases plus nine new network regressions. Real Clerk sign-in/logout, profile persistence, actual PDF upload/private download, resume extraction/matching, saved jobs, applications/duplicates, recruiter job management, statuses/interviews and database-backed analytics all passed after the transport changes. Main journeys assert no unexpected failed local API requests or uncaught errors. Intentional network faults are expected only inside the named regressions. No unexpected generic `Network Error` remained in these exercised workflows.

## Post-restart and launcher verification

After the full suite, `node scripts/verify-local-persistence.js` recorded all four local collections. The initial test processes had closed stdin, so the explicitly guarded localhost development MongoDB was shut down using its administrative shutdown command before stopping only the verified local API/Vite listeners. No records or directories were deleted.

`npm run dev:local:all` then successfully started the normal frontend and API together. `node scripts/verify-local-persistence.js --compare` passed: **9 users, 22 companies, 21 jobs and 16 applications** retained identical records, including resume metadata/status/interview data. A further graceful `stop` of the combined launcher, restart with the same command and repeated comparison also passed.

An additional real Chrome smoke run after the switch performed **12 post-restart checks**: two actual frontend job round trips, one Node health check, real Clerk candidate login with four authenticated candidate APIs, and actual recruiter form login with four recruiter APIs. Both public and private API requests returned 200; health reported `database: connected`. Evidence is in ignored `.qa/network-live-checks.json`. The launcher also rejected a deliberate duplicate start with `EADDRINUSE` before opening another MongoDB process; the running instance and data were retained. This expected negative startup test is not an unresolved application failure.

These persistence counts belong only to the authorized local test database. The configured remote database remains BLOCKED. Email delivery and live public webhook ingress were not executed.

## Network cases

| Regression | Actual mechanism | Required outcome |
|---|---|---|
| Original generic Network Error | Real frontend with backend port closed | Before-fix Chrome shows Network Error; failed request is ERR_CONNECTION_REFUSED |
| Actionable stopped-backend diagnosis | Same real unavailable backend after repair | Cannot reach API explanation and Retry; no fake success |
| API URL validation | Frontend tests reject absent/unsafe/credential-bearing/mixed-content targets before network | Controlled configuration error without leaking values |
| HTTP status/message preservation | Real Node HTTP 401/503 responses | Server message and HTTP status retained |
| Mutation deadline/no retry | Real Node HTTP server holds a POST open | Timeout message; exactly one mutation request |
| Repeated browser outage/recovery | Chrome request abort fault, twice per viewport | Actionable error; Retry receives actual HTTP 200 jobs from local API |
| Offline/reconnect | Chrome offline mode | Offline explanation; reconnect Retry restores actual jobs |
| Legacy CORS bypass reproduction | Real cross-origin local HTTP 503 without CORS | Browser cannot read HTTP status; shared client reports actionable transport failure |
| Corrected DB-failure CORS | Same real HTTP boundary through Express; database DNS fault simulated | Browser reads 503, controlled database code and safe JSON message |
| Browser timeout | Local HTTP fixture holds request open | Actual browser XHR times out once; specific timeout message |
| Database readiness | Express with no ready MongoDB connection | Health/API return 503 promptly rather than false readiness/buffering |
| Preflight on DB failure | Real HTTP OPTIONS with authorization request header | 204 with CORS before any database connection attempt |

Core test files: `client/tests/api.test.js`, `server/tests/network.test.js`, `server/tests/integration/api.test.js`, `server/e2e/network.spec.js`. Existing full candidate/recruiter journeys are rerun as regressions for the shared transport migration.

The initial new backend test correctly failed when a controlled 503 became 500. The central handler was repaired and the test rerun passed. That failing intermediate result is not represented as a pass.

## How to rerun

```powershell
Set-Location -LiteralPath 'E:/job_portal - Copy/client'
npm test
npm run lint
npm run build
Set-Location -LiteralPath 'E:/job_portal - Copy/server'
npm test
npm run test:integration
npm run check
node scripts/discover-api-endpoints.js
npm run test:e2e:audit
```

For a network-only browser rerun use `npm run test:e2e:audit -- --grep "repeated transport|offline mode|CORS-blocked"`. Start with a fresh disposable audit process if prior runs exhausted normal login throttles. Do not reduce production rate limits. The browser configuration starts/reuses local servers and refuses nonlocal fixture databases before test mutations. Existing `.env` files are read-only.

## Evidence artifacts

- [Original Network Error](screenshots/network-before-backend-unavailable.png)
- [Actionable unavailable-backend message](screenshots/network-after-backend-unavailable.png)
- [Actual local jobs after restart](screenshots/network-recovered-live.png)
- Existing viewport-specific `screenshots/final-*.png` are regenerated by full browser journeys.
- Ignored `.qa/final-e2e-results.json` records actual final browser counts.
- Ignored `.qa/network-integration-endpoints.json` records normalized endpoint/status evidence. No credentials, signed URLs, request bodies or user identifiers are included.

See [root causes and affected files](NETWORK_ERROR_ROOT_CAUSE.md) and [all endpoint outcomes](COMPLETE_API_ENDPOINT_AUDIT.md). Remote MongoDB, live email, hosted webhook ingress and deployment verification remain BLOCKED/unexecuted; local pass counts do not imply those services passed.
