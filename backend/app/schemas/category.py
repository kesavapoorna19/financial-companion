"""Category schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import CategoryType


class CategoryBase(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    type: CategoryType = CategoryType.both
    icon: str | None = Field(default=None, max_length=60)
    color: str | None = Field(default=None, max_length=9)


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=60)
    type: CategoryType | None = None
    icon: str | None = None
    color: str | None = None


class CategoryOut(CategoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    is_default: bool
    created_at: datetime
