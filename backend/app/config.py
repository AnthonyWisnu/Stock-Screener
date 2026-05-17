"""Konfigurasi aplikasi.

Seluruh nilai sensitif dan parameter runtime dibaca dari environment variable.
Validasi dijalankan pada saat startup; bila variable wajib hilang, proses
dihentikan dengan pesan error yang menyebut nama variable.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Optional

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Kumpulan pengaturan aplikasi yang dibaca dari environment."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # PostgreSQL
    database_url_env: Optional[str] = Field(None, alias="DATABASE_URL")
    postgres_host: Optional[str] = Field(None, alias="POSTGRES_HOST")
    postgres_port: int = Field(5432, alias="POSTGRES_PORT")
    postgres_db: Optional[str] = Field(None, alias="POSTGRES_DB")
    postgres_user: Optional[str] = Field(None, alias="POSTGRES_USER")
    postgres_password: Optional[str] = Field(None, alias="POSTGRES_PASSWORD")

    # Aplikasi
    app_env: str = Field("development", alias="APP_ENV")
    log_level: str = Field("INFO", alias="LOG_LEVEL")
    market_timezone: str = Field("Asia/Jakarta", alias="MARKET_TIMEZONE")
    fetch_interval_minutes: int = Field(15, alias="FETCH_INTERVAL_MINUTES")
    history_bar_count: int = Field(260, alias="HISTORY_BAR_COUNT")
    yfinance_timeout_seconds: int = Field(30, alias="YFINANCE_TIMEOUT_SECONDS")
    fetch_max_concurrency: int = Field(8, alias="FETCH_MAX_CONCURRENCY")
    cors_allow_origins: str = Field("http://localhost:5173", alias="CORS_ALLOW_ORIGINS")

    @field_validator("log_level")
    @classmethod
    def _validate_log_level(cls, value: str) -> str:
        allowed = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        normalized = value.upper()
        if normalized not in allowed:
            raise ValueError(
                f"LOG_LEVEL tidak valid: '{value}'. Gunakan salah satu dari {sorted(allowed)}."
            )
        return normalized

    @field_validator("app_env")
    @classmethod
    def _validate_app_env(cls, value: str) -> str:
        allowed = {"development", "production", "test"}
        normalized = value.lower()
        if normalized not in allowed:
            raise ValueError(
                f"APP_ENV tidak valid: '{value}'. Gunakan salah satu dari {sorted(allowed)}."
            )
        return normalized

    @model_validator(mode="after")
    def _validate_database_config(self) -> "Settings":
        if self.database_url_env:
            return self

        missing = [
            name
            for name, value in {
                "POSTGRES_HOST": self.postgres_host,
                "POSTGRES_DB": self.postgres_db,
                "POSTGRES_USER": self.postgres_user,
                "POSTGRES_PASSWORD": self.postgres_password,
            }.items()
            if not value
        ]
        if missing:
            raise ValueError(
                "Konfigurasi database belum lengkap. Isi DATABASE_URL atau variable: "
                + ", ".join(missing)
                + "."
            )
        return self

    @property
    def database_url(self) -> str:
        """URL koneksi async untuk SQLAlchemy/asyncpg."""
        if self.database_url_env:
            url = self.database_url_env
            if url.startswith("postgres://"):
                return "postgresql+asyncpg://" + url.removeprefix("postgres://")
            if url.startswith("postgresql://"):
                return "postgresql+asyncpg://" + url.removeprefix("postgresql://")
            return url

        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_allow_origins.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Ambil singleton Settings.

    Kegagalan validasi environment variable wajib akan memunculkan
    ValidationError dari Pydantic yang memuat nama variable yang hilang.
    """
    return Settings()  # type: ignore[call-arg]
