"""Financial Data Export service.

Builds a report from ONE user's records for a given period and renders it
as CSV text or a PDF byte stream. All queries are scoped to ``user_id`` —
there is no way to request another user's data.
"""

import calendar
import csv
import io
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestError
from app.models.category import Category
from app.models.savings import SavingsContribution
from app.models.transaction import Expense, Income
from app.schemas.reports import (
    ReportCategoryTotal,
    ReportMonthlyPoint,
    ReportOverview,
)
from app.utils.money import format_money

MONTH_ABBREV = calendar.month_abbr  # ['', 'Jan', 'Feb', ...]

PAYMENT_LABELS = {
    "cash": "Cash",
    "bank_transfer": "Bank Transfer",
    "upi": "UPI",
    "card": "Card",
    "cheque": "Cheque",
    "other": "Other",
}

FREQUENCY_LABELS = {
    "daily": "Daily",
    "weekly": "Weekly",
    "monthly": "Monthly",
    "yearly": "Yearly",
}


# ── Report data model ─────────────────────────────────────────────────────


@dataclass
class ReportData:
    user_name: str
    period_label: str
    generated_at: str
    total_income: Decimal
    total_expenses: Decimal
    balance: Decimal
    savings_amount: Decimal
    expense_summary: list[dict] = field(default_factory=list)
    income_records: list[Income] = field(default_factory=list)
    expense_records: list[Expense] = field(default_factory=list)


# ── Build the report ──────────────────────────────────────────────────────


def _month_bounds(year: int, month: int) -> tuple[date, date]:
    start = date(year, month, 1)
    if month == 12:
        return start, date(year + 1, 1, 1)
    return start, date(year, month + 1, 1)


def build_report(
    db: Session,
    user_id: UUID,
    user_name: str,
    year: int,
    month: int,
    start_date: date | None = None,
    end_date: date | None = None,
) -> ReportData:
    """Fetch and aggregate one user's records for the period.

    ``start_date`` / ``end_date`` override the month when provided (custom
    date range support). ``end_date`` is inclusive at the caller's choice.
    """
    if start_date and end_date:
        period_start = start_date
        period_end = end_date  # inclusive — handled with <= below
        period_label = f"{period_start} to {period_end}"
    else:
        period_start, _ = _month_bounds(year, month)
        period_end = None
        period_label = f"{month:02d}/{year}"

    incomes = (
        db.query(Income)
        .filter(Income.user_id == user_id, Income.deleted_at.is_(None))
        .all()
    )
    expenses = (
        db.query(Expense)
        .filter(Expense.user_id == user_id, Expense.deleted_at.is_(None))
        .all()
    )

    # Filter in Python so a single query serves both month and custom ranges.
    def in_range(d: date) -> bool:
        if d < period_start:
            return False
        if period_end is not None and d > period_end:
            return False
        if period_end is None:
            # month mode: before the first day of next month
            _, next_month = _month_bounds(year, month)
            return d < next_month
        return True

    incomes = sorted([r for r in incomes if in_range(r.income_date)], key=lambda r: r.income_date)
    expenses = sorted([r for r in expenses if in_range(r.expense_date)], key=lambda r: r.expense_date)

    total_income = sum((r.amount for r in incomes), Decimal("0"))
    total_expenses = sum((r.amount for r in expenses), Decimal("0"))

    # Savings amount = money contributed to savings goals in this period
    savings = db.query(func.coalesce(func.sum(SavingsContribution.amount), 0)).filter(
        SavingsContribution.contribution_date >= period_start
    )
    if period_end is not None:
        savings = savings.filter(SavingsContribution.contribution_date <= period_end)
    else:
        _, next_month = _month_bounds(year, month)
        savings = savings.filter(SavingsContribution.contribution_date < next_month)
    savings_amount = Decimal(float(savings.scalar() or 0))

    # Expense summary by category
    summary: dict[str, Decimal] = {}
    for e in expenses:
        name = e.category.name if e.category else "Uncategorized"
        summary[name] = summary.get(name, Decimal("0")) + e.amount
    total = sum(summary.values(), Decimal("0")) or Decimal("1")
    expense_summary = [
        {"category": name, "amount": amount, "percentage": round(float(amount / total * 100), 1)}
        for name, amount in sorted(summary.items(), key=lambda kv: kv[1], reverse=True)
    ]

    return ReportData(
        user_name=user_name,
        period_label=period_label,
        generated_at=datetime.now().strftime("%d %b %Y, %H:%M"),
        total_income=total_income,
        total_expenses=total_expenses,
        balance=total_income - total_expenses,
        savings_amount=savings_amount,
        expense_summary=expense_summary,
        income_records=incomes,
        expense_records=expenses,
    )


# ── Small helpers ─────────────────────────────────────────────────────────


def _category_name(record) -> str:
    return record.category.name if record.category else "Uncategorized"


def _payment_label(method) -> str:
    return PAYMENT_LABELS.get(method.value if hasattr(method, "value") else method, "Other")


def _recurring_label(expense: Expense) -> str:
    if not expense.is_recurring:
        return "No"
    freq = FREQUENCY_LABELS.get(
        expense.recurring_frequency.value if expense.recurring_frequency else "", "—"
    )
    return f"Yes ({freq})"


# ── CSV export ────────────────────────────────────────────────────────────


def to_csv(data: ReportData) -> str:
    """Render the report as CSV text (UTF-8 with BOM so Excel opens it well)."""
    buffer = io.StringIO()
    writer = csv.writer(buffer)

    writer.writerow(["FINANCIAL COMPANION — FINANCIAL REPORT"])
    writer.writerow(["User", data.user_name])
    writer.writerow(["Period", data.period_label])
    writer.writerow(["Generated on", data.generated_at])
    writer.writerow([])

    writer.writerow(["SUMMARY"])
    writer.writerow(["Total Income", format_money(data.total_income)])
    writer.writerow(["Total Expenses", format_money(data.total_expenses)])
    writer.writerow(["Remaining Balance", format_money(data.balance)])
    writer.writerow(["Savings Amount", format_money(data.savings_amount)])
    writer.writerow([])

    writer.writerow(["EXPENSE CATEGORY SUMMARY"])
    writer.writerow(["Category", "Amount", "Share"])
    for row in data.expense_summary:
        writer.writerow([row["category"], format_money(row["amount"]), f'{row["percentage"]}%'])
    writer.writerow([])

    writer.writerow(["INCOME RECORDS"])
    writer.writerow(["Date", "Title", "Category", "Amount", "Payment Method", "Notes"])
    for r in data.income_records:
        writer.writerow(
            [
                r.income_date.isoformat(),
                r.title,
                _category_name(r),
                format_money(r.amount, r.currency_code),
                _payment_label(r.payment_method),
                r.notes or "",
            ]
        )
    writer.writerow([])

    writer.writerow(["EXPENSE RECORDS"])
    writer.writerow(["Date", "Title", "Category", "Amount", "Payment Method", "Merchant", "Recurring", "Notes"])
    for r in data.expense_records:
        writer.writerow(
            [
                r.expense_date.isoformat(),
                r.title,
                _category_name(r),
                format_money(r.amount, r.currency_code),
                _payment_label(r.payment_method),
                r.merchant or "",
                _recurring_label(r),
                r.notes or "",
            ]
        )

    return "﻿" + buffer.getvalue()


# ── PDF export ────────────────────────────────────────────────────────────


def to_pdf(data: ReportData) -> bytes:
    """Render the report as a PDF byte stream (reportlab)."""
    from io import BytesIO

    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import inch
    from reportlab.platypus import (
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
    )

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
        title="Financial Companion Report",
        author=data.user_name,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("TitleX", parent=styles["Title"], fontSize=18, spaceAfter=2)
    sub_style = ParagraphStyle("Sub", parent=styles["Normal"], fontSize=9, textColor=colors.grey)
    h2 = ParagraphStyle("H2", parent=styles["Heading2"], fontSize=12, spaceBefore=12, spaceAfter=6)
    cell = ParagraphStyle("Cell", parent=styles["Normal"], fontSize=8, leading=10)

    def th(text_):
        return Paragraph(f"<b>{text_}</b>", cell)

    def td(text_):
        return Paragraph(str(text_), cell)

    def table(header, rows, col_widths=None):
        data = [[th(h) for h in header]] + [[td(c) for c in row] for row in rows]
        t = Table(data, colWidths=col_widths, repeatRows=1)
        t.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4f46e5")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 8),
                    ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f8fafc")),
                    ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cbd5e1")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
                ]
            )
        )
        return t

    story = [
        Paragraph("Financial Companion", title_style),
        Paragraph("Financial Report", sub_style),
        Spacer(1, 6),
        Paragraph(f"User: <b>{data.user_name}</b> &nbsp;·&nbsp; Period: <b>{data.period_label}</b>", cell),
        Paragraph(f"Generated on {data.generated_at}", sub_style),
        Spacer(1, 4),
        Paragraph("Summary", h2),
        table(
            ["Item", "Amount"],
            [
                ["Total Income", format_money(data.total_income)],
                ["Total Expenses", format_money(data.total_expenses)],
                ["Remaining Balance", format_money(data.balance)],
                ["Savings Amount", format_money(data.savings_amount)],
            ],
            col_widths=[2.5 * inch, 2.5 * inch],
        ),
    ]

    if data.expense_summary:
        story.append(Paragraph("Expense Category Summary", h2))
        story.append(
            table(
                ["Category", "Amount", "Share"],
                [[s["category"], format_money(s["amount"]), f'{s["percentage"]}%'] for s in data.expense_summary],
                col_widths=[2.2 * inch, 2.2 * inch, 1.6 * inch],
            )
        )

    story.append(Paragraph("Income Records", h2))
    if data.income_records:
        story.append(
            table(
                ["Date", "Title", "Category", "Amount", "Payment", "Notes"],
                [
                    [
                        r.income_date.isoformat(),
                        r.title,
                        _category_name(r),
                        format_money(r.amount, r.currency_code),
                        _payment_label(r.payment_method),
                        r.notes or "",
                    ]
                    for r in data.income_records
                ],
                col_widths=[0.8 * inch, 1.4 * inch, 1.1 * inch, 0.9 * inch, 0.8 * inch, 1.5 * inch],
            )
        )
    else:
        story.append(Paragraph("No income in this period.", sub_style))

    story.append(Paragraph("Expense Records", h2))
    if data.expense_records:
        story.append(
            table(
                ["Date", "Title", "Category", "Amount", "Payment", "Merchant", "Recurring", "Notes"],
                [
                    [
                        r.expense_date.isoformat(),
                        r.title,
                        _category_name(r),
                        format_money(r.amount, r.currency_code),
                        _payment_label(r.payment_method),
                        r.merchant or "",
                        _recurring_label(r),
                        r.notes or "",
                    ]
                    for r in data.expense_records
                ],
                col_widths=[0.7 * inch, 1.2 * inch, 0.9 * inch, 0.8 * inch, 0.7 * inch, 0.8 * inch, 0.7 * inch, 1.0 * inch],
            )
        )
    else:
        story.append(Paragraph("No expenses in this period.", sub_style))

    doc.build(story)
    return buffer.getvalue()


# ── Overview (Reports page) ───────────────────────────────────────────────


def _add_months(d: date, months: int) -> date:
    month_index = d.month - 1 + months
    year = d.year + month_index // 12
    month = month_index % 12 + 1
    day = min(d.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def _category_totals(records) -> list[ReportCategoryTotal]:
    """Group a list of income/expense records by category name."""
    agg: dict[str, Decimal] = {}
    for r in records:
        name = r.category.name if r.category else "Uncategorized"
        agg[name] = agg.get(name, Decimal("0")) + r.amount
    total = sum(agg.values(), Decimal("0")) or Decimal("1")
    return [
        ReportCategoryTotal(
            category=name,
            total=amount,
            percentage=round(float(amount / total * 100), 1),
        )
        for name, amount in sorted(agg.items(), key=lambda kv: kv[1], reverse=True)
    ]


def build_overview(
    db: Session,
    user_id: UUID,
    user_name: str,
    start_date: date,
    end_date: date,
) -> ReportOverview:
    """Aggregate a period for the interactive Reports page."""
    if start_date > end_date:
        raise BadRequestError("start_date must be before end_date")

    incomes = (
        db.query(Income)
        .filter(
            Income.user_id == user_id,
            Income.deleted_at.is_(None),
            Income.income_date >= start_date,
            Income.income_date <= end_date,
        )
        .all()
    )
    expenses = (
        db.query(Expense)
        .filter(
            Expense.user_id == user_id,
            Expense.deleted_at.is_(None),
            Expense.expense_date >= start_date,
            Expense.expense_date <= end_date,
        )
        .all()
    )

    total_income = sum((r.amount for r in incomes), Decimal("0"))
    total_expenses = sum((r.amount for r in expenses), Decimal("0"))

    savings = db.query(func.coalesce(func.sum(SavingsContribution.amount), 0)).filter(
        SavingsContribution.contribution_date >= start_date,
        SavingsContribution.contribution_date <= end_date,
    )
    savings_amount = Decimal(float(savings.scalar() or 0))

    # Monthly series (one point per month in the range)
    monthly_series: list[ReportMonthlyPoint] = []
    cursor = start_date.replace(day=1)
    while cursor <= end_date:
        _, next_month = _month_bounds(cursor.year, cursor.month)
        seg_end = min(next_month - timedelta(days=1), end_date)
        seg_start = max(cursor, start_date)
        m_income = sum(
            (r.amount for r in incomes if seg_start <= r.income_date <= seg_end),
            Decimal("0"),
        )
        m_expenses = sum(
            (r.amount for r in expenses if seg_start <= r.expense_date <= seg_end),
            Decimal("0"),
        )
        monthly_series.append(
            ReportMonthlyPoint(
                month=MONTH_ABBREV[cursor.month],
                year=cursor.year,
                income=m_income,
                expenses=m_expenses,
            )
        )
        cursor = _add_months(cursor, 1)

    return ReportOverview(
        user_name=user_name,
        period_label=f"{start_date.isoformat()} to {end_date.isoformat()}",
        start_date=start_date,
        end_date=end_date,
        total_income=total_income,
        total_expenses=total_expenses,
        balance=total_income - total_expenses,
        savings_amount=savings_amount,
        income_by_category=_category_totals(incomes),
        expense_by_category=_category_totals(expenses),
        monthly_series=monthly_series,
    )
