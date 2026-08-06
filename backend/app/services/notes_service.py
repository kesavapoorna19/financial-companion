"""Notes aggregation service.

Collects the free-text notes on a user's income and expense records into a
single browsable list. Only records that actually have a non-empty note are
returned. Scoped to the current ``user_id``.
"""

import logging
from datetime import date
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.models.transaction import Expense, Income
from app.schemas.notes import NoteOut

logger = logging.getLogger("financial_companion.notes")


def list_notes(
    db: Session,
    user_id: UUID,
    *,
    search: str | None = None,
    note_type: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[NoteOut], int]:
    """Return (items, total) of notes across income and expense records."""
    if note_type not in (None, "income", "expense"):
        note_type = None

    incomes = (
        db.query(Income)
        .options(joinedload(Income.category))
        .filter(
            Income.user_id == user_id,
            Income.deleted_at.is_(None),
            Income.notes.isnot(None),
            Income.notes != "",
        )
        .all()
    )
    expenses = (
        db.query(Expense)
        .options(joinedload(Expense.category))
        .filter(
            Expense.user_id == user_id,
            Expense.deleted_at.is_(None),
            Expense.notes.isnot(None),
            Expense.notes != "",
        )
        .all()
    )

    notes: list[NoteOut] = []
    for rec in incomes:
        notes.append(
            NoteOut(
                id=rec.id,
                type="income",
                title=rec.title,
                note=rec.notes,
                date=rec.income_date,
                amount=rec.amount,
                currency_code=rec.currency_code,
                category_name=rec.category.name if rec.category else None,
            )
        )
    for rec in expenses:
        notes.append(
            NoteOut(
                id=rec.id,
                type="expense",
                title=rec.title,
                note=rec.notes,
                date=rec.expense_date,
                amount=rec.amount,
                currency_code=rec.currency_code,
                category_name=rec.category.name if rec.category else None,
            )
        )

    # Filters (in-memory — personal-finance scale is small)
    if note_type:
        notes = [n for n in notes if n.type == note_type]
    if search:
        q = search.strip().lower()
        notes = [n for n in notes if q in n.title.lower() or q in n.note.lower()]
    if start_date:
        notes = [n for n in notes if n.date >= start_date]
    if end_date:
        notes = [n for n in notes if n.date <= end_date]

    notes.sort(key=lambda n: n.date, reverse=True)
    total = len(notes)
    start = (page - 1) * page_size
    return notes[start : start + page_size], total
