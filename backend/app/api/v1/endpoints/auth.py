"""Authentication endpoints.

POST /auth/register  — create account (auto-creates role profile + settings)
POST /auth/login     — verify credentials, return JWT
GET  /auth/me        — current authenticated user profile
"""

import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.exceptions import UnauthorizedError
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserOut
from app.services import auth_service

router = APIRouter(tags=["auth"])
logger = logging.getLogger("financial_companion.auth")


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new account. A role-specific profile is created automatically."""
    user, token = auth_service.register_user(db, data)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password."""
    try:
        _user, token = auth_service.authenticate_user(db, data.email, data.password)
    except UnauthorizedError:
        raise  # re-raise as-is (401 with clear message)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return user
