import urllib.request
import json
import time
import zipfile
import io
import sys

def test_full_pipeline():
    print("=== 1. Submitting Job via Vite Proxy (http://localhost:5173/api/jobs/) ===")
    payload = {
        "event_name": "Automated E2E Gala 2026",
        "organization_name": "Aereo Systems Engineering",
        "issue_date": "2026-10-10",
        "recipients": [
            {"name": "Elena Rostova", "email": "elena@example.com"},
            {"name": "Marcus Vance", "email": "marcus@example.com"},
            {"name": "   ", "email": "blank@example.com"}  # Row 3 invalid to test failure isolation
        ]
    }
    req = urllib.request.Request(
        "http://localhost:5173/api/jobs/",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "Accept": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 202, f"Expected 202, got {resp.status}"
        job = json.loads(resp.read().decode("utf-8"))
        job_id = job["id"]
        print(f"-> Job Created: {job_id}")
        print(f"-> Initial Status: {job['status']}")
        print(f"-> Initial Progress: {job['progress']}")
        assert job["progress"]["total"] == 3
        assert job["progress"]["pending"] == 2
        assert job["progress"]["failed"] == 1

    print("\n=== 2. Polling Job Telemetry Processed by Live Celery Worker ===")
    final_job = None
    for i in range(30):
        time.sleep(0.5)
        with urllib.request.urlopen(f"http://localhost:5173/api/jobs/{job_id}/") as resp:
            job = json.loads(resp.read().decode("utf-8"))
            print(f"   Poll {i+1}: status={job['status']} generated={job['progress']['generated']} failed={job['progress']['failed']}")
            if job["status"] in ("COMPLETED", "COMPLETED_WITH_ERRORS", "FAILED"):
                final_job = job
                break

    assert final_job is not None, "Job timed out"
    assert final_job["status"] == "COMPLETED_WITH_ERRORS", f"Unexpected status: {final_job['status']}"
    assert final_job["progress"]["generated"] == 2
    assert final_job["progress"]["failed"] == 1
    assert final_job["progress"]["percent_complete"] == 100.0
    print("-> Terminal status reached: COMPLETED_WITH_ERRORS")

    certs = final_job["certificates"]
    gen_certs = [c for c in certs if c["status"] == "GENERATED"]
    fail_certs = [c for c in certs if c["status"] == "FAILED"]
    assert len(gen_certs) == 2
    assert len(fail_certs) == 1
    print(f"-> Row failure isolation confirmed: Row {fail_certs[0]['row_number']} error: {fail_certs[0]['error']['message']}")

    print("\n=== 3. Testing Certificate Metadata and PDF Download ===")
    cert_id = gen_certs[0]["id"]
    with urllib.request.urlopen(f"http://localhost:5173/api/certificates/{cert_id}/") as resp:
        assert resp.status == 200
        meta = json.loads(resp.read().decode("utf-8"))
        print(f"-> Metadata retrieved: {meta['certificate_number']} for {meta['recipient_name']}")

    with urllib.request.urlopen(f"http://localhost:5173/api/certificates/{cert_id}/download/") as resp:
        assert resp.status == 200
        assert resp.headers.get("content-type") == "application/pdf"
        cd = resp.headers.get("content-disposition", "")
        print(f"-> Content-Disposition header: {cd}")
        pdf_bytes = resp.read()
        assert pdf_bytes.startswith(b"%PDF"), "Invalid PDF binary format"
        print(f"-> PDF downloaded successfully: {len(pdf_bytes)} bytes")

    print("\n=== 4. Testing Bulk ZIP Download ===")
    with urllib.request.urlopen(f"http://localhost:5173/api/jobs/{job_id}/download/") as resp:
        assert resp.status == 200
        assert resp.headers.get("content-type") == "application/zip"
        zip_bytes = resp.read()
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
            entries = zf.namelist()
            print(f"-> ZIP entries ({len(entries)} files): {entries}")
            assert len(entries) == 2
            for entry in entries:
                assert zf.read(entry).startswith(b"%PDF"), f"Entry {entry} is not valid PDF"
        print("-> ZIP archive contents verified!")

    print("\n=== 5. Testing Job Ledger (GET /api/jobs/) ===")
    with urllib.request.urlopen("http://localhost:5173/api/jobs/") as resp:
        assert resp.status == 200
        job_list = json.loads(resp.read().decode("utf-8"))
        results = job_list.get("results", [])
        assert any(j["id"] == job_id for j in results), "Created job not found in history ledger"
        print(f"-> Confirmed job present in ledger. Total jobs: {job_list.get('count')}")

    print("\n========================================================")
    print(">>> COMPLETE LIVE FULL-STACK WORKFLOW VERIFIED 100% <<<")
    print("========================================================")

if __name__ == "__main__":
    test_full_pipeline()
