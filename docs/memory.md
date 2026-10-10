# Project Memory — Bulk Certificate Generator

> **Living state document.** Answers: **WHERE ARE WE RIGHT NOW?**
> Update at **meaningful milestones** (phase started/completed, decision made, problem found) — **not** for tiny code edits.
> Source-of-truth order: assignment > `prd.md` > `architecture.md` > `rules.md` > `phases.md` > this file.

---

## Current Status

### GitHub/Railway release — 2026-10-11

The final release task supersedes the completed implementation phase boundaries.
Existing frontend design and browser Archive/Vault work are preserved. Added
private S3-compatible certificate storage, safe provider errors, runtime ports
and private Nginx routing, collected static-file serving, and readiness checks.
No database schema or authentication changes were made.

Verified: 156 backend tests on Windows/PostgreSQL and 156 in the Linux Docker
image; 138 frontend tests, lint, TypeScript/build; 16 explicit storage/configuration
tests; real local container Celery/PDF/ZIP flow and downloads after restart;
real Chrome archive/reload/restore and certificate inspector rendering. Fixed
absolute pagination query loss, date-test clock mocking, blocked localStorage
handling and the production PDF.js worker MIME type. See
`qa_evidence/release_verification_report.md` and `docs/deployment.md`.

Published `AGRIM140/aereo-certificate-bulk-generator` on `master`. Railway project
`aereo-certificate-bulk-generator` / `production` contains Postgres, Redis,
backend, worker and frontend plus the private certificates bucket. Public URL:
https://frontend-production-94636.up.railway.app . Live synthetic batch produced
exactly 3 rows: 2 PDFs and 1 validation failure; PDF/ZIP/history checks passed.
Chrome verified archive/reload/restore, CSV/JSON import and inspector rendering.
Actual bucket objects matched API downloads and rejected anonymous direct GET.
The same PDFs remained retrievable with matching hashes after backend/worker
restart, confirming bucket persistence separately from local container tests.
Railway rejects legacy Config as Code for new services: applied explicit service
settings through its API instead. Mapped provider `virtual-host` to boto3 `virtual`.
No paid upgrade or payment method; approximately $4.998 trial credit remained
at the post-deployment check. API access remains public; use synthetic data only.

```text
Project Status: COMPLETE & READY FOR SUBMISSION
Current Phase: Phase 12 COMPLETE & FULL-STACK INTEGRATED
Current Task: Full-stack verified; ready for submission
Overall Progress: Backend (Phases 1–12) 100% verified; Frontend (Phases F1–F7) 100% verified; Docker deployment ready
Last Updated: 2026-10-10
```

---

## Current Architecture (final)

```text
Client -> Django + DRF -> PostgreSQL (source of truth: GenerationJob, Certificate)
                      \-> transaction.on_commit -> Celery task (job UUID only)
                                                     -> Redis (broker only)
                                                     -> Celery worker
                                                     -> services.process_job (claim with select_for_update)
                                                     -> ReportLab overlay on static Recursion template
                                                     -> local MEDIA_ROOT
```

- Django + DRF, **PostgreSQL**, **Celery**, **Redis (broker only)**, ReportLab, local media storage.
- API contract unchanged (`POST /api/jobs/`, `GET /api/jobs/{id}/`, `GET /api/certificates/{id}/`, `GET /api/certificates/{id}/download/`; recommended endpoints added: `GET /api/jobs/`, `GET /api/jobs/{id}/certificates/`, `GET /api/jobs/{id}/download/`). Only addition: `certificate_number` on certificate objects.
- Job status (`GenerationJob.status` in PostgreSQL) is authoritative; Celery task state is not the business status.

---

## Completed

- Phase 1: Django + DRF project foundation, PostgreSQL configuration, Celery wiring, local setup files, and foundation tests. Verified against PostgreSQL 17.11.
- Phase 2: `GenerationJob` and `Certificate` PostgreSQL models, schema migration, progress and certificate-number helpers, UUID-only upload path, and 11 model tests. Verified against PostgreSQL 17.11.
- Phase 3: request and per-recipient DRF serializers, job/certificate output serializers, and a registered JSON error-envelope handler. Added 24 tests for validation, errors, and output. The full 38-test Django suite passes on PostgreSQL; `manage.py check` reports no issues and `makemigrations --check --dry-run` reports no changes.
- Phase 4: cleaned the supplied Recursion template's dynamic-text areas into a fixed RGB asset; bundled Cormorant Garamond regular/bold TTFs and their SIL OFL licence; added fixed layout configuration and a ReportLab generator that returns bytes without database, API, Celery, or file writes. Ten PDF tests pass. The full 48-test suite passes on PostgreSQL. Short, typical, and maximum-length PDFs were rendered and visually inspected. A typical PDF is about 388 KB after template compression.
- Phase 5: `services.py` creates a job and one numbered certificate row per recipient in one atomic transaction, using the existing recipient serializer and certificate-number helper. Invalid rows become `FAILED/VALIDATION`. Synchronous `process_job` claims a pending job under a short PostgreSQL row lock, generates and stores PDFs for pending rows, records isolated generation failures, removes partial files, and finalizes job status from certificate rows. Sixteen new service tests pass; the full 64-test suite passes on PostgreSQL. `manage.py check` reports no issues and `makemigrations --check --dry-run` reports no changes. No schema changes were needed.
- Phase 6: `config/celery.py` and `certificates/tasks.py` configured with `process_job_task(job_id)` passing only the job UUID string. `services.dispatch_job(job_id)` registers dispatch via `transaction.on_commit(queue_job)`; broker errors are caught and logged, leaving the job `PENDING` in PostgreSQL for later recovery. Multiple/duplicate calls to `process_job` are idempotent no-ops. Added `CeleryEagerTestCase` test helper providing in-process Celery execution and isolated temporary media storage. Eight new Celery tests pass; full 72-test suite passes on PostgreSQL; `manage.py check` and `makemigrations --check --dry-run` are clean. Real end-to-end background execution verified against a local Redis server and live Celery worker (`--pool=solo`).
- Phase 7: REST API endpoints `POST /api/jobs/` (accepting bulk requests, validating via `JobRequestSerializer`, delegating to `services.create_job`, returning HTTP 202 with job details and `status_url`) and `GET /api/jobs/{job_id}/` (retrieving job, progress counts, and per-recipient certificates in 3 constant queries) implemented in `certificates/views.py` and routed in `certificates/urls.py`. All error responses preserve the documented JSON error envelope (400 validation, 404 unknown/malformed UUID via `MalformedJobDetailView` and `handler404`, 405 method not allowed, 415 unsupported media type). 21 new API tests added; full 93-test suite passes on PostgreSQL. Live end-to-end API lifecycle verified with local Redis and running Celery worker.
- Phase 8: Certificate metadata endpoint `GET /api/certificates/{id}/` and download endpoint `GET /api/certificates/{id}/download/` implemented in `certificates/views.py` and routed in `certificates/urls.py`. Metadata endpoint returns HTTP 200 with `CertificateDetailSerializer` output. Download endpoint streams PDF as an attachment using `FileResponse`, headers `Content-Disposition: attachment; filename="CERT-<year>-<hex>.pdf"` and `Content-Type: application/pdf`. Incomplete/failed certificates return HTTP 409 (`certificate_not_available`), unknown or non-UUID IDs return HTTP 404 in standard error envelope, and missing disk files log errors without leaking filesystem paths. Added 10 tests in `certificates/tests/test_retrieval.py`; full 103-test suite passes on PostgreSQL. Live end-to-end download verified.
- Phase 9: All recommended features implemented and verified:
  (1) FR-017 `process_pending_jobs` management command and `services.recover_stale_jobs()` with `--older-than-minutes` threshold (default from `STALE_JOB_MINUTES` = 15) to re-dispatch stale PENDING jobs and reset/re-dispatch stale PROCESSING jobs under row locks;
  (2) FR-016 `GET /api/jobs/{job_id}/download/` bulk ZIP download of all GENERATED certificates (`application/zip`, attachment header `job_{id}_certificates.zip`, entries named `{row_number:04d}_{cert_number}.pdf`), returning 409 Conflict if no certificates are generated;
  (3) FR-014 `GET /api/jobs/` paginated job list (newest first, summary serializer) and FR-015 `GET /api/jobs/{job_id}/certificates/?status=...` paginated/filterable certificate list (supporting PENDING, GENERATED, FAILED; 400 on invalid status, 404 on unknown job);
  (4) FR-018 `certificates/admin.py` model registration for `GenerationJob` and `Certificate`.
  Added 14 tests across `test_job_status.py`, `test_retrieval.py`, `test_management_command.py`, and `test_foundation.py`. The full 117-test suite passes on PostgreSQL; `manage.py check` and `makemigrations --check --dry-run` are clean. Live end-to-end integration verified against local Redis and Celery worker.
- Phase 10: Testing and verification complete:
  (1) Traceability matrix fully walked and covered; added 23 focused tests across `test_validation.py`, `test_failure_handling.py`, `test_job_status.py`, `test_job_creation.py`, and `test_pdf_generation.py` ensuring every FR-001…FR-022 and NFR-001…NFR-008 requirement is explicitly tested. Total test count reached 140 tests.
  (2) Suite stability verified with 3 consecutive full test runs (`manage.py test`): all 3 runs passed 140/140 tests cleanly on PostgreSQL in ~5.4s (zero flakiness).
  (3) Migration safety verified: `makemigrations --check --dry-run` reports no changes detected; `manage.py check` reports 0 issues.
  (4) Scale benchmark with live PostgreSQL, Redis, and Celery worker (`--pool=solo`): 500-recipient job generated 500 valid PDFs in 49.63s processing time (10.07 certs/sec throughput, 99.3 ms/cert). Average PDF size: 387.5 KB (184.8 MB total). Bulk ZIP download built in 16.47s (152.4 MB) containing 500 valid PDFs. Test media and database rows cleaned up post-run.
- Phase 11: Comprehensive README and documentation completed:
  (1) Authored complete, professional `README.md` containing architectural component and flow diagrams, local setup instructions (Python 3.11+, PostgreSQL 14+, Redis 7+), step-by-step installation commands, environment variable configuration, and migration execution.
  (2) Fully documented application runtime procedures: web server command, Celery worker process execution (including Windows `--pool=solo` note), test execution procedures, and verified suite results (140 tests passing).
  (3) Provided comprehensive API documentation for all 7 endpoints with copy-pasteable `curl` examples, request payloads, response schemas, and standardized JSON error envelopes.
  (4) Documented technical design decisions with interview-ready rationales: Django + DRF, PostgreSQL authoritative state, Celery + Redis vs synchronous/threads, `transaction.on_commit()`, `select_for_update()` row claiming, failure isolation, Recursion template overlay with Cormorant Garamond typography, certificate number format, and future scaling architecture (S3, PgBouncer, chunking, `acks_late`).
  (5) Documented stale-job recovery management command (`process_pending_jobs`), known limitations/assumptions, verified Phase 10 scale benchmark metrics, and accurate repository directory tree.

*(The developer explicitly requested Phase 1 implementation while Phase 0's design questions remain open. Those questions are still relevant before their dependent later phases.)*

---

## Currently Working On

- No coding phase is currently in progress. Phase 11 was completed, verified, and committed. Ready for Phase 12 upon explicit instruction.

---

## Next

- Phase 12 — Final review (checklist pass against prd.md §1.8 and §1.15, security check against rules.md §3.7, fresh-clone verification, interview preparation drills).





---

## Decisions Made

Full reasoning is in `architecture.md` §2.16. Do **not** change active decisions without developer approval. Superseded decisions are kept as history.

```text
ACTIVE
- DEC-001 Backend framework: Django + Django REST Framework
- DEC-003 Certificate format: PDF via ReportLab (template part amended by DEC-025)
- DEC-005 Validation: request-level errors -> 400 (no job); invalid recipients -> saved as FAILED/VALIDATION
- DEC-006 Certificate info (event_name, organization_name, issue_date) is per job; recipients have name + optional email
- DEC-007 UUID primary keys / public IDs
- DEC-008 Progress counts computed from certificate rows (no stored counters)
- DEC-009 MAX_RECIPIENTS_PER_JOB = 500 (configurable); job detail embeds all per-recipient results
- DEC-010 Thin views; logic in services.py; thin tasks.py; PDF drawing in pdf_generator.py (pure function)
- DEC-011 Tests: Django test runner in certificates/tests/ (now requires PostgreSQL)
- DEC-012 Bundled serif Unicode TTF font (accented Latin only)
- DEC-013 Consistent JSON error envelope via custom DRF exception handler
- DEC-014 PDFs stored on configurable local media, served only through API views
- DEC-015 Job statuses: PENDING, PROCESSING, COMPLETED, COMPLETED_WITH_ERRORS, FAILED
- DEC-016 No authentication (out of scope)
- DEC-017 APIView/generic views with explicit URLs (no ViewSets/routers)
- DEC-018 python-dotenv for .env loading
- DEC-019 PostgreSQL selected as the relational database (supersedes DEC-002)
- DEC-020 Celery selected for background processing; Python threading removed (supersedes DEC-004)
- DEC-021 Redis selected as Celery broker only; no result backend; PostgreSQL is the source of truth
- DEC-022 Task queued via transaction.on_commit (never before commit)
- DEC-023 Job claimed with select_for_update() in a short transaction (one active worker per job)
- DEC-024 Celery task receives only the job UUID string
- DEC-025 Certificate template = supplied Recursion design as static image; ReportLab overlays dynamic data; config in template_config.py
- DEC-026 certificate_number = CERT-<year>-<12 hex of UUID>, unique, printed at the "Registration Number" position of the body sentence; UUID stays internal
- DEC-027 Queue failure: log, job stays PENDING, API still 202, recover via command
- DEC-028 Tests: PostgreSQL required, Celery eager mode, no Redis/worker needed
- DEC-029 Body paragraph drawn dynamically (constant sentence + escaped values in a ReportLab Paragraph); baked-in sample text erased from the template asset
- DEC-030 Page size follows image aspect ratio by default; re-export at exact A4 + higher resolution recommended; compress/flatten image to keep PDFs small

SUPERSEDED (history only)
- DEC-002 SQLite as initial database  -> superseded by DEC-019
- DEC-004 Python thread processing + sync switch -> superseded by DEC-020
```

**Phase 1 direct dependency pins:** Django 5.2.18, djangorestframework 3.18.3, `psycopg[binary]` 3.3.6, `celery[redis]` 5.6.3, reportlab 5.0.1, python-dotenv 1.2.4, dj-database-url 3.1.2. Pillow 12.3.0 was installed transitively by ReportLab. The documented OQ-6 default (`dj-database-url`) was used; no new dependency was introduced. Dev-only optional: coverage, ruff.

**Setup requirements:** Python 3.11+, running **PostgreSQL** (empty database + user that can create test databases), running **Redis**; two processes: `python manage.py runserver` and `celery -A config worker --loglevel=info` (Windows: possibly `--pool=solo`).

**Environment variables:** `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `DATABASE_URL`, `CELERY_BROKER_URL`, `MEDIA_ROOT`, `MAX_RECIPIENTS_PER_JOB`, optional `STALE_JOB_MINUTES`.

---

## Changes

| Date | Change |
|---|---|
| 2026-10-08 | Initial documentation (`prd.md`, `architecture.md`, `rules.md`, `phases.md`, `memory.md`) created (SQLite + threading design). No code written. |
| 2026-10-08 | **Architecture migration (docs only):** SQLite → PostgreSQL; threading → Celery + Redis; transaction.on_commit dispatch; select_for_update job claim; self-drawn template → supplied Recursion template overlay; certificate_number added; new FR-019…FR-022, NFR-012/013, AC-012…AC-014, assumptions A-12…A-16; phases renumbered (0–13); rules gained §3.0 mandates. Assignment requirements unchanged. |
| 2026-10-08 | **Template analysis (docs only):** the supplied Recursion PNG (1184×864, RGBA, ≈1.4 MB, ratio 1.370) was inspected. Findings: sample/dynamic text is baked into the pixels (organization line, body paragraph with typos, bottom-left name/date) and must be erased; organization name slot = green line under "PROUDLY PRESENTED BY" (A-13 resolved); body sentence drawn dynamically; resolution ≈100 DPI at A4; 500 × 1.4 MB concern. Added A-17…A-20, DEC-029/030, OQ-11…OQ-15, rules for escaping and the cleaned asset. |
| 2026-10-08 | **Phase 1 started:** copied the five source documents into `docs/`; created the virtual environment, Django `config` project, `certificates` app, PostgreSQL-only settings, DRF JSON settings, Celery broker wiring, pinned requirements, environment example, README stub, and three foundation tests. `manage.py check` passed; two configuration tests passed. The full suite failed before tests ran because no PostgreSQL server is reachable at `127.0.0.1:5432`. Winget's PostgreSQL installer download returned HTTP 403; Chocolatey installation failed without Windows administrator rights. No SQLite fallback was used. |
| 2026-10-08 | **Phase 1 completed:** with the developer's installer authorization, PostgreSQL 17.11 was installed as a local Windows service. A dedicated `bulk_certificates` database and `bulk_certificates_user` role with `CREATEDB` were created; generated local credentials are stored only in ignored `.env`. `manage.py check` passed, `migrate --noinput` applied all initial Django migrations, `makemigrations --check --dry-run` reported "No changes detected", `manage.py test --verbosity 2` created a PostgreSQL test database and passed all 3 tests, and `runserver` listened on loopback and served a local request. Temporary setup clusters were stopped and removed. No Redis or Celery worker was needed for Phase 1. |
| 2026-10-08 | **Phase 2 completed:** added both documented models with UUID primary keys, status/error choices, timestamps, PDF file reference, `(job, row_number)` and certificate-number uniqueness, and `(job, status)` and job-status indexes. Added `get_progress()` (one aggregate query), UUID-only upload path, and the UUID-derived certificate-number helper. Generated and applied `certificates.0001_initial` on PostgreSQL. `manage.py check` passed; `makemigrations --check --dry-run` reported "No changes detected"; 11 new model tests and the full 14-test suite passed. No Phase 3 code was started. |
| 2026-10-08 | **Phase 3 completed:** added request/recipient validation serializers, response serializers, and custom DRF exception handler returning standardized JSON error envelopes. 24 validation and error tests added; full 38-test suite passed. |
| 2026-10-08 | **Phase 4 completed:** cleaned the supplied image's sample text with the static Recursion layout retained, then reduced the RGB PNG to 256 colours for size. Bundled [Cormorant Garamond regular and bold](https://github.com/google-fonts-bower/cormorantgaramond-bower) with its SIL OFL licence. The generator uses the image's 1.370 aspect ratio at 842 pt width, draws escaped dynamic text in measured boxes, and returns bytes only. Ten Phase 4 tests and the full 48-test PostgreSQL suite passed; short, typical and maximum-length output was visually checked with a temporary PDF renderer. `manage.py check` passed; `makemigrations --check --dry-run` found no changes. No Phase 5 code was started. |
| 2026-10-08 | **Phase 5 completed:** added `services.py` with atomic `create_job` (saving job and certificate rows with validation status) and `process_job` claiming pending jobs under PostgreSQL row locks (`select_for_update`), generating PDFs, isolating failures, removing partial files, and computing final status. 16 tests added; full 64-test suite passed on PostgreSQL. |
| 2026-10-08 | **Phase 6 completed:** configured Celery with Redis broker and `process_job_task(job_id)` entry point passing only the UUID string. Registered `services.dispatch_job` via `transaction.on_commit(queue_job)` to prevent race conditions before database commits; caught and logged broker exceptions leaving jobs in `PENDING` state. Added idempotent handling for duplicate and already-processing tasks. Created `CeleryEagerTestCase` test helper with temporary media root and eager execution. Added 8 Celery processing tests; full 72-test suite passed on PostgreSQL. Verified real end-to-end background execution with local Redis and Celery worker (`--pool=solo`). |
| 2026-10-08 | **Phase 7 completed:** implemented REST API views `JobCreateView` (`POST /api/jobs/`) and `JobDetailView` (`GET /api/jobs/{job_id}/`) with URL routing, returning 202 Accepted on creation and 200 OK on status retrieval. Preserved standardized error envelopes (400, 404, 405, 415). Added 21 API tests; full 93-test suite passed on PostgreSQL; live manual verification passed against running Celery worker and Redis. |
| 2026-10-08 | **Phase 8 completed:** implemented certificate metadata endpoint `GET /api/certificates/{id}/` and download endpoint `GET /api/certificates/{id}/download/`. Download endpoint returns binary PDF attachment (`Content-Disposition: attachment; filename="CERT-<year>-<hex>.pdf"` and `Content-Type: application/pdf`). Added HTTP 409 handling for certificates not yet generated or failed (`certificate_not_available`), HTTP 404 error envelope for invalid/unknown UUIDs, and safe 404 handling if physical PDF file is missing without path leaks. Added 10 tests in `certificates/tests/test_retrieval.py`; full 103-test suite passed on PostgreSQL. Live end-to-end PDF download verified with real background worker. |
| 2026-10-08 | **Phase 9 completed:** implemented all recommended features (FR-014 through FR-018): `process_pending_jobs` management command and `services.recover_stale_jobs()` with `STALE_JOB_MINUTES` = 15; bulk ZIP download `GET /api/jobs/{job_id}/download/` with `services.build_job_zip()`; paginated job list `GET /api/jobs/`; paginated and filterable certificate list `GET /api/jobs/{job_id}/certificates/?status=...`; and Django admin registration for `GenerationJob` and `Certificate`. Added 14 tests; full 117-test suite passed on PostgreSQL. Live end-to-end integration verified against running Celery worker and Redis. |
| 2026-10-08 | **Phase 10 completed:** testing and verification. Walked traceability matrix across FR-001…FR-022 and NFR-001…NFR-008, added 23 focused tests ensuring 100% matrix coverage (total 140 tests). Verified test stability and zero flakiness via 3 consecutive full suite passes (~5.4s per run). Confirmed `manage.py check` (0 issues) and `makemigrations --check --dry-run` (clean). Performed live 500-recipient scale benchmark with live PostgreSQL, Redis, and Celery worker (`--pool=solo`): 500 certificates generated in 49.63s (10.07 certs/sec), average PDF size 387.5 KB, bulk ZIP download verified (152.4 MB, 16.47s), post-test cleanup verified. |
| 2026-10-08 | **Phase 11 completed:** README and documentation. Authored complete, production-ready `README.md` covering architecture, prerequisites, local setup, run commands (with Windows Celery solo pool notes), test execution, full API documentation with curl examples, design decisions (Celery vs threads/sync, transaction.on_commit, select_for_update, failure isolation, template overlay with Cormorant Garamond typography), stale-job recovery, verified 500-recipient benchmark metrics, and repository structure. Reconciled docs with current implementation. |



*(Add rows for: phase completions, deviations from the documents, new dependencies with justification.)*

---

## Known Issues

```text
None known for Phases 1–4. Git checkpoints are tracked in the repository.
```

**Known limitations (by design, to be stated in README):**
- No authentication (A-6).
- Names must be Latin script (accents OK); other scripts unsupported (A-10).
- A Celery worker killed mid-job leaves the job `PROCESSING` until the recovery command runs (FR-017, recommended). Celery alone does not guarantee business-level completion.
- If Redis is down when a job is created, the job stays `PENDING` until re-dispatched.
- Worker and Django server must share the same local `MEDIA_ROOT` (no S3).
- Local setup is heavier: PostgreSQL + Redis + two processes.
- No retries, no file cleanup/retention (A-8, A-16).
- **Template asset:** the cleaned PNG preserves the supplied design's aspect ratio and is 1468×1071 pixels. It is still not exact A4 (1.370 vs 1.414); the documented aspect-ratio page avoids distortion. A higher-resolution export from the original design tool would improve print sharpness if available.

---

## Scale Benchmark Results (Phase 10)

```text
Run date: 2026-10-08
Environment: Local Windows x64, PostgreSQL 17.11, Redis 8.10.1, Celery 5.6.3 (solo pool)
Recipients: 500 (maximum configured batch size)
Job submission latency: 0.352s (POST /api/jobs/ -> HTTP 202 Accepted)
Job processing time: 49.63s (started_at to finished_at in PostgreSQL)
Total wall-clock duration: 50.31s (submission to terminal status polling completion)
Throughput: 10.07 certificates / second (99.3 ms per certificate)
PDF sizes:
  - Minimum: 387,436 bytes (378.4 KB)
  - Maximum: 387,685 bytes (378.6 KB)
  - Average: 387,487 bytes (378.4 KB)
  - Total storage: 184.77 MB across 500 PDF files
Bulk ZIP download:
  - Archive generation & download: 16.47s
  - Total ZIP size: 152.41 MB
  - Archive contents: 500 valid PDFs with intact %PDF headers and %%EOF markers
Cleanup: Post-benchmark removal of media directory and database rows verified clean.
```


---

## Deferred Decisions

```text
- Frontend visual design deferred until a suitable template/reference is selected; design.md NOT created yet.
- Frontend itself (Phase 13) deferred until the backend is complete.
- Celery retries/acks_late, multi-worker scaling strategy, S3/object storage, PgBouncer: future/scaling only.
- Authentication/authorization approach deferred.
- Font and layout were fixed in Phase 4: Cormorant Garamond; image-aspect page at 842 pt width; date display `%d %B %Y`. Coordinates are in `template_config.py`.
- Whether to implement each Recommended feature (FR-014 … FR-018) decided in Phase 9.
```

---

## Open Questions

Defaults are already in the documents. Only update if the developer wants something different.

| ID | Question | Default in docs |
|---|---|---|
| OQ-1 | Accept-and-record invalid recipients (default) or reject the whole request? | Accept and record (A-2) |
| OQ-2 | Is `email` required? | Optional (A-5) |
| OQ-3 | Is a 500-recipient cap acceptable? | Yes, configurable (A-7) |
| OQ-4 | OK to bundle a font file in the repo? | Yes (DEC-012) |
| OQ-5 | Python / Django / PostgreSQL / Redis versions on the developer's machine? | Python 3.11+, Django current LTS, any maintained PostgreSQL/Redis; record exact versions in Phase 1 |
| OQ-6 | Use `dj-database-url` to parse `DATABASE_URL`, or hand-parse with `urllib.parse`? | `dj-database-url` (one tiny extra dependency) |
| OQ-7 | ~~Where does `organization_name` appear on the template?~~ **RESOLVED:** the green line under "PROUDLY PRESENTED BY" (currently "RECURSION") | Dynamic line (A-13) |
| OQ-8 | **RESOLVED:** the cleaned template was flattened to RGB and reduced to 256 colours (≈420 KB). A typical generated PDF is ≈388 KB. | Kept `certificate_template.png` as documented. |
| OQ-9 | Certificate number format `CERT-<year>-<12 hex>` OK, or prefer a sequential `CERT-2026-000001` (needs a PostgreSQL sequence/counter)? | UUID-derived (DEC-026) |
| OQ-10 | Provide a `docker-compose.yml` just for PostgreSQL + Redis? | No (out of scope; rules forbid Docker files unless requested) |
| OQ-11 | Body wording: is *"This certifies that {name} with Registration Number {cert no} has successfully completed {event}."* acceptable? (The sample's "1st Place … outstanding performance and dedication" sentence is dropped because we have no award/place field.) | As written (A-17) |
| OQ-12 | Bottom-left block: recipient name + issue date (default), or something else (e.g. event coordinator)? | Recipient name + issue date (A-18) |
| OQ-13 | **Default applied:** the PDF page uses the cleaned image's aspect ratio at 842 pt width. An exact-A4 export from the original design tool remains an optional future improvement. | Image-aspect page (DEC-030) |
| OQ-14 | Are the static "CERTIFICATE OF ACHIEVEMENT" heading, "WINNER" medal and "Dr. Vikash Kumar Singh – Head of Department" signature acceptable on every certificate? | Yes, as supplied (A-19) |
| OQ-15 | Cosmetic: keep or clean the faint mark near the bottom-right corner and the white box behind the SMIT logo? | Clean if easy; otherwise keep |

---

## Important Context (for every new Codex session)

1. **Read order at session start:** `prd.md` → `architecture.md` → `rules.md` → `phases.md` → this file.
2. **What we're building:** a Django + DRF backend where a client POSTs one request with event info and a list of recipients; the API saves the job in PostgreSQL, queues a Celery task after commit, a worker generates one PDF per valid recipient by overlaying dynamic text on the static Recursion template, tracks per-certificate and per-job status, and the client checks progress and downloads certificates.
3. **PostgreSQL, Celery, Redis, the template and ReportLab are OUR choices** — the assignment only requires Python, a framework, a relational database, bulk generation, validation, failure isolation, status tracking, retrieval, tests, README.
4. **The developer is a CS/Data Science student, new to Django/DRF.** Code must be simple, well commented (explaining *why*), and explainable in an interview. Explain concepts in layman's terms first.
5. **Do not over-engineer.** Only PostgreSQL + Redis + Celery. No RabbitMQ/Kafka/Kubernetes/S3/Docker/distributed locks, no retries, no template editor.
6. **Failure isolation is the headline requirement:** one bad recipient or one failed PDF must never stop other certificates. Never hide exceptions — log them and record them.
7. **Never queue before commit; never use threading; never store job state in Redis.**
8. **Do not implement** optional/recommended features before Phases 1–8 are green. Do not create `design.md` or any frontend.
9. **Do not change architecture silently.** If a change is necessary: stop, explain, get approval, update docs, log it in *Changes* above.
10. **Testing:** `python manage.py test` on PostgreSQL; Celery eager mode; temp `MEDIA_ROOT`; failures injected by patching `certificates.pdf_generator.generate_certificate_pdf`.
11. **Template:** never print sample data from the original design ("Akshat Rawat", "25th September 2023", "C Programming Workshop", "1st Place"); the committed asset must be the cleaned version (A-12); escape dynamic text in paragraphs.
12. **Assignment authority:** the original assignment text overrides these documents if they ever conflict.

---

## Milestone Update Template

```text
Phase N completed.
Phase N+1 currently in progress.

Completed:
- <what was finished>

Currently working on:
- <current phase/task>

Next:
- <next planned task>

Decisions / deviations:
- <anything new, with reason>

Test status: <command run> -> <real result>
```
