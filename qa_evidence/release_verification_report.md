# Release verification — 2026-10-11

## Verified locally

- Existing branch `master`, starting checkpoint `95ef990`; existing frontend
  design and Archive/Vault changes preserved. No remote was initially configured.
- Credential/sensitive-path scan: 279 historical blobs plus current publishable
  files; no flagged credentials or sensitive filenames. `.env`, virtualenv,
  media, build output, keys/dumps/logs and scratch tooling are excluded. Backend
  Docker image was checked to contain no `/app/.env`.
- Windows PostgreSQL suite: **156 tests passed** (`manage.py test --verbosity 2`,
  10.255s). Linux production-image PostgreSQL suite: **156 passed** (8.329s).
- Explicit storage/configuration tests: **16 passed**. S3 transport is mocked;
  actual ReportLab PDF generation, ORM persistence and PDF/ZIP APIs are exercised.
- Frontend Vitest: **138 tests in 18 files passed**. Oxlint and TypeScript passed.
  Production Vite build passed. Existing large-chunk warning remains; Vitest also
  reports PDF.js Node legacy-build and jsdom scrollTo notices, without failures.
- Django checks: no issues. `makemigrations --check --dry-run`: no changes.
  `migrate --check`: success. `pip check`: no broken requirements.
- `collectstatic --noinput`: 154 copied, 444 post-processed on the initial run.
- Docker Compose configuration validation passed. Backend, worker and frontend
  images built successfully. Unused compiler packages were removed from backend
  image; binary Python dependencies and bundled fonts work in Linux.
- Isolated Compose project `aereo-release-check` used local ports 18000/15173,
  separate container names, PostgreSQL 16, Redis 7 and separate named volumes.
  Existing local PostgreSQL/Redis were not modified.
- Synthetic real-worker batch: two valid recipients and one invalid; exactly
  three certificate rows, terminal `COMPLETED_WITH_ERRORS`, 2 generated and
  1 validation failure. Both downloaded PDFs began `%PDF`; ZIP held 2 valid PDFs.
  Job appeared in history. Both PDFs remained downloadable after restarting the
  test backend and worker using the local shared volume.
- Real headless Chrome: landing/dashboard/create/history routes, archive/reload/
  restore, generated certificate gallery and PDF.js/Three.js inspector canvas
  loaded; no page or console errors on the final run.
- The browser check found a real Nginx MIME problem: `.mjs` was served as
  `application/octet-stream`. JavaScript MIME handling was added, frontend image
  rebuilt, and the browser check then passed.

## Commands

```powershell
.\.venv\Scripts\python.exe scratch/release_security_audit.py
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py makemigrations --check --dry-run
.\.venv\Scripts\python.exe manage.py migrate --check
.\.venv\Scripts\python.exe -m pip check
.\.venv\Scripts\python.exe manage.py collectstatic --noinput
.\.venv\Scripts\python.exe manage.py test certificates.tests.test_storage certificates.tests.test_deployment_settings --verbosity 1
.\.venv\Scripts\python.exe manage.py test --verbosity 2
# frontend directory:
npm.cmd test -- --reporter=dot
npm.cmd run lint
npx.cmd tsc -b
npm.cmd run build
# repository root:
docker compose config --quiet
docker compose -p aereo-release-check build
docker compose -p aereo-release-check -f docker-compose.yml -f scratch/compose-release-check.yml up -d
.\.venv\Scripts\python.exe scratch/release_container_smoke.py
docker exec aereo_release_check_frontend nginx -t
docker compose -p aereo-release-check -f docker-compose.yml -f scratch/compose-release-check.yml restart backend celery_worker
.\.venv\Scripts\python.exe scratch/restart_download_check.py
docker exec aereo_release_check_backend python manage.py check
docker exec aereo_release_check_backend python manage.py makemigrations --check --dry-run
docker exec aereo_release_check_backend python manage.py test --verbosity 1
node scratch/release_browser_check.cjs
```

Scratch scripts are local verification tooling and are intentionally excluded
from the release. Standard backend/frontend commands are reproducible from the
repository; deployment and synthetic acceptance steps are in the deployment guide.

## Verified GitHub and Railway release

- GitHub identity verified as `AGRIM140`; created public repository
  https://github.com/AGRIM140/aereo-certificate-bulk-generator and pushed `master`.
  Initial release commits `b5140e0` and `1dd17f4` were verified against the remote.
  The final documentation commit is available through Git history.
- Final pre-commit security scan: 312 historical blobs plus current publishable
  files, zero credential/sensitive-path findings. `git diff --check` passed.
- Railway official login completed. Workspace had no projects, $5 remaining
  credit and 30 trial days. No paid upgrade was authorized.
- Railway rejected $3 alert / $4 hard caps (minimums $5/$10); a higher cap was
  not configured. Do not treat a failed limit update as budget enforcement.
- Created Railway project `aereo-certificate-bulk-generator`, environment
  `production`, services `Postgres`, `Redis`, `backend`, `worker`, `frontend`,
  and private bucket `certificates`. Application sources point to GitHub `master`.
  Backend/worker use private PostgreSQL/Redis reference variables and the same
  bucket credentials. Frontend has no database/broker/storage credentials.
- Public app https://frontend-production-94636.up.railway.app returned HTTP 200
  for `/`, `/dashboard`, `/jobs`, `/jobs/new`, and `/health/` over HTTPS.
- Backend pre-deploy applied all existing migrations successfully. Gunicorn
  started on `[::]:8000`; Railway's DB health probe returned HTTP 200. The worker
  connected to Redis with concurrency 1 and its result backend disabled.
- Live synthetic job `6c94b99d-24f8-4372-829b-7c1e68bff43d` was accepted with 202
  and reached `COMPLETED_WITH_ERRORS`: 3 rows, 2 generated, 1 validation failure.
  Both PDFs had `%PDF` content; ZIP contained exactly 2 valid PDFs; history
  contained the job. This used the deployed API, PostgreSQL and real Celery worker.
- Direct authenticated bucket checks found both expected UUID-path objects,
  matching API download SHA-256 hashes. Anonymous direct object GET returned
  access denied. Backend/worker were safely restarted; the same two PDFs and
  matching bucket objects remained retrievable afterward.
- Real Chrome against the public URL verified routes, archive/reload/restore,
  gallery and PDF.js/Three.js inspector canvas with no page/console errors.
  Separate CSV and JSON import checks passed with no failed HTTP/network
  requests. Checked browser responses did not contain bucket access credentials.
- Deployment exposed and resolved two real provider issues: new Railway services
  reject legacy `railway.json` configuration, so equivalent settings were applied
  directly via API; bucket `virtual-host` style requires boto3 `virtual`.
  Frontend was redeployed after backend private-domain references resolved.
- Post-deployment trial check: 30 trial days, approximately $4.998 remaining,
  no payment method. No paid upgrade was enabled. Trial hosting is temporary.
- The application has no authentication. Buckets remain private, but application
  endpoints intentionally allow public job listing and downloads. Only synthetic
  assignment data is suitable for the public demo.

### Live commands

Commands used the official Railway CLI (installed through `npx @railway/cli`).
Secret-bearing CLI results were captured privately and excluded from Git/transcripts.
Provider mutations applied only the named project's production services.

```powershell
railway service source connect --repo AGRIM140/aereo-certificate-bulk-generator --branch master --service backend --json
railway service source connect --repo AGRIM140/aereo-certificate-bulk-generator --branch master --service worker --json
railway service source connect --repo AGRIM140/aereo-certificate-bulk-generator --branch master --service frontend --json
railway redeploy --service frontend --yes --json
$env:QA_BASE_URL='https://frontend-production-94636.up.railway.app'
$env:QA_JOB_FILE='scratch/live-smoke-job.json'
.\.venv\Scripts\python.exe scratch/release_container_smoke.py
.\.venv\Scripts\python.exe scratch/live_storage_check.py
node scratch/release_browser_check.cjs
node scratch/live_import_check.cjs
railway restart --service backend --yes --json
railway restart --service worker --yes --json
.\.venv\Scripts\python.exe scratch/live_storage_check.py
.\.venv\Scripts\python.exe scratch/railway_budget_check.py
```

The storage check reads actual bucket credentials from ignored local tooling,
not from committed source. Logs were inspected with secret redaction. Local
scratch tools and credential captures are excluded from the repository.
