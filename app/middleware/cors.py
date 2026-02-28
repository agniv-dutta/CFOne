"""CORS configuration"""

from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings

settings = get_settings()


def setup_cors(app):
    """Configure CORS middleware"""
    origins = settings.cors_origins.split(",")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
        expose_headers=["X-Request-ID"],
        max_age=600,
    )
