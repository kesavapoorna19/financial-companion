"""Employee role models: profile, EMIs, salary history."""

import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base
from app.models.enums import EmiStatus


class EmployeeProfile(Base):
    __tablename__ = "employee_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    employer_name: Mapped[str | None] = mapped_column(String(120))
    designation: Mapped[str | None] = mapped_column(String(120))
    monthly_salary: Mapped[float | None] = mapped_column(Numeric(14, 2), default=0)
    salary_day: Mapped[int | None] = mapped_column(SmallInteger)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Emi(Base):
    __tablename__ = "emis"
    __table_args__ = (
        CheckConstraint("total_amount > 0", name="chk_emis_total_positive"),
        CheckConstraint("monthly_installment > 0", name="chk_emis_installment_positive"),
        CheckConstraint("remaining_balance >= 0", name="chk_emis_remaining_nonneg"),
        CheckConstraint("months_paid >= 0", name="chk_emis_months_nonneg"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    lender: Mapped[str | None] = mapped_column(String(120))
    total_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    monthly_installment: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    months_paid: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    remaining_balance: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    interest_rate: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), default=0)
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[EmiStatus] = mapped_column(
        SAEnum(EmiStatus, name="emi_status", native_enum=True),
        nullable=False,
        default=EmiStatus.active,
    )
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class SalaryHistory(Base):
    __tablename__ = "salary_history"
    __table_args__ = (
        CheckConstraint("amount > 0", name="chk_salary_amount_positive"),
        UniqueConstraint("user_id", "salary_month", name="uq_salary_user_month"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency_code: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    salary_month: Mapped[date] = mapped_column(Date, nullable=False)
    received_date: Mapped[date | None] = mapped_column(Date)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
