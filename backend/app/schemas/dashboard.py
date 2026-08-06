"""Dashboard summary schemas (Phase 5)."""

from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DashboardTotals(BaseModel):
    """Money totals for the current month."""
    total_income: Decimal
    total_expenses: Decimal
    balance: Decimal


class MonthlyPoint(BaseModel):
    """Income and expenses for a single month (chart series)."""
    month: str
    year: int
    income: Decimal
    expenses: Decimal


class CategoryBreakdown(BaseModel):
    """Spending/earning per category with share of the total."""
    category: str
    total: Decimal
    percentage: float


class RecentTransaction(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    category: str | None
    amount: Decimal
    currency_code: str
    date: date
    type: str  # "income" | "expense"


class GoalProgress(BaseModel):
    id: UUID
    name: str
    target_amount: Decimal
    saved_amount: Decimal
    percentage: float
    currency_code: str
    status: str


class DailyTotal(BaseModel):
    """Income and expenses for a single day (calendar view)."""
    income: Decimal
    expenses: Decimal


class Insights(BaseModel):
    """Simple rule-based insights (AI placeholder for later)."""
    top_expense_category: str | None
    biggest_expense: str | None
    spending_change_vs_last_month: float | None  # percent, + = spent more
    message: str | None


class DashboardSummary(BaseModel):
    totals: DashboardTotals
    monthly: list[MonthlyPoint]
    expense_breakdown: list[CategoryBreakdown]
    income_breakdown: list[CategoryBreakdown]
    recent_transactions: list[RecentTransaction]
    goals: list[GoalProgress]
    daily_totals: dict[str, DailyTotal]  # "YYYY-MM-DD" → totals for current month
    insights: Insights
