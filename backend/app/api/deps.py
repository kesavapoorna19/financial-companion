"""Shared FastAPI dependencies.

- ``get_db``        — one database session per request.
- ``get_current_user`` — extracts the JWT and loads the authenticated user.
- ``require_role``  — restricts access to specific roles (e.g. shop_owner).
"""

import logging

import jwt
from fastapi import Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import UnauthorizedError, ForbiddenError
from app.core.security import decode_access_token
from app.models.enums import UserRole
from app.models.user import User

logger = logging.getLogger("financial_companion.auth")

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    """Validate the Authorization header and return the current user.

    Raises 401 if the token is missing, invalid or the user no longer exists.
    """
    if credentials is None:
        raise UnauthorizedError("Not authenticated")

    try:
        payload = decode_access_token(credentials.credentials)
        user_id: str | None = payload.get("sub")
    except jwt.ExpiredSignatureError:
        raise UnauthorizedError("Token has expired — please log in again")
    except jwt.InvalidTokenError:
        raise UnauthorizedError("Invalid token")

    if not user_id:
        raise UnauthorizedError("Invalid token payload")

    user = (
        db.query(User)
        .filter(User.id == user_id, User.is_active.is_(True), User.deleted_at.is_(None))
        .first()
    )
    if not user:
        raise UnauthorizedError("User not found or account deactivated")

    return user


def require_role(*allowed_roles: UserRole):
    """Dependency factory: ``Depends(require_role(UserRole.employee))``."""

    def _check(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            allowed_names = "/".join(r.value for r in allowed_roles)
            raise ForbiddenError(
                f"This page is for {allowed_names} users only"
            )
        return user

    return _check
