"""Job APScheduler untuk siklus pengambilan data dan kalkulasi indikator."""

from __future__ import annotations

import asyncio
import logging
import time
from datetime import datetime, timezone

from app.config import get_settings
from app.core.market_hours import is_market_open
from app.data.fetcher import fetch_ohlcv, normalize_ohlcv_df
from app.db.engine import get_session_factory
from app.db.repository import (
    get_active_stocks,
    upsert_indicators_batch,
    upsert_ohlcv_batch,
    upsert_stock_latest,
)
from app.indicators.calculator import calculate_latest

logger = logging.getLogger(__name__)

_cycle_running = False


async def run_fetch_cycle() -> None:
    """Satu siklus lengkap: fetch -> kalkulasi -> upsert."""
    global _cycle_running

    settings = get_settings()

    if not is_market_open(settings.market_timezone):
        logger.info("Di luar jam bursa. Siklus dilewati.")
        return

    if _cycle_running:
        logger.warning(
            "Siklus sebelumnya masih berjalan saat interval berikutnya tiba. Siklus baru dilewati."
        )
        return

    _cycle_running = True
    start_time = time.monotonic()
    start_ts = datetime.now(tz=timezone.utc).isoformat()
    session_factory = get_session_factory()

    async with session_factory() as session:
        stocks = await get_active_stocks(session)

    total = len(stocks)
    logger.info("Siklus fetch dimulai pada %s. Jumlah saham: %d.", start_ts, total)

    semaphore = asyncio.Semaphore(settings.fetch_max_concurrency)
    tasks = [fetch_ohlcv(stock.kode_saham, semaphore) for stock in stocks]
    results = await asyncio.gather(*tasks, return_exceptions=False)

    sukses = 0
    gagal = 0

    for kode_saham, df, error_msg in results:
        if df is None or error_msg:
            gagal += 1
            continue
        try:
            nama = next((s.nama_perusahaan for s in stocks if s.kode_saham == kode_saham), "")
            ohlcv_rows = normalize_ohlcv_df(kode_saham, df)

            async with session_factory() as session:
                await upsert_ohlcv_batch(session, ohlcv_rows)
                await session.commit()

            indicator_result = calculate_latest(kode_saham, df)

            if indicator_result.timestamp_bar is not None:
                async with session_factory() as session:
                    await upsert_indicators_batch(session, [indicator_result.to_dict()])
                    await session.commit()

                df_cols = df.columns.str.lower().tolist()
                harga = float(df["close"].iloc[-1]) if "close" in df_cols else float(df["Close"].iloc[-1])

                latest_row = {
                    "kode_saham": kode_saham,
                    "nama_perusahaan": nama,
                    "harga_terakhir": harga,
                    "timestamp_bar": indicator_result.timestamp_bar,
                    "rsi_14": indicator_result.rsi_14,
                    "macd": indicator_result.macd,
                    "macd_signal": indicator_result.macd_signal,
                    "ema_50": indicator_result.ema_50,
                    "ema_200": indicator_result.ema_200,
                    "bb_upper": indicator_result.bb_upper,
                    "bb_lower": indicator_result.bb_lower,
                    "volume_ratio": indicator_result.volume_ratio,
                }
                async with session_factory() as session:
                    await upsert_stock_latest(session, latest_row)
                    await session.commit()

            sukses += 1
        except Exception as exc:
            gagal += 1
            logger.error("Gagal memproses %s: %s", kode_saham, exc)

    elapsed = time.monotonic() - start_time
    logger.info(
        "Siklus fetch selesai. Durasi: %.1f detik. Sukses: %d. Gagal: %d.",
        elapsed, sukses, gagal,
    )
    if elapsed > settings.fetch_interval_minutes * 60:
        logger.warning(
            "Durasi siklus (%.1f detik) melebihi interval update (%d detik).",
            elapsed, settings.fetch_interval_minutes * 60,
        )

    _cycle_running = False
