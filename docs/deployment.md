# GitHub release and Railway deployment

This guide deploys the existing application; PostgreSQL remains the source of
truth and Redis remains the Celery broker. PDFs use private S3-compatible storage
in production and local `MEDIA_ROOT` during development. No schema change is
needed. The frontend uses relative `/api/` URLs through Nginx.

## Cost and access

Deployment is authorized only within available free trial credit. Do not upgrade
to a paid plan or add a payment method automatically. Railway currently offers a
one-time $5 trial credit for up to 30 days, then $1/month on Free. This is not a
promise of indefinite free operation of six resources. Check credit balance,
account resource limits, and bucket eligibility before deploying. Stop if the
account requires paid access; never silently switch architecture/providers.

Official references: [trial](https://docs.railway.com/pricing/free-trial),
[buckets](https://docs.railway.com/storage-buckets),
[bucket credential environment names](https://docs.railway.com/cli/bucket),
[configuration files](https://docs.railway.com/config-as-code/reference),
[pre-deploy commands](https://docs.railway.com/deployments/pre-deploy-command).

Sign in using GitHub/Railway's official interfaces. Never put tokens in commits,
frontend environment variables, chat, command arguments, or screenshots.

## Local development

Follow the README setup for PostgreSQL, Redis, Django and the Vite frontend.
Copy `.env.example` to the ignored `.env` and supply local credentials.
`CERTIFICATE_STORAGE=filesystem` is the default. Local Compose uses a shared
named media volume between backend and worker. Railway service filesystems
cannot replace that shared volume: use the bucket for both services.

Compose requires a local `DJANGO_SECRET_KEY` and is intended for local testing.
Do not expose its PostgreSQL/Redis ports to the public internet.

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe manage.py migrate --noinput
.\.venv\Scripts\python.exe manage.py runserver
# Separate terminal:
.\.venv\Scripts\python.exe -m celery -A config worker --loglevel=info --pool=solo
# Separate terminal in frontend/:
npm ci
npm run dev
```

## Railway service configuration

Use the intended public GitHub repository and its `master` branch. Keep all
services in the same Railway project/environment and choose compatible regions.
Create PostgreSQL, Redis, and one private bucket only after checking free credit
and account limits. Service display names below are configuration names, not
claims that resources already exist.

| Service | Repository root | Config file path (from repository root) | Start command | Public domain |
| --- | --- | --- | --- | --- |
| backend | `/` | `/railway.backend.json` | Docker CMD: `sh /app/start-backend.sh` | None |
| worker | `/` | `/railway.worker.json` | `celery -A config worker --loglevel=info --concurrency=1` | None |
| frontend | `/frontend` | `/frontend/railway.json` | Docker CMD (Nginx entrypoint) | Generate HTTPS domain |

In each service's Settings, select the root directory and config path above.
Dockerfiles are selected explicitly in the configuration files. Leave frontend
start-command override empty so Nginx's official entrypoint substitutes runtime
variables. Do not use a Vite development server for production.

### Backend and worker variables

Use the same values on both services. `${{...}}` below is Railway reference
syntax; select the actual database/Redis/bucket service from the variable picker.
If names differ, adapt the service reference, not its exported variable name.

| Variable | Value/source |
| --- | --- |
| `DJANGO_DEBUG` | `false` |
| `DJANGO_SECRET_KEY` | A unique generated secret, stored only in Railway Variables |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (actual Postgres service reference) |
| `CELERY_BROKER_URL` | `${{Redis.REDIS_URL}}` (actual Redis service reference) |
| `CERTIFICATE_STORAGE` | `s3` |
| `AWS_ENDPOINT_URL` | Exact endpoint from bucket Credentials tab (`ENDPOINT`) |
| `AWS_S3_BUCKET_NAME` | Exact bucket name from Credentials (`BUCKET`) |
| `AWS_ACCESS_KEY_ID` | Bucket credential `ACCESS_KEY_ID` |
| `AWS_SECRET_ACCESS_KEY` | Bucket credential `SECRET_ACCESS_KEY` |
| `AWS_DEFAULT_REGION` | Bucket credential `REGION` |
| `AWS_S3_URL_STYLE` | Exact `virtual` or `path` URL style shown for this bucket |
| `MAX_RECIPIENTS_PER_JOB` | `500` |
| `STALE_JOB_MINUTES` | `15` |

For example, with a service actually named `Certificates`, the endpoint reference
is `${{Certificates.ENDPOINT}}`. Copy actual credentials/reference values, never
invent an endpoint. New and older buckets can use different addressing styles.
Do not enable public access, public ACLs, or add bucket credentials to frontend.

Backend-only variables:

| Variable | Value/source |
| --- | --- |
| `PORT` | `8000` (explicit shared private port) |
| `WEB_CONCURRENCY` | `1` for this small assignment deployment |
| `DJANGO_ALLOWED_HOSTS` | Actual frontend hostname, actual backend private hostname, `healthcheck.railway.app` |
| `DJANGO_TRUST_PROXY` | `true`, while backend has no public domain and trusts Nginx |
| `CORS_ALLOW_ALL_ORIGINS` | `false` |
| `CORS_ALLOWED_ORIGINS` | Actual `https://` frontend origin |
| `CSRF_TRUSTED_ORIGINS` | Actual `https://` frontend origin |
| `DJANGO_HSTS_SECONDS` | `0` until HTTPS routing is confirmed; optionally enable after verification |

Never use `*` for allowed hosts or origins. Nginx forwards the original Host and
Railway's HTTPS scheme. Database/broker URLs stay in runtime variables. Django
rejects missing secrets, non-PostgreSQL databases, and incomplete S3 settings.

### Frontend variables and networking

Set `PORT=8080` and
`BACKEND_URL=http://${{backend.RAILWAY_PRIVATE_DOMAIN}}:8000` using the actual
backend service name. Leave storage/database/broker secrets off this service.
This is a runtime Nginx setting, not a `VITE_` build variable. Only `PORT` and
`BACKEND_URL` are substituted; Nginx's `$uri` and other variables remain intact.
Do not add a trailing path to `BACKEND_URL`.

Generate a public frontend domain with target port 8080. Put that exact hostname
and HTTPS origin in the backend variables. Nginx serves SPA deep links, compresses
text, caches fingerprinted `/assets/`, and prevents API responses being cached.
ES module `.mjs` assets are served as JavaScript so the PDF.js worker can load.
Gunicorn binds IPv6 (`[::]`) in the Linux image, including IPv4 on the default
dual-stack Linux socket. This supports Railway environments with IPv6 private DNS.

### Migrations and rollout

1. Review the target Postgres service and migration state. There is no new
   application migration in this release and no destructive seeding/reset.
2. Backend config runs `python manage.py migrate --noinput` in Railway's
   pre-deploy step. Do not attach that command to the worker or frontend.
3. Backend startup runs `collectstatic --noinput` and Gunicorn. WhiteNoise serves
   Django static files from the image runtime. PDFs are never served as static
   assets or exposed by a media URL.
4. Deploy backend and confirm `/health/` succeeds, then worker, then frontend.
5. Confirm the worker connects to the intended Redis and database. Keep worker
   concurrency low to fit the trial; do not add replicas automatically.
6. Review sanitized service logs. A successful build is not a successful release.

## Health, errors, and persistence

Backend `GET /health/` returns `{"status":"ok"}` only when a PostgreSQL `SELECT 1`
succeeds; otherwise it returns a safe 503. This probe does not assert worker,
Redis, bucket, or end-to-end generation readiness. Frontend `/health/` checks
Nginx only. Railway uses the `healthcheck.railway.app` Host header for its probe.

PDF paths remain `certificates/{job_uuid}/{certificate_uuid}.pdf`. The worker
uploads private objects; Django retrieves them through authenticated bucket
credentials and proxies PDF/ZIP content. Object metadata stays in PostgreSQL.
Missing PDFs preserve 404 behavior, an empty ZIP preserves 409, and provider
outages return the standard safe 503 `storage_unavailable` envelope. S3 files
are fetched before streaming starts so errors are handled before a 200 response.
ZIP assembly and PDF retrieval use memory; large batches can consume memory.

`django-storages[s3]` and pinned `boto3` provide the S3 implementation;
`whitenoise` serves collected Django static files under Gunicorn. These are the
only new runtime capabilities. Local filesystem tests still use temporary media.

Existing local PDFs are not automatically uploaded. If deploying an existing
database, plan a separate verified migration of its referenced objects before
switching storage. Do not silently create production records for local files.

## Public assignment data and archive behavior

The API intentionally remains unauthenticated. A private bucket prevents direct
anonymous object access but does not add authorization to the public API: users
can list jobs and retrieve generated certificates through application endpoints.
Use synthetic assignment data only. This deployment is unsuitable for private
recipient records without a separately reviewed access-control design.

The Archive/Vault feature stores job UUIDs in browser `localStorage`. It hides
records on that browser; it does not delete backend jobs, restrict access, or
archive records across devices. State survives reloads on the same origin. A
different hostname/browser or cleared storage has its own archive state.

## Verification commands

From the repository root on Windows:

```powershell
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py makemigrations --check --dry-run
.\.venv\Scripts\python.exe manage.py migrate --check
.\.venv\Scripts\python.exe manage.py test certificates.tests.test_storage certificates.tests.test_deployment_settings --verbosity 2
.\.venv\Scripts\python.exe manage.py test --verbosity 2
.\.venv\Scripts\python.exe manage.py collectstatic --noinput
.\.venv\Scripts\python.exe -m pip check
docker compose config --quiet
docker compose build
docker compose up -d
```

From `frontend/`:

```powershell
npm ci
npm test
npm run lint
npx tsc -b
npm run build
```

### Live acceptance (requires actual deployments)

Over the public HTTPS domain, load `/`, `/dashboard`, `/jobs`, and `/jobs/new`.
Submit a clearly labeled synthetic batch with two valid Latin-script recipients
and one blank name. Confirm 202, polling, worker consumption, one certificate row
per submitted recipient, and terminal `COMPLETED_WITH_ERRORS` with 2 generated
and 1 validation failure. Download both PDFs (`%PDF`) and the ZIP (2 PDFs).
Test archive, reload, restore, CSV/JSON import and the PDF.js/Three.js inspector.
Check browser console/network for failures and exposed secrets.

Check the actual bucket contains the two UUID paths and anonymous direct object
requests fail. Safely restart/redeploy backend and worker, then download the same
PDFs again to establish persistence. Keep the exact synthetic IDs for optional
cleanup; never delete other records or objects.

## Troubleshooting

- **DisallowedHost / failed probe:** verify exact frontend/private hosts and
  `healthcheck.railway.app`, not a URL with scheme in `DJANGO_ALLOWED_HOSTS`.
- **Nginx 502:** verify actual backend private DNS, port 8000, backend readiness,
  and that both services are in the same environment; private networking is
  available at runtime, not during builds.
- **Job remains PENDING:** inspect worker and Redis connectivity. Existing
  `python manage.py recover_stale_jobs` is an explicit recovery operation; don't
  introduce a scheduler or silently change retry semantics.
- **FAILED generation / storage 503:** verify both services use the same bucket
  credentials, region, endpoint, and exact URL style. Never log credentials.
- **PDF 404 after redeploy:** verify production `CERTIFICATE_STORAGE=s3` on both
  services and that referenced objects exist; filesystem storage is ephemeral.
- **Credit or resource limit:** stop deployment; do not upgrade automatically.

Live Railway verification and Docker verification must be reported separately
from local automated tests. Do not infer a public URL or persistence result.
