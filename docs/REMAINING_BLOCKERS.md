# Remaining blockers — 21 November 2026

The local application is demonstrable. The hosted application and configured remote database are **not fully verified**.

| Item | Status | Required owner action |
|---|---|---|
| Configured `npm start` database connection | BLOCKED | Resolve the configured MongoDB DNS/connectivity issue and identify an authorized development/staging database. Existing connection string was not changed or disclosed. |
| Remote duplicate inspection and unique index | BLOCKED | Review duplicate counts/index impact on the authorized persistent database, then explicitly approve index installation. Never delete duplicates automatically. `npm run db:check-indexes` is read-only; `--apply` writes and requires approval. |
| Live email delivery | BLOCKED | Configure `RESEND_API_KEY`, `EMAIL_FROM` and a verified sender manually; provide authorized test recipient addresses before delivery checks. Local/demo modes disable outbound email. Unit transport tests are mocked. |
| Internet delivery of Clerk webhooks | BLOCKED | Provide an approved reachable staging webhook endpoint and matching `CLERK_WEBHOOK_SECRET`; verify delivery in Clerk. Signed raw-payload verification is tested locally, but live ingress was not executed. First login no longer depends on webhook arrival. |
| Vercel deployment, function packaging and production CORS | NOT TESTED | Approve staging deployment, configure existing variables manually and verify hosted worker startup, request limits, deep links and exact allowed origins. No deployment or setting was changed. |
| Legacy publicly stored resumes | NOT TESTED | Review existing assets and authorize a private-storage migration/retention policy. Newly uploaded PDFs are authenticated assets; expiring signed links are bearer capabilities until expiry. |
| Arbitrary/scanned resumes | NOT TESTED | Test representative real resumes with consent. This parser extracts embedded PDF text, has no OCR, and recognizes a fixed technical vocabulary. No recognized skill is reported honestly; manual profile skills provide recommendation fallback. |
| Full production operational security | NOT TESTED | Review shared throttling, monitoring, backups, recruiter recovery/session storage, retention and malware scanning before public launch. |

No admin console was added; it remains outside this repair scope. No account receives admin permissions. Local QA uploads and generated recruiters exist only for the authorized development demonstration. Repeated resume replacement retains older assets; retention/cleanup remains an operational follow-up.

All existing environment files are confidential and read-only. No new variable is required for the added persistent local mode. Its runtime email/Sentry isolation and local CORS affect only that process. The configured production environment and database were not changed.
