"""Test infrastructure.

Creates a dedicated ``financial_companion_test`` PostgreSQL database, runs
all CREATE statements + seed data, and exposes pytest fixtures for a clean
FastAPI TestClient with JWT auth helpers.

Requires a running PostgreSQL on the default port — same one used by the
development database (docker compose up -d db).
"""

import os
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.database import Base, get_db
from app.main import app
from app.seed.seed_data import DEFAULT_CATEGORIES

# ---------------------------------------------------------------------------
# Database URL helpers
# ---------------------------------------------------------------------------

TEST_DB_URL = os.environ.get(
    "TEST_DATABASE_URL",
    settings.DATABASE_URL.rstrip("/") + "_test",
)


def _server_url(db_url: str) -> str:
    """Point at the ``postgres`` admin database (same credentials)."""
    return db_url.rsplit("/", 1)[0] + "/postgres"


def _create_test_database_if_missing(db_url: str) -> None:
    """CREATE DATABASE (if not exists) using an AUTOCOMMIT admin connection."""
    server_url = _server_url(db_url)
    db_name = db_url.rsplit("/", 1)[-1].split("?")[0]

    engine = create_engine(server_url, isolation_level="AUTOCOMMIT")
    with engine.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :name"),
            {"name": db_name},
        ).scalar()
        if not exists:
            conn.execute(text(f'CREATE DATABASE "{db_name}"'))
    engine.dispose()


# ---------------------------------------------------------------------------
# Seed helper
# ---------------------------------------------------------------------------

def _clean_and_seed(db_engine) -> None:
    """Truncate every public table, then re-insert default categories."""
    with db_engine.begin() as conn:
        tables = conn.execute(
            text("SELECT tablename FROM pg_tables WHERE schemaname='public'")
        ).scalars().all()
        for t in tables:
            conn.execute(text(f'TRUNCATE TABLE "{t}" RESTART IDENTITY CASCADE'))
        for cat in DEFAULT_CATEGORIES:
            conn.execute(
                text(
                    "INSERT INTO categories (user_id, name, type, icon, color, is_default) "
                    "VALUES (NULL, :name, :type, :icon, :color, true)"
                ),
                cat,
            )


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session", autouse=True)
def _create_test_db():
    """Session-wide: create the test database once, populate schema."""
    _create_test_database_if_missing(TEST_DB_URL)
    engine = create_engine(TEST_DB_URL)
    Base.metadata.create_all(engine)
    engine.dispose()
    yield
    # Teardown is optional — the test DB stays for quick re-runs.


@pytest.fixture(scope="session")
def db_engine():
    engine = create_engine(TEST_DB_URL)
    yield engine
    engine.dispose()


@pytest.fixture()
def client(db_engine):
    """FastAPI TestClient with dependency override and per-test cleanup."""
    TestSession = sessionmaker(bind=db_engine, autoflush=False, autocommit=False)

    def override_get_db():
        db = TestSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app, raise_server_exceptions=False) as c:
        yield c

    app.dependency_overrides.clear()


@pytest.fixture(autouse=True, scope="function")
def reset_db(db_engine):
    """Start each test with a clean database (tables empty + default categories seeded)."""
    _clean_and_seed(db_engine)
    yield


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

API = "/api/v1"


def _register(client: TestClient, **overrides) -> tuple[str, str]:
    """Register a test user and return ``(access_token, email)``."""
    payload = {
        "full_name": "Test User",
        "email": f"user_{uuid.uuid4().hex[:8]}@example.com",
        "password": "password123",
        "role": "employee",
    }
    payload.update(overrides)
    res = client.post(f"{API}/auth/register", json=payload)
    assert res.status_code == 201, res.text
    return res.json()["access_token"], payload["email"]


@pytest.fixture()
def auth(client):
    """First user — authenticated."""
    token, email = _register(client)
    return {"Authorization": f"Bearer {token}"}, email


@pytest.fixture()
def auth2(client):
    """Second user — tests cross-user isolation."""
    token, email = _register(client)
    return {"Authorization": f"Bearer {token}"}, email


@pytest.fixture()
def income_category(client, auth):
    """Fetch the first income-compatible default category."""
    res = client.get(f"{API}/categories", params={"type": "income"}, headers=auth)
    assert res.status_code == 200
    cats = res.json()
    assert cats, "Expected seeded default categories"
    return cats[0]["id"]


@pytest.fixture()
def expense_category(client, auth):
    """Fetch the first expense-compatible default category."""
    res = client.get(f"{API}/categories", params={"type": "expense"}, headers=auth)
    assert res.status_code == 200
    cats = res.json()
    assert cats, "Expected seeded default categories"
    return cats[0]["id"]
