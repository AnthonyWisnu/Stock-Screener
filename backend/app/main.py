"""Entry point aplikasi FastAPI.

Urutan startup:
1. Muat konfigurasi dari environment variable (gagal-cepat bila kurang).
2. Atur logging ke stdout.
3. Buat instance FastAPI dengan CORS dan exception handler.
4. Daftarkan router API.
5. Pada lifespan startup: inisialisasi pool DB, seed saham, mulai scheduler.
6. Pada lifespan shutdown: hentikan scheduler, tutup pool DB.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api.routes_stocks import router as stocks_router
from app.config import get_settings
from app.core.errors import register_exception_handlers
from app.db.engine import close_db, get_session_factory, init_db
from app.logging_config import configure_logging
from app.scheduler.setup import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Siklus hidup aplikasi."""
    logger = logging.getLogger("app.lifespan")
    logger.info("Aplikasi IDX Stock Screener versi %s mulai.", __version__)

    # 1. Inisialisasi pool koneksi database
    await init_db()

    # 2. Seed daftar saham bila tabel kosong
    try:
        from app.data.seed_stocks import seed_default_stocks
        from app.db.repository import get_active_stocks

        session_factory = get_session_factory()
        async with session_factory() as session:
            existing = await get_active_stocks(session)
            if not existing:
                logger.info("Tabel stocks kosong. Menjalankan seed data awal.")
                await seed_default_stocks(session)
                await session.commit()
            else:
                logger.info("Tabel stocks sudah berisi %d saham aktif.", len(existing))
    except Exception as exc:
        logger.error("Gagal melakukan seed saham: %s", exc)

    # 3. Mulai scheduler
    start_scheduler()

    # 4. Bila jam bursa sedang buka saat startup, langsung jalankan satu siklus fetch
    #    agar data tidak stale setelah backend restart
    try:
        from app.core.market_hours import is_market_open
        from app.scheduler.jobs import run_fetch_cycle
        import asyncio

        settings = get_settings()
        if is_market_open(settings.market_timezone):
            logger.info("Jam bursa sedang buka. Menjalankan siklus fetch awal...")
            asyncio.create_task(run_fetch_cycle())
        else:
            logger.info("Di luar jam bursa. Siklus fetch awal dilewati.")
    except Exception as exc:
        logger.error("Gagal menjalankan siklus fetch awal: %s", exc)

    try:
        yield
    finally:
        stop_scheduler()
        await close_db()
        logger.info("Aplikasi IDX Stock Screener berhenti.")


def create_app() -> FastAPI:
    """Factory pembuatan instance FastAPI."""
    settings = get_settings()
    configure_logging(settings.log_level)

    app = FastAPI(
        title="IDX Stock Screener API",
        version=__version__,
        description=(
            "API screener saham IDX. Data OHLCV dan indikator teknikal dihitung "
            "di backend Python dan disimpan ke PostgreSQL melalui operasi upsert."
        ),
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["GET"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)
    app.include_router(stocks_router)

    return app


app = create_app()
