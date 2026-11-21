# Deployment readiness — no deployment performed

> Current evidence is in [FINAL_E2E_AUDIT.md](FINAL_E2E_AUDIT.md) and [REMAINING_BLOCKERS.md](REMAINING_BLOCKERS.md). The original phase evidence below is historical. A persistent local development mode now runs on 5175/5000 without changing environment files; it does not certify remote database or Vercel readiness.

> Subsequent local browser verification: 20 desktop/mobile Chrome tests now pass, including real Clerk development authentication and Cloudinary QA uploads/downloads. See [WORKING_APP_VERIFICATION.md](WORKING_APP_VERIFICATION.md). Persistent database connectivity and hosted deployment remain blocked/unverified as described there. The earlier evidence below records the preceding implementation phase.

The existing two-project client/server layout and Vercel routing configuration are retained. No hosted project, environment variable, Git remote or deployment was changed.

1. Review the code, approve a staging deployment and use a dedicated staging MongoDB database and Clerk test instance. Do not point tests at production.
2. Select a supported Node runtime meeting PDF.js requirements (recommend Node 24 LTS). Frontend project root: `client`; build `npm run build`; output `dist`. Existing SPA rewrites handle deep links.
3. Backend project root: `server`; the retained Vercel Node builder targets `server.js`. The exported handler reuses a lazy database connection; local listener starts only on direct execution. Worker source and PDF.js legacy build are explicitly included in the existing build configuration.
4. Manually review existing required variables listed in the root README. Never expose server secrets with a `VITE_` prefix. Manually select the frontend API base URL, Clerk instance/domain configuration and exact `ALLOWED_ORIGINS`. Existing values were not changed by this work.
5. Confirm Cloudinary supports authenticated raw assets and signed download URLs for PDFs. Use a staging upload to verify actual storage and expiration. New uploads use authenticated delivery; old public assets need a separately approved migration/retention plan.
6. Check application duplicate counts in the selected staging database and manually install the reviewed unique application index. Normal startup does not create indexes or migrate records. Repeat the controlled index process for production only after explicit approval.
7. Configure `/webhooks` in the same Clerk instance and manually verify signed creation/update/deletion delivery. Webhook verification happens before JSON parsing; identity updates preserve profile/resume fields.
8. If enabling email, manually configure Resend, verify the sender domain and set `RESEND_API_KEY` and `EMAIL_FROM`. Verify submission/status/interview email delivery using test recipients. No email transport was previously available, and no provider account was configured by this work.
9. Sentry is opt-in through manually configured `SENTRY_DSN`; request bodies, headers and cookies are removed from captured events and personal-data sending is disabled. Development telemetry test routes are unavailable in production.
10. Before public launch, add a shared/platform throttle, review proxy/IP handling, verify user-specific cache behavior, ensure HTTPS, and review recruiter session storage, recovery, logging, backups, malware scanning and asset retention.
11. Verify actual Vercel function bundle startup and the PDF worker, function timeout/memory limits and upload request-body limits. The application accepts 5 MB, but a hosting plan/runtime may enforce a smaller limit; align UI/server limits with the selected host. A local build cannot prove hosted worker compatibility.
12. Complete browser tests at desktop, tablet and mobile widths, Clerk candidate sign-in/logout, recruiter registration/login, job editing, PDF upload/download, bookmarking, matching, application/status/interview workflows and all error paths.

## Evidence and blockers

- Frontend production build and lint: PASS locally.
- Backend JavaScript syntax and isolated application startup/API responses: PASS locally.
- Real isolated MongoDB/API suite: PASS, 15 tests. Clerk identity and external transports are test seams, not live-service evidence.
- Unit suite: PASS, 11 tests, including real sample PDF parsing.
- Browser: local QA server started; connected browser could not reach loopback (`ERR_CONNECTION_TIMED_OUT`). Responsive/visual checks: NOT VERIFIED.
- Live Clerk, Cloudinary, email and Vercel startup/deployment: NOT VERIFIED.
- Existing database index and old public assets: no production checks or modifications were performed.

Do not call this production-ready until those staging and operational gates are complete. Push and deployment remain subject to the owner's explicit approval.
