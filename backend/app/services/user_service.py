"""User profile and settings services."""

import logging
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.user import User, UserSettings
from app.schemas.user import UserUpdate, UserSettingsUpdate

logger = logging.getLogger("financial_companion.users")


def update_profile(db: Session, user_id: UUID, data: UserUpdate) -> User:
    """Update the user's name or avatar. Returns the updated user."""
    user = db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()
    if not user:
        raise NotFoundError("User not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


def get_settings(db: Session, user_id: UUID) -> UserSettings:
    """Fetch the user's settings, creating defaults if missing."""
    settings = (
        db.query(UserSettings)
        .filter(UserSettings.user_id == user_id)
        .first()
    )
    if not settings:
        settings = UserSettings(user_id=user_id, currency_code="INR", theme="light")
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def update_settings(db: Session, user_id: UUID, data: UserSettingsUpdate) -> UserSettings:
    """Update display currency, theme, or budget."""
    settings = get_settings(db, user_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)

    db.commit()
    db.refresh(settings)
    return settings
