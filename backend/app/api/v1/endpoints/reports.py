"""Financial Data Export endpoints.

GET /reports/export/csv?year=2026&month=8            → CSV file
GET /reports/export/pdf?year=2026&month=8            → PDF file

Custom date range (future-ready):
GET /reports/export/csv?start_date=2026-01-01&end_date=2026-03-31

Every response is scoped to the authenticated user — no cross-user access.
"""

from datetime import date

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.exceptions import BadRequestError
from app.models.user import User
from app.schemas.reports import ReportOverview
from app.services import report_service

router = APIRouter(tags=["reports"])


@router.get("/overview", response_model=ReportOverview)
def report_overview(
    start_date: date,
    end_date: date,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Aggregated summary for a date range (Reports page viewer)."""
    return report_service.build_overview(db, user.id, user.full_name, start_date, end_date)


def _build_and_download(
    db: Session,
    user: User,
    year: int,
    month: int | None,
    start_date: date | None,
    end_date: date | None,
    content_type: str,
    extension: str,
    renderer,
) -> Response:
    """Shared logic: validate period, build report, return as a download."""
    # Determine the period
    if start_date and end_date:
        if start_date > end_date:
            raise BadRequestError("start_date must be before end_date")
        build_kwargs = {"start_date": start_date, "end_date": end_date}
        period_part = f"{start_date.isoformat()}_to_{end_date.isoformat()}"
    else:
        if month is None or year is None:
            raise BadRequestError("Provide month + year, or a start_date + end_date range")
        build_kwargs = {}
        period_part = f"{year}-{month:02d}"

    data = report_service.build_report(
        db,
        user_id=user.id,
        user_name=user.full_name,
        year=year,
        month=month or 1,
        **build_kwargs,
    )

    content = renderer(data)
    filename = f"financial-report-{period_part}.{extension}"

    return Response(
        content=content,
        media_type=content_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(content)),
        },
    )


@router.get("/export/csv")
def export_csv(
    year: int | None = Query(default=None, ge=2000, le=2100),
    month: int | None = Query(default=None, ge=1, le=12),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _build_and_download(
        db, user, year, month, start_date, end_date,
        content_type="text/csv; charset=utf-8",
        extension="csv",
        renderer=report_service.to_csv,
    )


@router.get("/export/pdf")
def export_pdf(
    year: int | None = Query(default=None, ge=2000, le=2100),
    month: int | None = Query(default=None, ge=1, le=12),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _build_and_download(
        db, user, year, month, start_date, end_date,
        content_type="application/pdf",
        extension="pdf",
        renderer=report_service.to_pdf,
    )
