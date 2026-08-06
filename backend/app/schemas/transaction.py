"""Income and expense schemas.

Request DTOs use the same field names as the database columns
(``income_date`` / ``expense_date``) so no field mapping is needed in the
service layer. Amounts are ``Decimal`` — Pydantic serializes them to JSON as
strings to avoid floating-point rounding on money.
"""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import PaymentMethod, RecurringFrequency


# ---------------------------------------------------------------------------
# Income
# ---------------------------------------------------------------------------
class IncomeCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    amount: Decimal = Field(gt=0)
    currency_code: str = Field(default="INR", min_length=3, max_length=3)
    income_date: date
    category_id: UUID | None = None
    payment_method: PaymentMethod = PaymentMethod.cash
    notes: str | None = None
    attachment_url: str | None = None


class IncomeUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    amount: Decimal | None = Field(default=None, gt=0)
    currency_code: str | None = Field(default=None, min_length=3, max_length=3)
    income_date: date | None = None
    category_id: UUID | None = None
    payment_method: PaymentMethod | None = None
    notes: str | None = None
    attachment_url: str | None = None


class IncomeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    category_id: UUID | None
    title: str
    amount: Decimal
    currency_code: str
    income_date: date
    payment_method: PaymentMethod
    notes: str | None
    attachment_url: str | None
    created_at: datetime
    updated_at: datetime


class IncomeListOut(BaseModel):
    """Pagination envelope for income listings."""
    items: list[IncomeOut]
    total: int
    page: int
    page_size: int
    pages: int


# ---------------------------------------------------------------------------
# Expense
# ---------------------------------------------------------------------------
class ExpenseCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    amount: Decimal = Field(gt=0)
    currency_code: str = Field(default="INR", min_length=3, max_length=3)
    expense_date: date
    category_id: UUID | None = None
    payment_method: PaymentMethod = PaymentMethod.cash
    merchant: str | None = Field(default=None, max_length=120)
    notes: str | None = None
    is_recurring: bool = False
    recurring_frequency: RecurringFrequency | None = None
    next_due_date: date | None = None


class ExpenseUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    amount: Decimal | None = Field(default=None, gt=0)
    currency_code: str | None = Field(default=None, min_length=3, max_length=3)
    expense_date: date | None = None
    category_id: UUID | None = None
    payment_method: PaymentMethod | None = None
    merchant: str | None = Field(default=None, max_length=120)
    notes: str | None = None
    is_recurring: bool | None = None
    recurring_frequency: RecurringFrequency | None = None
    next_due_date: date | None = None


class ExpenseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    category_id: UUID | None
    title: str
    amount: Decimal
    currency_code: str
    expense_date: date
    payment_method: PaymentMethod
    merchant: str | None
    notes: str | None
    is_recurring: bool
    recurring_frequency: RecurringFrequency | None
    next_due_date: date | None
    created_at: datetime
    updated_at: datetime


class ExpenseListOut(BaseModel):
    """Pagination envelope for expense listings."""
    items: list[ExpenseOut]
    total: int
    page: int
    page_size: int
    pages: int
