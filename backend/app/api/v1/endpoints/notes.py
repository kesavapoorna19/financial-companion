"""Notes endpoints (Phase 8).

GET /notes — browse the user's notes across income and expense records.

Editing a note is done through the existing income/expense PATCH endpoints
(PATCH /incomes/{id} or /expenses/{id} with {"notes": "..."}).
"""

import math
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.notes import NoteListOut
from app.services import notes_service

router = APIRouter(tags=["notes"])


@router.get("", response_model=NoteListOut)
def list_notes(
    search: str | None = Query(default=None, max_length=120),
    type: str | None = Query(default=None),  # "income" | "expense"
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total = notes_service.list_notes(
        db,
        user.id,
        search=search,
        note_type=type,
        start_date=start_date,
        end_date=end_date,
        page=page,
        page_size=page_size,
    )
    return NoteListOut(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size) if total else 0,
    )
