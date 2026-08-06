"""Income endpoints (Phase 6).

GET    /incomes          — list with search / filters / pagination
POST   /incomes          — create
GET    /incomes/{id}     — single record
PATCH  /incomes/{id}     — update
DELETE /incomes/{id}     — soft delete
"""

import math
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.enums import PaymentMethod
from app.models.user import User
from app.schemas.transaction import IncomeCreate, IncomeListOut, IncomeOut, IncomeUpdate
from app.services import income_service

router = APIRouter(tags=["incomes"])


@router.get("", response_model=IncomeListOut)
def list_incomes(
    search: str | None = Query(default=None, max_length=120),
    category_id: UUID | None = Query(default=None),
    payment_method: PaymentMethod | None = Query(default=None),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total = income_service.list_incomes(
        db,
        user.id,
        search=search,
        category_id=category_id,
        payment_method=payment_method,
        start_date=start_date,
        end_date=end_date,
        page=page,
        page_size=page_size,
    )
    return IncomeListOut(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size) if total else 0,
    )


@router.post("", response_model=IncomeOut, status_code=201)
def create_income(
    data: IncomeCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return income_service.create_income(db, user.id, data)


@router.get("/{income_id}", response_model=IncomeOut)
def get_income(
    income_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return income_service.get_income(db, user.id, income_id)


@router.patch("/{income_id}", response_model=IncomeOut)
def update_income(
    income_id: UUID,
    data: IncomeUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return income_service.update_income(db, user.id, income_id, data)


@router.delete("/{income_id}", status_code=204)
def delete_income(
    income_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    income_service.delete_income(db, user.id, income_id)
