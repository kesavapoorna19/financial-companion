"""Savings goal schemas."""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import GoalStatus


class SavingsGoalCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    target_amount: Decimal = Field(gt=0)
    currency_code: str = Field(default="INR", min_length=3, max_length=3)
    target_date: date | None = None


class SavingsGoalUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    target_amount: Decimal | None = Field(default=None, gt=0)
    currency_code: str | None = Field(default=None, min_length=3, max_length=3)
    target_date: date | None = None
    status: GoalStatus | None = None


class SavingsContributionCreate(BaseModel):
    amount: Decimal = Field(gt=0)
    contribution_date: date
    notes: str | None = None


class SavingsContributionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    goal_id: UUID
    amount: Decimal
    contribution_date: date
    notes: str | None
    created_at: datetime


class SavingsGoalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    target_amount: Decimal
    currency_code: str
    target_date: date | None
    status: GoalStatus
    created_at: datetime
    updated_at: datetime
