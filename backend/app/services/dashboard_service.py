"""Dashboard aggregation service.

Every query is scoped to a single ``user_id`` — no user can ever see
another user's data.
"""

import calendar
from datetime import date
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.enums import GoalStatus
from app.models.savings import SavingsContribution, SavingsGoal
from app.models.transaction import Expense, Income
from app.schemas.dashboard import (
    CategoryBreakdown,
    DailyTotal,
    DashboardSummary,
    DashboardTotals,
    GoalProgress,
    Insights,
    MonthlyPoint,
    RecentTransaction,
)

MONTH_ABBREV = calendar.month_abbr  # ['', 'Jan', 'Feb', ...]


# ── Helpers ───────────────────────────────────────────────────────────────


def _month_bounds(year: int, month: int) -> tuple[date, date]:
    """Return (first day, first day of next month) for a month."""
    start = date(year, month, 1)
    if month == 12:
        return start, date(year + 1, 1, 1)
    return start, date(year, month + 1, 1)


def _sum_between(db, model, user_id, date_col, start, end) -> float:
    """Sum of one user's amounts in [start, end)."""
    value = (
        db.query(func.coalesce(func.sum(model.amount), 0))
        .filter(
            model.user_id == user_id,
            model.deleted_at.is_(None),
            date_col >= start,
            date_col < end,
        )
        .scalar()
    )
    return float(value)


def _breakdown(db, model, user_id, date_col, start, end) -> list[CategoryBreakdown]:
    """Sum amounts grouped by category name."""
    rows = (
        db.query(
            func.coalesce(Category.name, "Uncategorized"),
            func.sum(model.amount),
        )
        .select_from(model)
        .outerjoin(Category, model.category_id == Category.id)
        .filter(
            model.user_id == user_id,
            model.deleted_at.is_(None),
            date_col >= start,
            date_col < end,
        )
        .group_by(func.coalesce(Category.name, "Uncategorized"))
        .all()
    )
    total = sum(float(r[1]) for r in rows) or 0.0
    result = []
    for name, amount in sorted(rows, key=lambda r: float(r[1]), reverse=True):
        result.append(
            CategoryBreakdown(
                category=name,
                total=float(amount),
                percentage=round(float(amount) / total * 100, 1) if total else 0.0,
            )
        )
    return result


def _recent(db, user_id, limit=10) -> list[RecentTransaction]:
    """Merge the newest incomes and expenses into one list."""
    incomes = (
        db.query(Income)
        .filter(Income.user_id == user_id, Income.deleted_at.is_(None))
        .order_by(Income.income_date.desc(), Income.created_at.desc())
        .limit(limit)
        .all()
    )
    expenses = (
        db.query(Expense)
        .filter(Expense.user_id == user_id, Expense.deleted_at.is_(None))
        .order_by(Expense.expense_date.desc(), Expense.created_at.desc())
        .limit(limit)
        .all()
    )

    items: list[RecentTransaction] = []
    for inc in incomes:
        items.append(
            RecentTransaction(
                id=inc.id,
                title=inc.title,
                category=inc.category.name if inc.category else None,
                amount=inc.amount,
                currency_code=inc.currency_code,
                date=inc.income_date,
                type="income",
            )
        )
    for exp in expenses:
        items.append(
            RecentTransaction(
                id=exp.id,
                title=exp.title,
                category=exp.category.name if exp.category else None,
                amount=exp.amount,
                currency_code=exp.currency_code,
                date=exp.expense_date,
                type="expense",
            )
        )

    items.sort(key=lambda t: t.date, reverse=True)
    return items[:limit]


def _daily_totals(db, user_id, start, end) -> dict[str, DailyTotal]:
    """Per-day income/expense totals for the calendar view."""
    income_rows = (
        db.query(Income.income_date, func.coalesce(func.sum(Income.amount), 0))
        .filter(
            Income.user_id == user_id,
            Income.deleted_at.is_(None),
            Income.income_date >= start,
            Income.income_date < end,
        )
        .group_by(Income.income_date)
        .all()
    )
    expense_rows = (
        db.query(Expense.expense_date, func.coalesce(func.sum(Expense.amount), 0))
        .filter(
            Expense.user_id == user_id,
            Expense.deleted_at.is_(None),
            Expense.expense_date >= start,
            Expense.expense_date < end,
        )
        .group_by(Expense.expense_date)
        .all()
    )

    totals: dict[str, DailyTotal] = {}
    for d, amount in income_rows:
        key = d.isoformat()
        totals.setdefault(key, DailyTotal(income=0, expenses=0)).income = float(amount)
    for d, amount in expense_rows:
        key = d.isoformat()
        totals.setdefault(key, DailyTotal(income=0, expenses=0)).expenses = float(amount)
    return totals


def _goal_progress(db, user_id) -> list[GoalProgress]:
    goals = (
        db.query(SavingsGoal)
        .filter(
            SavingsGoal.user_id == user_id,
            SavingsGoal.deleted_at.is_(None),
            SavingsGoal.status != GoalStatus.archived,
        )
        .order_by(SavingsGoal.created_at.desc())
        .limit(5)
        .all()
    )
    result = []
    for goal in goals:
        saved = float(
            db.query(func.coalesce(func.sum(SavingsContribution.amount), 0))
            .filter(SavingsContribution.goal_id == goal.id)
            .scalar()
        )
        pct = round(saved / float(goal.target_amount) * 100, 1) if goal.target_amount else 0.0
        result.append(
            GoalProgress(
                id=goal.id,
                name=goal.name,
                target_amount=goal.target_amount,
                saved_amount=saved,
                percentage=min(pct, 100.0),
                currency_code=goal.currency_code,
                status=goal.status.value,
            )
        )
    return result


def _insights(db, user_id, this_start, this_month_expense, breakdown) -> Insights:
    """Rule-based insights — designed to be upgraded to AI later."""
    insights = Insights(
        top_expense_category=None,
        biggest_expense=None,
        spending_change_vs_last_month=None,
        message=None,
    )

    if breakdown:
        insights.top_expense_category = breakdown[0].category

    biggest = (
        db.query(Expense)
        .filter(
            Expense.user_id == user_id,
            Expense.deleted_at.is_(None),
            Expense.expense_date >= this_start,
        )
        .order_by(Expense.amount.desc())
        .first()
    )
    if biggest:
        insights.biggest_expense = f"{biggest.title} ({biggest.amount} {biggest.currency_code})"

    # Compare this month vs last month
    today = date.today()
    last_start, _ = _month_bounds(
        today.year - (1 if today.month == 1 else 0),
        today.month - 1 if today.month > 1 else 12,
    )
    last_expense = _sum_between(db, Expense, user_id, Expense.expense_date, last_start, this_start)
    if last_expense > 0:
        change = round((this_month_expense - last_expense) / last_expense * 100, 1)
        insights.spending_change_vs_last_month = change

    # Human-readable message
    if breakdown:
        top = breakdown[0]
        change_msg = ""
        if insights.spending_change_vs_last_month is not None:
            if insights.spending_change_vs_last_month > 0:
                change_msg = (
                    f" That's {insights.spending_change_vs_last_month}% more than last month."
                )
            else:
                change_msg = (
                    f" That's {abs(insights.spending_change_vs_last_month)}% less than last month."
                )
        insights.message = (
            f"Your biggest expense category this month is {top.category} "
            f"with {top.total} in total.{change_msg}"
        )
    return insights


# ── Main entrypoint ───────────────────────────────────────────────────────


def get_dashboard_summary(db: Session, user_id: UUID) -> DashboardSummary:
    today = date.today()

    # Current month totals
    this_start, this_end = _month_bounds(today.year, today.month)
    total_income = _sum_between(db, Income, user_id, Income.income_date, this_start, this_end)
    total_expenses = _sum_between(db, Expense, user_id, Expense.expense_date, this_start, this_end)

    # Last 6 months series
    monthly: list[MonthlyPoint] = []
    for i in range(5, -1, -1):
        m = today.month - i
        y = today.year
        while m <= 0:
            m += 12
            y -= 1
        start, end = _month_bounds(y, m)
        monthly.append(
            MonthlyPoint(
                month=MONTH_ABBREV[m],
                year=y,
                income=_sum_between(db, Income, user_id, Income.income_date, start, end),
                expenses=_sum_between(db, Expense, user_id, Expense.expense_date, start, end),
            )
        )

    expense_breakdown = _breakdown(db, Expense, user_id, Expense.expense_date, this_start, this_end)
    income_breakdown = _breakdown(db, Income, user_id, Income.income_date, this_start, this_end)

    return DashboardSummary(
        totals=DashboardTotals(
            total_income=total_income,
            total_expenses=total_expenses,
            balance=total_income - total_expenses,
        ),
        monthly=monthly,
        expense_breakdown=expense_breakdown,
        income_breakdown=income_breakdown,
        recent_transactions=_recent(db, user_id),
        goals=_goal_progress(db, user_id),
        daily_totals=_daily_totals(db, user_id, this_start, this_end),
        insights=_insights(db, user_id, this_start, total_expenses, expense_breakdown),
    )
