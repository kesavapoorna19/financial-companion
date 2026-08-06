"""Category endpoints.

GET /categories?type=income|expense — defaults + the user's custom categories.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.exceptions import BadRequestError
from app.models.user import User
from app.schemas.category import CategoryOut
from app.services import category_service

router = APIRouter(tags=["categories"])


@router.get("", response_model=list[CategoryOut])
def list_categories(
    type: str | None = Query(default=None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return category_service.list_categories(db, user.id, type)
    except ValueError:
        raise BadRequestError("type must be 'income', 'expense' or empty")
