# Network error root cause — 21 November 2026

## Reproduction and confirmed causes

1. **The backend was not listening.** At the start of this investigation, ports 5000, 5102, 5175 and 5176 all returned `ECONNREFUSED`. Starting only the normal frontend reproduced the exact browser symptom: `/api/jobs` failed with `net::ERR_CONNECTION_REFUSED`, while the page displayed only `Network Error` and Retry. Chrome screenshot: [before](screenshots/network-before-backend-unavailable.png). This was an actual refused connection, not a mocked response.
2. **Configured backend startup fails at MongoDB DNS resolution.** Actual `npm start` exited 1. Before the fix it logged only a general startup message; after controlled diagnostics were added it reported `DATABASE_DNS_UNAVAILABLE`. No database hostname, URI, secret or credential value was printed. This external configuration remains **BLOCKED**; environment files were not changed.
3. **The exported hosted handler bypassed CORS on connection failure.** `server/server.js` previously awaited `connectDB()` outside Express and wrote its own 503 JSON response when connection failed. That response skipped Express CORS middleware. A cross-origin browser could not inspect the 503 or JSON message, exposing an opaque transport failure instead. This path was reproduced using a real local HTTP server and Chrome, with simulated database failure; it is not a claim that a live Vercel deployment was tested.
4. **Error handling collapsed a controlled 503 into 500.** The central handler accepted explicit 4xx statuses only. The new database-failure regression initially failed with `500 !== 503`. The handler now preserves controlled 5xx status codes while keeping messages sanitized.
5. **Frontend requests had no shared transport diagnosis or deadline.** Eleven modules imported Axios directly and surfaced its generic transport message. A disconnected service, CORS-blocked response or browser offline state could look identical, and requests had no application deadline. These requests now share configuration validation, bounded timeouts and actionable failures. Browser JavaScript cannot reliably distinguish connection refusal, DNS, TLS and CORS from a generic opaque transport failure; the UI explains what to check rather than inventing an exact cause.

## Repairs

- Added `client/src/lib/api.js`: validates the API base URL, rejects missing/unsafe/mixed-content configuration before sending, uses a 15-second normal request deadline and 60-second upload deadline, preserves server validation/auth/status messages, explains offline/refused/timeout conditions, and rejects cross-origin request targets that do not match the configured API. No automatic retries of mutations are performed.
- Migrated all application Axios imports to that shared instance. Existing Clerk bearer headers, recruiter `token` headers, routes, multipart uploads and response envelopes are retained. API base whitespace/trailing slashes are normalized in context without modifying configuration files.
- Moved lazy database connection into the Express factory **after CORS**. Connection failure now follows the normal safe JSON error path with status 503 and a controlled database code. Preflight remains usable without connecting to MongoDB.
- Health now reports `database: connected/unavailable` from connection state and uses 503 when unavailable. API requests fail promptly if there is no ready connection, instead of buffering against a missing database. A health connection-state flag is not a substitute for the successful real job/profile/application database operations tested separately.
- Added secret-safe startup classification for DNS, refusal, authentication and timeout failures. Raw driver messages are not logged.
- Added an optional one-command local launcher, `npm run dev:local:all`, to start the persistent local backend and normal frontend together. It checks ports before opening the local database directory and closes only its own services on graceful shutdown. Existing two-terminal scripts remain compatible.
- Added actual endpoint discovery and integration coverage recording, plus frontend, backend and browser network regressions. No mocked success data was added to application flows.

## Every file changed in this network repair

Frontend transport/callers:

- `client/src/lib/api.js`
- `client/src/context/AppContext.jsx`
- `client/src/pages/AddJob.jsx`, `Applications.jsx`, `Analytics.jsx`, `ApplyJob.jsx`, `EditJob.jsx`, `ManageJobs.jsx`, `ViewApplications.jsx`
- `client/src/components/InterviewForm.jsx`, `RecruiterLogin.jsx`, `ResumeAccess.jsx`
- `client/package.json`, `client/tests/api.test.js`

Backend/runtime/verification:

- `server/app.js`, `server/server.js`, `server/middleware/security.js`
- `server/utils/databaseDiagnostic.js`
- `server/scripts/dev-local.js`, `server/scripts/discover-api-endpoints.js`, `server/package.json`
- `server/tests/network.test.js`, `server/tests/integration/api.test.js`, `server/e2e/network.spec.js`

Documentation/evidence: this report, `COMPLETE_API_ENDPOINT_AUDIT.md`, `NETWORK_REGRESSION_TESTS.md`, updated README/demo links and the two network screenshots. Prior-session modifications elsewhere in Git were preserved and are not attributed to this repair.

## Safe startup

From a normal PowerShell terminal, after stopping your previous local instance gracefully:

```powershell
Set-Location -LiteralPath 'E:/job_portal - Copy/server'
npm run dev:local:all
```

Open <http://127.0.0.1:5175>; API health: <http://127.0.0.1:5000/health>. Keep the process running; type `stop` or use Ctrl+C to close both services while preserving `.qa/local-mongodb`. Do not start another MongoDB process against that directory. The launcher refuses occupied ports rather than terminating another application.

Alternatively start `npm run dev:local` in `server`, then `npm run dev:local` in `client` in another terminal. Starting only the frontend cannot make API requests succeed. The existing `npm start` still uses the configured remote database and remains BLOCKED until its DNS/connectivity is corrected manually.

## Remaining boundaries

Final local verification: **28/28 endpoint contracts**, **14 backend unit/network tests**, **18 isolated API tests**, **3 frontend transport tests**, **54 real Chrome E2E cases**, frontend lint/build and backend syntax passed. The one-command launcher, duplicate-start guard, repeated frontend/API calls and two restart-persistence comparisons were executed. Details and explicit fault-injection boundaries are in [NETWORK_REGRESSION_TESTS.md](NETWORK_REGRESSION_TESTS.md).

The exercised local workflows are verified separately in [network regressions](NETWORK_REGRESSION_TESTS.md). This is not a permanent guarantee of connectivity: stopped processes, outages, changed configuration or disallowed origins can still prevent requests. The improvement is a verified local runtime, correct CORS/HTTP behavior and recoverable, specific diagnostics.

Configured remote MongoDB, live email delivery, public Clerk webhook delivery and hosted Vercel behavior remain BLOCKED/unverified. No production database record, deployment, environment file, environment value on disk, Git remote or history was changed. No push or deployment occurred. If a different environment still fails, the remaining useful information is the public frontend URL, request path/method, HTTP status or browser network failure code, safe startup diagnostic code and the exact launch command—not passwords, tokens or connection strings.
