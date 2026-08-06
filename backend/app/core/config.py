"""Application settings loaded from environment variables (.env)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Every env variable the backend reads lives here.

    Values come from the process environment or a ``.env`` file next to the
    project. Unknown extra variables are ignored so the same file can also
    be used by Docker Compose.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- App ---
    APP_NAME: str = "Financial Companion API"
    APP_VERSION: str = "0.2.0"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # --- Database ---
    DATABASE_URL: str = (
        "postgresql+psycopg2://financial:change-me@localhost:5432/financial_companion"
    )

    # --- Auth (active from Phase 4) ---
    JWT_SECRET: str = "change-me-to-a-long-random-string"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # --- CORS ---
    # JSON array in the .env file, e.g. ["http://localhost:5173"]
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:5173"]


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (re-created only on process restart)."""
    return Settings()


settings = get_settings()
