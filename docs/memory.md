# Project Memory — Bulk Certificate Generator

> **Living state document.** Answers: **WHERE ARE WE RIGHT NOW?**
> Update at **meaningful milestones** (phase started/completed, decision made, problem found) — **not** for tiny code edits.
> Source-of-truth order: assignment > `prd.md` > `architecture.md` > `rules.md` > `phases.md` > this file.

---

## Current Status

```text
Project Status: IMPLEMENTATION
Current Phase: Phase 2 COMPLETE
Current Task: Awaiting explicit instruction before Phase 3
Overall Progress: Phases 1 and 2 verified; later phases not started
Last Updated: 2026-10-08
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
- API contract unchanged (`POST /api/jobs/`, `GET /api/jobs/{id}/`, `GET /api/certificates/{id}/`, `GET /api/certificates/{id}/download/`; recommended endpoints unchanged). Only addition: `certificate_number` on certificate objects.
- Job status (`GenerationJob.status` in PostgreSQL) is authoritative; Celery task state is not the business status.

---

## Completed

- Phase 1: Django + DRF project foundation, PostgreSQL configuration, Celery wiring, local setup files, and foundation tests. Verified against PostgreSQL 17.11.
- Phase 2: `GenerationJob` and `Certificate` PostgreSQL models, schema migration, progress and certificate-number helpers, UUID-only upload path, and 11 model tests. Verified against PostgreSQL 17.11.

*(The developer explicitly requested Phase 1 implementation while Phase 0's design questions remain open. Those questions are still relevant before their dependent later phases.)*

---

## Currently Working On

- No coding phase is currently in progress. Phase 2 was completed and verified; Phase 3 requires the developer's explicit instruction.

---

## Next

- Phase 3 — serializers, validation, and error handling, only when the developer explicitly asks to proceed.

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

*(Add rows for: phase completions, deviations from the documents, new dependencies with justification.)*

---

## Known Issues

```text
None known for Phases 1–2. The source directory is not yet a Git repository; `.gitignore` is present for when version control is initialized.
```

**Known limitations (by design, to be stated in README):**
- No authentication (A-6).
- Names must be Latin script (accents OK); other scripts unsupported (A-10).
- A Celery worker killed mid-job leaves the job `PROCESSING` until the recovery command runs (FR-017, recommended). Celery alone does not guarantee business-level completion.
- If Redis is down when a job is created, the job stays `PENDING` until re-dispatched.
- Worker and Django server must share the same local `MEDIA_ROOT` (no S3).
- Local setup is heavier: PostgreSQL + Redis + two processes.
- No retries, no file cleanup/retention (A-8, A-16).
- **Template asset:** the supplied PNG still contains baked-in sample text; the committed asset must be a cleaned copy (A-12). Its low resolution (≈100 DPI at A4), different aspect ratio (1.370 vs A4 1.414) and ≈1.4 MB size per embedded copy are open items (OQ-8, OQ-13).

---

## Deferred Decisions

```text
- Frontend visual design deferred until a suitable template/reference is selected; design.md NOT created yet.
- Frontend itself (Phase 13) deferred until the backend is complete.
- Celery retries/acks_late, multi-worker scaling strategy, S3/object storage, PgBouncer: future/scaling only.
- Authentication/authorization approach deferred.
- Exact serif font (DejaVu Serif vs an OFL serif such as Noto Serif) decided in Phase 4 after viewing the template.
- Template field coordinates, A4 orientation, date display format: decided in Phase 4.
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
| OQ-8 | Template file format/size: it is an RGBA PNG ≈1.4 MB embedded in every PDF — flatten to RGB and compress/convert (e.g. JPEG), or keep as is? | Flatten/compress if PDFs are large; keep file name `certificate_template.png` unless converted |
| OQ-9 | Certificate number format `CERT-<year>-<12 hex>` OK, or prefer a sequential `CERT-2026-000001` (needs a PostgreSQL sequence/counter)? | UUID-derived (DEC-026) |
| OQ-10 | Provide a `docker-compose.yml` just for PostgreSQL + Redis? | No (out of scope; rules forbid Docker files unless requested) |
| OQ-11 | Body wording: is *"This certifies that {name} with Registration Number {cert no} has successfully completed {event}."* acceptable? (The sample's "1st Place … outstanding performance and dedication" sentence is dropped because we have no award/place field.) | As written (A-17) |
| OQ-12 | Bottom-left block: recipient name + issue date (default), or something else (e.g. event coordinator)? | Recipient name + issue date (A-18) |
| OQ-13 | Page size/resolution: image-aspect page (default) or re-export the cleaned design at exact A4 (e.g. 1754×1240) / higher DPI? | Re-export recommended; default is aspect-ratio page (DEC-030) |
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
