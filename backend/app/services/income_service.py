"""Income CRUD service.

Every operation is scoped to the current ``user_id`` — one user can never
read or modify another user's income records.
"""

import logging
from datetime import date, datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import BadRequestError, NotFoundError
from app.models.category import Category
from app.models.transaction import Income
from app.schemas.transaction import IncomeCreate, IncomeUpdate
from app.utils.money import SUPPORTED_CURRENCIES

logger = logging.getLogger("financial_companion.income")


def list_incomes(
    db: Session,
    user_id: UUID,
    *,
    search: str | None = None,
    category_id: UUID | None = None,
    payment_method=None,
    start_date: date | None = None,
    end_date: date | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Income], int]:
    """Return (items, total) for the user's incomes with optional filters."""
    query = (
        db.query(Income)
        .options(joinedload(Income.category))
        .filter(Income.user_id == user_id, Income.deleted_at.is_(None))
    )

    if search:
        query = query.filter(Income.title.ilike(f"%{search.strip()}%"))
    if category_id:
        query = query.filter(Income.category_id == category_id)
    if payment_method is not None:
        query = query.filter(Income.payment_method == payment_method)
    if start_date:
        query = query.filter(Income.income_date >= start_date)
    if end_date:
        query = query.filter(Income.income_date <= end_date)

    total = query.count()
    items = (
        query.order_by(Income.income_date.desc(), Income.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def get_income(db: Session, user_id: UUID, income_id: UUID) -> Income:
    income = (
        db.query(Income)
        .options(joinedload(Income.category))
        .filter(Income.id == income_id, Income.user_id == user_id, Income.deleted_at.is_(None))
        .first()
    )
    if not income:
        raise NotFoundError("Income record not found")
    return income


def create_income(db: Session, user_id: UUID, data: IncomeCreate) -> Income:
    """Create an income record. Validates currency and category ownership."""
    _validate_currency(data.currency_code)
    _validate_category(db, user_id, data.category_id)

    income = Income(user_id=user_id, **data.model_dump())
    db.add(income)
    db.commit()
    db.refresh(income)
    logger.info("Income created: %s (%.2f %s)", income.title, income.amount, income.currency_code)
    return income


def update_income(db: Session, user_id: UUID, income_id: UUID, data: IncomeUpdate) -> Income:
    income = get_income(db, user_id, income_id)

    update_data = data.model_dump(exclude_unset=True)

    currency = update_data.get("currency_code", income.currency_code)
    _validate_currency(currency)
    if "category_id" in update_data:
        _validate_category(db, user_id, update_data["category_id"])

    for field, value in update_data.items():
        setattr(income, field, value)

    db.commit()
    db.refresh(income)
    return income


def delete_income(db: Session, user_id: UUID, income_id: UUID) -> None:
    """Soft-delete an income record."""
    income = get_income(db, user_id, income_id)
    income.deleted_at = datetime.now(timezone.utc)
    db.commit()
    logger.info("Income deleted: %s", income_id)


# ── Validation helpers ────────────────────────────────────────────────────


def _validate_currency(currency_code: str) -> None:
    if currency_code not in SUPPORTED_CURRENCIES:
        raise BadRequestError(f"Unsupported currency: {currency_code}")


def _validate_category(db: Session, user_id: UUID, category_id: UUID | None) -> None:
    """Ensure the category exists and belongs to the user or is a default."""
    if category_id is None:
        return
    category = (
        db.query(Category)
        .filter(
            Category.id == category_id,
            Category.deleted_at.is_(None),
            (Category.user_id.is_(None)) | (Category.user_id == user_id),
        )
        .first()
    )
    if not category:
        raise BadRequestError("Category not found")
