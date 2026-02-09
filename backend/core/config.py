"""Application configuration management."""
from typing import List
from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    DATABASE_URL: str
    DB_HOST: str = "db"
    DB_PORT: int = 5432
    DB_NAME: str = "packnow"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "postgres"
    
    # Redis
    REDIS_URL: str = "redis://redis:6379/0"
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    
    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Application
    APP_NAME: str = "PackNow"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    
    # CORS - simple string that will be parsed
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:80"
    
    # Pricing
    BASE_PACKING_FEE: float = 50.0
    PRICE_PER_KM: float = 10.0
    URGENT_MULTIPLIER: float = 1.5
    
    # Service
    DEFAULT_PACKER_SEARCH_RADIUS_KM: float = 10.0
    LOW_INVENTORY_THRESHOLD: int = 10
    
    def get_cors_origins(self) -> List[str]:
        """Get CORS origins as a list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]
    
    class Config:
        """Pydantic config."""
        env_file = ".env"
        case_sensitive = True


settings = Settings()
