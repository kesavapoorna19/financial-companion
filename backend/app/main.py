"""FastAPI application entrypoint.

Run from the ``backend/`` directory:
    uvicorn app.main:app --reload
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import setup_logging

logger = logging.getLogger("financial_companion")


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info("Starting %s v%s", settings.APP_NAME, settings.APP_VERSION)
    yield
    logger.info("Shutdown complete")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="All-in-one personal finance platform: income, expenses, savings, "
    "investments, and role-specific tools. Built with FastAPI.",
    lifespan=lifespan,
)

# --- CORS (frontend origins) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Exception handlers → clean JSON errors ---
register_exception_handlers(app)

# --- API routes ---
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["root"])
def root() -> dict:
    return {"app": settings.APP_NAME, "docs": "/docs", "health": settings.API_V1_PREFIX + "/health"}
