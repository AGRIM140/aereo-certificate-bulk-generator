# Architecture — Bulk Certificate Generator

| | |
|---|---|
| **Version** | 1.2 (final architecture + analysis of the supplied template image) |
| **Date** | 2026-10-08 |
| **Answers the question** | **HOW should the system work?** |
| **Related** | `prd.md` (what/why), `rules.md` (rules), `phases.md` (order), `memory.md` (status) |
| **Revision** | v1.1 supersedes the earlier SQLite + Python-threading design and the self-drawn template. Superseded decisions stay in §2.16 as history. PostgreSQL, Celery, Redis and the template are **our implementation choices**, not requirements of the assignment. |
| **Template note (v1.2)** | §2.12 now documents the real Recursion design: what is static, what must be erased from the PNG, where each dynamic field goes, and the resolution/size/aspect-ratio findings. |

> **How to read this document:** Every important concept is explained *in everyday words first*, then in proper technical terms. Decisions are numbered **DEC-xxx** (full list in §2.16) so they can be referenced from other documents and in the interview.

---

## 2.1 Architecture Overview

### Simple explanation
Think of a print shop. A customer (the **client**) hands over one order form listing many names. The front desk (**Django + DRF API**) checks the form, writes the order in the shop's ledger (**PostgreSQL**), and gives the customer an order number (**job ID**). Only once the ledger entry is safely written does the front desk pin a note ("process order #123") on the shop's ticket board (**Redis**, managed by **Celery**). A printing-room worker (**Celery worker**) takes the note, looks the order up in the ledger, and prints each certificate onto the pre-printed certificate paper (**the template image**), adding the person's details (**ReportLab**). Every success or failure is written back to the ledger. The finished certificates go on a shelf (**local media storage**). The customer can phone any time with the order number to see progress or collect a certificate.

**Golden rule:** the ledger (PostgreSQL) is the truth. The ticket board (Redis) only carries notes and can be rebuilt; losing a note never loses the order.

### Component diagram

```text
Client (curl / Postman / script / future UI)
   |
   v
Django + DRF  (app: certificates)
   |
   +--------------------+
   |                    |
   v                    v
PostgreSQL            Celery (client side: process_job_task.delay)
(source of truth)       |
   |                    v
   |                  Redis  (broker only: carries "process job <uuid>")
   |                    |
   |                    v
   |              Celery worker  (separate process)
   |                    |
   |                    v
   |              Service layer  (services.process_job)
   |                    |
   |                    v
   |              ReportLab PDF  (+ static certificate template image)
   |                    |
   |                    v
   |              Local media  (MEDIA_ROOT)
   |
   v
Job + Certificate state (read by the API for status and downloads)
```

### Job-creation flow

```text
POST /api/jobs/
      |
      v
Request validation (serializer)  --invalid--> 400, nothing saved
      |
      v
PostgreSQL transaction (atomic)
      |
      +--> GenerationJob (PENDING)
      +--> Certificate rows (PENDING, or FAILED/VALIDATION for bad recipients)
      |
Commit transaction
      |
      v
transaction.on_commit(...)   <- registered inside the transaction, runs only AFTER commit
      |
      v
process_job_task.delay("<job uuid>")  -> Redis broker -> Celery worker
      |
      v
API returns 202 Accepted immediately (does NOT wait for PDFs)
```

### Worker flow

```text
Celery worker receives job UUID
      |
      v
Claim job: short transaction + select_for_update()  (PENDING -> PROCESSING, else exit)
      |
      v
For each PENDING certificate (ordered by row_number):
      +--> Recipient A -> GENERATED
      +--> Recipient B -> FAILED   (error recorded, loop continues)
      +--> Recipient C -> GENERATED
      +--> Recipient D -> FAILED
      |
      v
Finalize GenerationJob
      |
      v
COMPLETED / COMPLETED_WITH_ERRORS / FAILED
```

### Responsibilities at a glance

| Component | Responsibility | Must NOT do |
|---|---|---|
| `urls.py` | Map URL paths to views. | Contain logic. |
| `views.py` | Receive request, call serializer/service, return response + status code. | Contain business logic or draw PDFs. |
| `serializers.py` | Validate input; shape output JSON. | Touch files, Celery, or run processing. |
| `services.py` | Create jobs, validate recipients, register the on-commit dispatch, claim and process jobs, set final status. | Know about HTTP requests/responses. |
| `tasks.py` | A very thin Celery task: receives the job UUID string and calls `services.process_job`. | Contain business logic; accept recipient data. |
| `config/celery.py` | Create the Celery app and load settings. | Contain tasks or logic. |
| `pdf_generator.py` | Turn certificate data into **PDF bytes** by overlaying text on the template. | Touch the database, HTTP, serializers, Celery, or save files. |
| `template_config.py` | One place for the template path, page size, field positions, font names/sizes, date format. | Contain drawing or business logic. |
| `models.py` | Define tables, status choices, small helper methods. | Contain PDF, HTTP, or Celery logic. |
| `api_errors.py` | One place that formats all error responses. | Hide errors. |
| `management/commands/` | Command-line recovery tool (recommended). | Duplicate service logic (it calls it). |

---

## 2.2 Request Lifecycle

### A) Creating a job — `POST /api/jobs/`

```text
 1. HTTP Request (JSON body)
        ↓
 2. Django URL routing        → finds the right view
        ↓
 3. DRF View (APIView)        → parses JSON into Python data
        ↓
 4. Request Serializer        → validates the WHOLE request (FR-002)
        ↓   (invalid → 400 + error body, nothing saved)
 5. Service: create_job()     → validates EACH recipient (FR-003)
        ↓                       opens ONE PostgreSQL transaction:
        ↓                       save Job + all Certificate rows
        ↓                       register transaction.on_commit(dispatch)
        ↓                       COMMIT
 6. on_commit callback runs   → process_job_task.delay("<job uuid>") → Redis → worker
        ↓
 7. Response serializer       → builds JSON
        ↓
 8. HTTP 202 Accepted + job JSON   (PDFs are NOT generated yet)
```

Step-by-step in beginner language:

1. **HTTP request** – the client sends text over the network: a path, a method (`POST`), and a JSON body.
2. **URL routing** – Django looks at the path (`/api/jobs/`) and picks the matching view, like a receptionist directing a visitor.
3. **View** – DRF turns the JSON text into Python dictionaries/lists. The view is intentionally "thin": it orchestrates but doesn't decide business rules.
4. **Serializer validation** – a *serializer* is a checklist: "Is `event_name` present? Is `issue_date` a real date? Is `recipients` a non-empty list under the limit?" If any check fails, we stop and return `400`. Nothing is saved.
5. **Service: create_job** – applies the per-recipient checklist. Valid recipients become `PENDING` certificate rows; invalid ones become `FAILED` rows with an error message. All of it is saved inside **one transaction**.
   - *Simple:* a transaction is an **all-or-nothing** save — either everything is written, or nothing is.
   - *Technical:* `transaction.atomic()` wraps the writes so a crash midway rolls back, preventing a job with only half its certificates.
6. **`transaction.on_commit`** – inside the transaction we *register* "queue the Celery task". Django runs that callback **only after the transaction has successfully committed**.
   - *Simple:* don't tell the printing room about an order until the order is really written in the ledger.
   - *Technical:* if the task were queued before the commit, a fast worker could receive the job UUID and query PostgreSQL **before the new rows are visible** (the transaction is not committed yet), find nothing, and fail or silently skip the job. `on_commit` removes that race. If the transaction rolls back, the callback never runs, so no task is queued for a job that doesn't exist.
7. **Response** – the response serializer converts the job to JSON.
8. **202 Accepted** – "I accepted your request; work is in progress." The client then polls the status endpoint.

### B) Checking a job — `GET /api/jobs/{job_id}/`

```text
HTTP Request → URL routing (validates UUID format) → View → fetch Job
(+ its Certificates in ONE extra query) → compute progress counts → Serializer → 200 JSON
                                   (unknown ID → 404)
```

### C) Downloading a certificate — `GET /api/certificates/{id}/download/`

```text
HTTP Request → URL routing → View → fetch Certificate (404 if missing)
→ status must be GENERATED (else 409) → open stored file safely → FileResponse (application/pdf)
```

---

## 2.3 Technology Stack

| Technology | Purpose |
|---|---|
| Python 3.11+ | Language |
| Django (current LTS, e.g. 5.2 LTS; pin exact version in `requirements.txt`) | Web framework + ORM + migrations + test tools |
| Django REST Framework | Build the REST API, validate input, format output |
| **PostgreSQL** | Relational database — the **source of truth** for all job/certificate state |
| PostgreSQL driver: `psycopg` (v3, `psycopg[binary]`) | Lets Django talk to PostgreSQL (use the driver that matches the pinned Django version) |
| Django ORM | Talk to the database in Python |
| **Celery** (`celery[redis]`) | Background task execution |
| **Redis** | Celery **message broker** only (carries "process job <uuid>" notes) |
| ReportLab | Generate PDFs: draw the template image and overlay dynamic text |
| Pillow | Installed automatically as a ReportLab dependency (needed to read PNG images); **not** added as a direct dependency |
| `dj-database-url` | Parse the `DATABASE_URL` environment variable (tiny, single-purpose; see `memory.md` Open Questions OQ-6) |
| `python-dotenv` | Load `.env` into environment variables (keeps secrets out of code) |
| Django's built-in test runner (+ DRF `APIClient`, `unittest.mock`) | Testing |

### Per-technology explanations

#### Python
- **What it is:** The programming language.
- **Why we need it:** Required by the assignment.
- **Alternatives:** None allowed (assignment mandates Python).
- **Why selected:** Mandated; the developer is a data-science student and knows it well.
- **Trade-offs:** Slower than compiled languages, but PDF generation for ≤500 certificates is not CPU-critical.

#### Django
- **Simple explanation:** A "batteries-included" toolkit for web backends: it comes with a database layer, URL routing, settings, admin site, security protections, and a testing framework.
- **Technical explanation:** A high-level Python web framework following MVT (Model–View–Template) conventions, with an ORM, migrations system, and a test runner.
- **Why we need it:** We need models, migrations, validation, file handling, and tests with minimal extra libraries.
- **Alternatives:** FastAPI, Flask (see §2.4).
- **Why selected:** One framework gives us nearly everything. Its conventions make the code predictable and easy to explain.
- **Trade-offs:** More "magic"/files than Flask; synchronous by default (fine here — slow work goes to Celery).

#### Django REST Framework (DRF)
- **Simple explanation:** An add-on that makes Django good at building JSON APIs. Its **serializers** act as checklists for incoming data and as translators for outgoing data.
- **Technical:** Provides `APIView`/generic views, serializers (validation + (de)serialization), pagination, parsers/renderers, and exception handling hooks.
- **Why we need it:** Validation, pagination, consistent responses, and `APIClient` for tests.
- **Alternatives:** Hand-written Django `JsonResponse` views; Django Ninja.
- **Why selected:** Industry standard with Django; matches the assignment's named option.
- **Trade-offs:** Another thing to learn; some DRF magic (we avoid ViewSets/routers to keep things explicit — DEC-017).

#### PostgreSQL (relational database)
- **Simple explanation:** A robust database that stores data in tables with rows and columns, and links between tables (a certificate "belongs to" a job). Many people and programs (the API *and* several workers) can read and write at the same time safely.
- **Technical:** A client–server relational database with MVCC, row-level locking (`SELECT ... FOR UPDATE`), native UUID type, and strong transactional guarantees.
- **Why we need it:** The assignment requires a relational database (our choice of engine). Job state is written by the API and by one or more Celery worker processes concurrently, and we rely on **transactions** and **row-level locks** (to prevent the same job being processed twice). PostgreSQL does this properly.
- **Alternatives:** SQLite (single writer, row-level locks not available, so duplicate-processing protection would not behave like production), MySQL/MariaDB.
- **Why selected:** Robust, concurrent, standard with Django, and matches how the job state would run in production.
- **Trade-offs:** Needs to be installed and running locally (more setup than SQLite); tests also need a PostgreSQL server (Django creates and drops a separate test database automatically, so the database user needs permission to create databases).

#### Django ORM
- **Simple:** Lets us read/write the database using Python objects instead of raw SQL.
- **Technical:** Maps model classes to tables; generates SQL; manages migrations; provides `transaction.atomic()`, `transaction.on_commit()` and `select_for_update()`.
- **Alternatives:** SQLAlchemy, raw SQL.
- **Why selected:** Built in; readable and consistent.
- **Trade-offs:** Can hide inefficient queries — see rules §3.6 about avoiding N+1 queries.

#### Celery
- **Simple explanation:** A system for running work "in the background" in a separate program (a *worker*), so the web request can return immediately. The API drops a note in a waiting line; a worker picks it up and does the job.
- **Technical:** A distributed task queue. Our Django code calls `process_job_task.delay(job_id)`; Celery serializes the call as JSON, publishes it to the broker (Redis), and a worker process consumes it and runs the task function.
- **Why we need it:** Generating up to 500 PDFs takes seconds to minutes — too long for an HTTP request. The assignment wants progress tracking, which only makes sense if the request doesn't wait.
- **Alternatives:** Synchronous generation inside the request; Python `threading` (dies with the web process, no separate worker, awkward with database connections); Django-Q/Huey/RQ (lighter queues).
- **Why selected:** Industry-standard Python background-job system; survives web-server restarts (the worker is a separate process); scales by simply starting more workers; widely recognized in interviews.
- **Trade-offs:** Two more things to run (Redis + the worker); more concepts to explain; **Celery does not guarantee business-level completion** (see §2.10).

#### Redis (Celery broker)
- **Simple explanation:** A very fast in-memory "mailbox" where Celery leaves task notes for workers.
- **Technical:** An in-memory data-structure store used as Celery's **message broker**.
- **Why we need it:** Celery needs a broker to hand tasks from the Django process to worker processes.
- **Alternatives:** RabbitMQ (more features, heavier), using the database as broker (not recommended).
- **Why selected:** Simplest broker to install and run locally.
- **Trade-offs:** Redis is **not** our database. It holds only transient notes. We configure **no Celery result backend**, so nothing about jobs is stored in Redis; the truth stays in PostgreSQL.

#### ReportLab (PDF generation)
- **Simple:** A Python library that draws text, images and shapes onto a PDF page like a programmable drawing board.
- **Technical:** Open-source PDF toolkit; we use the low-level `canvas` API: draw the template image across the page, then draw text at configured positions, and get the PDF bytes in memory.
- **Alternatives:** WeasyPrint/xhtml2pdf (HTML→PDF; need system libraries), fpdf2 (similar, lightweight), overlaying text onto a pre-made PDF with `pypdf` (needs a PDF template and an extra library).
- **Why selected:** The assignment lets us choose the PDF library. ReportLab is pure Python, mature, fast, and gives exact control over text placement — ideal for "static design + dynamic text".
- **Trade-offs:** Layout is coordinate-based; fonts must be registered for accented characters.

#### Testing framework (Django test runner)
- **Simple:** Tools to run automatic checks proving the code still works.
- **Technical:** `django.test.TestCase` (each test runs in a transaction rolled back afterward) plus DRF's `APIClient`, `unittest.mock`, and Celery's eager mode so tasks run synchronously during tests.
- **Alternatives:** `pytest` + `pytest-django` (nicer syntax, extra dependency).
- **Why selected:** No extra dependency; `python manage.py test` is easy to document and explain.
- **Trade-offs:** Slightly more verbose than pytest; requires a PostgreSQL server.

---

## 2.4 Framework Comparison — why Django + DRF *for this project*

We are not claiming Django is universally better. Each framework suits different needs.

| Need in this project | Django + DRF | FastAPI | Flask |
|---|---|---|---|
| ORM + migrations | **Built in** | Add SQLAlchemy + Alembic | Add SQLAlchemy/Flask-SQLAlchemy + migrations |
| Input validation | DRF serializers (rich, handles per-field errors) | Pydantic (excellent) | Add marshmallow/pydantic |
| Pagination, parsers, error hooks | Built in to DRF | Manual | Manual/extensions |
| Admin UI for inspecting data | **Free** | None | Extensions |
| Test client & DB test isolation | **Built in** | Add pytest, set up DB isolation | Extensions |
| Auto API docs | Optional (`drf-spectacular`) | **Built in** | Extensions |
| Async/high concurrency | Limited (sync default) | **Strong** | Limited |
| Number of separate libraries to learn | **Fewest** | Several | Several |
| Dev's first project in it | Yes (documented learning path) | — | — |

**Reasoning:** Our workload is CPU-light, small-scale, database-centric CRUD with strong validation needs and a status model. The extra performance edge of FastAPI's async model is not relevant at this scale (PDF drawing is synchronous work anyway). Django gives the ORM, migrations, validation, admin, and test tooling in one coherent, well-documented package, which minimizes the number of decisions the developer must be able to defend. Flask would work but requires hand-assembling the same pieces. **Where FastAPI would win:** a high-concurrency, I/O-heavy API needing automatic OpenAPI docs from day one.

---

## 2.5 Database Architecture

**Engine: PostgreSQL** (DEC-019), accessed only through the Django ORM; schema managed by Django migrations. UUID columns use PostgreSQL's native `uuid` type.

### Tables

#### `GenerationJob` (table `certificates_generationjob`)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID, **primary key** | Server-generated (`uuid4`); hard to guess (DEC-007). |
| `status` | char, choices | `PENDING`, `PROCESSING`, `COMPLETED`, `COMPLETED_WITH_ERRORS`, `FAILED`. Indexed. |
| `event_name` | char(150) | Required. |
| `organization_name` | char(100) | Required. |
| `issue_date` | date | Defaults to today (server date) if omitted. |
| `error_message` | text, blank | Safe message only for job-level crashes. |
| `created_at` | datetime | Auto-set. |
| `started_at` | datetime, null | Set when processing begins. |
| `finished_at` | datetime, null | Set when a terminal status is reached. |

#### `Certificate` (table `certificates_certificate`)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID, **primary key** | Internal identifier used in API URLs. It is **not** the number printed on the certificate (see `certificate_number`). |
| `certificate_number` | char(32), **unique**, indexed | Human-readable display identifier printed at the "with Registration Number" position of the body sentence, format `CERT-<issue year>-<12 hex chars of the UUID, uppercase>`, e.g. `CERT-2026-3F9A12BC47D1` (DEC-026). Built once when the row is created. |
| `job` | **foreign key** → `GenerationJob`, `related_name="certificates"`, `on_delete=CASCADE` | Many certificates belong to one job. |
| `row_number` | positive int | 1-based position in the submitted list; identifies recipients without relying on name/email. |
| `recipient_name` | char(100), blank allowed | Best-effort value even for invalid rows (truncated). |
| `recipient_email` | email(254), blank allowed | Optional. |
| `status` | char, choices | `PENDING`, `GENERATED`, `FAILED`. |
| `error_type` | char, blank | `""`, `VALIDATION`, or `GENERATION`. |
| `error_message` | char(500), blank | Human-readable, **safe** (no stack traces/paths). |
| `pdf_file` | FileField, null/blank | Relative path inside `MEDIA_ROOT`. |
| `created_at` | datetime | Auto-set. |
| `generated_at` | datetime, null | Set on success. |

### Constraints and indexes

- `UniqueConstraint(job, row_number)` — a position can appear only once per job.
- `certificate_number` is unique across all certificates (unique constraint/index).
- `Index(job, status)` — fast "show me failed certificates of this job" and progress counts.
- Ordering of certificates: by `row_number`.

### ER diagram

```text
+-------------------------+ 1        many +----------------------------+
|     GenerationJob       |---------------|        Certificate         |
|-------------------------|               |----------------------------|
| id (PK, UUID)           |               | id (PK, UUID)              |
| status                  |               | job_id (FK → Job.id)       |
| event_name              |               | row_number                 |
| organization_name       |               | certificate_number (UNIQUE)|
| issue_date              |               | recipient_name             |
| error_message           |               | recipient_email            |
| created_at              |               | status                     |
| started_at              |               | error_type                 |
| finished_at             |               | error_message              |
+-------------------------+               | pdf_file (path)            |
                                          | created_at / generated_at  |
                                          +----------------------------+
          UNIQUE(job_id, row_number)      INDEX(job_id, status)
```

### Status tracking

**Certificate status**

```text
(valid recipient)   PENDING ──success──> GENERATED
                        └─────failure──> FAILED (error_type=GENERATION)

(invalid recipient) created directly as FAILED (error_type=VALIDATION)
```

**Job status**

```text
PENDING ──> PROCESSING ──> COMPLETED               (failed == 0)
                      ├──> COMPLETED_WITH_ERRORS   (failed ≥ 1 and generated ≥ 1)
                      └──> FAILED                  (generated == 0, or unexpected job-level crash)
```

**Progress numbers are computed, not stored (DEC-008).**
- *Simple:* instead of keeping a separate scoreboard that could get out of sync, we count the certificate rows whenever asked.
- *Technical:* a single `aggregate()` with conditional `Count(..., filter=Q(status=...))` returns `generated`, `failed`, `pending`, `total`. `percent_complete = (generated + failed) / total × 100` (0 if total is 0).
- *Trade-off:* one small query per read vs. the risk of counter drift. At ≤500 rows this is trivial.

**`GenerationJob.status` in PostgreSQL is the authoritative application status.** It is *not* the same thing as Celery's own task state (see §2.10).

### Data lifecycle note
Deleting a job cascades to its certificate **rows** but does **not** delete the PDF files (Django doesn't auto-delete files). There is no delete endpoint; cleanup is out of scope (A-8).

---

## 2.6 Application Flows

### Job creation
1. Validate request-level fields (serializer).
2. In `create_job()`: for each recipient (in order) run the recipient checklist; build a `certificate_number` for every row (DEC-026).
3. In one `transaction.atomic()` block (PostgreSQL): create the job (`PENDING`), then `bulk_create` all certificate rows (valid → `PENDING`; invalid → `FAILED/VALIDATION` with message), and **register** `transaction.on_commit(...)` to queue the Celery task.
4. When the block ends, PostgreSQL **commits**; only then does Django run the on-commit callback, which calls `process_job_task.delay("<job uuid>")`.
5. Return `202` with the job summary.

*Why on_commit?* See §2.2 step 6: a worker must never see a job UUID whose rows are not yet visible. If the transaction rolls back, nothing is queued.

*If queueing fails* (e.g. Redis is down): the callback catches the error, logs it, and leaves the job `PENDING`. The client still gets `202`; the recovery command (FR-017) can re-dispatch the job later (DEC-027).

### Input validation (two levels)

| Level | Where | Failure outcome |
|---|---|---|
| **Request-level** (shape, job info, list size) | `serializers.py` | `400`, nothing saved, nothing queued |
| **Recipient-level** (name, email, type) | `RecipientSerializer`, applied by `services.create_job` to each item | Row saved as `FAILED/VALIDATION`; others continue |

Recipient rules: `name` required string, trimmed, 1–100 chars, no control characters; `email` optional, valid format, ≤254; non-object item invalid; unknown extra keys are ignored.
Error messages are compact and joined, e.g. `"email: Enter a valid email address."`.

### Bulk certificate generation — `process_job(job_id)` (runs inside a Celery worker)

Call chain: `Celery worker → tasks.process_job_task(job_id) → services.process_job(job_id)`. The task is a thin wrapper; all logic is in the service (testable without Celery).

1. **Claim the job (duplicate-processing protection, DEC-023).**
   - Open a short `transaction.atomic()` block and load the job with `select_for_update()` — PostgreSQL puts a "busy" lock on that one row.
   - *Simple explanation:* like a "do not disturb" sign on the order: if two workers grab the same note, the second must wait until the first has finished updating the order status; then it sees "already being processed" and walks away.
   - *Technical:* `SELECT ... FOR UPDATE` takes a row-level lock held until the transaction ends. Under it: if the job does not exist → log and return; if `status != PENDING` → log "already claimed/finished" and return **without changes**; otherwise set `PROCESSING` and `started_at`. The transaction commits and the lock is released within milliseconds.
   - The lock is **not** held while PDFs are generated. (A long lock would block other workers and hide progress.) The `PROCESSING` status itself is what keeps other workers out afterwards.
   - *Equally valid alternative:* a conditional `UPDATE ... WHERE status='PENDING'` that checks how many rows changed. We prefer `select_for_update()` because it is explicit and easy to explain.
2. Loop over the job's `PENDING` certificates ordered by `row_number` (use `.iterator()`; avoid loading everything at once).
3. For each certificate, inside its own `try/except Exception`:
   - call `pdf_generator.generate_certificate_pdf(...)` (always through the **module attribute** so tests can patch it) → bytes;
   - save bytes to `pdf_file` with a server-built name;
   - mark `GENERATED`, set `generated_at` (one small `save`, its own tiny transaction).
4. **Finalize**: count results → set job status (`COMPLETED` / `COMPLETED_WITH_ERRORS` / `FAILED`) and `finished_at`.

Processing only touches `PENDING` certificates, so running it again (after a crash or a duplicate delivery) never regenerates finished ones.

### Individual certificate failure
Inside the per-certificate `try/except`:
- `logger.exception(...)` records the full traceback with job ID and certificate ID (for developers).
- The certificate is marked `FAILED`, `error_type="GENERATION"`, `error_message="Certificate generation failed."` (a safe, short message for clients; optionally including the exception *class name* but never paths or stack traces). A text-fitting problem uses the safe message "Text does not fit the certificate template."
- Any half-written file is removed.
- The loop continues. **The exception is never swallowed silently** — it's logged and recorded.

```text
for each certificate:
    try:
        generate PDF -> save PDF -> mark GENERATED
    except Exception:
        mark FAILED + record safe error + log technical exception
        continue
```

Updating the failed row is itself wrapped so that a database hiccup on one row is logged and doesn't kill the loop either; if the whole job crashes unexpectedly, the outer handler sets the job `FAILED`, stores a safe `error_message`, and marks remaining `PENDING` certificates `FAILED/GENERATION` ("Job processing was interrupted").

### Job progress tracking
Because each certificate is saved as soon as it finishes (its own small commit), a client polling `GET /api/jobs/{id}/` sees `generated + failed` rising until `pending` reaches 0. Progress is always computed from certificate rows, never from Celery.

### Job completion
Terminal job statuses: `COMPLETED`, `COMPLETED_WITH_ERRORS`, `FAILED`. `finished_at` is set. Clients know they can stop polling when `status` is terminal.

### Certificate retrieval
- Metadata: `GET /api/certificates/{id}/` → JSON.
- File: `GET /api/certificates/{id}/download/` → PDF stream (`FileResponse`, `Content-Disposition: attachment`, filename built from the certificate number/UUID — not from user input).
- Bulk (recommended): `GET /api/jobs/{id}/download/` → ZIP built with Python's `zipfile` from GENERATED files (names like `0007_certificate.pdf`, again server-built).

---

## 2.7 Folder and File Structure

```text
bulk-certificate-generator/
├── manage.py
├── README.md                        # written in Phase 11
├── requirements.txt                 # pinned: Django, DRF, psycopg, celery[redis], reportlab, python-dotenv, dj-database-url
├── .env.example                     # documented env vars (NO real secrets)
├── .gitignore                       # .env, media/, __pycache__/, venv/
├── docs/
│   ├── prd.md
│   ├── architecture.md
│   ├── rules.md
│   ├── phases.md
│   └── memory.md
├── config/                          # Django project (settings & root URLs)
│   ├── __init__.py                  # imports the Celery app so it loads with Django
│   ├── celery.py                    # Celery app: reads CELERY_* settings, autodiscovers tasks
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── certificates/                    # the single Django app
│   ├── __init__.py
│   ├── apps.py
│   ├── admin.py                     # (recommended) model registration
│   ├── models.py                    # GenerationJob, Certificate
│   ├── serializers.py               # request/recipient/response serializers
│   ├── views.py                     # thin API views
│   ├── urls.py                      # app routes (included from config/urls.py)
│   ├── services.py                  # create_job, dispatch_job, process_job, finalize, zip
│   ├── tasks.py                     # thin Celery task: process_job_task(job_id)
│   ├── pdf_generator.py             # generate_certificate_pdf(...) -> bytes
│   ├── template_config.py           # template path, page size, field positions, fonts, date format
│   ├── api_errors.py                # custom DRF exception handler (error envelope)
│   ├── pagination.py                # small PageNumberPagination subclass (page size 50)
│   ├── assets/
│   │   ├── certificate_template.png # THE single static template: Recursion design, sample text ERASED (see §2.12)
│   │   └── fonts/                   # bundled serif Unicode TTF + its license file
│   ├── management/
│   │   └── commands/
│   │       └── process_pending_jobs.py   # (recommended) recovery command
│   ├── migrations/
│   └── tests/
│       ├── __init__.py
│       ├── helpers.py               # payload builders, temp media + Celery-eager base test class
│       ├── test_job_creation.py
│       ├── test_validation.py
│       ├── test_pdf_generation.py
│       ├── test_job_status.py
│       ├── test_failure_handling.py
│       ├── test_celery_processing.py     # on_commit dispatch, task args, claim/duplicate protection
│       ├── test_retrieval.py
│       └── test_management_command.py    # only if FR-017 implemented
└── media/                           # generated PDFs at runtime (git-ignored)
```

*Notes:*
- The Django project package is named `config` (established here, so the worker command is `celery -A config worker --loglevel=info`). If the developer renames it, update every document.
- Tests live inside the app (`certificates/tests/`) so `python manage.py test` discovers them with no configuration (DEC-011).
- The template lives in `certificates/assets/` and its path is defined once in `template_config.py` (not scattered, not embedded in business logic). Clients cannot upload or choose templates.

| File | Why it exists |
|---|---|
| `config/settings.py` | Reads environment variables; configures PostgreSQL, DRF, Celery, media, logging, limits. |
| `config/celery.py` | Standard Celery–Django wiring (one small file). |
| `services.py` | The "brain": keeps views thin and logic testable without HTTP or Celery. |
| `tasks.py` | The only place that knows Celery task syntax; calls the service. |
| `pdf_generator.py` | Isolated so layout can change without touching anything else, and so tests can fake it. |
| `template_config.py` | Separates *where text goes* (configuration) from *how text is drawn* (code). |
| `api_errors.py` | Guarantees one error format everywhere. |
| `assets/` | The static template image and bundled font (DEC-012, DEC-025). |

---

## 2.8 API Architecture

Base path: `/api/`. All IDs are UUIDs. Bodies are JSON. No authentication (A-6). Trailing slashes are used (Django convention). **The API contract is unchanged by the PostgreSQL/Celery migration**; the only addition is the additive `certificate_number` field on certificate objects.

| # | Method & Path | Purpose | Priority |
|---|---|---|---|
| 1 | `POST /api/jobs/` | Create a bulk generation job | **Must** |
| 2 | `GET /api/jobs/{job_id}/` | Job status, progress, per-recipient results | **Must** |
| 3 | `GET /api/certificates/{certificate_id}/` | One certificate's metadata | **Must** |
| 4 | `GET /api/certificates/{certificate_id}/download/` | Download PDF | **Must** |
| 5 | `GET /api/jobs/` | List jobs (paginated, newest first) | Recommended |
| 6 | `GET /api/jobs/{job_id}/certificates/?status=FAILED&page=2` | Paginated, filterable certificate list | Recommended |
| 7 | `GET /api/jobs/{job_id}/download/` | ZIP of all generated certificates | Recommended |

### 1) `POST /api/jobs/`
- **Input:**

```json
{
  "event_name": "Data Science Bootcamp 2026",
  "organization_name": "Acme Academy",
  "issue_date": "2026-10-01",
  "recipients": [
    {"name": "Asha Verma", "email": "asha@example.com"},
    {"name": "José Álvarez"},
    {"name": "", "email": "not-an-email"}
  ]
}
```
  (`issue_date` optional; `email` optional.)
- **Output `202 Accepted`:** the job summary (same shape as endpoint 2; normally `status: PENDING` with certificates still `PENDING`, because the Celery task has only just been queued). Includes `status_url`. The response never waits for PDF generation.
- **Errors:** `400` request-level validation (nothing created). Per-recipient problems are **not** errors here; they appear in the job's results.

### 2) `GET /api/jobs/{job_id}/` → `200`

```json
{
  "id": "6f1c…",
  "status": "COMPLETED_WITH_ERRORS",
  "event_name": "Data Science Bootcamp 2026",
  "organization_name": "Acme Academy",
  "issue_date": "2026-10-01",
  "progress": {"total": 3, "generated": 2, "failed": 1, "pending": 0, "percent_complete": 100},
  "created_at": "…", "started_at": "…", "finished_at": "…",
  "error_message": "",
  "certificates": [
    {"id": "…", "row_number": 1, "certificate_number": "CERT-2026-3F9A12BC47D1", "recipient_name": "Asha Verma", "recipient_email": "asha@example.com",
     "status": "GENERATED", "error": null,
     "download_url": "http://host/api/certificates/…/download/"},
    {"id": "…", "row_number": 3, "certificate_number": "CERT-2026-0B71D49E5A22", "recipient_name": "", "recipient_email": "not-an-email",
     "status": "FAILED",
     "error": {"type": "VALIDATION", "message": "name: This field may not be blank. email: Enter a valid email address."},
     "download_url": null}
  ]
}
```
- **Errors:** `404` unknown or malformed UUID.
- Size is bounded by `MAX_RECIPIENTS_PER_JOB`, so embedding all results is acceptable (DEC-009). Endpoint 6 is the scalable alternative.

### 3) `GET /api/certificates/{certificate_id}/` → `200`
Same certificate object as above plus `job_id` and `generated_at`. `404` if unknown.

### 4) `GET /api/certificates/{certificate_id}/download/`
- `200` + `application/pdf` attachment when `GENERATED`.
- `404` unknown ID **or** the stored file is missing on disk (logged as an error).
- `409 Conflict` when status is `PENDING` or `FAILED` ("Certificate is not available").

### 5–7 (Recommended)
- **5:** `200` paginated `{count, next, previous, results[]}` of job summaries (without per-recipient lists).
- **6:** same pagination; filter `status` ∈ {PENDING, GENERATED, FAILED}; invalid filter value → `400`; unknown job → `404`.
- **7:** `200` `application/zip`; `404` unknown job; `409` if the job has no generated certificates.

### Error response shape (all endpoints, DEC-013)

```json
{
  "error": {
    "code": "validation_error",
    "message": "The request data is invalid.",
    "details": { "recipients": ["Ensure this field has at least 1 element."] }
  }
}
```

| Situation | HTTP | `code` |
|---|---|---|
| Request-level validation | 400 | `validation_error` |
| Unknown job / certificate / malformed UUID | 404 | `not_found` |
| Certificate not downloadable | 409 | `certificate_not_available` |
| Wrong HTTP method | 405 | `method_not_allowed` |
| Unsupported content type (not JSON) | 415 | `unsupported_media_type` |
| Unexpected server error | 500 | generic message, no internals (Django's production error handling; `DEBUG=False`) |

---

## 2.9 Error Handling Architecture

| Situation | Handled where | Behaviour |
|---|---|---|
| Invalid request body / job fields | Request serializer | `400`, consistent envelope, no job, nothing queued. |
| Invalid recipient data | `services.create_job` | Row saved as `FAILED/VALIDATION` with message + `row_number`; others continue. |
| Missing job / certificate | View lookup (`get_object_or_404` / DRF `NotFound`) | `404` envelope. |
| PDF generation failure (one cert) | `process_job` per-certificate `try/except` | Row `FAILED/GENERATION`; traceback logged; loop continues. |
| Text does not fit the template | Generator raises; same per-certificate `try/except` | Row `FAILED/GENERATION` with safe message; loop continues. |
| File-saving failure (one cert) | Same `try/except` | Same handling; partial file cleaned. |
| Database error while creating job | `transaction.atomic` | Rolled back; `500` generic error; nothing half-saved; **no Celery task queued** (the on-commit callback never runs). |
| Redis/broker unavailable when queueing | `dispatch_job` callback (try/except + log) | Job and certificates stay saved; job stays `PENDING`; API still `202`; recover with FR-017. |
| Celery worker not running | Not an error in the app | Notes wait in Redis; job stays `PENDING` until a worker starts. |
| Database error while updating one cert during processing | Logged inside loop | Loop continues; a certificate left `PENDING` is recoverable with FR-017. |
| Unexpected job-level crash | Outer handler in `process_job` | Job `FAILED`, safe `error_message`, remaining PENDING marked FAILED. |
| Worker process killed mid-job | Not catchable | Job stays `PROCESSING` with some certificates generated; recover via `process_pending_jobs` once stale (FR-017). |
| Same job delivered/processed twice | Claim step with `select_for_update()` | Second run sees non-`PENDING` status and exits without changes. |
| Stored PDF missing at download time | Download view | `404` + logged error (no path leaked). |

**Principle — "Failure isolation":** *Simple:* each certificate is like an independent task on a to-do list; if one task fails, we cross it out with a note and go on to the next. *Technical:* per-item exception boundaries with durable per-item state in PostgreSQL.

---

## 2.10 Processing Strategy

> **Final decision (DEC-020, supersedes DEC-004):** generation runs as **Celery background tasks** with **Redis** as the broker. **PostgreSQL is the source of truth.** Python `threading` is **not** used. None of these technologies is required by the assignment; they are our choices.

### Options considered

| Option | How it works | Pros | Cons |
|---|---|---|---|
| **Synchronous** | POST generates everything, then replies | Simplest; no lost jobs | Request may take minutes for large jobs → timeouts; "progress tracking" becomes meaningless; blocks the web worker |
| **Python threading** *(rejected)* | POST saves job, starts a thread in the web process | No extra infrastructure | Thread dies with the web process (restart, auto-reload, crash); shares the web server's resources; manual DB-connection handling; cannot add more workers; no standard tooling |
| **Celery + Redis (CHOSEN)** | POST saves job, queues a task; separate worker processes do the work | Separate, restartable worker processes; scale by adding workers; standard Python approach; request returns instantly | Two extra things to run (Redis + worker); more concepts; no business-level guarantee by itself |

### Why each piece
- **Why not synchronous?** The assignment stresses that a request may contain many recipients and wants progress tracking. A request that waits for 500 PDFs is slow, fragile, and has nothing to track.
- **Why not threads?** A thread lives and dies with the Django process and cannot be scaled or supervised on its own. With PostgreSQL we want real, separate worker processes.
- **Why Celery?** Certificate generation is background work and must not block the API request.
- **Why Redis?** The simplest broker for Celery. It only carries "process job <uuid>" notes.
- **Why PostgreSQL as the source of truth?** It is a robust relational database suitable for concurrent access (API + several workers) and transactional job state. Redis can lose messages on restart; PostgreSQL holds the real job and certificate state, so nothing important is lost with a note.

### Dispatch rule: `transaction.on_commit` (DEC-022)
The Celery task is queued **only after** the PostgreSQL transaction that created the job and certificates has committed (§2.2 step 6). Reason: a worker that receives the task before the commit could query PostgreSQL before the rows are visible and find no job. The call lives in one place: `services.dispatch_job` (registered via `transaction.on_commit`). Nothing may call `.delay()` anywhere else.

### Task design (DEC-024)
- The task receives **only the job UUID as a string** — never recipients or large payloads. The worker reads everything it needs from PostgreSQL.
- Conceptually: `create_job() → process_job_task.delay(job_id) → process_job(job_id) → load job → claim → process certificates → finalize`.
- Celery configured with the JSON serializer only, **no result backend** (`task_ignore_result`): we never read Celery results; PostgreSQL has the results.
- **No retries** are configured (§2.11 mentions retries as a future option).

### Concurrency: preventing duplicate processing (DEC-023)
With several workers (or duplicate deliveries) the same job UUID could arrive twice. The claim step (§2.6) uses a short transaction + `select_for_update()` so that only the first worker moves the job `PENDING → PROCESSING`; later arrivals see a non-`PENDING` status and exit. Objective: **only one active worker processes a given `GenerationJob` at a time.** No distributed locks, no extra infrastructure — PostgreSQL's row lock is enough.

| Scenario | Outcome |
|---|---|
| Two workers receive the same job at the same moment | One claims; the other waits milliseconds, sees `PROCESSING`, exits. |
| Duplicate task delivery after the job finished | Sees `COMPLETED*`/`FAILED`, exits. |
| Recovery command re-dispatches a job whose original worker is just very slow | Possible overlap if the threshold is too short; processing is deterministic (UUID-based paths, only `PENDING` certificates), so the worst case is repeated work, not corruption. Use a generous threshold (default 30 min). |

### Celery task state ≠ application job status
| Concept | Where it lives | Meaning |
|---|---|---|
| **Celery task state** (`SUCCESS`, `FAILURE`, …) | Celery/Redis (we do not even store it) | "Did the task *function* return or raise?" |
| **`GenerationJob.status`** | PostgreSQL | The business outcome: `PENDING`, `PROCESSING`, `COMPLETED`, `COMPLETED_WITH_ERRORS`, `FAILED`. **Authoritative.** |
| **`Certificate.status`** | PostgreSQL | `PENDING`, `GENERATED`, `FAILED` per recipient. |

Example: the task function returns normally (Celery would say `SUCCESS`) while the job is `COMPLETED_WITH_ERRORS` because two certificates failed. The API only ever reports PostgreSQL state.

### Reliability and recovery — four different things
| Concept | Question it answers | Where handled |
|---|---|---|
| **Task execution** | Did a worker run the function? | Celery |
| **Database state** | What really happened to the job and each certificate? | PostgreSQL (`status`, timestamps, per-certificate errors) |
| **Worker failure** | Did the worker die mid-task? | Not catchable in code; visible as a job stuck in `PROCESSING` |
| **Job recovery** | How do we finish interrupted work? | `process_pending_jobs` command (FR-017, recommended) |

**Celery does not by itself guarantee business-level completion.** With default settings, a task note taken by a worker that is then killed is gone, and a failed dispatch may never reach Redis. That is why durable state lives in PostgreSQL and why a simple recovery command exists.

**Recovery command (kept simple):** `python manage.py process_pending_jobs [--older-than-minutes N]` (default from `STALE_JOB_MINUTES`). It finds (a) jobs `PENDING` for longer than the threshold (task never queued/lost) and (b) jobs `PROCESSING` whose `started_at` is older than the threshold (worker presumably died). For (b) it resets the job to `PENDING` inside a `select_for_update()` transaction, then dispatches via the normal on-commit path. Because processing only handles `PENDING` certificates, finished ones are never redone.

### Retries (not implemented)
No retry API, endpoint, queue, or automatic business retry. Celery's retry features (`autoretry_for`, backoff) may be mentioned as a future possibility only.

### Honest limitations (state in README)
- The worker and the Django server must see the **same `MEDIA_ROOT`** (same machine locally). Multi-machine deployments would need shared/object storage (future).
- A killed worker leaves a job `PROCESSING` until the recovery command runs.
- If Redis is down, new jobs stay `PENDING` until re-dispatched.
- Local development needs PostgreSQL, Redis, and two processes (§2.13).

---

## 2.11 Scalability

### Initial assignment implementation
- Django + DRF API, PostgreSQL, Redis broker, one or more Celery workers on the same machine sharing a local `MEDIA_ROOT`.
- Max 500 recipients per job (configurable); paginated listings; DB indexes on `(job, status)`.
- Workers can already be scaled out simply by starting more worker processes; the claim step keeps one job on one worker at a time.
- Sized for demos and modest real use.

### Future production scaling (documented only — NOT built)

| Concern | Future option |
|---|---|
| Resilience | Celery `acks_late` with idempotent tasks, automatic retries with backoff (`autoretry_for`), dead-letter handling, periodic stale-job sweeper (Celery beat) |
| Throughput | Split large jobs into chunks / per-certificate tasks across workers; dedicated queues; autoscaling workers |
| Database | Connection pooling (e.g. PgBouncer), read replicas, `select_for_update(skip_locked=True)` patterns |
| File storage | S3-compatible object storage with signed download URLs (`django-storages`); removes the "same filesystem" limitation |
| Large lists | CSV/streaming upload; raise limits with chunking |
| Security | API keys/OAuth, per-client quotas, rate limiting |
| Integration | Webhooks on job completion; email delivery; idempotency keys |
| Operations | Metrics, alerting (e.g. Flower), structured JSON logs, retention/cleanup jobs |

---

## 2.12 Certificate Template Design (single predefined template) — DEC-025, DEC-029

### The decision
The application's **single predefined template is the supplied certificate design of the Recursion university club** ("Certificate of Achievement", SMIT/Recursion/ACCESS branding). It is stored as **one static image asset** used as the page background; ReportLab overlays only the dynamic text.

```text
certificate_template.png  (static asset, sample text erased)
        |
        v
PDF canvas  --> draw template image as full-page background
        |
        v
draw dynamic text at configured positions (template_config.py)
        |
        v
save PDF to bytes in memory
```

**Why this approach (simple explanation):** it is like printing on pre-designed certificate paper: the beautiful design is already on the paper; the printer only writes the person's details in the empty spots. We don't redraw the circuit-board border, logos or seal in code.

**Interview explanation (also goes in the README):**
> "I used an existing certificate design from the Recursion club at my university as the predefined template. Since the assignment requires a single predefined certificate design and does not require a template editor, I kept the visual design static and used ReportLab to dynamically populate recipient-specific information. This keeps the implementation simple while clearly separating the template from the certificate-generation logic."

(No additional ownership or licensing claims are made beyond this statement.)

### What the supplied image actually is (analysis)
- File: `Untitled_Design.png`, **1184 × 864 px**, RGBA, ≈1.4 MB, landscape, aspect ratio **1.370** (A4 landscape is 1.414).
- Layout (top → bottom): green/gold circuit-board border; SMIT logo (top-left, on a white box), ACCESS logo (top-right), Recursion logo (top-centre); heading **CERTIFICATE OF ACHIEVEMENT**; gold rule; **PROUDLY PRESENTED BY**; green line **RECURSION**; body paragraph (about 5 lines); bottom-left name + date above/below a short line; centre gold **WINNER** medal; bottom-right signatory **Dr. Vikash Kumar Singh / Head of Department**.
- **Important finding:** the body paragraph and several other texts are *baked into the pixels*, including sample data, dotted blanks and typos ("25nd", "ben", a garbled word). They cannot be overwritten by drawing on top; they must be **erased from the committed asset** (A-12).

### Static vs dynamic content

| Static (stays in the image) | Dynamic (drawn by ReportLab) |
|---|---|
| Border and circuit-board graphics, paper texture | **organization_name** → the green line under "PROUDLY PRESENTED BY" (currently reads "RECURSION") |
| SMIT, ACCESS and Recursion logos | **Body sentence** → contains **recipient name**, **certificate number** ("with Registration Number …") and **event name** |
| Heading "CERTIFICATE OF ACHIEVEMENT", gold rule, "PROUDLY PRESENTED BY" | **Bottom-left block** → **recipient name** (above the line) and **issue date** (below the line) *(A-18, to confirm)* |
| Gold "WINNER" medal | |
| Bottom-right signatory "Dr. Vikash Kumar Singh – Head of Department" | |

Sample values in the design ("Akshat Rawat", "25th September 2023", "C Programming Workshop", "1st Place", the dotted blanks) are **never** part of the committed asset or of generated output.

### Regions to erase when preparing the committed asset (A-12)
Initial estimates in the 1184×864 pixel grid (top-left origin), to be **verified in Phase 4**:

| Region | Approx. pixel box (x1, y1, x2, y2) | Contains |
|---|---|---|
| Organization line | (440, 400, 730, 450) | green "RECURSION" text |
| Body paragraph | (110, 465, 1075, 655) | dotted blanks, "This certifies that …", "held from …", "1st Place", "…outstanding performance and dedication." |
| Bottom-left block | (135, 705, 365, 775) | "Akshat Rawat", date (keep the short gold line at about y≈742, x 143–356 if it is part of the artwork, or redraw it) |

Erase by filling with the surrounding paper texture (e.g. clone/patch in the design tool, or re-export the original design without these text layers — if the design came from a tool like Canva, simply **delete those text boxes and export again**, which is cleaner than patching pixels). Do not touch logos, heading, medal or the signatory.

### Body sentence (DEC-029)
The fixed words are a constant in `template_config.py`; the dynamic values are inserted and drawn as one ReportLab `Paragraph` (centered, wrapping automatically):

> *This certifies that **{recipient_name}** with Registration Number **{certificate_number}** has successfully completed **{event_name}**.*

- The award-specific sentence of the sample ("held from … 1st Place for … outstanding performance and dedication") is dropped because our request has no place/award field (A-17). Wording is configurable in one place (OQ-11).
- **Escape dynamic text** before inserting it into the paragraph (`xml.sax.saxutils.escape`), because ReportLab paragraphs interpret `<` and `&` as markup. A name like `A & B <x>` must render literally and must not crash or alter formatting.
- Dynamic values are drawn **bold** (or otherwise emphasized) so they read as filled-in fields. Final styling decided in Phase 4.

### Template asset and configuration
- Location: `certificates/assets/certificate_template.png`. Referenced **only** through `template_config.py`; never embedded in business logic.
- `template_config.py` holds: template path, page size, the body-sentence constant, and for each dynamic element its anchor/box, alignment, colour, maximum and minimum font size and maximum lines, plus font names and the date display format.
- **Colours sampled from the design** (verify visually): organization line ≈ `#52A94E` (green); body text ≈ `#1E1A09` (near-black); heading ≈ `#19311B` (dark green).
- No client upload, no template editor, no second template.

### Page size, resolution and file size (findings)
| Finding | Consequence | Default / recommendation |
|---|---|---|
| Aspect ratio 1.370 ≠ A4 1.414 | Stretching to A4 would distort the logos/medal by ≈3% | **Default:** create the page with the image's aspect ratio at A4-landscape width (842 pt wide, ≈615 pt high) so nothing is distorted. **Better:** re-export the cleaned design at exact A4 ratio (e.g. 1754×1240 px) and use true A4 (OQ-13). |
| 1184 px across A4 width ≈ 100 DPI | Slightly soft when printed | Re-export at ≈1754×1240 (150 DPI) or higher if print quality matters |
| RGBA PNG ≈1.4 MB, embedded in **every** PDF | 500 certificates ≈ 700 MB | Flatten to RGB (drop the alpha channel) and compress/convert (e.g. high-quality JPEG ≈150–300 KB) if PDFs are large; measure in Phase 4; record in `memory.md` (OQ-8). If the file name/format changes, update the docs |
| ReportLab needs Pillow to read the image | Already installed as a ReportLab dependency | No extra dependency |

### Positioning dynamic fields (Phase 4 procedure)
1. Prepare the cleaned asset (regions above) and place it at `certificates/assets/certificate_template.png`.
2. Choose page size (table above); scale = page width ÷ image width (ReportLab's origin is the **bottom-left**; image pixels have a top-left origin).
3. Convert the estimated boxes to PDF points and record them in `template_config.py`: organization line (centered at about x≈585 px), body paragraph box (about x 120–1065, y 470–650 px), bottom-left name/date (centered at about x≈250 px, name above the line at y≈722, date below at y≈758).
4. Generate sample PDFs (short, typical, maximum-length values) and compare against the original design; adjust.
5. Keep anything inside the gold border safe-area; nothing may touch the border, logos, medal or the signatory block.

### Function contract (isolated and independently testable)
`generate_certificate_pdf(recipient_name, event_name, organization_name, issue_date, certificate_number) -> bytes`
Pure: **no database, no HTTP, no serializers, no Celery, no file saving.** Reading the template image and font from disk is allowed (fixed assets, not user input).

### Long values
- *Simple:* if a value is longer than the sample, first make the letters a bit smaller; if still too long, let it wrap onto another line; if it still cannot fit, refuse rather than print something ugly or overlapping.
- *Technical:* single-line fields (organization line, bottom-left name): measure with `pdfmetrics.stringWidth`, shrink from the maximum to the minimum font size, then wrap if `max_lines > 1`. The body paragraph: start at the maximum font size and reduce until `Paragraph.wrap()` reports a height that fits the box; if the minimum size still does not fit, raise a clear generator error (`FAILED/GENERATION`, safe message "Text does not fit the certificate template.").
- Nothing may overflow the intended area, overlap surrounding text, or break the PDF. Phase 4 must tune field settings and the validation limits (name ≤100, event ≤150, organization ≤100) so **maximum-length allowed values fit**; if a limit must change, update `prd.md` FR-002/FR-003 and `rules.md` §3.4 together.

### Fonts and characters (DEC-012, amended)
- The design uses a classic serif (the body looks like Garamond-style). Bundle a **serif TTF with Latin Extended coverage and a permissive licence** — suggested: **EB Garamond** or **Cormorant Garamond** (both SIL OFL) for the body and dynamic text; **DejaVu Serif** is the fallback. Final choice in Phase 4 after comparing against the design. Include the licence file. Register a regular and a bold variant.
- Must correctly render normal accented Latin names such as **José Álvarez** and **André Müller**.
- **Not supported:** Hindi, Chinese, and other non-Latin scripts (A-10). Characters missing from the font show as blank/boxes — documented limitation.

### Date format
Default display `25 September 2023` (`%d %B %Y`). The sample's superscript ordinal ("25th") is optional polish (`<super>` in the paragraph) and not required.

### Certificate number vs internal UUID (DEC-026)
- **Internal UUID** (`Certificate.id`): primary key, used in URLs, never printed.
- **Certificate number** (`Certificate.certificate_number`): human-readable, printed at the "with Registration Number" position, returned in API JSON. Format `CERT-<issue year>-<12 hex chars of the UUID, uppercase>` (e.g. `CERT-2026-3F9A12BC47D1`), unique by constraint. No counters or complex numbering.

### Storage naming
`certificates/<job_id>/<certificate_id>.pdf` relative to `MEDIA_ROOT` — built only from UUIDs.

### Things to confirm about the supplied design (see `memory.md` OQ-11…OQ-15)
Body wording (the "1st Place … outstanding performance" sentence is dropped); bottom-left block meaning; page-size/re-export choice; that the static "WINNER" medal, "CERTIFICATE OF ACHIEVEMENT" heading and the Head-of-Department signature are acceptable on every certificate; the faint mark near the bottom-right corner of the image and the white box behind the SMIT logo (cosmetic — keep or clean).

---

## 2.13 Configuration (environment variables)

| Variable | Example / default | Purpose |
|---|---|---|
| `DJANGO_SECRET_KEY` | none in production; insecure dev placeholder allowed **only when** `DJANGO_DEBUG=true` | Django signing key |
| `DJANGO_DEBUG` | `false` | Debug mode |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1` | Allowed hosts |
| `DATABASE_URL` | `postgres://USER:PASSWORD@localhost:5432/DBNAME` (placeholders only in `.env.example`) | PostgreSQL connection (DEC-019) |
| `CELERY_BROKER_URL` | `redis://localhost:6379/0` | Redis broker for Celery (DEC-021) |
| `MEDIA_ROOT` | `media/` | Where PDFs are stored (shared by Django and the worker) |
| `MAX_RECIPIENTS_PER_JOB` | `500` | Request limit (FR-002) |
| `STALE_JOB_MINUTES` *(optional, FR-017)* | `30` | Age after which the recovery command treats a job as stuck |

Rules: no real passwords, secret keys, database credentials, or Redis credentials in code or in `.env.example`; `.env` is never committed. Celery settings that are not environment-specific (JSON serializer only, ignore results, no retries) are fixed in `settings.py`. The Celery eager (synchronous) mode is for **tests only**.

### Local development requirements
- **Install/run:** Python, **PostgreSQL** (create an empty database and user), **Redis**.
- **Application processes (two terminals):**
  - Terminal 1: `python manage.py runserver`
  - Terminal 2: `celery -A config worker --loglevel=info`
- PostgreSQL and Redis must be running before starting the processes. Run `python manage.py migrate` once.
- *Windows note:* Celery's default worker pool is unreliable on Windows; if needed use `--pool=solo` (verify in Phase 6 and document in the README).
- Tests need PostgreSQL (the database user must be allowed to create the temporary test database) but **not** Redis and **not** a running worker.

---

## 2.14 Logging and Testing Architecture

### Logging
Standard `logging`, console handler, INFO level (Django process and Celery worker). Log: job created (ID, counts), task queued / queue failure, job claimed or skipped (already claimed), processing finished (final status, counts), every certificate failure (job ID, certificate ID, row number, traceback via `logger.exception`). Never log secrets. No `print()`.

### Testing layers

| Layer | What | Tools |
|---|---|---|
| Unit | `pdf_generator` returns valid PDF bytes; long and accented names; text-fit error; recipient validation rules | `SimpleTestCase`/`TestCase` |
| Service | `create_job`, `process_job`, finalize rules, failure isolation, claim logic | `TestCase`, `unittest.mock.patch` on `certificates.pdf_generator.generate_certificate_pdf` |
| API | Endpoints, status codes, error shape, downloads | DRF `APIClient` / `APITestCase` |
| Celery behaviour | Task args, dispatch after commit, duplicate-processing protection, task→service wiring | `captureOnCommitCallbacks`, patching `.delay`, Celery eager mode |

### How Celery is tested without a worker or Redis
```text
Production:  Django → Celery → Redis → Worker
Tests:       Django → Celery task → synchronous (eager) execution in the same process
```
A shared base test class in `tests/helpers.py` turns Celery eager mode on (`task_always_eager`, `task_eager_propagates`) and restores it afterwards, uses a temporary `MEDIA_ROOT`, and cleans up. (Codex must verify the exact mechanism works with the pinned Celery/Django versions and document it in `memory.md`.) Most service tests call `services.process_job(job_id)` directly — no Celery involved at all.

### Test environment rules
- Tests run against **PostgreSQL** (never SQLite) so `select_for_update()` behaves like production.
- No running Redis or Celery worker required; no network; no sleeps; deterministic.
- Override `MEDIA_ROOT` to a temporary directory (cleaned after).

### Key techniques
- **Force a certificate failure:** patch `certificates.pdf_generator.generate_certificate_pdf` with a fake that raises only for one chosen recipient name; assert that certificate is `FAILED/GENERATION`, all others `GENERATED`, job `COMPLETED_WITH_ERRORS`.
- **Verify failure isolation:** compare statuses of the certificates *after* the failing one.
- **Verify dispatch-after-commit:** wrap the POST/`create_job` in `captureOnCommitCallbacks(execute=False)` with `process_job_task.delay` patched; assert `.delay` was **not** called before the callbacks run, then run them and assert it was called once with `str(job.id)`.
- **Verify the task receives the job UUID:** assert the patched `.delay` call arguments are exactly the job UUID string.
- **Verify duplicate-processing protection:** call `process_job` twice for the same job (second is a no-op), and call it on a job already `PROCESSING`/finished (no changes). A true two-thread race test is **optional** and must not make the suite flaky.
- **Verify worker updates PostgreSQL state:** run the task eagerly and assert database statuses, counts, files.
- **Verify broker-down behaviour:** patch `.delay` to raise; assert job saved, still `PENDING`, API `202`, error logged.

Required test areas map directly to the assignment (see `phases.md` traceability matrix).

---

## 2.15 Interview Guide — answers at a glance

### "Changed requirement" cheat sheet

| Possible change | Where to change | Effort |
|---|---|---|
| Add a field (e.g. `course_hours`) to the certificate | `serializers.py` request serializer → `GenerationJob` model + migration → `template_config.py` (new field slot) + `pdf_generator.py` → tests | Small |
| Move text on the certificate / change font size | `template_config.py` only | Tiny |
| Per-recipient date/course | Recipient serializer + `Certificate` model field + generator argument | Small–medium |
| Require email | One serializer field flag + tests | Tiny |
| Add retries for failed certificates | Service function resets FAILED/GENERATION → PENDING and dispatches; (optionally Celery `autoretry_for`) | Small–medium |
| Move PDFs to S3 | Swap Django storage backend (`django-storages`); workers then no longer need the same filesystem | Medium |
| Add authentication | DRF `DEFAULT_AUTHENTICATION_CLASSES` / permission classes; tests | Small–medium |
| Change max recipients | Environment variable | Tiny |
| Change job status rules | `finalize_job` in `services.py` + tests | Small |
| Add a second worker | Start another `celery -A config worker`; the claim step already protects against duplicate processing | Tiny |

### Likely interview questions → short answers → where in the docs

**Architecture**
- *Why Django + DRF?* ORM, migrations, serializers/validation, admin, test tools in one package → §2.4.
- *Why PostgreSQL?* Concurrent access from API and workers, transactions, row-level locks; job state must be durable and consistent → §2.3, §2.10.
- *Why Celery?* Generation is background work; the request must return immediately; progress is tracked → §2.10.
- *Why Redis?* Simplest Celery broker; carries only notes, not state → §2.3.
- *Why not synchronous?* Slow, fragile for big jobs, nothing to track → §2.10.
- *Why not Python threads?* Tied to the web process, not scalable, manual connection handling → §2.10.
- *Why is PostgreSQL the source of truth?* Redis is a transient mailbox; the API reads only PostgreSQL → §2.1, §2.10.

**Reliability**
- *What if one certificate fails?* Per-certificate `try/except`: logged, recorded as `FAILED`, the rest continue → §2.6.
- *What if the Celery worker crashes?* Job stays `PROCESSING`, finished certificates are safe in PostgreSQL; the recovery command resets and re-dispatches; only `PENDING` certificates are redone → §2.10.
- *What if the same job is processed twice?* The claim step with `select_for_update()` lets only the first win → §2.6, §2.10.
- *Why `transaction.on_commit()`?* So a worker never sees a job UUID before its rows are committed → §2.2, §2.10.
- *Celery says SUCCESS but job is COMPLETED_WITH_ERRORS — how?* Celery state is about the task function; job status is business state in PostgreSQL → §2.10.
- *What if Redis is down at creation?* Job saved, `202`, job stays `PENDING`, recoverable → §2.9.

**Database**
- *Why transactions?* Job + all certificates saved all-or-nothing → §2.2.
- *Why `select_for_update()`?* Row lock so only one worker claims a job → §2.6.
- *Why calculate progress from certificate rows?* No counters to drift out of sync → §2.5.

**PDF generation**
- *Why ReportLab?* Pure Python, exact control of text placement → §2.3.
- *Why a static template?* The assignment needs one predefined design and no editor; static image + overlay is simple and separates design from logic → §2.12.
- *Why not a template editor?* Explicitly not required → `prd.md` non-goals.
- *How are dynamic fields positioned?* Coordinates in `template_config.py`, measured from the image → §2.12.
- *How are long names handled?* The body sentence is a ReportLab paragraph that shrinks to fit its box; single-line fields shrink then wrap; if nothing fits, a clear error → `FAILED/GENERATION` → §2.12.

**Testing**
- *How do you test Celery without a worker?* Eager mode + calling the service directly + patching `.delay` → §2.14.
- *How do you force a failure?* Patch the generator to raise for one recipient → §2.14.
- *How do you verify failure isolation?* Assert the other certificates are `GENERATED` and the job is `COMPLETED_WITH_ERRORS` → §2.14.

---

## 2.16 Decision Log

Superseded decisions are kept as history (not silently deleted).

| ID | Decision | Reason (short) | Alternative | Status |
|---|---|---|---|---|
| DEC-001 | Django + DRF | Fewest moving parts; ORM, validation, tests built in | FastAPI, Flask | Active |
| DEC-002 | ~~SQLite initially~~ | Zero setup | PostgreSQL | **SUPERSEDED by DEC-019** |
| DEC-003 | ReportLab, PDF output (originally with a self-drawn template) | Pure Python, no system deps | WeasyPrint, fpdf2, pypdf overlay | Active; template part **amended by DEC-025** |
| DEC-004 | ~~Background thread default + `sync` mode switch~~ | Progress tracking without infrastructure | Celery | **SUPERSEDED by DEC-020** |
| DEC-005 | Per-recipient validation; accept partial; invalid → `FAILED/VALIDATION` | Assignment demands valid recipients still be generated | Reject whole request | Active |
| DEC-006 | Certificate info is per job | Matches "event/course" scenario; simplest | Per-recipient info | Active |
| DEC-007 | UUID primary keys | Non-guessable public IDs | Auto-increment ints | Active |
| DEC-008 | Progress counts computed from rows | No drift | Stored counters | Active |
| DEC-009 | `MAX_RECIPIENTS_PER_JOB`=500; job detail embeds all results | Bounded size, simple client | Pagination-only | Active |
| DEC-010 | Thin views, logic in `services.py`, PDF in `pdf_generator.py`, thin `tasks.py` | Testability, explainability | Fat views | Active (extended) |
| DEC-011 | Django test runner; tests inside the app | No extra dependency; auto-discovery | pytest | Active (tests now require PostgreSQL) |
| DEC-012 | Bundled serif Unicode TTF font | Accented names must render; design is serif-style | Helvetica only | Active (amended: serif) |
| DEC-013 | Custom error envelope via DRF exception handler | Consistent client experience | DRF defaults | Active |
| DEC-014 | PDFs on configurable local media, served by API views only | Simple, safe | Object storage (S3) | Active |
| DEC-015 | Job status semantics: COMPLETED / COMPLETED_WITH_ERRORS / FAILED | Clear, testable | Boolean flags | Active |
| DEC-016 | No authentication | Out of scope | API keys | Active |
| DEC-017 | `APIView`/generic views with explicit URLs; no ViewSets/routers | Easier to read and explain | ViewSets + routers | Active |
| DEC-018 | `python-dotenv` for `.env` loading | Tiny, keeps secrets out of code | Raw `os.environ` only | Active |
| **DEC-019** | **PostgreSQL** is the relational database (Django ORM stays the abstraction) | Robust concurrent access, transactions, row-level locks | SQLite | Active (supersedes DEC-002) |
| **DEC-020** | **Celery** background tasks for generation; Python threading removed | Request returns instantly; separate restartable workers | Sync; threads | Active (supersedes DEC-004) |
| **DEC-021** | **Redis** as Celery broker only; no result backend; PostgreSQL is the source of truth | Simplest broker; state must be durable | RabbitMQ | Active |
| **DEC-022** | Queue the task via `transaction.on_commit` | Worker must never see uncommitted rows | Queue inside the transaction | Active |
| **DEC-023** | Claim job with `select_for_update()` in a short transaction | Only one worker processes a job | Conditional UPDATE; distributed locks | Active |
| **DEC-024** | Celery task receives only the job UUID string | Small, safe payload; state read from PostgreSQL | Pass recipients | Active |
| **DEC-025** | Template = supplied Recursion design as a static image; ReportLab overlays dynamic text; config in `template_config.py` | Simple; separates design from logic | Redraw design in code; template editor | Active (amends DEC-003) |
| **DEC-026** | `certificate_number` = `CERT-<year>-<12 hex of UUID>`, unique, printed at the "Registration Number" position of the body sentence; UUID stays internal | Simple, no counters | Sequential counter | Active |
| **DEC-027** | If queueing fails: log, job stays `PENDING`, API still `202`, recover via command | Job is already durably saved | Fail the request | Active |
| **DEC-028** | Tests: PostgreSQL required; Celery eager mode; no Redis/worker needed | Deterministic tests with production-like locking | Real Redis in tests | Active |
| **DEC-029** | The body paragraph is **drawn dynamically** (fixed sentence constant + escaped dynamic values in a ReportLab `Paragraph`); baked-in sample text is erased from the asset | The design's text contains sample data and typos that cannot be overwritten | Keep the baked-in text; redraw the whole design | Active |
| **DEC-030** | Page size follows the image's aspect ratio by default; re-export at exact A4 and higher resolution recommended; flatten/compress the image to keep PDFs small | Avoid distortion, soft print and 500 × 1.4 MB | Stretch to A4 | Active (pending OQ-13) |
