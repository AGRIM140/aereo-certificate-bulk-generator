# Production Dockerfile for Bulk Certificate Generator Backend & Celery Worker
FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# psycopg[binary] and Pillow provide wheels; template/fonts are bundled assets.
# No compiler toolchain or system font download is required in the runtime image.
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . /app/

# Ensure media directory exists
RUN mkdir -p /app/media

EXPOSE 8000

CMD ["sh", "/app/start-backend.sh"]
