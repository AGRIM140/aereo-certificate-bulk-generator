# Engineering Rules — Bulk Certificate Generator

| | |
|---|---|
| **Version** | 1.2 (final architecture + template analysis) |
| **Date** | 2026-10-08 |
| **Answers the question** | **WHAT RULES must the implementation follow?** |
| **Audience** | Codex (primary), the developer (must be able to explain every rule's reason) |
| **Related** | `prd.md` (requirements), `architecture.md` (design & decisions DEC-xxx), `phases.md`, `memory.md` |
| **Revision** | v1.1 replaces the SQLite/threading rules with PostgreSQL + Celery + Redis rules and adds template rules. Preserved: all other engineering, security, testing and code-quality rules. |
| **Template note (v1.2)** | Added rules for escaping dynamic text, the cleaned template asset, and the dynamic body sentence. |

**Keyword meaning:** **MUST / MUST NOT** = mandatory. **SHOULD** = default unless there is a written reason. **MAY** = allowed, not required.

---

## 3.0 Final Architecture Mandates (read first)

### MUST
1. **Use PostgreSQL** as the application database, accessed through the **Django ORM**.
2. **Use Celery** for background certificate processing and **Redis** as the Celery broker.
3. **Queue tasks only after the transaction commits** (`transaction.on_commit`).
4. **Keep application state in PostgreSQL** (`GenerationJob`, `Certificate`). `GenerationJob.status` is the authoritative job status; Celery task state is not.
5. **Keep views thin and business logic in services**; keep the Celery task a thin wrapper.
6. **Isolate PDF generation** (pure function; no DB/HTTP/serializers/Celery).
7. **Isolate certificate failures** (per-certificate `try/except`; one failure never stops the rest).
8. **Prevent duplicate concurrent processing of a job** (short transaction + `select_for_update()` claim).
9. **Keep tests deterministic** (PostgreSQL test DB, Celery eager mode, temp media, no sleeps, no real Redis/worker).
10. **Use the single supplied template asset** as a static background and overlay dynamic text; never hard-code sample data from the design.

### MUST NOT
1. Use **SQLite** as the selected application database (or for tests).
2. Use Python **`threading`** as the primary (or any) certificate-processing mechanism.
3. Store application job state in **Redis** (no Celery result backend either).
4. **Queue Celery tasks before the transaction commits**, or call `.delay()` anywhere except through `dispatch_job`'s on-commit callback.
5. **Expose stack traces** (or file paths, SQL, settings) in API responses.
6. **Derive file paths from user input.**
7. Introduce **unnecessary infrastructure** (no RabbitMQ, Kafka, Kubernetes, microservices, S3, distributed locks, complex monitoring).
8. **Over-engineer** the solution.
9. Allow clients to upload templates, choose templates, or edit templates.

---

## 3.1 General Engineering Rules

1. **Readability first.** Prefer clear, boring code over clever code. The developer must be able to explain every line in an interview.
2. **Follow Django and DRF conventions** (project layout, naming, `settings`, migrations, serializers, `APIView`/generic views).
3. **Prefer simple solutions.** If two approaches work, choose the one that is easier to explain.
4. **Meaningful names.** `process_job`, `recipient_name`, `GenerationJob` — not `proc`, `data2`, `x`.
5. **Small functions** with one job each. If a function needs "and" to describe it, consider splitting it.
6. **No unnecessary abstractions.** No base classes, factories, plugin systems, registries, or design patterns unless they remove real duplication *now*.
7. **Don't duplicate logic.** Status rules, validation rules, and path-building live in exactly one place.
8. **Comments explain *why*, not *what*.** Add short docstrings to every service function, model, and view stating its purpose and any non-obvious decision. Use plain language.
9. **PEP 8 style.** Type hints are encouraged on service/generator functions. A formatter/linter is optional (if used, `ruff` as a dev-only tool, not required).
10. **No dead code, no commented-out code, no `print()` debugging.** Use `logging`.
11. **No premature optimization.** Optimize only where documented (e.g. avoiding N+1 queries).
12. **Use timezone-aware datetimes** (`USE_TZ = True`, `django.utils.timezone.now()`).

---

## 3.2 Architecture Rules

1. **Views MUST be thin.** A view parses/validates input (via serializers), calls a service function, and returns a response. No loops over recipients, no PDF code, no status rules in views.
2. **Business logic lives in `certificates/services.py`.** Services MUST NOT import HTTP request/response objects.
3. **PDF drawing lives only in `certificates/pdf_generator.py`** and MUST be a pure function from certificate data to PDF **bytes**. It MUST NOT access the database, HTTP requests/responses, serializers, Celery, or write/save files. Reading the fixed, bundled template/font assets from disk is allowed. It MUST NOT access runtime-generated, user-controlled, or arbitrary filesystem paths.
4. **Saving files is the service's job**, not the generator's.
5. **`process_job` MUST call the generator through the module** (`pdf_generator.generate_certificate_pdf(...)`, with `from . import pdf_generator`) — **not** `from .pdf_generator import generate_certificate_pdf` — so tests can patch it in one place.
6. **How processing is triggered lives only in `dispatch_job`** (which registers `transaction.on_commit` → `process_job_task.delay(str(job_id))`). `process_job` MUST NOT know about Celery; `tasks.py` MUST stay a thin wrapper that only receives a job UUID string and calls `services.process_job`. Avoid a circular import between `services.py` and `tasks.py` (e.g. import the task inside `dispatch_job`).
7. **All API error formatting goes through `api_errors.py`** (DEC-013). Views MUST NOT hand-craft error JSON in several different styles.
8. **No frontend concerns in the backend.** No HTML templates for the product, no CORS/session hacks "for a future UI" (can be added in Phase 13).
9. **No cross-component coupling shortcuts:** serializers don't call the generator; the generator doesn't know about models; models don't import services.
10. **One Django app (`certificates`)** is enough. Do not split into multiple apps.
11. **Explicit URLs** (DEC-017). No ViewSets/routers unless the developer approves.
12. **Settings-driven behavior:** limits and processing mode come from settings (read from environment), never from magic numbers scattered in code.
13. **Template layout lives in `template_config.py`.** Coordinates, font sizes, page size and the template path are configuration, not scattered literals in drawing code. The template image path is never embedded in business logic.
14. **Celery task payloads are tiny:** the job UUID string only. No recipient lists, no model instances, no files.
15. **Celery state is not business state.** API responses and tests use `GenerationJob.status` / `Certificate.status` only.
16. **No retry framework:** no retry endpoints, queues, or automatic business retries (see 3.10).
17. **The committed template asset must be the cleaned version** (baked-in sample text erased — `architecture.md` §2.12). Do not draw dynamic text over visible sample text, and never print sample values ("Akshat Rawat", "25th September 2023", "C Programming Workshop", "1st Place") anywhere.
18. **The body sentence wording is a constant in `template_config.py`**, not scattered across drawing code.

---

## 3.3 Library Rules

### Approved (may be added without asking)

| Library | Why |
|---|---|
| `Django` (current LTS; pin exact version) | Framework |
| `djangorestframework` | REST API |
| `psycopg[binary]` (psycopg 3, matching the Django version) | PostgreSQL driver |
| `celery[redis]` | Background tasks + Redis support |
| `reportlab` | PDF generation (its dependency Pillow is installed automatically — do **not** add Pillow as a direct dependency) |
| `python-dotenv` | Load `.env` |
| `dj-database-url` | Parse `DATABASE_URL` (pending developer confirmation, `memory.md` OQ-6; alternative: ~10 lines with `urllib.parse`) |
| Standard library: `uuid`, `logging`, `zipfile`, `io`, `pathlib`, `unittest.mock`, `tempfile`, `datetime`, `re` | Everything else we need |

Bundled **assets** (not libraries): the certificate template image and the serif TTF font (+ license).

### Additional libraries
A new dependency MUST have: (1) a written reason in `memory.md` → *Decisions Made*, (2) confirmation that Django/DRF/Celery/stdlib cannot do the job reasonably, (3) developer approval for anything beyond a dev-only tool.

**Pre-approved dev-only optional tools:** `coverage` (test coverage report), `ruff` (lint/format).
**Pre-approved optional feature library:** `drf-spectacular` (only for OPT-003, only after required work).

### Avoid (MUST NOT add without explicit developer approval)
Other brokers/queues and their libraries (`rabbitmq`/`pika`, `kafka-python`, `rq`, `dramatiq`, `django-q`, `huey`); `django-celery-results` (we use no result backend); `django-celery-beat`, `flower` (future ideas only); `eventlet`/`gevent`; `pytest*` (we use Django's runner — DEC-011); `django-environ` (we use `python-dotenv`); `django-filter` (a manual `status` filter is ~5 lines); `Pillow` as a direct dependency; `pandas`; `boto3`/`django-storages` (no S3); `drf-yasg`; any PDF library besides ReportLab (no `pypdf`, WeasyPrint, etc.); ORMs other than Django's; async frameworks; Docker/Kubernetes files unless the developer explicitly asks.

---

## 3.4 Validation Rules

1. **Validate at the boundary.** All client input is validated before any state change.
2. **Two levels (DEC-005):**
   - *Request-level failures* → `400`, nothing saved (rules in `prd.md` FR-002).
   - *Recipient-level failures* → saved as `FAILED/VALIDATION` rows; valid recipients continue (FR-003).
3. **Do not silently accept or "fix" invalid data.** The only allowed normalization is trimming leading/trailing whitespace. No guessing names, no dropping bad rows without recording them.
4. **Every submitted recipient MUST end up with exactly one certificate row** (valid → `PENDING`, invalid → `FAILED`). Row count == number of submitted recipients. This is a testable invariant.
5. **Error messages MUST be specific and human-readable** (e.g. `name: This field may not be blank.`) and identify the affected recipient by `row_number`.
6. **Limits** (from settings/constants, not scattered literals): `event_name` ≤150, `organization_name` ≤100, `name` ≤100, `email` ≤254 and valid format, recipients 1…`MAX_RECIPIENTS_PER_JOB`.
7. **Reject control characters** (including newlines/NUL) in `name`. They break layout and are risky in file names/logs.
8. **Use DRF serializers** for validation (including per-recipient validation via a `RecipientSerializer` run by the service). Don't hand-roll regex email validation.
9. **Never let a non-dict recipient crash validation.** Strings, numbers, `null`, lists as recipients are recorded as invalid rows.
10. **Unknown extra keys are ignored** (not stored, not echoed).
11. **`issue_date` defaults to today** if omitted; if present it MUST be a valid ISO date.
12. **Escape dynamic text drawn through ReportLab paragraphs** (`xml.sax.saxutils.escape`): values such as `A & B` or `<b>` must render literally and must never break or alter the PDF. Never build paragraph markup by concatenating unescaped user input.

---

## 3.5 Error Handling Rules

1. **Never silently swallow exceptions.** Every `except` block MUST either re-raise, or log with `logger.exception(...)` *and* record the failure in the database where applicable.
2. **No bare `except:`.** Use `except Exception` only at deliberate isolation boundaries (the per-certificate loop and the outermost job handler). Elsewhere catch specific exceptions.
3. **Failure isolation (FR-006):** the per-certificate `try/except` MUST wrap *both* PDF generation and file saving. One certificate's failure MUST NOT end the loop.
4. **Record, don't hide:** failed certificates get `status=FAILED`, `error_type`, and a **safe** `error_message`.
5. **API/client-facing messages MUST NOT contain:** stack traces, file-system paths, SQL, settings values, or secrets. Developers see details in logs.
6. **Errors identify the recipient** via `row_number` (and name/email when available).
7. **Use proper status codes** exactly as in `architecture.md` §2.8: 400, 404, 409 (and framework-generated 405/415).
8. **Jobs MUST reach a terminal status.** The outer handler in `process_job` sets `FAILED` on unexpected crashes. Use `finally`/explicit finalize so a job is never left `PROCESSING` by a *caught* error.
9. **Clean up partial files** for a failed certificate.
10. **Tests MUST NOT be made to pass by catching/hiding exceptions** in production code.
11. **`DEBUG` MUST be `False` by default** so tracebacks are not exposed.
12. **Celery task failures are not business failures.** An unexpected exception inside `process_job` MUST be handled by its outer handler (job `FAILED`, safe message, logged) rather than relying on Celery to report it; the API never exposes Celery task states or tracebacks.
13. **Queue failure handling:** if queueing the Celery task fails after the commit, log it and leave the job `PENDING` (recoverable); do not roll back or delete the saved job, and do not return a `5xx` for the already-committed job.

---

## 3.6 Database Rules

1. **PostgreSQL only.** Configure the database from `DATABASE_URL`. SQLite MUST NOT be the application database or the test database (it has no row-level locking, so `select_for_update()` would not be exercised).
2. **Migrations:** every model change comes with a generated migration, committed to Git. Never edit applied migrations; add new ones. `makemigrations --check` MUST be clean before declaring a phase done.
3. **Transactions:** job creation (job + all certificate rows) MUST be in one `transaction.atomic()` block. Per-certificate updates during processing are separate small transactions. Do NOT wrap the entire processing loop in one transaction (it would hide progress and hold locks for a long time).
4. **Dispatch after commit:** the Celery task is queued only through `transaction.on_commit(...)`, registered inside the creation transaction. Never call `.delay()` before the commit, and never from anywhere except `dispatch_job`'s callback.
5. **Claim the job under a row lock:** in a short `transaction.atomic()` block, load the job with `select_for_update()`; if it does not exist or its status is not `PENDING`, return without changes; otherwise set `PROCESSING` and `started_at`. Do NOT hold the lock while generating PDFs.
6. **Data integrity:** keep `UniqueConstraint(job, row_number)`, the unique `certificate_number`, and the `(job, status)` index. Use `on_delete=CASCADE` for certificates.
7. **Avoid N+1 queries:** job detail uses one query for the job and one for its certificates; list endpoints use annotation/aggregation, not per-row queries. Add a test asserting a small, fixed query count for the job detail endpoint (`assertNumQueries`) if practical.
8. **Use `bulk_create`** for the initial certificate rows. Use `.iterator()` when looping over certificates for processing.
9. **Progress counts are always computed** from certificate rows (DEC-008). Do not add counter fields.
10. **Application state lives only in PostgreSQL.** Redis is a broker only; configure no Celery result backend and store nothing about jobs in Redis.
11. **No destructive operations without explicit intent:** no `flush`, no deleting the database/media folder, no dropping tables, no `--fake` migrations, no bulk deletes in code — unless the developer explicitly asks.
12. **Connections:** let Django/Celery manage database connections. No manual long-lived connections, no connection sharing across processes.
13. **Use `select_related`/`prefetch_related` only when it measurably removes extra queries** — don't sprinkle them.

---

## 3.7 Security Rules

1. **No hard-coded secrets.** `SECRET_KEY` and other sensitive configuration come from environment variables. An insecure development placeholder is allowed only when `DJANGO_DEBUG=true`; otherwise startup MUST fail clearly if the key is missing.
2. **`.env` MUST be in `.gitignore`.** Commit `.env.example` (no real values). Also git-ignore `media/`, virtual environments, `__pycache__/`.
3. **File paths:** build storage paths only from server-generated UUIDs (`certificates/<job_id>/<certificate_id>.pdf`). **Never** use any user-supplied text (names, emails, event name) in a file path, file name, or `Content-Disposition` header.
4. **Serve files only through API views**; do not expose `MEDIA_URL` publicly. Open files via Django's storage API (`FieldFile`) and return `FileResponse`, never concatenating user input into paths.
5. **Do not expose stack traces** or internal details in responses (`DEBUG=False` default; custom error envelope).
6. **Validate all user-controlled input** (3.4), including query parameters like `?status=` (invalid values → `400`).
7. **Limit request size via business rules** (max recipients; max string lengths). SHOULD also verify/document the request-body size limit that actually applies to JSON bodies.
8. **UUID path converters** (`<uuid:...>`) so malformed IDs return `404` before touching the database.
9. **Log hygiene:** don't log secrets; avoid logging full recipient lists.
10. **`ALLOWED_HOSTS`** from environment; sensible default for local use.
11. **Authentication is out of scope** (A-6). Do not invent partial auth; document it as a limitation in the README.
12. **Dependency hygiene:** pin versions in `requirements.txt`.
13. **Connection strings are secrets.** `DATABASE_URL` and `CELERY_BROKER_URL` come only from the environment; `.env.example` contains placeholders, never real credentials. Do not log them.
14. **Celery serialization:** JSON only (no pickle). Redis MUST NOT be exposed beyond the local machine/network by our setup instructions.
15. **Template and font assets are fixed files** loaded from known paths in `template_config.py`; no user input ever selects or builds an asset path.

---

## 3.8 Testing Rules

1. **Tests are mandatory** and are written **alongside** each phase, not saved for the end.
2. **Runner:** `python manage.py test` MUST run the whole suite and pass. It requires a running **PostgreSQL**; it MUST NOT require a running Redis server or Celery worker.
3. **Minimum coverage of behavior (from the assignment):**

| Area | Must verify |
|---|---|
| Job creation | `202`, job + one certificate row per recipient, status URL |
| Input validation | Each request-level failure → `400` & no job; each recipient-level failure → `FAILED/VALIDATION` row & valid ones still generated |
| Certificate generation | File created, bytes start with `%PDF`, certificate `GENERATED`, accented and max-length names OK |
| Job status/progress | Counts, percent, status transitions (`COMPLETED`, `COMPLETED_WITH_ERRORS`, `FAILED`), `404` for unknown/malformed IDs |
| Individual failure | Forced failure for one recipient → only that one `FAILED/GENERATION`; others `GENERATED`; job `COMPLETED_WITH_ERRORS`; no traceback in API output |
| Certificate retrieval | PDF download `200` + content type; `404` unknown; `409` not generated |

4. **Celery-related behavior to test (where practical, deterministically):**

| Behavior | How |
|---|---|
| Task receives the job UUID (string) | Patch `.delay`, assert arguments |
| Task is dispatched **after** commit, not before | `captureOnCommitCallbacks(execute=False)` then execute |
| Worker processing updates PostgreSQL state | Eager mode, assert DB state and files |
| Duplicate processing is prevented | Second `process_job` on the same job is a no-op; job already `PROCESSING`/finished is skipped |
| Broker failure leaves job `PENDING` | Patch `.delay` to raise; assert `202` + state + log |

5. **Test behavior, not implementation details.** Prefer asserting HTTP responses and database state over asserting that specific internal functions were called (the explicit exceptions are the dispatch/task-argument checks above).
6. **Test isolation:** each test uses a temporary `MEDIA_ROOT` (cleaned up) and Celery eager mode (via the shared base test class). Tests MUST NOT depend on execution order, network, wall-clock timing, sleeps, a real Redis, or a running worker.
7. **Failure injection:** use `unittest.mock.patch("certificates.pdf_generator.generate_certificate_pdf", side_effect=...)` where the fake raises only for a chosen recipient.
8. **Concurrency tests:** the required duplicate-processing tests are sequential and deterministic. A real multi-thread race test (`TransactionTestCase`) is optional and MUST NOT make the suite flaky.
9. **Readable tests:** descriptive names (`test_failed_certificate_does_not_stop_other_certificates`), small helpers in `tests/helpers.py`, one concept per test.
10. **Tests MUST NOT be deleted, skipped, weakened, or marked expected-failure just to get a green run.** If a test is wrong, fix it and explain why in `memory.md`.
11. **Run the full suite before declaring any phase complete** and report the real result.

---

## 3.9 AI / Codex Rules

Codex is allowed to generate code, **under these rules**:

1. **Read first.** At the start of every session read `prd.md`, `architecture.md`, `rules.md`, `phases.md`, and `memory.md` (in that order, `memory.md` last for current status).
2. **Follow the documents.** They are the source of truth. Do **not** silently change architecture, endpoints, status names, field names, or the **active** decisions among DEC-001…DEC-028 (superseded decisions DEC-002 and DEC-004 are history only).
3. **No new major dependencies** without a written justification (3.3) and developer approval.
4. **Required before optional.** Do not start RECOMMENDED or OPTIONAL items until Phases 1–8 are complete and tested. Never implement `design.md`/frontend work before Phase 13.
5. **Work phase by phase**, in the order in `phases.md`. Don't jump ahead. Keep each change small and reviewable.
6. **Don't delete tests** to get a green run; **don't hide exceptions** to get a green run.
7. **Avoid rewriting unrelated files.** Make the minimum change needed. No drive-by refactors or mass reformatting.
8. **Preserve working behavior.** Run the test suite before and after changes; never leave the suite red at the end of a phase.
9. **Document significant deviations.** If a change to the architecture is truly necessary, STOP, explain why to the developer, get approval, then update the relevant document(s) *and* record it in `memory.md` → *Changes*.
10. **Update `memory.md` at meaningful milestones** (phase started/completed, a decision made, a problem found) — not for tiny edits.
11. **Ambiguity:** if a requirement is unclear or contradictory, **don't invent complex behavior**. Add it to `memory.md` → *Open Questions*, propose the simplest interpretation, and ask the developer.
12. **Explainability duty.** For each phase, finish with a short plain-language summary the developer can use to explain the code: what was built, where, why, and how to modify it. Prefer explaining Django/DRF concepts in layman's terms first.
13. **Keep code beginner-explainable.** Avoid metaclass tricks, decorators-heavy abstractions, unusual language features, or "magic".
14. **No fabricated results.** Report real test output; don't claim something works unless it was run.
15. **Security basics always apply** (3.7), even for "just a demo".
16. **Git hygiene:** small logical commits if asked to commit; never commit `.env`, `media/`, or virtual environments.

---

## 3.10 Scope Boundaries

### In scope (build)
Everything marked **Must** in `prd.md` §1.6 (FR-001 … FR-013 and FR-019 … FR-022), tests, README.

### Allowed only after required work is done and tested
RECOMMENDED items (FR-014 … FR-018).

### Out of scope (do NOT build)
- Template editor, multiple templates, client-uploaded templates, QR codes, digital signatures.
- Email/SMS/WhatsApp delivery.
- Authentication, user accounts, roles, API keys, rate limiting.
- CSV/Excel upload.
- RabbitMQ, Kafka, Kubernetes, microservices, S3/cloud storage, distributed locks (ZooKeeper etc.), complex monitoring infrastructure, CI/CD pipelines, cloud deployment.
- Retry APIs/endpoints/queues and automatic business-level retries (OPT-001); idempotency keys (OPT-004); webhooks.
- File retention/cleanup, delete endpoints, soft deletes.
- Multi-language/non-Latin script support (A-10).
- Verification portals, payments, multi-tenancy, billing.
- Frontend and `design.md` (deferred to Phase 13 and the later design stage).
- Performance tuning beyond what is documented.

### Rule of thumb
> If it isn't in `prd.md` as Must or Recommended, **don't build it** — ask first.
