"""Report overview schemas (Phase 9)."""

from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class ReportCategoryTotal(BaseModel):
    """A category's total and share of the whole period."""
    category: str
    total: Decimal
    percentage: float


class ReportMonthlyPoint(BaseModel):
    """Income and expenses for a single month in the period."""
    month: str
    year: int
    income: Decimal
    expenses: Decimal


class ReportOverview(BaseModel):
    """Everything the Reports page needs for a chosen period."""
    user_name: str
    period_label: str
    start_date: date
    end_date: date
    total_income: Decimal
    total_expenses: Decimal
    balance: Decimal  # profit/loss
    savings_amount: Decimal
    income_by_category: list[ReportCategoryTotal]
    expense_by_category: list[ReportCategoryTotal]
    monthly_series: list[ReportMonthlyPoint]
