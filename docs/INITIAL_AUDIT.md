# Initial audit — before implementation

Inspected existing frontend components/pages/context, backend routes/controllers/models/middleware, package manifests and deployment configuration. Environment file contents were not opened. No production services were contacted.

| Capability | Initial status | Evidence / issue |
|---|---|---|
| Clerk registration/login/logout | ALREADY IMPLEMENTED | Clerk provider and UserButton; live credentials NOT VERIFIED |
| Clerk identity synchronization | BUGGY | Webhook verifies reserialized JSON, creation not idempotent |
| Recruiter signup/JWT | PARTIALLY IMPLEMENTED | bcrypt and expiring JWT; validation, HTTP errors and throttling missing |
| Search/category/location | ALREADY IMPLEMENTED | Client JobListing filters real API records |
| Job details/visibility | BUGGY | Public detail endpoint also returns hidden jobs |
| Resume upload | PARTIALLY IMPLEMENTED | Cloudinary upload exists; no upload limits, temp cleanup, privacy or parsing |
| Apply/history/status | PARTIALLY IMPLEMENTED | Ownership filtering exists; duplicate check races, server does not require resume or visible job |
| Hide applied jobs | PARTIALLY IMPLEMENTED | Related-job suggestions exclude applications; general listing does not |
| Recruiter posting/visibility/applicants | ALREADY IMPLEMENTED | Company ownership queries exist; live persistence NOT VERIFIED |
| Edit job | MISSING | No edit endpoint or UI |
| Resume recommendations/analysis | MISSING | No parsing or matching code |
| Recruiter analytics | MISSING | ManageJobs counts applicants using N+1 queries |
| Saved jobs/candidate profile | MISSING | User model has identity and resume only |
| Salary/level/type/work-mode filters | MISSING | Salary/level stored; type/work mode absent |
| Interview scheduling | MISSING | No model fields, endpoint or controls |
| Email notifications | REQUIRES MANUAL CONFIGURATION | No email transport or sender configuration in source |
| Admin | MISSING | Optional; no trusted role provisioning exists |
| UI/loading/errors | PARTIALLY IMPLEMENTED | Existing responsive Tailwind cards and toasts; hover-only controls, raw HTML rendering, endless detail loading on errors |
| Automated QA | MISSING | No tests or backend test script |
| Deployment | PARTIALLY IMPLEMENTED | Vercel configs exist; backend connects at module startup and starts listener unconditionally |

Architecture: React 19 / Vite 8 / Tailwind / React Router / Axios / Quill; Express 5 / Mongoose 9 / MongoDB; Clerk candidates, bcrypt + JWT recruiters, Cloudinary assets, Svix webhooks, Sentry instrumentation. Existing User, Company, Job and JobApplication collections are preserved.

Priority: protect existing workflows; secure auth/uploads/HTML/webhooks; add local explainable matching, profiles/bookmarks/analytics/filters/interviews; test without production data. No destructive migration, deployment, push or environment edit is authorized.
