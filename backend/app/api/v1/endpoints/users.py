"""User profile and settings endpoints.

GET  /users/me          — full profile
PATCH /users/me         — update name / avatar
GET  /users/me/settings — currency, theme, budget
PATCH /users/me/settings — update any of the above
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.user import UserOut, UserUpdate, UserSettingsOut, UserSettingsUpdate
from app.services import user_service

router = APIRouter(tags=["users"])


@router.get("/me", response_model=UserOut)
def read_profile(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserOut)
def edit_profile(
    data: UserUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_service.update_profile(db, user.id, data)


@router.get("/me/settings", response_model=UserSettingsOut)
def read_settings(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_service.get_settings(db, user.id)


@router.patch("/me/settings", response_model=UserSettingsOut)
def edit_settings(
    data: UserSettingsUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_service.update_settings(db, user.id, data)
