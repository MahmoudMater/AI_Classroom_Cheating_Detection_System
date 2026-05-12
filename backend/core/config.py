from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def _default_model_dir() -> str:
    """`backend/ai-models` next to this package (core/ → backend/)."""
    return str((Path(__file__).resolve().parent.parent / "ai-models").resolve())


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/proctoring_db"
    SYNC_DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/proctoring_db"
    MODEL_DIR: str = Field(default_factory=_default_model_dir)
    BEST_MODEL_FILE: str = "cnn_cheating_model.pth"
    CORS_ORIGINS: list[str] = Field(default_factory=lambda: ["*"])
    API_VERSION: str = "1.0.0"
    WS_FRAME_JPEG_QUALITY: int = 60

    @property
    def backend_root(self) -> Path:
        return Path(__file__).resolve().parent.parent
