"""Configuration management for CFOne application"""

from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # AWS Configuration
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"

    # Application Settings
    app_env: str = "development"
    debug: bool = True
    secret_key: str = "CHANGE_ME_IN_PRODUCTION"  # Override in .env
    jwt_expiration_hours: int = 24
    jwt_algorithm: str = "HS256"

    # Database
    database_url: str = "sqlite:///./data/cfone.db"

    # File Storage
    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 10
    allowed_extensions: list = ["pdf", "xlsx", "xls"]

    # Vector Store
    vector_store_path: str = "./data/vector_store"

    # API Server
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # AWS Bedrock Models
    nova_lite_model_id: str = "amazon.nova-lite-v1:0"
    nova_pro_model_id: str = "amazon.nova-pro-v1:0"
    nova_model_id: str = "amazon.nova-lite-v1:0"
    titan_embedding_model_id: str = "amazon.titan-embed-text-v2:0"

    # Processing Settings
    chunk_size_words: int = 500
    chunk_overlap_words: int = 50
    max_retries: int = 3
    request_timeout_seconds: int = 60

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
