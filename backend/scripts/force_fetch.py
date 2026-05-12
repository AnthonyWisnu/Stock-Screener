"""Paksa satu siklus fetch tanpa cek jam bursa — untuk testing di luar jam bursa.

Jalankan saat backend TIDAK sedang berjalan:
    python scripts/force_fetch.py

Script ini berguna untuk mengisi database dengan data awal
sehingga tabel screener tidak kosong saat pertama kali dibuka.
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

try:
    from dotenv import load_dotenv
    load_dotenv(ROOT / ".env")
except ImportError:
    pass


async def main() -> None:
    # Import setelah env dimuat
    from app.logging_config import configure_logging
    from app.config import get_settings
    from app.db.engine import init_db, close_db, get_session_factory
    from app.data.seed_stocks import seed_default_stocks
    from app.db.repository import get_active_stocks

    settings = get_settings()
    configure_logging(settings.log_level)

    print("=== Force Fetch: satu siklus tanpa cek jam bursa ===")
    print()

    await init_db()

    # Seed bila tabel kosong
    session_factory = get_session_factory()
    async with session_factory() as session:
        existing = await get_active_stocks(session)
        if not existing:
            print("Tabel stocks kosong. Menjalankan seed...")
            await seed_default_stocks(session)
            await session.commit()
            print("Seed selesai.")

    # Jalankan siklus fetch langsung (bypass jam bursa)
    import asyncio as _asyncio
    from app.data.fetcher import fetch_ohlcv, normalize_ohlcv_df
    from app.db.repository import (
        get_active_stocks,
        upsert_ohlcv_batch,
        upsert_indicators_batch,
        upsert_stock_latest,
    )
    from app.indicators.calculator import calculate_latest
    import time

    async with session_factory() as session:
        stocks = await get_active_stocks(session)

    print(f"Mengambil data untuk {len(stocks)} saham...")
    print("(Ini bisa memakan waktu 2-5 menit tergantung koneksi internet)")
    print()

    semaphore = _asyncio.Semaphore(settings.fetch_max_concurrency)
    tasks = [fetch_ohlcv(stock.kode_saham, semaphore) for stock in stocks]

    start = time.monotonic()
    results = await _asyncio.gather(*tasks, return_exceptions=False)

    sukses = 0
    gagal = 0

    for kode_saham, df, error_msg in results:
        if df is None or error_msg:
            gagal += 1
            print(f"  GAGAL: {kode_saham} — {error_msg}")
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

                df_cols = [c.lower() for c in df.columns]
                harga = float(df["Close"].iloc[-1]) if "Close" in df.columns else float(df["close"].iloc[-1])

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
            print(f"  OK: {kode_saham} — {len(ohlcv_rows)} bar")
        except Exception as exc:
            gagal += 1
            print(f"  ERROR: {kode_saham} — {exc}")

    elapsed = time.monotonic() - start
    print()
    print(f"Selesai dalam {elapsed:.1f} detik.")
    print(f"Sukses: {sukses} | Gagal: {gagal}")
    print()
    print("Sekarang jalankan backend dan buka http://localhost:5173")

    await close_db()


if __name__ == "__main__":
    import platform
    if platform.system() == "Windows":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
