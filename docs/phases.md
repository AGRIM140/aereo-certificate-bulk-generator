# Implementation Phases — Bulk Certificate Generator

| | |
|---|---|
| **Version** | 1.2 (final architecture + template analysis) |
| **Date** | 2026-10-08 |
| **Answers the question** | **IN WHAT ORDER should we build the project?** |
| **Related** | `prd.md` (FR/NFR IDs), `architecture.md` (§ and DEC IDs), `rules.md`, `memory.md` (live status) |
| **Revision** | v1.1 re-plans phases for PostgreSQL, Celery + Redis and the template asset. Details of earlier phases are preserved where still valid. |
| **Template note (v1.2)** | Phase 4 now begins with preparing a cleaned template asset and covers the dynamic body paragraph. |

**How to use this file:**
- Work **one phase at a time, in order**. Do not start a phase until its dependencies are complete.
- **Tests are written inside each phase**, not left for the end (Phase 10 is the gap-filling/verification pass).
- Status values: `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`, `COMPLETE`.
- Phases 1 and 2 are complete. Phase 0's remaining design questions are tracked in `memory.md`.
- **Recommended** and **Optional** work happens only after Phase 8 passes (see Phase 9).
- Local prerequisites from Phase 1 onward: **Python, PostgreSQL, Redis** running; two processes (Django dev server, Celery worker).

---

## Phase Overview

| Phase | Name | Required? | Status |
|---|---|---|---|
| 0 | Requirements and architecture approval | Yes | NOT_STARTED |
| 1 | Django project setup + PostgreSQL configuration | Yes | COMPLETE |
| 2 | Database models + migrations | Yes | COMPLETE |
| 3 | Serializers, validation, error handling | Yes | NOT_STARTED |
| 4 | Certificate template asset + ReportLab PDF generator | Yes | NOT_STARTED |
| 5 | Service layer + job processing logic | Yes | NOT_STARTED |
| 6 | Celery + Redis integration | Yes | NOT_STARTED |
| 7 | REST API (create job, job status) | Yes | NOT_STARTED |
| 8 | Certificate metadata and download | Yes | NOT_STARTED |
| 9 | Recommended features | Recommended | NOT_STARTED |
| 10 | Testing and verification | Yes | NOT_STARTED |
| 11 | README and documentation | Yes | NOT_STARTED |
| 12 | Final review | Yes | NOT_STARTED |
| 13 | Frontend (deferred) | Later / Optional | NOT_STARTED |

---

## Phase 0 — Requirements and architecture approval

- **Objective:** Analyze the assignment, create and then update the five documentation files to the final architecture.
- **Tasks:** `prd.md`, `architecture.md`, `rules.md`, `phases.md`, `memory.md` written and synchronized; developer reviews, answers Open Questions (`memory.md`), and prepares the **cleaned template** (sample text erased, ideally re-exported at A4 ratio / higher resolution — A-12, A-20).
- **Expected output:** Five approved files in `docs/`; cleaned template image available (or Phase 4 prepares it).
- **Dependencies:** None.
- **Relevant requirements:** All (planning).
- **Completion criteria:** Developer approval; assumptions A-1…A-20 confirmed or changed; OQ-1…OQ-15 answered (especially OQ-11…OQ-14 about the template); `memory.md` updated.
- **Status:** `NOT_STARTED`

---

## Phase 1 — Django project setup + PostgreSQL configuration

- **Objective:** A running, empty Django + DRF project connected to PostgreSQL, with Celery wiring present but no tasks yet.
- **Tasks:**
  1. Create virtual environment; `requirements.txt` with pinned `Django`, `djangorestframework`, `psycopg[binary]`, `celery[redis]`, `reportlab`, `python-dotenv` (and `dj-database-url` if confirmed, OQ-6).
  2. Create project `config/` and app `certificates/`.
  3. `settings.py`: read env vars (`DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `DATABASE_URL`, `CELERY_BROKER_URL`, `MEDIA_ROOT`, `MAX_RECIPIENTS_PER_JOB`, optional `STALE_JOB_MINUTES`); PostgreSQL database; `USE_TZ`; logging; DRF settings (JSON parser/renderer, no auth, pagination placeholder).
  4. `.env.example` (placeholders only), `.gitignore`, README stub, folder structure from `architecture.md` §2.7.
  5. Root `urls.py` includes `certificates.urls` under `/api/`.
  6. Create the local PostgreSQL database/user (manually) and verify `migrate` works.
- **Expected output:** `python manage.py runserver` starts; `python manage.py check` passes; `python manage.py test` runs (zero tests OK) against a PostgreSQL test database.
- **Dependencies:** Phase 0.
- **Relevant requirements:** FR-012, NFR-010, NFR-011, DEC-019, rules §3.7.
- **Completion criteria:** Fresh clone → install → configure `.env` → migrate → runserver works; `.env` ignored by Git; no secrets committed; exact dependency versions recorded in `memory.md`.
- **Status:** `COMPLETE`

---

## Phase 2 — Database models + migrations

- **Objective:** Persist jobs and certificates exactly as designed, on PostgreSQL.
- **Tasks:**
  1. `GenerationJob` and `Certificate` models with `TextChoices` for statuses and error types (`architecture.md` §2.5), including `certificate_number`.
  2. Constraints/indexes: unique `(job, row_number)`, unique `certificate_number`, index `(job, status)`; default ordering.
  3. Helper: `get_progress()` on job (single aggregate query).
  4. `upload_to` function building `certificates/<job_id>/<certificate_id>.pdf`.
  5. Helper to build `certificate_number` (`CERT-<year>-<12 hex>`).
  6. Generate and commit migration.
  7. Model tests: progress counts, percent calc (incl. total 0), uniqueness constraints, upload path, certificate-number format.
- **Expected output:** Migrations applied; model tests green.
- **Dependencies:** Phase 1.
- **Relevant requirements:** FR-007, FR-008, FR-012, FR-021, NFR-002, DEC-007, DEC-008, DEC-026.
- **Completion criteria:** `makemigrations --check` clean; model tests pass.
- **Status:** `COMPLETE`

---

## Phase 3 — Serializers, validation, error handling

- **Objective:** Define input validation and the consistent error response shape.
- **Tasks:**
  1. Request serializer (`event_name`, `organization_name`, `issue_date`, `recipients` list-of-anything with min/max size).
  2. `RecipientSerializer` (name, optional email) for per-recipient validation.
  3. Output serializers for job (with progress and certificates) and certificate (with `certificate_number`, `error` object and `download_url`).
  4. `api_errors.py` exception handler → error envelope; register in DRF settings.
  5. Tests: every request-level rule; every recipient-level rule (blank name, too long, control characters, bad email, non-object item); error envelope shape.
- **Expected output:** Serializers + exception handler with passing unit tests.
- **Dependencies:** Phase 2.
- **Relevant requirements:** FR-002, FR-003, FR-011, DEC-005, DEC-013.
- **Completion criteria:** All validation rules in `prd.md` FR-002/FR-003 have tests.
- **Status:** `NOT_STARTED`

---

## Phase 4 — Certificate template asset + ReportLab PDF generator

- **Objective:** A pure function that overlays dynamic text on the static Recursion template and returns PDF bytes.
- **Prerequisite:** The supplied design (`Untitled_Design.png`, 1184×864 px) exists. A **cleaned version** with baked-in sample text erased is needed before generator work is finalized (A-12): either the developer re-exports it from the design tool without those text layers (preferred), or Phase 4 produces it by patching the paper texture. Decide page size/resolution at the same time (OQ-13).
- **Tasks:**
  1. Prepare/commit the cleaned asset at `certificates/assets/certificate_template.png` (erase: organization line, body paragraph, bottom-left name/date — `architecture.md` §2.12); reference it only via `template_config.py`. Flatten to RGB and compress if PDFs are large (OQ-8).
  2. Choose page size (image aspect ratio at A4-landscape width, or exact A4 if re-exported); map the dynamic elements — organization line, body paragraph, bottom-left name and date — measure and record positions, colours and font sizes in `template_config.py` (`architecture.md` §2.12).
  3. Bundle a serif Unicode TTF (regular + bold; EB Garamond / Cormorant Garamond suggested, DejaVu Serif fallback) + licence in `certificates/assets/fonts/`; register it.
  4. `generate_certificate_pdf(recipient_name, event_name, organization_name, issue_date, certificate_number) -> bytes`: draw the template as background; draw the organization line; draw the body sentence (constant wording + **escaped** dynamic values) as a ReportLab `Paragraph`; draw the bottom-left name and date.
  5. Text fitting: single-line fields shrink → wrap; the body paragraph shrinks until it fits its box; raise a clear error if the minimum size still does not fit. Tune limits so maximum-length allowed values fit (update FR-002/003 and rules §3.4 together if limits change).
  6. Check generated PDF size; resample the template if needed (OQ-8); record outcome in `memory.md`.
  7. Tests: output starts with `%PDF`; non-empty; "José Álvarez" and "André Müller" work; a name like `A & B <x>` renders without error; maximum-length name/event/organization do not raise; an impossible value raises the fit error; dynamic values (not sample values) are what gets drawn (e.g. by spying on the low-level draw/paragraph helper); no sample strings ("Akshat Rawat", "C Programming Workshop") exist in `template_config.py` or in drawn text; the function touches no DB/HTTP/Celery.
  8. Manually open sample PDFs (typical, short, maximum-length) to eyeball layout (not committed).
- **Expected output:** `pdf_generator.py`, `template_config.py`, assets, tests.
- **Dependencies:** Phase 1 (independent of models — may be done in parallel with Phases 2–3).
- **Relevant requirements:** FR-005, FR-022, NFR-004, NFR-013, A-9, A-10, A-12, A-13, DEC-003, DEC-012, DEC-025.
- **Completion criteria:** Tests pass; sample PDFs visually correct (no overlap/overflow, no sample data); font license included.
- **Status:** `NOT_STARTED`

---

## Phase 5 — Service layer + job processing logic

- **Objective:** All business logic in `services.py`, testable without HTTP or Celery.
- **Tasks:**
  1. `create_job(...)`: validate each recipient; one `atomic` block creating job + certificates (`bulk_create`, with certificate numbers); returns job. (Dispatch registration is added in Phase 6.)
  2. `process_job(job_id)`: **claim** with a short `atomic` + `select_for_update()` (exit if missing or not `PENDING`); loop `PENDING` certificates; per-certificate `try/except` wrapping generate + save; failure recording; cleanup partial files; outer handler for job-level crash; `finalize_job`.
  3. Logging for job/certificate lifecycle and failures.
  4. Tests (service level, temp media): all-success → `COMPLETED`; mixed → `COMPLETED_WITH_ERRORS`; all-fail → `FAILED`; forced single failure via `patch`; invalid recipients recorded; second `process_job` on the same job is a no-op; job already `PROCESSING`/finished is skipped; row-count invariant; files stored under UUID-only paths.
- **Expected output:** Working services with thorough tests.
- **Dependencies:** Phases 2, 3 (recipient serializer), 4.
- **Relevant requirements:** FR-003…FR-008, FR-013, FR-020, FR-021, NFR-001, NFR-002, NFR-004, NFR-007, NFR-012, DEC-005, DEC-010, DEC-015, DEC-023.
- **Completion criteria:** Failure-isolation test passes; counts always consistent; duplicate-processing tests pass.
- **Status:** `NOT_STARTED`

---

## Phase 6 — Celery + Redis integration

- **Objective:** Run `process_job` in a Celery worker, queued only after commit.
- **Tasks:**
  1. `config/celery.py`, `config/__init__.py` import, `CELERY_*` settings (broker from env, JSON only, ignore results, no retries).
  2. `tasks.py`: `process_job_task(job_id)` — thin wrapper calling `services.process_job` (receives the job UUID string only).
  3. `services.dispatch_job(job_id)`: `transaction.on_commit` → `process_job_task.delay(str(job_id))`, with try/except + logging so a broker failure leaves the job `PENDING`. Call it from `create_job` inside the atomic block.
  4. Shared test base class: Celery eager mode, temp media (verify the mechanism with the pinned versions; document in `memory.md`).
  5. Tests (`test_celery_processing.py`): `.delay` not called before commit, called once after with `str(job.id)`; eager run updates PostgreSQL state and files; broker failure leaves job `PENDING`; duplicate task run is a no-op.
  6. Manual check with real Redis + worker: create a job, watch the worker log and status change (note Windows `--pool=solo` if needed).
- **Expected output:** Working Celery pipeline; tests green without Redis/worker.
- **Dependencies:** Phase 5.
- **Relevant requirements:** FR-004, FR-019, FR-020, NFR-004, NFR-012, DEC-020, DEC-021, DEC-022, DEC-024, DEC-027, DEC-028.
- **Completion criteria:** Manual end-to-end worker run succeeds; deterministic tests pass; no `threading` anywhere.
- **Status:** `NOT_STARTED`

---

## Phase 7 — REST API (create job, job status)

- **Objective:** Expose creation and status over HTTP.
- **Tasks:**
  1. `POST /api/jobs/` view: serializer → `create_job` → `202` with job JSON + `status_url` (never waits for PDFs).
  2. `GET /api/jobs/{job_id}/` view: job + certificates (fixed small number of queries) + progress.
  3. URL config with `<uuid:job_id>`.
  4. API tests with `APIClient` (eager Celery; use `captureOnCommitCallbacks(execute=True)` where needed): valid creation; each `400` case creates no job and queues nothing; mixed valid/invalid recipients; job detail progress/results; `404` unknown and malformed ID; `405`/`415` shape.
- **Expected output:** Endpoints 1 and 2 working end-to-end.
- **Dependencies:** Phases 3, 6.
- **Relevant requirements:** FR-001, FR-002, FR-004, FR-009, FR-011, AC-001…AC-003, AC-007.
- **Completion criteria:** Manual `curl` run with a real worker shows status moving PENDING → PROCESSING → terminal; tests green.
- **Status:** `NOT_STARTED`

---

## Phase 8 — Certificate metadata and download

- **Objective:** Let clients get certificate metadata and PDFs.
- **Tasks:**
  1. `GET /api/certificates/{id}/` (metadata, incl. `certificate_number`).
  2. `GET /api/certificates/{id}/download/` → `FileResponse` (PDF, attachment; filename from certificate number/UUID); `409` if not `GENERATED`; `404` if unknown or file missing (log error, no path leak).
  3. Tests: successful download (content type + `%PDF`); `404`; `409` for FAILED and PENDING; missing-file case.
- **Expected output:** Endpoints 3 and 4 working.
- **Dependencies:** Phase 7.
- **Relevant requirements:** FR-010, FR-011, FR-013, FR-021, AC-008…AC-010, AC-014.
- **Completion criteria:** Real end-to-end manual run: create job → poll → download PDF and open it (check the certificate number and dynamic text on the template).
- **Status:** `NOT_STARTED`

> **Required scope is functionally complete after Phase 8.**

---

## Phase 9 — Recommended features (only if Phases 1–8 are green)

- **Objective:** Add the small, high-value improvements, one at a time.
- **Tasks (any subset, in this order of value):**
  1. FR-017 `process_pending_jobs` management command (stale `PENDING`/`PROCESSING` jobs; reset under `select_for_update()` then dispatch via on-commit; README note on worker crashes).
  2. FR-016 ZIP download of a job's generated certificates.
  3. FR-015 job certificate list with `?status=` filter and pagination; FR-014 job list.
  4. FR-018 Django admin registration.
  Each item gets tests.
- **Expected output:** Selected extras with tests; none break required behavior.
- **Dependencies:** Phase 8.
- **Relevant requirements:** FR-014…FR-018.
- **Completion criteria:** Required test suite still fully green; each extra documented in README.
- **Status:** `NOT_STARTED`

---

## Phase 10 — Testing and verification

- **Objective:** Prove every requirement is covered; remove gaps.
- **Tasks:**
  1. Walk the traceability matrix below; add any missing tests.
  2. Run full suite: `python manage.py test`; check for flakiness (run 3×).
  3. Optional: `coverage` report; review uncovered lines in `services.py`, `tasks.py` and `pdf_generator.py`.
  4. Verify `makemigrations --check`.
  5. Manual run of a 500-recipient job with a real worker; note timing and PDF sizes in `memory.md`.
- **Expected output:** Green, stable suite covering the six assignment areas plus Celery behavior.
- **Dependencies:** Phase 8 (and 9 if done).
- **Relevant requirements:** All FR/NFR; `rules.md` §3.8.
- **Completion criteria:** Traceability matrix fully ticked; suite passes repeatedly.
- **Status:** `NOT_STARTED`

---

## Phase 11 — README and documentation

- **Objective:** A README a stranger can follow, plus accurate docs.
- **README must contain (assignment-required topics plus our setup needs):**
  1. Project overview (short) and architecture diagram.
  2. **Prerequisites and setup:** Python, **PostgreSQL** (create database/user), **Redis**; venv; `pip install -r requirements.txt`; copy `.env.example`; `migrate`.
  3. **Run:** Terminal 1 `python manage.py runserver`; Terminal 2 `celery -A config worker --loglevel=info` (PostgreSQL and Redis running; Windows note if relevant).
  4. **Run tests:** `python manage.py test` (needs PostgreSQL, not Redis/worker).
  5. **Submit a request:** copy-pasteable `curl` example (`architecture.md` §2.8).
  6. **Check progress** and **retrieve certificates:** `curl` examples (single PDF; ZIP if implemented).
  7. **Design decisions:** Django + DRF; PostgreSQL; Celery + Redis (with reasoning, why not sync/threads — **required**); `transaction.on_commit`; `select_for_update()` claim; failure isolation; status model (Celery state ≠ job status); static template + ReportLab overlay (include the interview explanation from `architecture.md` §2.12); certificate number vs UUID; what I'd do at scale.
  8. **Limitations / assumptions:** no auth, 500 recipient cap, Latin-only names, worker/server share local media, killed worker leaves a job `PROCESSING` until recovery, Redis down leaves new jobs `PENDING`.
- **Also:** Reconcile `architecture.md`/`prd.md` with what was actually built; update `memory.md`.
- **Dependencies:** Phase 10.
- **Relevant requirements:** D-003, D-004.
- **Completion criteria:** Following the README on a clean machine works end-to-end.
- **Status:** `NOT_STARTED`

---

## Phase 12 — Final review

- **Objective:** Readiness for submission and interview.
- **Tasks:**
  1. Checklist pass against `prd.md` §1.8 and §1.15.
  2. Security check against `rules.md` §3.7 (no secrets, `.gitignore`, `DEBUG` default).
  3. Fresh-clone test following only the README.
  4. Code read-through: remove dead code; no `threading`; no SQLite remnants; comments explain *why*.
  5. **Interview preparation:** walk through the code using `architecture.md` §2.15; practice one or two changed-requirement drills (e.g. make email required; add a new certificate field and its position on the template).
- **Dependencies:** Phase 11.
- **Completion criteria:** All Definition-of-Done items (§4.2) satisfied; developer confident explaining every file.
- **Status:** `NOT_STARTED`

---

## Phase 13 — Frontend (DEFERRED)

- **Objective:** Optional UI over the finished API.
- **Status:** `NOT_STARTED` — **deferred**, see §4.3. Do not begin until the backend is complete (Phase 12) and the developer provides a design reference.
- **Dependencies:** Phase 12 and the later design stage.

---

## 4.1 Dependency Graph

```text
Phase 0  (docs approved, template image supplied)
   ↓
Phase 1  (Django + PostgreSQL setup)
   ├──────────────┬──────────────┐
   ↓              ↓              ↓
Phase 2        Phase 4        (Phase 3 needs Phase 2)
(models)    (template + PDF)
   ↓              │
Phase 3           │
(serializers)     │
   └──────┬───────┘
          ↓
      Phase 5  (services: create + claim + process)
          ↓
      Phase 6  (Celery + Redis, on_commit dispatch)
          ↓
      Phase 7  (REST API: create job, job status)
          ↓
      Phase 8  (certificate metadata + download)   ← required scope complete
          ↓
      Phase 9  (recommended extras, optional subset)
          ↓
      Phase 10 (testing and verification)
          ↓
      Phase 11 (README & docs)
          ↓
      Phase 12 (final review)
          ↓
      Phase 13 (frontend — deferred)
```

Parallelizable: Phase 4 can proceed alongside Phases 2–3 (it depends only on Phase 1).

---

## 4.2 Definition of Done (backend)

The backend is complete when **all** are true:

- [ ] FR-001 … FR-013 and FR-019 … FR-022 implemented and each has at least one passing test.
- [ ] `python manage.py test` passes (and passes repeatedly — no flaky tests) without Redis or a worker running.
- [ ] The six required test areas are covered (job creation, validation, generation, status/progress, individual failure, retrieval) plus the Celery behaviors in `rules.md` §3.8.
- [ ] A forced failure for one recipient leaves all others `GENERATED`; job is `COMPLETED_WITH_ERRORS`.
- [ ] Invalid recipients are recorded as `FAILED/VALIDATION`, with messages and row numbers.
- [ ] The Celery task is queued only after commit, carries only the job UUID, and a second processing of the same job is a no-op.
- [ ] Manual end-to-end run with real PostgreSQL + Redis + worker: create → poll → download works; the PDF shows the real recipient data and certificate number on the template (no sample data).
- [ ] Migrations committed; `makemigrations --check` clean.
- [ ] No secrets in Git; `.env` and `media/` ignored.
- [ ] No stack traces or file paths in any API response.
- [ ] No `threading`-based processing and no SQLite configuration remains.
- [ ] README complete (all required topics + processing-choice reasoning + template explanation).
- [ ] `memory.md` accurate and up to date; any deviations from these docs recorded.
- [ ] The developer can explain every file and demonstrate one requirement change.

---

## 4.3 Design Phase (DEFERRED)

The detailed frontend design is **DEFERRED**. No design system, colors, typography, component library, animation, or 3D decisions are made at this stage, and `design.md` has **not** been created. (This is separate from the *certificate template*, which is already decided: the supplied Recursion design.)

> The frontend visual direction will be determined after selecting an appropriate design/template reference. Once the developer selects a template, `design.md` will be created based on that reference and adapted to the certificate-generator product.

At that stage the developer will provide: the template/reference (screenshots or URL), preferred visual elements, animation preferences, colors, typography preferences, pages/components wanted, and anything to change or remove. `design.md` will then document visual direction, color system, typography, spacing, components, layout, animations, 3D elements, responsive behavior, accessibility, screens, and interaction/loading/error/success states. Target feeling: **modern, premium, innovative, professional**, with tasteful 3D/animation — usable and accessible above all.

---

## 4.4 Requirement Traceability Matrix

`FR → architecture.md section → phase → planned test(s)` (test file names are fixed by `architecture.md` §2.7; test method names are guidance).

| Requirement | Architecture reference | Phase | Planned tests |
|---|---|---|---|
| **FR-001** Accept bulk request | §2.2A, §2.8 (1) | 7 | `test_job_creation.py`: `test_valid_request_returns_202_with_job_id`, `test_job_and_certificate_rows_created` |
| **FR-002** Request-level validation | §2.6, §2.8 (1), §2.9 | 3, 7 | `test_validation.py`: `test_missing_event_name_returns_400_and_creates_no_job`, `test_empty_recipients_rejected`, `test_too_many_recipients_rejected`, `test_invalid_issue_date_rejected`, `test_non_json_body_rejected` |
| **FR-003** Per-recipient validation | §2.6 (input validation) | 3, 5 | `test_validation.py`: `test_blank_name_recorded_as_failed_validation`, `test_invalid_email_recorded`, `test_non_object_recipient_recorded`, `test_control_characters_in_name_rejected`, `test_valid_recipients_still_generated_when_some_invalid`, `test_row_count_equals_submitted_recipients` |
| **FR-004** Atomic creation, 202, queue after commit | §2.2A step 5–8, §2.6 | 5, 6, 7 | `test_job_creation.py`: `test_creation_is_atomic_on_failure`, `test_response_contains_status_url`, `test_response_does_not_wait_for_generation` |
| **FR-005** Generate PDF per valid recipient | §2.6, §2.12 | 4, 5 | `test_pdf_generation.py`: `test_pdf_bytes_start_with_pdf_header`, `test_accented_names_supported`, `test_max_length_values_do_not_overflow`; `test_process_job_creates_files_for_valid_recipients` |
| **FR-006** Failure isolation | §2.6, §2.9 | 5 | `test_failure_handling.py`: `test_failed_certificate_does_not_stop_other_certificates`, `test_failure_marks_only_that_certificate`, `test_save_error_handled_like_generation_error`, `test_traceback_not_exposed_in_api` |
| **FR-007** Per-certificate status | §2.5 | 2, 5 | `test_job_status.py`: `test_certificate_status_and_error_fields`; model tests |
| **FR-008** Job lifecycle status | §2.5 (status diagram), §2.6 | 2, 5 | `test_job_status.py`: `test_all_success_is_completed`, `test_mixed_is_completed_with_errors`, `test_all_failed_is_failed`, `test_timestamps_set` |
| **FR-009** Job status endpoint | §2.8 (2) | 7 | `test_job_status.py`: `test_job_detail_shows_progress_counts`, `test_job_detail_lists_failures_with_errors`, `test_unknown_job_returns_404`, `test_malformed_job_id_returns_404`, `test_job_detail_query_count_is_small`, `test_api_reports_job_status_not_celery_state` |
| **FR-010** Retrieve certificate | §2.6, §2.8 (3, 4) | 8 | `test_retrieval.py`: `test_download_returns_pdf`, `test_certificate_metadata`, `test_unknown_certificate_404` |
| **FR-011** Consistent errors | §2.8, §2.9 | 3, 7, 8 | `test_validation.py`/`test_retrieval.py`: `test_error_envelope_shape`, `test_download_pending_or_failed_returns_409`, `test_missing_file_returns_404_without_path_leak` |
| **FR-012** PostgreSQL persistence | §2.3, §2.5 | 1, 2 | model tests; migration check |
| **FR-013** Safe storage & serving | §2.6, §2.12, rules §3.7 | 4, 5, 8 | `test_pdf_generation.py`/`test_retrieval.py`: `test_storage_path_uses_only_uuids`, `test_malicious_name_does_not_affect_path` |
| **FR-019** Celery dispatch after commit, UUID only | §2.2A step 6, §2.10 | 6 | `test_celery_processing.py`: `test_task_not_queued_before_commit`, `test_task_queued_once_after_commit_with_job_uuid`, `test_eager_task_processes_job`, `test_broker_failure_leaves_job_pending_and_returns_202`, `test_rolled_back_creation_queues_nothing` |
| **FR-020** No duplicate processing | §2.6 (claim), §2.10 | 5, 6 | `test_celery_processing.py`: `test_second_process_job_call_is_noop`, `test_processing_job_is_skipped`, `test_finished_job_is_skipped`, `test_missing_job_is_logged_and_ignored` |
| **FR-021** Certificate number | §2.5, §2.12 | 2, 8 | model tests: `test_certificate_number_format_and_unique`; `test_retrieval.py`: `test_certificate_number_in_api_response` |
| **FR-022** Template overlay (organization line, body paragraph, bottom-left block) | §2.12 | 4 | `test_pdf_generation.py`: `test_dynamic_values_are_drawn_not_sample_values`, `test_special_characters_are_escaped`, `test_long_name_shrinks_or_wraps`, `test_text_that_cannot_fit_raises_clear_error`; manual visual check against the design |
| **FR-014** Job list *(rec.)* | §2.8 (5) | 9 | `test_job_status.py`: `test_job_list_paginated_newest_first` |
| **FR-015** Certificate list + filter *(rec.)* | §2.8 (6) | 9 | `test_retrieval.py`: `test_filter_by_status`, `test_invalid_status_filter_400` |
| **FR-016** ZIP download *(rec.)* | §2.6, §2.8 (7) | 9 | `test_retrieval.py`: `test_zip_contains_only_generated`, `test_zip_409_when_none_generated` |
| **FR-017** Recovery command *(rec.)* | §2.9, §2.10 | 9 | `test_management_command.py`: `test_command_redispatches_stale_pending_job`, `test_command_resets_stale_processing_job`, `test_command_ignores_recent_jobs` |
| **FR-018** Admin *(rec.)* | §2.1 | 9 | manual check |
| **NFR-001** Reliability | §2.9 | 5 | failure-handling tests |
| **NFR-002** Integrity | §2.5, §2.6 | 2, 5 | atomic creation + counts tests |
| **NFR-003/009** Maintainability / simplicity | §2.1, rules §3.1–3.2 | all | code review (Phase 12) |
| **NFR-004** Testability | §2.14 | 4, 5, 6 | eager mode + patchable generator |
| **NFR-005** Performance | §2.10 | 10 | manual: 500-recipient run timing noted in `memory.md` |
| **NFR-006** Validation/security | rules §3.7 | 3, 8 | validation + path tests |
| **NFR-007** Observability | §2.14 | 5, 6 | optional `assertLogs` tests |
| **NFR-008** API usability | §2.8 | 3, 7 | envelope tests |
| **NFR-010/011** Portability / config | §2.13 | 1 | fresh-clone check (Phase 12) |
| **NFR-012** Concurrency safety | §2.6, §2.10 | 5, 6 | see FR-020 tests |
| **NFR-013** Template fidelity | §2.12 | 4 | see FR-022 tests + manual visual check |
