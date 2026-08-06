"""Category listing service.

Returns the built-in default categories plus the user's own custom
categories. Optionally filtered by category type (income / expense).
"""

from uuid import UUID

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.enums import CategoryType


def list_categories(
    db: Session,
    user_id: UUID,
    category_type: str | None = None,
) -> list[Category]:
    query = db.query(Category).filter(
        Category.deleted_at.is_(None),
        or_(Category.user_id.is_(None), Category.user_id == user_id),
    )

    if category_type == "income":
        query = query.filter(Category.type.in_([CategoryType.income, CategoryType.both]))
    elif category_type == "expense":
        query = query.filter(Category.type.in_([CategoryType.expense, CategoryType.both]))
    elif category_type is not None:
        raise ValueError(f"Unknown category type: {category_type}")

    return query.order_by(Category.is_default.desc(), Category.name.asc()).all()
