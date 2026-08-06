"""Structured logging for the application."""

import logging
import sys

from app.core.config import settings

_configured = False


def setup_logging() -> None:
    """Configure root logging once, on app startup.

    Output is JSON-style key=value on stdout so it can be shipped to
    log aggregation tools later without changing application code.
    """
    global _configured
    if _configured:
        return

    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter(
        fmt="%(asctime)s level=%(levelname)s name=%(name)s %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S%z",
    )
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level)
    # Keep uvicorn's own access logs at their default level
    logging.getLogger("uvicorn").setLevel(logging.INFO)

    _configured = True
