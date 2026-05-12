"""Data_Fetcher: mengambil data OHLCV dari yfinance secara async."""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd
import yfinance as yf

from app.config import get_settings

logger = logging.getLogger(__name__)

_PERIOD_FOR_15M = "60d"
_INTERVAL = "15m"


def _fetch_ticker_sync(ticker_symbol: str, timeout: int) -> Optional[pd.DataFrame]:
    """Panggil yfinance secara sinkron; dijalankan di thread terpisah."""
    try:
        ticker = yf.Ticker(ticker_symbol)
        df = ticker.history(
            period=_PERIOD_FOR_15M,
            interval=_INTERVAL,
            auto_adjust=True,
            prepost=False,
            timeout=timeout,
        )
        if df is None or df.empty:
            return None
        return df
    except Exception as exc:
        raise exc


async def fetch_ohlcv(
    kode_saham: str,
    semaphore: asyncio.Semaphore,
) -> Tuple[str, Optional[pd.DataFrame], Optional[str]]:
    """Ambil OHLCV untuk satu Kode_Saham secara async."""
    settings = get_settings()
    ticker_symbol = f"{kode_saham}.JK"
    timeout = settings.yfinance_timeout_seconds

    async with semaphore:
        try:
            df = await asyncio.wait_for(
                asyncio.to_thread(_fetch_ticker_sync, ticker_symbol, timeout),
                timeout=timeout + 5,
            )
            if df is None or df.empty:
                logger.warning(
                    "yfinance mengembalikan data kosong untuk %s pada %s",
                    ticker_symbol,
                    datetime.now(tz=timezone.utc).isoformat(),
                )
                return kode_saham, None, "Data kosong dari yfinance."
            logger.info("Berhasil mengambil %d bar untuk %s.", len(df), ticker_symbol)
            return kode_saham, df, None
        except asyncio.TimeoutError:
            msg = f"Timeout ({timeout}s) saat mengambil data {ticker_symbol}."
            logger.error("Timeout mengambil data %s pada %s", ticker_symbol,
                         datetime.now(tz=timezone.utc).isoformat())
            return kode_saham, None, msg
        except Exception as exc:
            msg = str(exc)
            logger.error("Error mengambil data %s pada %s: %s", ticker_symbol,
                         datetime.now(tz=timezone.utc).isoformat(), msg)
            return kode_saham, None, msg


def normalize_ohlcv_df(kode_saham: str, df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Konversi DataFrame yfinance ke list dict siap upsert."""
    df = df.copy()
    df.columns = df.columns.str.lower()

    if df.index.tzinfo is None:
        df.index = df.index.tz_localize("UTC")
    else:
        df.index = df.index.tz_convert("UTC")

    rows: List[Dict[str, Any]] = []
    for ts, row in df.iterrows():
        rows.append({
            "kode_saham": kode_saham,
            "timestamp_bar": ts.to_pydatetime(),
            "open": float(row["open"]),
            "high": float(row["high"]),
            "low": float(row["low"]),
            "close": float(row["close"]),
            "volume": int(row["volume"]),
        })
    return rows
