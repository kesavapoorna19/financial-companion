"""User and settings schemas."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import UserRole


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: str
    email: EmailStr
    role: UserRole
    avatar_url: str | None
    is_active: bool
    created_at: datetime


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    avatar_url: str | None = None


class UserSettingsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    currency_code: str
    theme: Literal["light", "dark"]
    monthly_income_budget: float | None


class UserSettingsUpdate(BaseModel):
    currency_code: str | None = Field(default=None, min_length=3, max_length=3)
    theme: Literal["light", "dark"] | None = None
    monthly_income_budget: float | None = Field(default=None, ge=0)
