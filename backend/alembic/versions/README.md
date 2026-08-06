# Alembic migration files

Future schema changes land here as numbered migration files, generated with:

```bash
cd backend
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```

The **initial** database is created by `backend/database/schema.sql`
(tables, enums, triggers, seed categories) — applied automatically by Docker
on first boot, or manually with `scripts/init_db.sh`. That means the first
Alembic migration can safely represent a schema *change*, not the initial
build.
