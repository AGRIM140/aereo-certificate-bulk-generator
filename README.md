# Bulk Certificate Generator

Phase 1 establishes the Django, DRF, PostgreSQL, and Celery project foundation.
Certificate models, processing, and API endpoints are scheduled for later phases.

## Local setup

Use Python 3.11 or newer, PostgreSQL 14 or newer, and Redis. Create a PostgreSQL
database and user with permission to create a test database. Then run:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `.env` with your local PostgreSQL credentials and a unique Django secret key.
Then run:

```powershell
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py test
.\.venv\Scripts\python.exe manage.py runserver
```

The test runner creates and removes a separate PostgreSQL test database. Redis
is configured as Celery's broker; no worker tasks exist yet in Phase 1.
