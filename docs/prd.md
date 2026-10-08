# Product Requirements Document (PRD) — Bulk Certificate Generator

| | |
|---|---|
| **Version** | 1.2 (final architecture + template analysis of the supplied Recursion design) |
| **Date** | 2026-10-08 |
| **Status** | Draft — awaiting developer review |
| **Answers the question** | **WHAT are we building, and WHY?** |
| **Authority order** | Original assignment > `prd.md` > `architecture.md` > `rules.md` > `phases.md` > `memory.md` |
| **Revision note** | v1.1 migrates the *implementation choices* (SQLite + threads → PostgreSQL + Celery + Redis; self-drawn template → supplied static template). **No requirement from the original assignment was removed or weakened.** These technologies are OUR choices; the assignment does not require them. |
| **Template note (v1.2)** | The supplied image was analysed. It contains baked-in sample text (a sample workshop title, dates, "1st Place" wording, a sample name) and dotted blanks, so a **cleaned copy** is required and the body sentence must be drawn dynamically (A-12, A-13, A-17…A-20). |

### Legend used in all five documents

| Tag | Meaning |
|---|---|
| **[REQUIRED]** | Stated directly by the assignment. Must be delivered. |
| **[IMPLICIT]** | Not stated, but a professional implementation needs it. Treated as required. |
| **[RECOMMENDED]** | Small improvement that meaningfully helps. Build only after every REQUIRED/IMPLICIT item works. |
| **[OPTIONAL]** | Nice to have. Build only if time remains. Must never delay required work. |
| **[FUTURE]** | Production-scale idea. Documented only. Never built for this assignment. |

---

## 1.1 Product Overview

**In simple words:** An organization finishes an event or course and wants to give every participant a certificate. Instead of making certificates one by one, the organization sends *one* request containing the event details and the *list of participants*. Our system creates a PDF certificate for each participant, keeps track of how many succeeded or failed, and lets the organization download the results.

**Technical view:** A REST API (built with Django + Django REST Framework) that accepts a bulk "certificate generation job", validates it, produces one PDF per valid recipient by overlaying the recipient-specific text onto a single predefined certificate template (the Recursion club design), records per-certificate and per-job status in **PostgreSQL**, hands the generation work to **Celery** background workers (with **Redis** as the message broker), and exposes endpoints for progress tracking and retrieval.

**Key idea — the "job":** A *job* is a record that says "please generate these certificates". The client receives a job ID right away and can come back later to ask "how is my job going?" This is the same idea as a restaurant giving you an order number instead of making you stand at the counter until the food is ready.

**How the work gets done (final architecture, in simple words):** the API saves the job in PostgreSQL and then drops a small note ("please process job #123") into a waiting line kept by Redis. A separate worker program (Celery) picks up that note, reads the job from PostgreSQL, produces the certificates one by one, and writes the results back to PostgreSQL. **PostgreSQL always holds the truth** about each job and certificate; Redis only carries the note.

---

## 1.2 Problem Statement

An organization needs certificates for a large number of participants. Making one API call per certificate is slow, error-prone, and hard to track. We must build a backend that:

1. accepts **one request** containing many recipients,
2. **validates** the recipient data,
3. **generates** a certificate per valid recipient from **one predefined template**,
4. **tracks** the generation status,
5. lets the client **check progress and results**, and
6. lets the client **retrieve** generated certificates,

while making sure that **one bad recipient, or one failed certificate, does not stop the others.**

---

## 1.3 Goals

| ID | Goal |
|---|---|
| G-1 | Bulk-first API: one request can contain many recipients. |
| G-2 | Per-recipient validation and clear reporting of what was wrong. |
| G-3 | Reliable generation: failure of one certificate never blocks the rest (failure isolation). |
| G-4 | Transparent tracking: the client can always tell which certificates succeeded, failed, or are pending, and why. |
| G-5 | Simple retrieval of each generated certificate (and, as a recommended extra, all at once). |
| G-6 | A codebase the developer can **fully understand, explain, debug, and modify** in an interview. |
| G-7 | Tests and a README that meet the assignment's minimum list. |

---

## 1.4 Non-Goals (explicitly NOT building)

- A certificate template editor, multiple certificate designs, or client-uploaded templates.
- User accounts, login, roles, or API keys (see Assumption A-6).
- Sending certificates by email or any other delivery channel.
- CSV/Excel upload (the request body is JSON).
- Extra infrastructure beyond PostgreSQL, Redis and Celery: RabbitMQ, Kafka, Kubernetes, microservices, S3/cloud storage, distributed locks, complex monitoring stacks.
- Certificate verification portals, QR codes, digital signatures.
- Payments, multi-tenancy, organizations/teams, billing.
- A frontend (deferred; see `phases.md` §4.3). The backend/API is the assignment.
- Automatic deletion/retention of old files.
- Retry APIs, retry endpoints, or automatic business-level retries of failed certificates (Celery retries are a future possibility only).

---

## 1.5 Target Users

| User | Description | How they use the system |
|---|---|---|
| **Event / course organizer** (via an API client) | Person or system that owns the participant list. | Submits a bulk job, checks progress, downloads certificates. |
| **API client / integrator** | A script, `curl`, Postman, or another service calling the API. | Same as above, programmatically. Needs clear JSON and status codes. |
| **Future frontend user** *(deferred)* | A person using a web UI that sits on top of this API. | Not built now. The API must be clean enough to support this later. |
| **Reviewer / interviewer** | Reads the code and asks questions. | Needs readable code, documented decisions, and passing tests. |

---

## 1.6 Core Features

### Must Have (REQUIRED / IMPLICIT)

| Feature | Source |
|---|---|
| Submit one request with certificate info + many recipients | REQUIRED |
| Request-level and per-recipient validation | REQUIRED |
| Generate a PDF certificate per valid recipient from one template | REQUIRED |
| Per-certificate and per-job status tracking | REQUIRED |
| Failure isolation (one failure doesn't stop others) | REQUIRED |
| Job status/progress endpoint that shows successes and failures | REQUIRED |
| Retrieve generated certificates | REQUIRED |
| Documented processing choice (background generation with Celery + Redis on PostgreSQL) with reasoning | REQUIRED |
| Tests for the six areas listed by the assignment | REQUIRED |
| README with setup/run/test/usage/design decisions | REQUIRED |
| Consistent JSON errors and correct HTTP status codes | IMPLICIT |
| Safe file storage and safe file serving | IMPLICIT |
| Configurable maximum recipients per job | IMPLICIT |
| Correct rendering of normal accented names (e.g. "José Álvarez") | IMPLICIT |
| Single predefined template: the supplied Recursion certificate design, kept static; only recipient-specific text is overlaid | REQUIRED |
| Job + certificate rows committed to PostgreSQL **before** the Celery task is queued (`transaction.on_commit`) | IMPLICIT |
| Protection against the same job being processed twice by concurrent workers | IMPLICIT |
| Human-readable certificate number (shown at the "Registration Number" position of the certificate's body sentence), separate from the internal UUID | IMPLICIT |

### Recommended

| Feature | Why |
|---|---|
| List jobs endpoint (paginated) | Lets a client find earlier jobs. |
| List a job's certificates with `?status=` filter and pagination | Easy way to see only failures in a big job. |
| Download all generated certificates of a job as one ZIP | Natural for "bulk" — one download instead of hundreds. |
| Recovery command for stuck/interrupted jobs (worker crash, failed dispatch) | Celery does not by itself guarantee business-level completion; this makes the design honest. |
| Django admin registration of models | Free, fast inspection of data while developing/demoing. |

### Optional (only after everything above is done)

| ID | Feature |
|---|---|
| OPT-001 | Retry endpoint for failed certificates |
| OPT-002 | Certificate verification endpoint / QR code |
| OPT-003 | OpenAPI/Swagger docs (e.g. `drf-spectacular`) |
| OPT-004 | Idempotency key on job creation (avoid duplicate jobs on client retry) |
| OPT-005 | Simple API-key authentication |
| OPT-006 | Per-recipient overrides (e.g. custom date or course) |
| OPT-007 | Frontend (deferred, later phase) |

### Future / scaling only (documented, never built)

S3/object storage, Celery automatic retries and dead-letter handling, dedicated queues, PostgreSQL connection pooling, webhooks, rate limiting, retention/cleanup jobs, metrics/monitoring (e.g. Flower). See `architecture.md` §2.11.

---

## 1.7 User Stories

| ID | Story |
|---|---|
| US-01 | As an event organizer, I want to submit a list of participants in one request so that certificates are generated in bulk. |
| US-02 | As an event organizer, I want invalid participant rows to be reported clearly, without blocking valid participants, so that one typo doesn't ruin the whole batch. |
| US-03 | As an API client, I want to receive a job ID immediately so that my request doesn't hang while hundreds of PDFs are produced. |
| US-04 | As an organizer, I want to check a job's progress (total / generated / failed / pending) so that I know when it's finished. |
| US-05 | As an organizer, I want to see exactly *which* recipients failed and *why* so that I can fix and resubmit them. |
| US-06 | As an organizer, I want to download an individual participant's certificate PDF so that I can send it to them. |
| US-07 | *(Recommended)* As an organizer, I want to download all certificates of a job as one ZIP so that I don't make hundreds of downloads. |
| US-08 | As a developer/maintainer, I want clear errors (404, 400, 409) so that I can debug integrations quickly. |
| US-09 | As the candidate (developer), I want simple, well-documented code so that I can explain and modify it in the interview. |

---

## 1.8 Functional Requirements

Priority: **M** = Must (REQUIRED/IMPLICIT), **R** = Recommended. Source: **E** = Explicit in assignment, **I** = Implicit.

| ID | Priority / Source | Requirement (clear and testable) |
|---|---|---|
| **FR-001** | M / E | The system SHALL provide one endpoint that accepts a single request containing job-level certificate information (`event_name`, `organization_name`, optional `issue_date`) and a list of `recipients`. |
| **FR-002** | M / E+I | The system SHALL validate the **request as a whole** and respond `400` **without creating a job** if: the body is not a JSON object; `event_name` or `organization_name` is missing/blank/too long (limits: 150 / 100 chars); `issue_date` is not a valid ISO date (`YYYY-MM-DD`); `recipients` is missing, not a list, empty, or longer than `MAX_RECIPIENTS_PER_JOB` (default 500). |
| **FR-003** | M / E | The system SHALL validate **each recipient independently**: `name` is required, a string, non-blank after trimming, ≤ 100 chars, no control characters/newlines; `email` is optional but, if present, must be a valid email (≤ 254 chars); a recipient that is not a JSON object is invalid. An invalid recipient SHALL be recorded (with its position `row_number`, whatever name/email could be read, and a human-readable error) with status `FAILED` and error type `VALIDATION`. Invalid recipients SHALL NOT prevent valid recipients from being processed. |
| **FR-004** | M / E+I | On a valid request the system SHALL, in one all-or-nothing PostgreSQL transaction, create one job (unique UUID) and one certificate record per submitted recipient (valid and invalid), and — only **after that transaction has committed** — queue a Celery task (see FR-019), then respond `202 Accepted` with the job ID, status, progress counts, and the URL for checking status. The response SHALL NOT wait for certificates to be generated. |
| **FR-005** | M / E | For every valid recipient the system SHALL generate exactly one PDF from the single predefined template (FR-022) containing: recipient name, event name, organization name, issue date, and the certificate number (FR-021). |
| **FR-006** | M / E | **Failure isolation:** if generating or saving one certificate raises any error, the system SHALL mark only that certificate `FAILED` (error type `GENERATION`), log the full technical error, and continue with the remaining certificates. |
| **FR-007** | M / E | Each certificate record SHALL track a status (`PENDING`, `GENERATED`, `FAILED`); a unique human-readable `certificate_number`; for failures an error type and safe error message; for successes a generation timestamp and a stored file reference. |
| **FR-008** | M / E | Each job SHALL track a lifecycle status — `PENDING`, `PROCESSING`, `COMPLETED` (all generated), `COMPLETED_WITH_ERRORS` (≥1 generated and ≥1 failed), `FAILED` (no certificate generated, or an unexpected job-level crash) — plus `created_at`, `started_at`, `finished_at`. |
| **FR-009** | M / E | A job-status endpoint SHALL return the job's details, **progress counts** (`total`, `generated`, `failed`, `pending`, `percent_complete`), and a per-recipient result list (position, name, email, status, error if any, download URL if generated), so successful and failed generations are identifiable. |
| **FR-010** | M / E | The system SHALL let a client (a) fetch a certificate's metadata and (b) download the generated PDF (`Content-Type: application/pdf`). |
| **FR-011** | M / I | Errors SHALL use one consistent JSON shape and correct status codes: `400` validation, `404` unknown job/certificate, `409` download requested for a certificate that is not `GENERATED`. Responses SHALL NOT leak stack traces or file-system paths. |
| **FR-012** | M / E | All job and certificate state SHALL be stored in **PostgreSQL** via the Django ORM, with the schema managed by migrations. Application state SHALL NOT be stored in Redis. |
| **FR-013** | M / I | Generated PDFs SHALL be stored under a configurable media directory using **server-generated** file names (never derived from user input) and SHALL be served only through API views. |
| **FR-019** | M / I | **Celery dispatch:** job processing SHALL run as a Celery background task that receives **only the job UUID** (as a string), never recipient data. The task SHALL be queued through `transaction.on_commit(...)`, so it is never queued before the job and certificate rows are committed. If queueing fails (e.g. Redis down), the failure is logged, the job stays `PENDING`, and the API response is still `202` (recoverable via FR-017). |
| **FR-020** | M / I | **No duplicate processing:** at most one worker SHALL actively process a given job. A worker SHALL claim a job (`PENDING → PROCESSING`) inside a short PostgreSQL transaction using a row lock (`select_for_update()`); a worker that finds the job already claimed or finished SHALL exit without changing anything. |
| **FR-021** | M / I | **Certificate number:** every certificate SHALL have a unique, human-readable `certificate_number` (format `CERT-<YYYY>-<12 hex characters>`, derived from the issue year and the certificate UUID), shown at the "with Registration Number …" position of the body sentence and returned in API responses. It is distinct from the internal UUID used in URLs. |
| **FR-022** | M / E | **Template overlay:** the PDF SHALL be produced by drawing one fixed template image as the page background and overlaying the dynamic values with ReportLab: the organization name (line under "PROUDLY PRESENTED BY"), a body sentence containing the recipient name, certificate number and event name, and the bottom-left block (recipient name and issue date). Sample values visible in the supplied design (e.g. "Akshat Rawat", "25th September 2023", "C Programming Workshop", "1st Place") SHALL NEVER appear on generated certificates. Long values SHALL be fitted (shrunk/wrapped) without overflowing, overlapping other elements, or breaking the PDF; dynamic text SHALL be XML-escaped before drawing. There is no template editor, no upload, and no second template. |
| **FR-014** | R / I | `GET` list of jobs, newest first, paginated. |
| **FR-015** | R / I | `GET` list of a job's certificates, paginated, filterable by `status`. |
| **FR-016** | R / I | `GET` ZIP download of all `GENERATED` certificates of a job. |
| **FR-017** | R / I | A management command that finds jobs left `PENDING` for too long (e.g. task never queued) or stuck in `PROCESSING` beyond a configurable threshold (e.g. worker killed) and re-dispatches them; processing only touches `PENDING` certificates, so already-finished certificates are never redone. |
| **FR-018** | R / I | Models registered in Django admin (read-friendly). |

---

## 1.9 Non-Functional Requirements

| ID | Requirement |
|---|---|
| **NFR-001 Reliability** | One failing certificate never stops others. The job always ends in a terminal status (`COMPLETED`, `COMPLETED_WITH_ERRORS`, or `FAILED`) unless the worker process itself is killed or the task is never delivered (then FR-017 recovers it). |
| **NFR-002 Data integrity** | Job creation is all-or-nothing. Progress counts are always derived from certificate rows, so they can never disagree with the data. |
| **NFR-003 Maintainability** | Views are thin; business logic lives in a service module; PDF drawing lives in its own module; no duplicated logic. |
| **NFR-004 Testability** | Tests need **PostgreSQL** (so row locking behaves like production) but need **neither a running Redis nor a Celery worker**: Celery runs in eager (synchronous) mode in tests; the PDF function can be replaced with a failing fake to test failure handling; tests never write to the real media folder. |
| **NFR-005 Performance** | Job creation responds quickly regardless of recipient count (target: well under ~2 seconds for 500 recipients). A 500-recipient job should finish in a reasonable time on a normal laptop (target: a few minutes at most; not a hard SLA). |
| **NFR-006 Validation & security** | All user input validated; no hard-coded secrets; safe file paths; no stack traces in responses. |
| **NFR-007 Observability** | Job and certificate lifecycle events and every failure are logged with job/certificate IDs. |
| **NFR-008 API usability** | Consistent JSON, predictable status codes, clear messages, UUID identifiers. |
| **NFR-009 Simplicity / explainability** | Prefer plain Django/DRF features and readable code over clever or abstract code. Every major choice has a written reason. |
| **NFR-010 Portability** | Local run needs Python, a running **PostgreSQL** and a running **Redis**, and two application processes (Django dev server + Celery worker). No other services. Setup is documented step by step in the README. |
| **NFR-011 Configurability** | Secrets and tunables (secret key, debug, database URL, broker URL, max recipients, media path) come from environment variables with safe defaults; no secrets in code. |
| **NFR-012 Concurrency safety** | Multiple Celery workers (or duplicate task deliveries) must never process the same job at the same time (FR-020). |
| **NFR-013 Template fidelity** | The certificate's static design is never altered by generation; dynamic text stays inside its intended area for all allowed input lengths. |

---

## 1.10 Acceptance Criteria

| ID | Covers | Given / When / Then |
|---|---|---|
| **AC-001** | FR-001, FR-004, FR-019 | *Given* a valid body with 3 valid recipients, *when* the client POSTs it, *then* the response is `202`, contains a job `id`, `status`, `progress.total = 3`, and a status URL; the database has 1 job and 3 certificate rows; a Celery task carrying only the job UUID is queued after the commit. |
| **AC-002** | FR-002 | *Given* a body with a missing `event_name`, an empty `recipients` list, or more than the allowed number of recipients, *when* POSTed, *then* the response is `400`, a consistent error body names the problem, and **no job is created**. |
| **AC-003** | FR-003 | *Given* recipients where one has a blank name and one has email `"abc"`, *when* POSTed with 3 other valid recipients, *then* a job is created, the 2 invalid rows are `FAILED/VALIDATION` with readable messages and their `row_number`, and the 3 valid ones are generated. |
| **AC-004** | FR-005 | *Given* a valid recipient, *when* the job is processed, *then* a non-empty file exists whose bytes begin with `%PDF` and the certificate is `GENERATED`. |
| **AC-005** | FR-006 | *Given* the PDF generator is forced to fail for one recipient, *when* the job is processed, *then* only that certificate is `FAILED/GENERATION`, all others are `GENERATED`, and the job is `COMPLETED_WITH_ERRORS`. |
| **AC-006** | FR-007, FR-008 | *Given* all certificates generate, *then* job = `COMPLETED`. *Given* all fail, *then* job = `FAILED`. *Given* a mix, *then* `COMPLETED_WITH_ERRORS`. `finished_at` is set in all three. |
| **AC-007** | FR-009 | *Given* an existing job, *when* the client GETs it, *then* the response contains correct `total/generated/failed/pending/percent_complete` and each recipient's result including error details for failures and a download URL for successes. |
| **AC-008** | FR-010 | *Given* a `GENERATED` certificate, *when* GET `/download/`, *then* `200`, `Content-Type: application/pdf`, body starts with `%PDF`. |
| **AC-009** | FR-011 | *Given* an unknown (or malformed) job/certificate ID, *then* `404` with the standard error shape. *Given* a `FAILED` or `PENDING` certificate, *when* downloading, *then* `409`. |
| **AC-010** | FR-013 | Stored file names contain only server-generated UUIDs; a recipient name like `../../evil` never affects any path. |
| **AC-011** | FR-014–FR-018 | Each recommended feature has at least one passing test (only if implemented). |
| **AC-012** | FR-019 | *Given* a job-creation call, *then* the Celery task is **not** queued until the transaction commits (verified by capturing on-commit callbacks), and the task argument is the job UUID string. *Given* queueing raises an error, *then* the API still returns `202`, the job stays `PENDING`, and the error is logged. |
| **AC-013** | FR-020 | *Given* a job already claimed (`PROCESSING`) or finished, *when* `process_job` runs again for it, *then* it exits without generating or changing anything. *Given* a `PENDING` job, a second run after the first completes is a no-op. |
| **AC-014** | FR-021, FR-022 | *Given* a generated certificate, *then* it shows the recipient's actual data (never the sample data from the design, and none of the template's baked-in sample text remains), its `certificate_number` appears in the body sentence and in the API response, a name containing `&` or `<` renders literally without breaking the PDF, and a maximum-length name does not overflow or overlap other elements. |

---

## 1.11 API Expectations (conceptual — no implementation here)

The API needs to let a client:

1. **Create a job** from certificate info + recipients → get a job ID fast.
2. **Check a job** → status, progress counts, per-recipient results.
3. **Fetch a certificate** → metadata, and the actual PDF.
4. *(Recommended)* **List** jobs, list a job's certificates (filter by status), and **download all as ZIP**.

Exact paths, bodies, and status codes are defined in `architecture.md` §2.8. All identifiers are UUIDs. All bodies are JSON (except PDF/ZIP downloads).

---

## 1.12 Constraints (from the assignment)

- Language: **Python**.
- Framework: one of FastAPI / Django + DRF / Flask → **we use Django + DRF** (rationale in `architecture.md` §2.4).
- A **relational database** is required → **our choice: PostgreSQL** (not required by the assignment).
- **Single predefined template**; no editor, no multiple designs → **our choice: the supplied Recursion certificate design**, kept as a static background image with dynamic text overlaid (not required by the assignment to be this design).
- Format and library are our choice → **PDF via ReportLab**.
- Must support **bulk** generation in one request.
- Processing mode (sync / background) is our choice **and must be documented with reasoning** → **our choice: Celery background tasks with a Redis broker** (not required by the assignment).
- Minimum tests: job creation, input validation, certificate generation, job status/progress, individual certificate failure, certificate retrieval.
- README must cover: setup, run, tests, how to submit a request, how to retrieve certificates, key design decisions.
- AI tools allowed, but the developer must be able to **understand, explain, and modify** the code (interview may include debugging and a changed requirement).
- Optional features must not come at the cost of required ones.

---

## 1.13 Success Criteria

A successful submission:

1. Fulfils every **FR-001 … FR-013** with passing tests.
2. Demonstrates failure isolation convincingly (a forced failure leaves other certificates intact).
3. Has a README that lets a stranger set up, run, test, and use it in minutes.
4. Shows good judgment: simple architecture, honest documentation of trade-offs and future scaling.
5. Is something the developer can **walk through line by line** and modify live.

---

## 1.14 Assumptions and Ambiguities

The assignment leaves some points open. Each is resolved below. Codex must **not** silently change these; change only via the developer and record in `memory.md`.

| ID | Ambiguity | Resolution (decision) |
|---|---|---|
| A-1 | "Certificate information" — is it shared by the whole job or per recipient? | **Per job** (`event_name`, `organization_name`, `issue_date`); per recipient we only need `name` and optional `email`. (Per-recipient overrides = OPT-006.) |
| A-2 | If some recipients are invalid, reject the whole request or accept the valid ones? | **Accept the request; record invalid recipients as FAILED/VALIDATION**; process valid ones. Only *structurally* broken requests are rejected (FR-002). The assignment says valid recipients must still be generated. |
| A-3 | Certificate format | **PDF**. |
| A-4 | Duplicate recipients (same name/email twice) | **Allowed**; each row is its own certificate, identified by `row_number`. No deduplication. |
| A-5 | Is `email` required? Do we send emails? | Optional, validated if present. **No emails are sent.** It is stored and printed nowhere on the certificate. |
| A-6 | Authentication | **Out of scope.** API is open. Documented as a known limitation and a future item. |
| A-7 | "Large number" of recipients | Default cap **500 per job** (configurable). Larger lists should be split into several jobs. |
| A-8 | File retention/cleanup | Out of scope. Files stay until manually removed. |
| A-9 | What does "predefined template" mean? | **One fixed certificate design: the supplied Recursion club certificate (1184×864 px PNG, "Certificate of Achievement")**, stored as a static asset. ReportLab draws the image as the page background and overlays the dynamic text. Field positions/sizes live in one configuration module. No editor, no upload, no second template. |
| A-10 | Non-Latin scripts (e.g. Hindi, Chinese) in names | **Not supported** (documented limitation). Latin letters with accents (e.g. "José Álvarez", "André Müller") are supported via a bundled serif Unicode TTF font. |
| A-11 | Is a job with *only* invalid recipients an error? | The job is created and ends `FAILED` with all certificates `FAILED/VALIDATION`. (Empty list → `400`.) |
| A-12 | The supplied design contains baked-in sample text | The supplied PNG contains text baked into the pixels: the dotted blanks and the whole body paragraph ("This certifies that … C Programming Workshop … 1st Place … outstanding performance and dedication"), the green **"RECURSION"** line under "PROUDLY PRESENTED BY", and the bottom-left **"Akshat Rawat / 25th September 2023"** block. These regions MUST be erased (replaced by matching paper texture) in the committed asset `certificate_template.png`, because dynamic text cannot be printed over them. All other elements stay untouched. The asset is prepared **before or at the start of Phase 4** (see `architecture.md` §2.12). |
| A-13 | Where does `organization_name` appear on the design? | **Resolved:** the green line under "PROUDLY PRESENTED BY" (currently the text "RECURSION"). That line becomes dynamic; the Recursion **logo** above it and the heading stay static. |
| A-14 | Certificate number format | `CERT-<issue year>-<first 12 hex chars of the certificate UUID, uppercase>`, e.g. `CERT-2026-3F9A12BC47D1`: simple, no global counter, unique by constraint. Stored in the database; displayed at the "with Registration Number" position of the body sentence. |
| A-15 | What if Redis/the broker is down when a job is created? | Job and certificates are still saved; the API returns `202`; the job stays `PENDING`; the error is logged; the recovery command re-dispatches it. |
| A-16 | Retries | No retry feature or automatic retry in scope. Celery retries are a future possibility only. |
| A-17 | The body paragraph mixes fixed words with dynamic values | The fixed wording lives as a constant sentence in `template_config.py` and is drawn by ReportLab with the dynamic values inserted: *"This certifies that **{recipient name}** with Registration Number **{certificate number}** has successfully completed **{event name}**."* The supplied wording also had typos ("25nd", "ben", a garbled word) and an award-specific sentence ("1st Place … outstanding performance and dedication") that our request fields cannot express; that sentence is **dropped**. The developer may adjust the wording (OQ-11). |
| A-18 | Bottom-left block | Treated as dynamic: **recipient name** above the line and **issue date** below it (the sample shows "Akshat Rawat" and a date there). To be confirmed (OQ-12). |
| A-19 | Bottom-right signatory and the "WINNER" medal | **Static, as supplied:** "Dr. Vikash Kumar Singh – Head of Department", the medal reading "WINNER", the heading "CERTIFICATE OF ACHIEVEMENT" and "PROUDLY PRESENTED BY" are printed on every certificate. Developer to confirm that wording suits all participants (OQ-14). |
| A-20 | Page size / resolution | The image is 1184×864 px (ratio 1.370), not the A4 ratio (1.414), and is only about 100 DPI at A4 size. Default: page sized to the image's aspect ratio at A4-landscape width (no distortion); recommended: re-export the cleaned design at the exact A4 ratio and higher resolution (OQ-13). |

---

## 1.15 Deliverables Checklist (assignment-level)

| ID | Deliverable |
|---|---|
| D-001 | Working Django + DRF backend meeting FR-001…FR-013 |
| D-002 | Automated tests covering the six required areas |
| D-003 | `README.md` with the six required sections |
| D-004 | Documented processing choice and reasoning (README + `architecture.md` §2.10) |
| D-005 | Clean Git history / repo structure |
