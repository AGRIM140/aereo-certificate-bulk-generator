# Full-Stack End-to-End Verification Evidence

**Date:** 2026-10-10  
**Status:** PASS (100% Verified)  
**Environment:**
- **Frontend:** Vite + React 19 (Port 5173 with `/api` reverse proxy)
- **Backend:** Django 5.2 + DRF (Port 8000)
- **Database:** PostgreSQL 17 (Port 5432)
- **Broker:** Redis 8 (Port 6379)
- **Worker:** Celery 5.6 (Solo Worker Pool)

## Workflow Verification Trace

### 1. Job Creation
- **Endpoint:** `POST http://localhost:5173/api/jobs/`
- **Request Payload:**
  - Event: `"Automated E2E Gala 2026"`
  - Organization: `"Aereo Systems Engineering"`
  - Issue Date: `"2026-10-10"`
  - Recipients:
    - Row 1: `Elena Rostova` (`elena@example.com`)
    - Row 2: `Marcus Vance` (`marcus@example.com`)
    - Row 3: `"   "` (`blank@example.com`) [deliberate blank name to verify failure isolation]
- **Response:** HTTP 202 Accepted
  - Job ID: `e97c3c4a-55a7-483a-bd48-a87c85698a8c`
  - Status: `PENDING`
  - Progress: `{'total': 3, 'generated': 0, 'failed': 1, 'pending': 2, 'percent_complete': 33.3%}`

### 2. Asynchronous Celery Processing
- Celery Task: `certificates.tasks.process_job_task` dispatched via `transaction.on_commit`
- Worker Claim: Claimed job under PostgreSQL `select_for_update(skip_locked=True)`
- PDF Generation: Rendered 2 certificates via ReportLab onto bundled template overlay
- Terminal Status: `COMPLETED_WITH_ERRORS`
- Final Counts: Total: 3, Generated: 2, Failed: 1 (100.0% progress complete)
- Per-row Isolation: Row 3 recorded as `FAILED` (`error: Row 3: name: This field may not be blank.`) without corrupting valid rows 1 and 2.

### 3. Metadata & PDF Download
- **Endpoint:** `GET http://localhost:5173/api/certificates/{cert_id}/`
  - Retrieved metadata: `CERT-2026-CCF28F44DA62` for Elena Rostova.
- **Endpoint:** `GET http://localhost:5173/api/certificates/{cert_id}/download/`
  - Content-Type: `application/pdf`
  - Content-Disposition: `attachment; filename="CERT-2026-CCF28F44DA62.pdf"`
  - File Size: `387,396 bytes`
  - Magic Bytes: Valid `%PDF` header confirmed.

### 4. Bulk ZIP Download
- **Endpoint:** `GET http://localhost:5173/api/jobs/{job_id}/download/`
  - Content-Type: `application/zip`
  - Content-Disposition: `attachment; filename="job_e97c3c4a-55a7-483a-bd48-a87c85698a8c_certificates.zip"`
  - Archive Entries:
    1. `0001_CERT-2026-CCF28F44DA62.pdf`
    2. `0002_CERT-2026-C38345D87328.pdf`
  - Binary Content: Both extracted files verified as valid `%PDF` documents.

### 5. Historical Ledger & Persistence
- **Endpoint:** `GET http://localhost:5173/api/jobs/`
  - Created job is present and retrievable with full telemetry.
