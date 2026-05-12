"""Kalkulasi 7 indikator teknikal menggunakan library ta.

Library: ta==0.11.0 - kompatibel Python 3.9+.
Seluruh kalkulasi di Python; tidak ada logika indikator di SQL.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from ta.momentum import RSIIndicator
from ta.trend import MACD, EMAIndicator
from ta.volatility import BollingerBands

logger = logging.getLogger(__name__)

MIN_BARS: Dict[str, int] = {
    "rsi_14": 15,
    "macd": 35,
    "ema_50": 50,
    "ema_200": 200,
    "bb": 20,
    "volume_ratio": 21,
}


@dataclass
class IndicatorResult:
    kode_saham: str
    timestamp_bar: Any
    rsi_14: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    ema_50: Optional[float] = None
    ema_200: Optional[float] = None
    bb_upper: Optional[float] = None
    bb_lower: Optional[float] = None
    volume_ratio: Optional[float] = None
    warnings: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "kode_saham": self.kode_saham,
            "timestamp_bar": self.timestamp_bar,
            "rsi_14": self.rsi_14,
            "macd": self.macd,
            "macd_signal": self.macd_signal,
            "ema_50": self.ema_50,
            "ema_200": self.ema_200,
            "bb_upper": self.bb_upper,
            "bb_lower": self.bb_lower,
            "volume_ratio": self.volume_ratio,
        }


@dataclass
class FullSeriesResult:
    kode_saham: str
    timestamps: List[Any]
    rsi_14: List[Optional[float]]
    macd: List[Optional[float]]
    macd_signal: List[Optional[float]]
    ema_50: List[Optional[float]]
    ema_200: List[Optional[float]]
    bb_upper: List[Optional[float]]
    bb_lower: List[Optional[float]]


# ============================================================
# Helper functions
# ============================================================

def _safe_float(value: Any) -> Optional[float]:
    try:
        f = float(value)
        return None if np.isnan(f) else f
    except (TypeError, ValueError):
        return None


def _series_to_list(series: pd.Series) -> List[Optional[float]]:
    return [_safe_float(v) for v in series]


def _empty_list(n: int) -> List[Optional[float]]:
    return [None] * n


def _validate_ohlcv(df: pd.DataFrame, kode_saham: str) -> bool:
    if df.empty or len(df.columns) == 0:
        logger.warning("OHLCV %s: DataFrame kosong.", kode_saham)
        return False
    required = {"open", "high", "low", "close", "volume"}
    missing = required - set(df.columns.str.lower())
    if missing:
        logger.warning("OHLCV %s: kolom hilang: %s", kode_saham, missing)
        return False
    return True


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty or len(df.columns) == 0:
        return df
    df = df.copy()
    df.columns = df.columns.str.lower()
    return df


def _ensure_datetime_index(df: pd.DataFrame) -> pd.DataFrame:
    """Pastikan index adalah DatetimeIndex terurut."""
    if not isinstance(df.index, pd.DatetimeIndex):
        if "timestamp" in df.columns:
            df = df.set_index("timestamp")
        elif "datetime" in df.columns:
            df = df.set_index("datetime")
    return df.sort_index()


def _drop_empty_last_bar(df: pd.DataFrame) -> pd.DataFrame:
    """Hapus bar terakhir bila volume-nya 0.

    yfinance mengembalikan bar 'current' yang masih berjalan dengan volume=0.
    Bar ini belum representatif dan merusak kalkulasi Volume_Ratio.
    """
    if len(df) < 2:
        return df
    last_vol = df["volume"].iloc[-1]
    if pd.isna(last_vol) or float(last_vol) == 0:
        return df.iloc[:-1]
    return df


# ============================================================
# Kalkulasi indikator
# ============================================================

def calculate_latest(kode_saham: str, df: pd.DataFrame) -> IndicatorResult:
    """Hitung 7 indikator dan kembalikan nilai bar terakhir."""
    df = _normalize_columns(df)
    if not _validate_ohlcv(df, kode_saham):
        return IndicatorResult(kode_saham=kode_saham, timestamp_bar=None)

    df = _ensure_datetime_index(df)
    df = _drop_empty_last_bar(df)  # buang bar current yfinance yang volume=0
    n = len(df)

    if n == 0:
        return IndicatorResult(kode_saham=kode_saham, timestamp_bar=None)

    result = IndicatorResult(kode_saham=kode_saham, timestamp_bar=df.index[-1])
    close = df["close"].astype(float)
    volume = df["volume"].astype(float)

    if n >= MIN_BARS["rsi_14"]:
        result.rsi_14 = _safe_float(RSIIndicator(close=close, window=14).rsi().iloc[-1])
    else:
        msg = f"{kode_saham}: bar tidak cukup untuk RSI_14 (tersedia {n}, butuh {MIN_BARS['rsi_14']})"
        logger.warning(msg)
        result.warnings.append(msg)

    if n >= MIN_BARS["macd"]:
        macd_ind = MACD(close=close, window_slow=26, window_fast=12, window_sign=9)
        result.macd = _safe_float(macd_ind.macd().iloc[-1])
        result.macd_signal = _safe_float(macd_ind.macd_signal().iloc[-1])
    else:
        msg = f"{kode_saham}: bar tidak cukup untuk MACD (tersedia {n}, butuh {MIN_BARS['macd']})"
        logger.warning(msg)
        result.warnings.append(msg)

    if n >= MIN_BARS["ema_50"]:
        result.ema_50 = _safe_float(EMAIndicator(close=close, window=50).ema_indicator().iloc[-1])
    else:
        msg = f"{kode_saham}: bar tidak cukup untuk EMA_50 (tersedia {n}, butuh {MIN_BARS['ema_50']})"
        logger.warning(msg)
        result.warnings.append(msg)

    if n >= MIN_BARS["ema_200"]:
        result.ema_200 = _safe_float(EMAIndicator(close=close, window=200).ema_indicator().iloc[-1])
    else:
        msg = f"{kode_saham}: bar tidak cukup untuk EMA_200 (tersedia {n}, butuh {MIN_BARS['ema_200']})"
        logger.warning(msg)
        result.warnings.append(msg)

    if n >= MIN_BARS["bb"]:
        bb = BollingerBands(close=close, window=20, window_dev=2)
        result.bb_upper = _safe_float(bb.bollinger_hband().iloc[-1])
        result.bb_lower = _safe_float(bb.bollinger_lband().iloc[-1])
    else:
        msg = f"{kode_saham}: bar tidak cukup untuk Bollinger Band (tersedia {n}, butuh {MIN_BARS['bb']})"
        logger.warning(msg)
        result.warnings.append(msg)

    if n >= MIN_BARS["volume_ratio"]:
        last_vol = float(volume.iloc[-1])
        avg_vol = float(volume.iloc[-21:-1].mean())
        result.volume_ratio = round(last_vol / avg_vol, 4) if avg_vol > 0 else None
    else:
        msg = f"{kode_saham}: bar tidak cukup untuk Volume_Ratio (tersedia {n}, butuh {MIN_BARS['volume_ratio']})"
        logger.warning(msg)
        result.warnings.append(msg)

    return result


def calculate_full_series(kode_saham: str, df: pd.DataFrame) -> FullSeriesResult:
    """Hitung 7 indikator untuk seluruh deret (digunakan endpoint chart)."""
    df = _normalize_columns(df)
    if not _validate_ohlcv(df, kode_saham):
        empty: List[Optional[float]] = []
        return FullSeriesResult(
            kode_saham=kode_saham, timestamps=[],
            rsi_14=empty, macd=empty, macd_signal=empty,
            ema_50=empty, ema_200=empty, bb_upper=empty, bb_lower=empty,
        )

    df = _ensure_datetime_index(df)
    df = _drop_empty_last_bar(df)  # buang bar current yfinance yang volume=0
    n = len(df)
    close = df["close"].astype(float)

    rsi_list = _series_to_list(RSIIndicator(close=close, window=14).rsi()) if n >= MIN_BARS["rsi_14"] else _empty_list(n)

    if n >= MIN_BARS["macd"]:
        macd_ind = MACD(close=close, window_slow=26, window_fast=12, window_sign=9)
        macd_list = _series_to_list(macd_ind.macd())
        macd_signal_list = _series_to_list(macd_ind.macd_signal())
    else:
        macd_list = _empty_list(n)
        macd_signal_list = _empty_list(n)

    ema50_list = _series_to_list(EMAIndicator(close=close, window=50).ema_indicator()) if n >= MIN_BARS["ema_50"] else _empty_list(n)
    ema200_list = _series_to_list(EMAIndicator(close=close, window=200).ema_indicator()) if n >= MIN_BARS["ema_200"] else _empty_list(n)

    if n >= MIN_BARS["bb"]:
        bb = BollingerBands(close=close, window=20, window_dev=2)
        bb_upper_list = _series_to_list(bb.bollinger_hband())
        bb_lower_list = _series_to_list(bb.bollinger_lband())
    else:
        bb_upper_list = _empty_list(n)
        bb_lower_list = _empty_list(n)

    return FullSeriesResult(
        kode_saham=kode_saham,
        timestamps=list(df.index),
        rsi_14=rsi_list,
        macd=macd_list,
        macd_signal=macd_signal_list,
        ema_50=ema50_list,
        ema_200=ema200_list,
        bb_upper=bb_upper_list,
        bb_lower=bb_lower_list,
    )
