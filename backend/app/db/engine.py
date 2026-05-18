"""Pool koneksi async PostgreSQL menggunakan SQLAlchemy 2.0 async + asyncpg."""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from typing import Optional

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import get_settings

logger = logging.getLogger(__name__)

_engine: Optional[AsyncEngine] = None
_session_factory: Optional[async_sessionmaker] = None


def _build_engine() -> AsyncEngine:
    settings = get_settings()
    return create_async_engine(
        settings.database_url,
        connect_args=settings.database_connect_args,
        echo=settings.app_env == "development",
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=1800,
    )


def get_engine() -> AsyncEngine:
    global _engine
    if _engine is None:
        _engine = _build_engine()
    return _engine


def get_session_factory() -> async_sessionmaker:
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            bind=get_engine(),
            expire_on_commit=False,
            autoflush=False,
            autocommit=False,
        )
    return _session_factory


async def init_db() -> None:
    """Inisialisasi pool koneksi; dipanggil dari lifespan startup."""
    import sqlalchemy
    engine = get_engine()
    s = get_settings()
    target = "DATABASE_URL" if s.database_url_env else f"{s.postgres_host}:{s.postgres_port}/{s.postgres_db}"
    logger.info(
        "Pool koneksi database diinisialisasi: %s",
        target,
    )
    async with engine.connect() as conn:
        await conn.execute(sqlalchemy.text("SELECT 1"))
    logger.info("Koneksi database berhasil diverifikasi.")


async def close_db() -> None:
    """Tutup pool koneksi; dipanggil dari lifespan shutdown."""
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _session_factory = None
        logger.info("Pool koneksi database ditutup.")


async def get_db() -> AsyncIterator[AsyncSession]:
    """Dependency FastAPI: sediakan session per-request."""
    factory = get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
