"""Database engine, session factory, and the declarative base.

The schema itself is created from ``backend/database/schema.sql`` (applied
automatically by Docker on first boot, or manually with ``scripts/init_db.sh``).
SQLAlchemy models are the ORM layer on top of it; Alembic handles future
migrations.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # re-connect cleanly if the DB restarts
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Declarative base every ORM model inherits from."""


def get_db():
    """FastAPI dependency that yields a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
