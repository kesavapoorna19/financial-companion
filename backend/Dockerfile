# ============================================================
# Financial Companion — Backend Dockerfile
# Multi-stage: install deps → run uvicorn
# ============================================================

FROM python:3.12-slim AS base
WORKDIR /app

# System deps for psycopg2 + reportlab
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps first (layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir gunicorn uvicorn[standard]

# Copy app code
COPY . .

EXPOSE 8000

# Run: 4 workers in production, auto-reload in dev via compose override
CMD ["gunicorn", "app.main:app", \
     "-k", "uvicorn.workers.UvicornWorker", \
     "-w", "4", \
     "-b", "0.0.0.0:8000"]
