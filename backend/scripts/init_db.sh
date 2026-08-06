#!/usr/bin/env bash
# ============================================================
# Apply the base schema (tables, enums, triggers, seed data)
# to a PostgreSQL database.
#
# Usage:
#   ./scripts/init_db.sh "postgresql://user:pass@localhost:5432/dbname"
#   # or with DATABASE_URL set:
#   DATABASE_URL="postgresql://..." ./scripts/init_db.sh
#
# Requires the `psql` client. (If you used docker-compose, the schema is
# already applied automatically on first boot and you don't need this.)
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_FILE="${SCRIPT_DIR}/../database/schema.sql"
DATABASE_URL="${1:-${DATABASE_URL:-}}"

if [[ -z "${DATABASE_URL}" ]]; then
  echo "Usage: $0 <DATABASE_URL>" >&2
  echo "   or: DATABASE_URL=\"postgresql://...\" $0" >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql not found. Install the PostgreSQL client, or use docker-compose instead." >&2
  exit 1
fi

echo "Applying schema to ${DATABASE_URL}"
psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -f "${SCHEMA_FILE}"
echo "Schema applied successfully."
