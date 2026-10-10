#!/bin/sh
set -eu

# Migrations run in the deployment pre-deploy step, never in the worker.
python manage.py collectstatic --noinput
exec gunicorn config.wsgi:application \
  --bind "[::]:${PORT:-8000}" \
  --workers "${WEB_CONCURRENCY:-2}" --timeout 120 \
  --access-logfile - --error-logfile -
