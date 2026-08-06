"""Expense endpoints (Phase 7).

GET    /expenses          — list with search / filters / pagination
POST   /expenses          — create
GET    /expenses/{id}     — single record
PATCH  /expenses/{id}     — update
DELETE /expenses/{id}     — soft delete
"""

import math
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.enums import PaymentMethod
from app.models.user import User
from app.schemas.transaction import ExpenseCreate, ExpenseListOut, ExpenseOut, ExpenseUpdate
from app.services import expense_service

router = APIRouter(tags=["expenses"])


@router.get("", response_model=ExpenseListOut)
def list_expenses(
    search: str | None = Query(default=None, max_length=120),
    category_id: UUID | None = Query(default=None),
    payment_method: PaymentMethod | None = Query(default=None),
    is_recurring: bool | None = Query(default=None),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total = expense_service.list_expenses(
        db,
        user.id,
        search=search,
        category_id=category_id,
        payment_method=payment_method,
        is_recurring=is_recurring,
        start_date=start_date,
        end_date=end_date,
        page=page,
        page_size=page_size,
    )
    return ExpenseListOut(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size) if total else 0,
    )


@router.post("", response_model=ExpenseOut, status_code=201)
def create_expense(
    data: ExpenseCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return expense_service.create_expense(db, user.id, data)


@router.get("/{expense_id}", response_model=ExpenseOut)
def get_expense(
    expense_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return expense_service.get_expense(db, user.id, expense_id)


@router.patch("/{expense_id}", response_model=ExpenseOut)
def update_expense(
    expense_id: UUID,
    data: ExpenseUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return expense_service.update_expense(db, user.id, expense_id, data)


@router.delete("/{expense_id}", status_code=204)
def delete_expense(
    expense_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense_service.delete_expense(db, user.id, expense_id)
