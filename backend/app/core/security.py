"""Password hashing and JWT token utilities.

Uses bcrypt for password hashing (via passlib) and PyJWT for token creation.
No social login, no OTP — just email + password as specified.
"""

from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str):
    return pwd_context.hash(plain_password[:72])


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check a plaintext password against a bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: str, role: str | None = None) -> str:
    """Create a signed JWT. The ``sub`` claim is the user's UUID as a string."""
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload: dict = {"sub": user_id, "exp": expire}
    if role:
        payload["role"] = role
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT. Raises ``jwt.ExpiredSignatureError`` or
    ``jwt.InvalidTokenError`` on failure."""
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
