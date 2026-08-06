"""Dashboard endpoints (Phase 5).

GET /dashboard/summary — everything the dashboard screen needs in one call.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.dashboard import DashboardSummary
from app.services import dashboard_service

router = APIRouter(tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_summary(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DashboardSummary:
    """Aggregated data for the dashboard, scoped to the current user."""
    return dashboard_service.get_dashboard_summary(db, user.id)
