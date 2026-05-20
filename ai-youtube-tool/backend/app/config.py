from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

# Resolve .env path — works whether running from backend/ or project root
_here = Path(__file__).parent.parent  # backend/
_env_file = _here / ".env" if (_here / ".env").exists() else _here.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_env_file),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # App
    app_env: str = "development"
    debug: bool = True

    # Database
    database_url: str = "postgresql+asyncpg://aitube:aitube_secret@localhost:5432/aitube"

    # Redis / Celery
    redis_url: str = "redis://localhost:6379/0"

    # AI Providers
    fal_key: str = ""
    ai_provider: str = "fal"

    # Storage
    storage_base_path: str = "./storage"

    # CORS
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()
