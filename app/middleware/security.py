"""Security middleware: rate limiting, security headers, request sanitization"""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime
import logging
import re

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Rate limiter – keyed on real client IP
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Return a clean 429 instead of slowapi's default."""
    return JSONResponse(
        status_code=429,
        content={
            "error": {
                "code": "RATE_LIMIT_EXCEEDED",
                "message": "Too many requests. Please slow down.",
            },
            "timestamp": datetime.utcnow().isoformat(),
        },
        headers={"Retry-After": "60"},
    )


# ---------------------------------------------------------------------------
# Security headers middleware (OWASP recommended)
# ---------------------------------------------------------------------------
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Injects security headers on every response."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        # Prevent MIME sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        # Clickjacking protection
        response.headers["X-Frame-Options"] = "DENY"
        # XSS filter (legacy browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"
        # Strict HTTPS (1 year, include sub-domains)
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )
        # Limit referrer leakage
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # Restrictive CSP – API only serves JSON so we can be very strict
        response.headers["Content-Security-Policy"] = "default-src 'none'"
        # Disable FLoC / Topics tracking
        response.headers["Permissions-Policy"] = (
            "geolocation=(), camera=(), microphone=()"
        )
        # Remove server banner
        if "server" in response.headers:
            del response.headers["server"]
        if "Server" in response.headers:
            del response.headers["Server"]

        return response


# ---------------------------------------------------------------------------
# Input sanitization helpers
# ---------------------------------------------------------------------------
# Characters that have no place in human-readable names / types
_DANGEROUS_CHARS = re.compile(r"[<>\"'`;\\]")
# Path traversal patterns
_PATH_TRAVERSAL = re.compile(r"\.\./|\.\.\\|%2e%2e", re.IGNORECASE)


def sanitize_string(value: str, max_length: int = 500) -> str:
    """
    Strip dangerous characters and path traversal sequences from a string.
    Raises ValueError if the input looks malicious after stripping.
    """
    if not isinstance(value, str):
        return value

    # Truncate first
    value = value[:max_length]

    if _PATH_TRAVERSAL.search(value):
        raise ValueError("Invalid input: path traversal detected")

    cleaned = _DANGEROUS_CHARS.sub("", value)
    return cleaned.strip()


def sanitize_filename(filename: str) -> str:
    """
    Return a safe filename:
    - keep only alphanumerics, dots, dashes, underscores
    - prevent path traversal
    - enforce max length
    """
    if not filename:
        raise ValueError("Filename cannot be empty")

    # Strip directory components
    filename = filename.replace("\\", "/").split("/")[-1]

    if _PATH_TRAVERSAL.search(filename):
        raise ValueError("Invalid filename")

    # Allow only safe characters
    safe = re.sub(r"[^\w.\-]", "_", filename)

    # Must have a valid extension
    parts = safe.rsplit(".", 1)
    if len(parts) != 2 or not parts[1]:
        raise ValueError("Filename must have a valid extension")

    # Cap total length
    if len(safe) > 255:
        name, ext = parts
        safe = name[: 255 - len(ext) - 1] + "." + ext

    return safe
