# Bulk Certificate Generator

A robust, production-grade backend REST API built with **Django**, **Django REST Framework (DRF)**, **PostgreSQL**, **Celery**, and **Redis** that generates personalized PDF certificates in bulk from a predefined design template.

Clients submit a single JSON request containing event details and a list of participants. The API validates the payload, durably records the job and individual certificate records in PostgreSQL, and dispatches background generation tasks via Celery. A background worker generates high-quality PDF certificates using ReportLab by overlaying dynamic text onto a static template image. The API provides real-time progress tracking, failure isolation, individual PDF downloads, bulk ZIP archive downloads, and stale-job recovery.

---

## Architecture Overview

```text
                           +--------------------------------------------------+
                           |                     Client                       |
                           |       (curl / Postman / Integration Scripts)     |
                           +--------------------------------------------------+
                                     |                             ^
                1. POST /api/jobs/   |                             | 7. Poll status /
                   (202 Accepted)    v                             |    Download PDFs
                           +--------------------+                  |
                           |   Django + DRF     |------------------+
                           |     API Views      |
                           +--------------------+
                              |              |
             2. Atomic commit |              | 3. transaction.on_commit()
                              v              v
           +--------------------+         +--------------------+
           |     PostgreSQL     |         |    Redis Broker    |
           |  (Source of Truth) |         | (Queue: Job UUIDs) |
           +--------------------+         +--------------------+
                              ^                      |
                              | 4. Claim job under   | 4. Dispatch task
                              |    row-level lock    v
                              |         +----------------------+
                              |         |    Celery Worker     |
                              |         |  (services.py logic) |
                              |         +----------------------+
                              |                      |
            6. Update status  |                      | 5. Render dynamic fields
               & error state  |                      v
                              |         +----------------------+
                              |         |    ReportLab PDF     |
                              +---------|   + Static Template  |
                                        +----------------------+
                                                     |
                                                     | 5. Store PDF
                                                     v
                                        +----------------------+
                                        |   Local MEDIA_ROOT   |
                                        | (certificates/{id}/) |
                                        +----------------------+
```

### Key Architectural Boundaries

1. **PostgreSQL is the Authoritative State:** All job lifecycles (`PENDING`, `PROCESSING`, `COMPLETED`, `COMPLETED_WITH_ERRORS`, `FAILED`) and certificate statuses (`PENDING`, `GENERATED`, `FAILED`) are tracked strictly in PostgreSQL. Redis is used solely as a message broker for task dispatch—never as a database or result backend.
2. **Transaction-Safe Async Dispatch (`transaction.on_commit`):** Background Celery tasks are dispatched strictly *after* the database transaction commits. This prevents race conditions where a worker attempts to process a job before its rows are visible in PostgreSQL.
3. **Idempotent Job Claiming (`select_for_update`):** Workers claim jobs using a short, row-level lock in PostgreSQL (`SELECT ... FOR UPDATE`). If multiple worker processes receive the same job ID or duplicate messages arrive, only the first worker transitions the job to `PROCESSING`; subsequent workers safely exit without duplicating work.
4. **Per-Certificate Failure Isolation:** If PDF generation fails for a specific recipient (e.g., malformed recipient data, drawing fit issues, or disk I/O errors), that certificate is marked `FAILED` with a sanitized error message and the loop continues. A single failure never halts or crashes the remaining certificates in the batch.
5. **Isolated PDF Generator:** The PDF rendering engine (`certificates/pdf_generator.py`) is a pure function decoupled from Django models, HTTP requests, serializers, and Celery. It takes raw string/date inputs and returns in-memory PDF bytes.

---

## Technology Stack

- **Backend Framework:** Python 3.11+, Django 5.2 (LTS), Django REST Framework 3.18
- **Database:** PostgreSQL 14+ (tested against PostgreSQL 17.11)
- **Database Driver:** `psycopg` 3.3 (binary)
- **Task Queue & Broker:** Celery 5.6 with Redis 8.10 (Redis broker only, `task_ignore_result=True`)
- **PDF Generation:** ReportLab 5.0, Pillow 12.3
- **Configuration & Environment:** `python-dotenv`, `dj-database-url`

---

## Prerequisites

Before setting up the project, ensure the following software is installed and accessible on your host machine:

1. **Python 3.11+**
2. **PostgreSQL 14+** (running locally on port `5432`)
3. **Redis 7+** (running locally on port `6379`)

---

## Local Setup & Installation

### 1. Clone & Set Up Virtual Environment

```bash
# Clone the repository and navigate into the project directory
cd "bulk-certificate-generator"

# Create a virtual environment
python -m venv .venv

# Activate the virtual environment
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Windows (cmd):
.\.venv\Scripts\activate.bat
# Linux / macOS:
source .venv/bin/activate

# Install pinned dependencies
pip install -r requirements.txt
```

### 2. Configure PostgreSQL Database

Ensure PostgreSQL is running. Open your PostgreSQL CLI (`psql`) or database GUI and create the application database and user:

```sql
CREATE DATABASE bulk_certificates;
CREATE USER bulk_certificates_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE bulk_certificates TO bulk_certificates_user;
ALTER USER bulk_certificates_user CREATEDB; -- Required for running Django automated test suite
```

### 3. Configure Environment Variables

Copy the provided `.env.example` file to `.env`:

```bash
# Windows PowerShell:
Copy-Item .env.example .env

# Linux / macOS:
cp .env.example .env
```

Update `.env` with your local database credentials and a secret key:

```ini
DJANGO_DEBUG=true
DJANGO_SECRET_KEY=replace-with-a-unique-local-secret-key-for-development
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgresql://bulk_certificates_user:your_secure_password@localhost:5432/bulk_certificates
CELERY_BROKER_URL=redis://localhost:6379/0
MEDIA_ROOT=media
MAX_RECIPIENTS_PER_JOB=500
STALE_JOB_MINUTES=15
```

### 4. Apply Database Migrations

Apply database schema migrations to PostgreSQL:

```bash
python manage.py migrate
```

Verify that system checks pass and no migrations are pending:

```bash
python manage.py check
python manage.py makemigrations --check --dry-run
```

---

## Running the Application

Running the application locally requires two terminal processes alongside the active PostgreSQL and Redis servers.

### Terminal 1: Django Web Server

```bash
python manage.py runserver
```
The REST API will be available at `http://localhost:8000/api/`.

### Terminal 2: Celery Worker Process

```bash
# Windows note: Celery on Windows requires the solo execution pool
celery -A config worker --loglevel=info --pool=solo

# Linux / macOS:
celery -A config worker --loglevel=info
```

---

## Running the Automated Test Suite

The test suite runs against the real PostgreSQL database, verifying schema constraints, transactional rollbacks, and API serialization.

> **Note:** Running tests does **not** require Redis or a running Celery worker. Tests use Celery's in-process eager mode (`CELERY_TASK_ALWAYS_EAGER=True`) with isolated temporary media storage.

```bash
python manage.py test --verbosity 2
```

### Test Suite Verification Status
- **Total Tests:** 140 passed
- **Execution Time:** ~5.4 seconds
- **Stability:** Zero flakiness verified across 3 consecutive complete suite runs
- **Coverage Areas:** Job creation atomicity, request/recipient validation, template PDF rendering, status progress, per-certificate failure isolation, metadata retrieval, binary streaming, bulk ZIP download, stale-job management commands, and Django admin registration.

---

## API Documentation & Usage

All API endpoints are prefixed with `/api/`. Requests and responses use JSON (except binary PDF and ZIP downloads).

### Summary of Available Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/jobs/` | Submit a bulk certificate generation job |
| `GET` | `/api/jobs/` | List all generation jobs (paginated, newest first) |
| `GET` | `/api/jobs/{job_id}/` | Get job status, progress counts, and certificate results |
| `GET` | `/api/jobs/{job_id}/certificates/` | List certificates in a job (paginated; filterable with `?status=`) |
| `GET` | `/api/jobs/{job_id}/download/` | Download all generated certificates as a single ZIP archive |
| `GET` | `/api/certificates/{cert_id}/` | Get metadata for a specific certificate |
| `GET` | `/api/certificates/{cert_id}/download/` | Download an individual certificate PDF file |

---

### Detailed Endpoint Specifications

#### 1. Submit a Bulk Certificate Job

- **Method & Path:** `POST /api/jobs/`
- **Status Code:** `202 Accepted` (returns immediately; does not block on PDF generation)
- **Request Body:**

```bash
curl -X POST http://localhost:8000/api/jobs/ \
  -H "Content-Type: application/json" \
  -d '{
    "event_name": "Full Stack Engineering Workshop 2026",
    "organization_name": "Antigravity Academy",
    "issue_date": "2026-10-08",
    "recipients": [
      {"name": "Ada Lovelace", "email": "ada@example.com"},
      {"name": "Alan Turing", "email": "alan@example.com"},
      {"name": "", "email": "invalid-email"}
    ]
  }'
```

- **Response (`202 Accepted`):**

```json
{
  "id": "e4da7a17-3b4a-48dc-aed3-c750c6ad94d3",
  "status": "PENDING",
  "event_name": "Full Stack Engineering Workshop 2026",
  "organization_name": "Antigravity Academy",
  "issue_date": "2026-10-08",
  "progress": {
    "total": 3,
    "generated": 0,
    "failed": 1,
    "pending": 2,
    "percent_complete": 33.3
  },
  "created_at": "2026-10-08T18:00:00Z",
  "started_at": null,
  "finished_at": null,
  "error_message": "",
  "certificates": [
    {
      "id": "14b11094-349c-4860-9d5e-69ebc30c9ab6",
      "row_number": 1,
      "certificate_number": "CERT-2026-14B11094349C",
      "recipient_name": "Ada Lovelace",
      "recipient_email": "ada@example.com",
      "status": "PENDING",
      "error": null,
      "download_url": null
    },
    {
      "id": "21930c55-983e-4f42-8aa7-fd63a37d079c",
      "row_number": 2,
      "certificate_number": "CERT-2026-21930C55983E",
      "recipient_name": "Alan Turing",
      "recipient_email": "alan@example.com",
      "status": "PENDING",
      "error": null,
      "download_url": null
    },
    {
      "id": "4fac15ab-43e9-4e0c-bd56-374a54395431",
      "row_number": 3,
      "certificate_number": "CERT-2026-4FAC15AB43E9",
      "recipient_name": "",
      "recipient_email": "invalid-email",
      "status": "FAILED",
      "error": {
        "type": "VALIDATION",
        "message": "name: This field may not be blank. email: Enter a valid email address."
      },
      "download_url": null
    }
  ],
  "status_url": "http://localhost:8000/api/jobs/e4da7a17-3b4a-48dc-aed3-c750c6ad94d3/"
}
```

*Note on Validation Behavior:* Malformed recipient rows (such as row 3 above) do not reject the entire request. They are persisted immediately as `FAILED` with `type: VALIDATION` and specific field error messages, while valid recipients proceed to generation.

---

#### 2. Check Job Status & Progress

- **Method & Path:** `GET /api/jobs/{job_id}/`
- **Status Code:** `200 OK`

```bash
curl http://localhost:8000/api/jobs/e4da7a17-3b4a-48dc-aed3-c750c6ad94d3/
```

- **Response (`200 OK`):**

```json
{
  "id": "e4da7a17-3b4a-48dc-aed3-c750c6ad94d3",
  "status": "COMPLETED_WITH_ERRORS",
  "event_name": "Full Stack Engineering Workshop 2026",
  "organization_name": "Antigravity Academy",
  "issue_date": "2026-10-08",
  "progress": {
    "total": 3,
    "generated": 2,
    "failed": 1,
    "pending": 0,
    "percent_complete": 100.0
  },
  "created_at": "2026-10-08T18:00:00Z",
  "started_at": "2026-10-08T18:00:01Z",
  "finished_at": "2026-10-08T18:00:03Z",
  "error_message": "",
  "certificates": [
    {
      "id": "14b11094-349c-4860-9d5e-69ebc30c9ab6",
      "row_number": 1,
      "certificate_number": "CERT-2026-14B11094349C",
      "recipient_name": "Ada Lovelace",
      "recipient_email": "ada@example.com",
      "status": "GENERATED",
      "error": null,
      "download_url": "http://localhost:8000/api/certificates/14b11094-349c-4860-9d5e-69ebc30c9ab6/download/"
    },
    {
      "id": "21930c55-983e-4f42-8aa7-fd63a37d079c",
      "row_number": 2,
      "certificate_number": "CERT-2026-21930C55983E",
      "recipient_name": "Alan Turing",
      "recipient_email": "alan@example.com",
      "status": "GENERATED",
      "error": null,
      "download_url": "http://localhost:8000/api/certificates/21930c55-983e-4f42-8aa7-fd63a37d079c/download/"
    },
    {
      "id": "4fac15ab-43e9-4e0c-bd56-374a54395431",
      "row_number": 3,
      "certificate_number": "CERT-2026-4FAC15AB43E9",
      "recipient_name": "",
      "recipient_email": "invalid-email",
      "status": "FAILED",
      "error": {
        "type": "VALIDATION",
        "message": "name: This field may not be blank. email: Enter a valid email address."
      },
      "download_url": null
    }
  ],
  "status_url": "http://localhost:8000/api/jobs/e4da7a17-3b4a-48dc-aed3-c750c6ad94d3/"
}
```

---

#### 3. Download an Individual Certificate PDF

- **Method & Path:** `GET /api/certificates/{certificate_id}/download/`
- **Status Code:** `200 OK` (Streams binary PDF)
- **Response Headers:**
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="CERT-2026-14B11094349C.pdf"`

```bash
curl -O -J http://localhost:8000/api/certificates/14b11094-349c-4860-9d5e-69ebc30c9ab6/download/
```

---

#### 4. Bulk Download Job Certificates as ZIP

- **Method & Path:** `GET /api/jobs/{job_id}/download/`
- **Status Code:** `200 OK` (Streams binary ZIP archive)
- **Response Headers:**
  - `Content-Type: application/zip`
  - `Content-Disposition: attachment; filename="job_e4da7a17-3b4a-48dc-aed3-c750c6ad94d3_certificates.zip"`

```bash
curl -O -J http://localhost:8000/api/jobs/e4da7a17-3b4a-48dc-aed3-c750c6ad94d3/download/
```
The ZIP file contains only successfully `GENERATED` certificates named deterministically in the format `{row_number:04d}_{certificate_number}.pdf` (e.g. `0001_CERT-2026-14B11094349C.pdf`). Returns `409 Conflict` if no certificates were generated.

---

#### 5. Filter Job Certificates by Status

- **Method & Path:** `GET /api/jobs/{job_id}/certificates/?status=FAILED&page=1`
- **Status Code:** `200 OK`

```bash
curl "http://localhost:8000/api/jobs/e4da7a17-3b4a-48dc-aed3-c750c6ad94d3/certificates/?status=FAILED"
```

- **Response (`200 OK`):**

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "4fac15ab-43e9-4e0c-bd56-374a54395431",
      "row_number": 3,
      "certificate_number": "CERT-2026-4FAC15AB43E9",
      "recipient_name": "",
      "recipient_email": "invalid-email",
      "status": "FAILED",
      "error": {
        "type": "VALIDATION",
        "message": "name: This field may not be blank. email: Enter a valid email address."
      },
      "download_url": null
    }
  ]
}
```

---

### Standardized Error Envelope

All API errors return a uniform JSON error envelope:

```json
{
  "error": {
    "code": "validation_error",
    "message": "The request data is invalid.",
    "details": {
      "recipients": ["Ensure this field has at least 1 element."]
    }
  }
}
```

#### Documented Error Codes & HTTP Statuses
- `400 Bad Request` (`validation_error`): Request body is missing required fields, contains invalid dates, exceeds maximum recipients, or passes an invalid filter parameter.
- `404 Not Found` (`not_found`): Resource not found or malformed UUID provided.
- `405 Method Not Allowed` (`method_not_allowed`): Unsupported HTTP method.
- `409 Conflict` (`certificate_not_available`): Certificate PDF requested before generation completes or after generation failed; or ZIP requested when 0 certificates were generated.
- `415 Unsupported Media Type` (`unsupported_media_type`): Non-JSON payload sent to JSON endpoints.

---

## Management Command: Stale-Job Recovery

If a worker process is abruptly killed mid-job, or if Redis is temporarily unreachable during job dispatch, jobs may remain stuck in `PROCESSING` or `PENDING`.

The management command `process_pending_jobs` safely discovers and recovers stuck jobs:

```bash
# Check and re-dispatch jobs older than the default 15 minutes:
python manage.py process_pending_jobs

# Custom age threshold:
python manage.py process_pending_jobs --older-than-minutes 5
```

### Recovery Semantics
- **Stale `PENDING` Jobs:** Re-dispatched through Celery using `transaction.on_commit()`.
- **Stale `PROCESSING` Jobs:** Atomically reset to `PENDING` under a PostgreSQL `select_for_update()` row lock and re-dispatched. Because the processing engine skips certificates that are already marked `GENERATED`, finished certificates are never regenerated.

---

## Design Decisions & Technical Rationale

### 1. Framework: Django + Django REST Framework
Django provides a mature ORM with native PostgreSQL transaction management, database migrations, connection handling, and security protections. DRF provides serializers for validation and structured API error handling.

### 2. Relational State: PostgreSQL
PostgreSQL is the single source of truth. Bulk certificate generation involves concurrent operations (web server creating jobs, workers claiming jobs, clients polling status). PostgreSQL's ACID transactions, explicit row locking (`select_for_update`), and compound indexes ensure data integrity under concurrent loads.

### 3. Background Processing: Celery + Redis (Why Not Synchronous or Threads?)
- **Why Not Synchronous?** Generating 500 ReportLab PDFs takes ~50 seconds. A synchronous endpoint would block web server worker threads, trigger HTTP gateway timeouts (e.g. Nginx 60s timeout), and render client-side progress polling impossible.
- **Why Not Python Threading?** In-memory daemon threads live and die with the web server process. If Django restarts, crashes, or reloads, background threads terminate abruptly, leaving half-finished, unrecoverable state. Furthermore, Python's GIL prevents true parallelism for CPU-bound generation, and thread execution cannot be scaled across multiple machines.
- **Why Celery + Redis?** Celery isolates heavy CPU work in separate, supervisor-managed worker processes. Redis acts as a lightweight, in-memory broker. This architecture allows workers to restart independently without disrupting web traffic.

### 4. Celery Task State vs. Authoritative Job Status
Celery task state indicates only whether the Python worker function finished or crashed. It does not reflect business domain logic. If 3 out of 10 certificates fail validation or rendering, Celery marks the task as `SUCCESS`, but the business status in PostgreSQL is `COMPLETED_WITH_ERRORS`. The API only ever exposes PostgreSQL status.

### 5. Template Strategy & ReportLab Overlay
- **Predefined Template:** An existing certificate design from the Recursion club at Sikkim Manipal Institute of Technology (SMIT) was used as the static template background.
- **Asset Preparation:** Dynamic text areas from the original template (sample names, workshop title, dates, and blanks) were cleanly removed from the background PNG (`certificates/assets/certificate_template.png`).
- **Dynamic Overlay:** ReportLab draws recipient names, event names, organization names, dates, and unique certificate numbers onto the canvas with exact coordinate positioning and automatic font scaling.
- **Typography:** Bundled SIL Open Font License (OFL) serif fonts (Cormorant Garamond Regular and Bold) ensure typography matches the template and renders accented Latin characters (e.g., `José Álvarez`, `André Müller`).

### 6. Certificate Numbers vs. Internal UUIDs
- **Internal UUID (`Certificate.id`):** Used as the primary key in database queries and API URLs (`/api/certificates/<uuid>/`). Never printed on certificates.
- **Public Certificate Number (`Certificate.certificate_number`):** Human-readable, alphanumeric identifier formatted as `CERT-<issue_year>-<12_hex_chars>` (e.g., `CERT-2026-14B11094349C`). Printed in the certificate body text and included in API metadata.

### 7. What We Would Do at Production Scale
For multi-node enterprise scale:
1. **Object Storage:** Store PDFs in AWS S3 or Google Cloud Storage using `django-storages` with pre-signed download URLs, eliminating the requirement for workers and web servers to share a local filesystem.
2. **Database Connection Pooling:** Deploy PgBouncer in front of PostgreSQL to handle high volumes of concurrent worker connections.
3. **Chunked Task Fan-Out:** Split a 500-recipient job into 10 Celery subtasks of 50 recipients each across a distributed worker pool, reducing total batch time from 50s to under 5s.
4. **Celery `acks_late` & Dead-Letter Queues:** Enable `acks_late=True` so killed worker tasks are automatically returned to the broker queue.

---

## Known Limitations & Documented Assumptions

1. **No Authentication:** In accordance with the assignment specification, API endpoints do not require authentication or API keys.
2. **Recipient Limit:** Each job is capped at `MAX_RECIPIENTS_PER_JOB=500` (configurable in `.env`).
3. **Latin Character Set:** Names must be in Latin script (accents like `é`, `ü`, `ñ` are supported). Non-Latin scripts (e.g., Devanagari, Cyrillic, CJK) are not supported by the bundled serif font.
4. **Shared Storage:** Web server and Celery worker must have access to the same local `MEDIA_ROOT` folder.
5. **No Automatic Retries:** Individual generation failures are recorded and isolated, but the system does not automatically retry failed certificates.

---

## Scale Benchmark Results (Verified Phase 10)

A live end-to-end benchmark was executed with 500 recipients against PostgreSQL 17.11, Redis 8.10, and a live Celery worker:

| Metric | Measured Result |
|---|---|
| **Recipients Count** | 500 recipients |
| **API Submission Latency (`POST /api/jobs/`)** | 0.352 s |
| **Worker Processing Duration** | 49.63 s |
| **Total Wall-Clock Polling Duration** | 50.31 s |
| **Average Generation Throughput** | 10.07 certificates / sec (99.3 ms / cert) |
| **Minimum PDF Size** | 387,436 bytes (378.4 KB) |
| **Maximum PDF Size** | 387,685 bytes (378.6 KB) |
| **Average PDF Size** | 387,487 bytes (378.4 KB) |
| **Total PDF Storage Generated** | 184.77 MB across 500 files |
| **Bulk ZIP Generation & Download Time** | 16.47 s (152.41 MB archive) |
| **ZIP Archive Integrity** | 100% (500 valid PDFs with `%PDF` header & `%%EOF`) |

---

## Repository Structure

```text
bulk-certificate-generator/
├── manage.py                               # Django CLI entrypoint
├── README.md                               # Comprehensive project documentation
├── requirements.txt                        # Pinned dependencies
├── .env.example                            # Template environment configuration
├── .gitignore                              # Git exclusion rules (.env, media/, etc.)
├── config/                                 # Django project configuration
│   ├── __init__.py                         # Imports Celery app on startup
│   ├── celery.py                           # Celery app initialization
│   ├── settings.py                         # Application settings (PostgreSQL, DRF, Celery)
│   ├── urls.py                             # Root URL routing & custom 404 handler
│   ├── wsgi.py                             # WSGI entrypoint
│   └── asgi.py                             # ASGI entrypoint
├── certificates/                           # Core application
│   ├── admin.py                            # Django Admin model registrations
│   ├── api_errors.py                       # Standardized JSON error envelope handler
│   ├── models.py                           # GenerationJob & Certificate PostgreSQL models
│   ├── pagination.py                       # DRF PageNumberPagination configuration
│   ├── pdf_generator.py                    # Pure ReportLab PDF generation logic
│   ├── serializers.py                      # Request, recipient, and response serializers
│   ├── services.py                         # Business logic: create, claim, process, zip, recover
│   ├── tasks.py                            # Celery task entrypoint (process_job_task)
│   ├── template_config.py                  # Certificate coordinates, typography, and constants
│   ├── urls.py                             # REST API route definitions
│   ├── assets/
│   │   ├── certificate_template.png        # Cleaned background template asset
│   │   └── fonts/                          # Bundled Cormorant Garamond TTFs + OFL license
│   ├── management/
│   │   └── commands/
│   │       └── process_pending_jobs.py     # Stale-job recovery management command
│   ├── migrations/
│   │   └── 0001_initial.py                 # Initial PostgreSQL schema migration
│   └── tests/                              # Comprehensive test suite (140 tests)
│       ├── helpers.py                      # Celery eager test case base & test fixtures
│       ├── test_celery_processing.py       # Async task dispatch & idempotency tests
│       ├── test_failure_handling.py        # Failure isolation & error envelope tests
│       ├── test_foundation.py              # Configuration & admin registration tests
│       ├── test_job_creation.py            # Job creation & request atomicity tests
│       ├── test_job_status.py              # Status progress & lifecycle tests
│       ├── test_management_command.py      # Stale-job recovery command tests
│       ├── test_models.py                  # Model constraints, indexes & progress tests
│       ├── test_pdf_generation.py          # ReportLab rendering & typography tests
│       ├── test_retrieval.py               # Metadata, PDF download & ZIP download tests
│       └── test_validation.py              # Request & recipient validation tests
└── docs/                                   # Project specification documents
    ├── prd.md                              # Product Requirements Document
    ├── architecture.md                     # System Architecture & Technical Specifications
    ├── rules.md                            # Development Rules & Coding Standards
    ├── phases.md                           # Phased Implementation Plan & Traceability Matrix
    └── memory.md                           # Living Project Memory & Status Checkpoint
```
