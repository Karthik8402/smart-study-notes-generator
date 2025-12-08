"""
Configuration settings for the Smart Study Notes Generator backend.
Uses Pydantic Settings for type-safe environment variable management.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # MongoDB Atlas
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "smart_study_notes"
    
    # JWT Authentication
    secret_key: str = "your-super-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Groq API (FREE LLM)
    groq_api_key: Optional[str] = None
    
    # ChromaDB
    chroma_persist_directory: str = "./chroma_db"
    
    # File Upload
    upload_directory: str = "./uploads"
    max_upload_size_mb: int = 50
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    
    # Embedding Model
    embedding_model: str = "all-MiniLM-L6-v2"
    
    # RAG Settings
    chunk_size: int = 800
    chunk_overlap: int = 200
    top_k_results: int = 5

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    Uses lru_cache to avoid reading .env file on every request.
    """
    return Settings()


# Export settings instance
settings = get_settings()
