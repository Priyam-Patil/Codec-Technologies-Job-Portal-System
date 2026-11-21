# Publication and preview release checks — 21 November 2026

This document records the checks made before preparing the release commit. Push acceptance and its exact SHA must be independently confirmed against the remote branch; this document does not claim that a deployment exists.

## Exact repository and history

- Authorized target: `https://github.com/Priyam-Patil/Codec-Technologies-Job-Portal-System.git`.
- Safe publication branch: `codex/insiderjobs-release-20261121`.
- The signed-in GitHub browser showed a private, empty repository. Git returned no heads or remote HEAD before publication. There are no target commits to overwrite.
- Existing local history has six commits and is retained. Existing `origin` continues to point to `Priyam-Patil/job_portal_working`; it was not changed. Push uses the exact target URL and only the release branch, with no force flag, no merge, and no production promotion.
- The GitHub connector returned404 for this private repository, while the signed-in browser and authenticated Git transport could access it. No token was extracted from the browser or credential store.

## Confidentiality and source review

The accumulated working tree, README, frontend/API integration, authentication/ownership paths, models, resume parser/worker, routes and tests were reviewed. Existing source, tests and historical QA documentation remain in the release snapshot.

The existing `.gitignore` excluded environment files, node_modules, dist, `.qa`, browser reports and test output. It was extended to exclude `.vercel`, `.aws`, private upload folders, conventional MongoDB data folders, private-key/certificate files, logs, coverage and generated diagnostics. Explicit ignore checks confirm representative environment, MongoDB, upload, Vercel and build/test paths are excluded. No matching sensitive paths are tracked or staged.

A signature scan plus exact comparison against known confidential existing environment values found no matching secrets in Git-eligible files or301 historical blobs from all six local commits. The staged blob scan repeats those checks before commit. Values are never printed or stored in the report. Both existing environment files are compared byte-for-byte with the pre-release and previous QA baselines. This is a scoped automated scan and review, not a guarantee that every possible secret format can be detected.

Local `.qa` manifests, database files, generated credentials, dependency/build output and test-result files stay ignored. The sanitized checked-in evidence mapping links local ignored evidence and retained screenshots; it does not publish raw manifests or private uploads.

## Release changes

- Extended root ignore rules for publication safety.
- Corrected the new checklist test to select this run's saved job by exact title. A repeat run with earlier bookmarks exposed the old globally matched Learn more locator. No saved jobs were deleted or application behavior changed.
- Pinned Quill to exact2.0.2 and updated the lockfile. The initial npm production audit flagged2.0.3 for [GHSA-v3m3-f69x-jf25](https://github.com/advisories/GHSA-v3m3-f69x-jf25), a low-severity HTML-export advisory. The advisory lists only2.0.3 as affected and no patched release; npm suggested the prior2.0.2 release. This is a pin outside the listed affected range, not a claim of an upstream security patch or comprehensive proof of editor security. Backend job HTML sanitization remains in place and its tests pass. Final npm audit reports zero known production dependency vulnerabilities for both applications.
- Removed redundant trailing blank lines from four QA Markdown documents; preserved their content.
- Linked the current138-case mapping and release report from README and clarified that the older54-case network suite includes fault injection.

No real environment file or hosted environment variable was changed. No production data or database index was modified.

## Executed checks

| Check | Result |
|---|---|
| Server `npm test` | PASS,14/14 |
| Server `npm run test:integration` | PASS,18/18, isolated local MongoDB; external test seams remain explicitly mocked |
| Server `npm run check` | PASS,54 JavaScript files |
| Client `npm test` | PASS,3/3 |
| Client `npm run lint` | PASS |
| Client `npm run build` after Quill pin | PASS,914 modules |
| Client/server `npm audit --omit=dev` | PASS,0 known reported vulnerabilities in final production dependency trees |
| `npx playwright test --config playwright.checklist138.config.js` after final dependency pin | PASS,12/12; zero failures/skips/flaky,1.6 minutes |
| Git whitespace, staged-file and secret checks | PASS;238 indexed files,182 staged changes,zero secret/forbidden/oversized-file findings; existing environment files unchanged |

The first release browser attempt passed seven scenarios then failed because two retained bookmarks matched one unscoped locator; four dependent scenarios did not run. That attempt is not represented as successful. After the locator fix all12 passed. Browser scenarios are repeated after the dependency pin, rather than assuming the prior editor build remains valid. A restricted-shell npm audit could not reach the registry; the same read-only check was rerun with authorized network access and returned zero findings.

The final real Chrome suite exercises Clerk development login/deep-link protection, recruiter signup and image validation, job creation/editing/visibility, filters, profile persistence, actual Cloudinary PDF upload and skill extraction, matching, bookmarks/account isolation, application ownership and private resume checks, actual focus and30-second status refresh, interview time/timezone/privacy, MongoDB analytics and logout. No mocked success responses or replacement authentication are counted as real browser evidence. Development test codes do not prove real email delivery.

The original138 criteria retain their separate case-by-case evidence in CHECKLIST_138_COVERAGE.md. The five external integration blockers remain outside those criteria.

## Vercel discovery and explicit stop point

The accessible team is `patilpriyam03-6348s-projects`. No Vercel project was returned for the exact target repository. The two older Job Portal projects are:

| Existing project | Latest inspected source | Why it was not deployed |
|---|---|---|
| `job-portal-client` | `Priyam-Patil/job_portal_working`, main, commit3c8c92f | Different repository and an existing production deployment |
| `job-portal-working-server` | Same older repository/commit | Different repository and an existing production deployment |

Their old READY states do not verify this release. No project was automatically relinked or created, no production deployment was triggered, no alias was promoted and no existing environment setting was changed. A preview URL for this release is **BLOCKED by missing target project/Git connection configuration**, not a deployment success.

## Exact manual prerequisites for preview

1. In the Vercel team above, authorize its GitHub integration to access the private `Priyam-Patil/Codec-Technologies-Job-Portal-System` repository. If using the ChatGPT GitHub connector for future checks, grant that connector access to the same private repository separately.
2. Identify or authorize dedicated staging projects for this repository. Keep the old production projects intact unless you explicitly choose otherwise. Configure frontend root `client`, build `npm run build`, output `dist`; backend root `server` with the retained Node handler configuration and compatible Node24 runtime.
3. Explicitly select the release branch for a **preview-target** deployment. In an initially empty repository, the first branch may become the GitHub default: do not assume a default-branch import creates a preview. Confirm target=preview before triggering any build. Do not promote or change production aliases without separate approval.
4. Provide an authorized staging MongoDB connection. The configured remote database previously failed DNS resolution; local database success does not establish hosted reachability. Manually configure the server's existing `MONGODB_URI`, `JWT_SECRET`, Clerk and Cloudinary variables; set exact `ALLOWED_ORIGINS` for the approved preview frontend. Never share values in chat or commit them.
5. Configure frontend Preview variables `VITE_BACKEND_URL` to the HTTPS staging API and `VITE_CLERK_PUBLISHABLE_KEY` to the matching Clerk development instance. Authorize preview origins/domains in Clerk manually. Configure server `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY` where required, `CLERK_WEBHOOK_SECRET`, `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_SECRET_KEY` in the staging project. Optional email requires manually verified sender plus `RESEND_API_KEY` and `EMAIL_FROM` and authorized recipients.
6. Inspect staging duplicates/index impact and obtain explicit approval before installing a missing unique application index. Do not delete duplicates or use production data for tests.
7. After the missing project/configuration is supplied, verify deployment source SHA, preview target, build logs, frontend SPA deep links, backend `/health`200 with database connected, authenticated browser/API requests, PDF worker packaging/upload limits and private resume delivery. A successful frontend build alone is insufficient.

Google OAuth test-account access, three live email events and public Clerk webhook ingress remain separately blocked. Hosted backend/MongoDB readiness and Vercel worker/request-limit behavior remain unverified. See REMAINING_BLOCKERS.md for operational and legacy-resume follow-ups.

## Local application

Keep the existing frontend http://127.0.0.1:5175/ and backend http://127.0.0.1:5000/ running. If intentionally stopped later, use:

```powershell
Set-Location -LiteralPath 'E:/job_portal - Copy/server'
npm run dev:local:all
```

This uses preserved local MongoDB files, not the configured remote database. Existing environment values remain confidential and unchanged. The Codex portal tab is retained.
