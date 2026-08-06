"""Aggregates every v1 router. New feature routers get included here.

Example (Phase 4+):
    from app.api.v1.endpoints import auth
    api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
"""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    categories,
    dashboard,
    expenses,
    health,
    incomes,
    notes,
    reports,
    users,
)

api_router = APIRouter()

# Core
api_router.include_router(health.router)

# Auth
api_router.include_router(auth.router, prefix="/auth")

# Users
api_router.include_router(users.router, prefix="/users")

# Dashboard
api_router.include_router(dashboard.router, prefix="/dashboard")

# Reports / Financial Data Export
api_router.include_router(reports.router, prefix="/reports")

# Income (Phase 6)
api_router.include_router(incomes.router, prefix="/incomes")

# Expenses (Phase 7)
api_router.include_router(expenses.router, prefix="/expenses")

# Categories
api_router.include_router(categories.router, prefix="/categories")

# Notes (Phase 8)
api_router.include_router(notes.router, prefix="/notes")
