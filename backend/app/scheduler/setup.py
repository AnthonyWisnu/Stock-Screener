"""Inisialisasi dan konfigurasi APScheduler.

Scheduler dijalankan di dalam proses FastAPI menggunakan AsyncIOScheduler
agar tidak membutuhkan proses atau thread terpisah.
"""

from __future__ import annotations

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.config import get_settings
from app.scheduler.jobs import run_fetch_cycle

logger = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler | None = None


def get_scheduler() -> AsyncIOScheduler:
    """Kembalikan instance scheduler singleton."""
    global _scheduler
    if _scheduler is None:
        _scheduler = AsyncIOScheduler(timezone="Asia/Jakarta")
    return _scheduler


def start_scheduler() -> None:
    """Daftarkan job dan mulai scheduler."""
    settings = get_settings()
    scheduler = get_scheduler()

    scheduler.add_job(
        run_fetch_cycle,
        trigger=IntervalTrigger(
            minutes=settings.fetch_interval_minutes,
            timezone="Asia/Jakarta",
        ),
        id="fetch_cycle",
        name="Siklus pengambilan data OHLCV dan kalkulasi indikator",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )

    scheduler.start()
    logger.info(
        "Scheduler dimulai. Interval: %d menit. Zona waktu: Asia/Jakarta.",
        settings.fetch_interval_minutes,
    )


def stop_scheduler() -> None:
    """Hentikan scheduler dengan graceful."""
    global _scheduler
    if _scheduler is not None and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler dihentikan.")
    _scheduler = None
