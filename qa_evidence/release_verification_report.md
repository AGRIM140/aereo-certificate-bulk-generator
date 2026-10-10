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

## External deployment status at release preparation

- GitHub cached credential identity verified as `AGRIM140`; intended repository
  `aereo-certificate-bulk-generator` did not exist at the initial check.
- Railway official login completed. Workspace had no projects, $5 remaining
  credit and 30 trial days. No paid upgrade was authorized.
- Railway rejected $3 alert / $4 hard caps (minimums $5/$10); a higher cap was
  not configured. Do not treat a failed limit update as budget enforcement.
- Actual Railway services, public HTTPS URL, live bucket access and persistence
  still require deployment verification. Local shared-volume restart success
  does not verify Railway bucket persistence.
- The application has no authentication. Buckets remain private, but application
  endpoints intentionally allow public job listing and downloads. Only synthetic
  assignment data is suitable for the public demo.
