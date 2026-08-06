"""Expense CRUD service.

Mirrors the income service, plus recurring-expense handling:
- ``is_recurring`` + ``recurring_frequency`` → ``next_due_date`` is computed
  from the expense date and kept in sync when either changes.
- Everything is scoped to the current ``user_id``.
"""

import calendar
import logging
from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import BadRequestError, NotFoundError
from app.models.category import Category
from app.models.enums import RecurringFrequency
from app.models.transaction import Expense
from app.schemas.transaction import ExpenseCreate, ExpenseUpdate
from app.utils.money import SUPPORTED_CURRENCIES

logger = logging.getLogger("financial_companion.expense")


# ── Query helpers ─────────────────────────────────────────────────────────


def list_expenses(
    db: Session,
    user_id: UUID,
    *,
    search: str | None = None,
    category_id: UUID | None = None,
    payment_method=None,
    is_recurring: bool | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Expense], int]:
    query = (
        db.query(Expense)
        .options(joinedload(Expense.category))
        .filter(Expense.user_id == user_id, Expense.deleted_at.is_(None))
    )

    if search:
        query = query.filter(Expense.title.ilike(f"%{search.strip()}%"))
    if category_id:
        query = query.filter(Expense.category_id == category_id)
    if payment_method is not None:
        query = query.filter(Expense.payment_method == payment_method)
    if is_recurring is not None:
        query = query.filter(Expense.is_recurring.is_(is_recurring))
    if start_date:
        query = query.filter(Expense.expense_date >= start_date)
    if end_date:
        query = query.filter(Expense.expense_date <= end_date)

    total = query.count()
    items = (
        query.order_by(Expense.expense_date.desc(), Expense.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def get_expense(db: Session, user_id: UUID, expense_id: UUID) -> Expense:
    expense = (
        db.query(Expense)
        .options(joinedload(Expense.category))
        .filter(Expense.id == expense_id, Expense.user_id == user_id, Expense.deleted_at.is_(None))
        .first()
    )
    if not expense:
        raise NotFoundError("Expense record not found")
    return expense


# ── Mutations ─────────────────────────────────────────────────────────────


def create_expense(db: Session, user_id: UUID, data: ExpenseCreate) -> Expense:
    _validate_currency(data.currency_code)
    _validate_category(db, user_id, data.category_id)

    payload = data.model_dump()
    payload["next_due_date"] = _resolve_next_due(
        data.is_recurring, data.expense_date, data.recurring_frequency, data.next_due_date
    )
    if not data.is_recurring:
        payload["recurring_frequency"] = None

    expense = Expense(user_id=user_id, **payload)
    db.add(expense)
    db.commit()
    db.refresh(expense)
    logger.info("Expense created: %s (%.2f %s)", expense.title, expense.amount, expense.currency_code)
    return expense


def update_expense(db: Session, user_id: UUID, expense_id: UUID, data: ExpenseUpdate) -> Expense:
    expense = get_expense(db, user_id, expense_id)
    update_data = data.model_dump(exclude_unset=True)

    _validate_currency(update_data.get("currency_code", expense.currency_code))
    if "category_id" in update_data:
        _validate_category(db, user_id, update_data["category_id"])

    _recompute_recurring(expense, update_data)

    for field, value in update_data.items():
        setattr(expense, field, value)

    db.commit()
    db.refresh(expense)
    return expense


def delete_expense(db: Session, user_id: UUID, expense_id: UUID) -> None:
    expense = get_expense(db, user_id, expense_id)
    expense.deleted_at = datetime.now(timezone.utc)
    db.commit()
    logger.info("Expense deleted: %s", expense_id)


# ── Recurring logic ───────────────────────────────────────────────────────


def _add_months(d: date, months: int) -> date:
    month_index = d.month - 1 + months
    year = d.year + month_index // 12
    month = month_index % 12 + 1
    day = min(d.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def _compute_next_due(expense_date: date, frequency: RecurringFrequency) -> date:
    if frequency == RecurringFrequency.daily:
        return expense_date + timedelta(days=1)
    if frequency == RecurringFrequency.weekly:
        return expense_date + timedelta(weeks=1)
    if frequency == RecurringFrequency.monthly:
        return _add_months(expense_date, 1)
    if frequency == RecurringFrequency.yearly:
        return _add_months(expense_date, 12)
    return expense_date


def _resolve_next_due(
    is_recurring: bool,
    expense_date: date,
    frequency: RecurringFrequency | None,
    client_next_due: date | None,
) -> date | None:
    if not is_recurring:
        return None
    if frequency is None:
        raise BadRequestError("Recurring expenses need a frequency (daily, weekly, monthly or yearly)")
    return client_next_due or _compute_next_due(expense_date, frequency)


def _recompute_recurring(expense: Expense, update_data: dict) -> None:
    """Keep next_due_date consistent with the recurring settings."""
    touches_recurring = any(
        k in update_data for k in ("is_recurring", "recurring_frequency", "expense_date")
    )
    if not touches_recurring:
        return

    is_recurring = update_data.get("is_recurring", expense.is_recurring)
    frequency = update_data.get("recurring_frequency", expense.recurring_frequency)
    expense_date = update_data.get("expense_date", expense.expense_date)

    if not is_recurring:
        update_data["next_due_date"] = None
        update_data["recurring_frequency"] = None
    else:
        if frequency is None:
            raise BadRequestError("Recurring expenses need a frequency (daily, weekly, monthly or yearly)")
        update_data["next_due_date"] = _compute_next_due(expense_date, frequency)


# ── Validation helpers ────────────────────────────────────────────────────


def _validate_currency(currency_code: str) -> None:
    if currency_code not in SUPPORTED_CURRENCIES:
        raise BadRequestError(f"Unsupported currency: {currency_code}")


def _validate_category(db: Session, user_id: UUID, category_id: UUID | None) -> None:
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
