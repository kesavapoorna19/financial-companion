"""Authentication business logic: register, login, token creation.

On registration, the service automatically creates:
- a ``user_settings`` row (default currency INR, light theme),
- the correct role-specific profile (student, employee, etc.).

This means every new user lands in a fully set-up account immediately —
no extra "complete your profile" step needed.
"""

import logging
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestError, ConflictError, UnauthorizedError
from app.core.security import create_access_token, hash_password, verify_password
from app.models.enums import UserRole
from app.models.user import User, UserSettings
from app.models.student import StudentProfile
from app.models.employee import EmployeeProfile
from app.models.freelancer import FreelancerProfile
from app.models.investor import InvestorProfile
from app.models.shop import ShopProfile
from app.schemas.auth import RegisterRequest

logger = logging.getLogger("financial_companion.auth")


def register_user(db: Session, data: RegisterRequest) -> tuple[User, str]:
    """Create a new user account with a role-specific profile.

    Returns ``(user, access_token)``.
    """
    email = data.email.strip().lower()

    existing = db.query(User).filter(User.email == email, User.deleted_at.is_(None)).first()
    if existing:
        raise ConflictError("An account with this email already exists")

    user = User(
        full_name=data.full_name.strip(),
        email=email,
        password_hash=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    db.flush()  # assigns user.id (UUID)

    # Default settings (currency INR, light theme)
    db.add(UserSettings(user_id=user.id, currency_code="INR", theme="light"))

    # Role-specific profile — every role gets its own row
    _create_role_profile(db, user.id, data.role)

    db.commit()
    db.refresh(user)

    token = create_access_token(str(user.id), user.role.value)
    logger.info("Registered new user: %s (%s)", user.email, user.role.value)
    return user, token


def authenticate_user(db: Session, email: str, password: str) -> tuple[User, str]:
    """Verify credentials and return ``(user, access_token)``.

    Raises ``UnauthorizedError`` on wrong email or password.
    """
    email = email.strip().lower()
    user = db.query(User).filter(User.email == email, User.deleted_at.is_(None)).first()

    if not user or not verify_password(password, user.password_hash):
        raise UnauthorizedError("Wrong email or password")

    if not user.is_active:
        raise UnauthorizedError("This account has been deactivated")

    token = create_access_token(str(user.id), user.role.value)
    return user, token


def get_profile(db: Session, user_id: UUID) -> User:
    """Fetch the current user profile. Raises if user no longer exists."""
    user = db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()
    if not user:
        raise BadRequestError("User not found")
    return user


# ── Internal helpers ──────────────────────────────────────────────────────


def _create_role_profile(db: Session, user_id: UUID, role: UserRole) -> None:
    """Insert the matching role-specific profile row."""
    profile_map: dict[UserRole, type] = {
        UserRole.student: StudentProfile,
        UserRole.employee: EmployeeProfile,
        UserRole.freelancer: FreelancerProfile,
        UserRole.investor: InvestorProfile,
        UserRole.shop_owner: ShopProfile,
    }
    model_cls = profile_map.get(role)
    if model_cls:
        db.add(model_cls(user_id=user_id))
