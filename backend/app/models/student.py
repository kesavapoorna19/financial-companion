"""Student role model."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, SmallInteger, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    college_name: Mapped[str | None] = mapped_column(String(120))
    course: Mapped[str | None] = mapped_column(String(120))
    year_of_study: Mapped[int | None] = mapped_column(SmallInteger)
    monthly_pocket_money: Mapped[float | None] = mapped_column(Numeric(14, 2), default=0)
    part_time_income: Mapped[float | None] = mapped_column(Numeric(14, 2), default=0)
    monthly_college_expenses: Mapped[float | None] = mapped_column(Numeric(14, 2), default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
