from fastapi import Request, status
from fastapi.responses import JSONResponse
import logging

# Configure Logger
logger = logging.getLogger("backend")

class BaseAppError(Exception):
    """Base class for application exceptions."""
    def __init__(self, message: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class AuthError(BaseAppError):
    """Exception raised for authentication errors."""
    def __init__(self, message: str):
        super().__init__(message, status_code=status.HTTP_401_UNAUTHORIZED)

class VideoGenError(BaseAppError):
    """Exception raised during video generation pipeline."""
    def __init__(self, message: str):
        super().__init__(message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StorageError(BaseAppError):
    """Exception raised for blob storage issues."""
    def __init__(self, message: str):
        super().__init__(message, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)

class ResourceNotFoundError(BaseAppError):
    """Exception raised when a requested resource is not found."""
    def __init__(self, message: str):
        super().__init__(message, status_code=status.HTTP_404_NOT_FOUND)

async def app_error_handler(request: Request, exc: BaseAppError):
    logger.error(f"Application Error: {exc.message} on {request.url}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.__class__.__name__,
            "message": exc.message,
            "success": False
        }
    )

async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled Exception on {request.url}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred in our engineering layer.",
            "success": False
        }
    )
