"""Application exceptions and their HTTP handlers.

Endpoints/services raise domain exceptions (e.g. ``NotFoundError``); the
handlers registered in ``main.py`` translate them into clean JSON responses
with proper HTTP status codes.
"""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


class AppException(Exception):
    """Base class for all application-level errors."""

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    message: str = "Something went wrong"

    def __init__(self, message: str | None = None) -> None:
        if message is not None:
            self.message = message
        super().__init__(self.message)


class NotFoundError(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    message = "Not found"


class ConflictError(AppException):
    status_code = status.HTTP_409_CONFLICT
    message = "Conflict"


class UnauthorizedError(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    message = "Not authenticated"


class ForbiddenError(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    message = "Not allowed"


class BadRequestError(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    message = "Bad request"


def register_exception_handlers(app: FastAPI) -> None:
    """Attach JSON handlers for application exceptions."""

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message},
        )
