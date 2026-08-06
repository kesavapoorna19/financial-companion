"""Notes schemas (Phase 8).

A "note" is the free-text note attached to an income or expense record.
The Notes API aggregates them so the user can browse and edit every note
in one place.
"""

from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class NoteOut(BaseModel):
    id: UUID
    type: str  # "income" | "expense"
    title: str
    note: str
    date: date
    amount: Decimal
    currency_code: str
    category_name: str | None


class NoteListOut(BaseModel):
    """Pagination envelope for notes."""
    items: list[NoteOut]
    total: int
    page: int
    page_size: int
    pages: int
