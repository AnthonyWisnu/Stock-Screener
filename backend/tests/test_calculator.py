"""Unit test untuk modul indicators.calculator.

Test ini tidak membutuhkan database atau koneksi jaringan.
DataFrame OHLCV dibuat secara sintetis.
Library indikator: ta==0.11.0
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import numpy as np
import pandas as pd
import pytest

from app.indicators.calculator import (
    MIN_BARS,
    FullSeriesResult,
    IndicatorResult,
    calculate_full_series,
    calculate_latest,
)

_TZ = timezone.utc


def _make_ohlcv(n: int, base_price: float = 1000.0) -> pd.DataFrame:
    """Buat DataFrame OHLCV sintetis dengan n bar."""
    rng = np.random.default_rng(seed=42)
    timestamps = [
        datetime(2024, 1, 2, 9, 0, tzinfo=_TZ) + timedelta(minutes=15 * i)
        for i in range(n)
    ]
    close = base_price + np.cumsum(rng.normal(0, 5, n))
    open_ = close - rng.uniform(0, 3, n)
    high = close + rng.uniform(0, 5, n)
    low = close - rng.uniform(0, 5, n)
    volume = rng.integers(100_000, 1_000_000, n).astype(float)

    df = pd.DataFrame(
        {"open": open_, "high": high, "low": low, "close": close, "volume": volume},
        index=pd.DatetimeIndex(timestamps, tz=_TZ),
    )
    return df


class TestCalculateLatest:
    def test_kembalikan_indicator_result(self):
        df = _make_ohlcv(250)
        result = calculate_latest("BBCA", df)
        assert isinstance(result, IndicatorResult)
        assert result.kode_saham == "BBCA"

    def test_timestamp_bar_terisi(self):
        df = _make_ohlcv(250)
        result = calculate_latest("BBCA", df)
        assert result.timestamp_bar is not None

    def test_rsi_dalam_rentang_0_100(self):
        df = _make_ohlcv(250)
        result = calculate_latest("BBCA", df)
        assert result.rsi_14 is not None
        assert 0.0 <= result.rsi_14 <= 100.0

    def test_ema_50_tersedia_dengan_cukup_bar(self):
        df = _make_ohlcv(250)
        result = calculate_latest("BBCA", df)
        assert result.ema_50 is not None

    def test_ema_200_tersedia_dengan_cukup_bar(self):
        df = _make_ohlcv(250)
        result = calculate_latest("BBCA", df)
        assert result.ema_200 is not None

    def test_bb_upper_lebih_besar_dari_bb_lower(self):
        df = _make_ohlcv(250)
        result = calculate_latest("BBCA", df)
        assert result.bb_upper is not None
        assert result.bb_lower is not None
        assert result.bb_upper > result.bb_lower

    def test_volume_ratio_positif(self):
        df = _make_ohlcv(250)
        result = calculate_latest("BBCA", df)
        assert result.volume_ratio is not None
        assert result.volume_ratio > 0

    def test_rsi_none_bila_bar_kurang(self):
        df = _make_ohlcv(MIN_BARS["rsi_14"] - 1)
        result = calculate_latest("BBCA", df)
        assert result.rsi_14 is None

    def test_ema_200_none_bila_bar_kurang(self):
        df = _make_ohlcv(MIN_BARS["ema_200"] - 1)
        result = calculate_latest("BBCA", df)
        assert result.ema_200 is None

    def test_df_kosong_kembalikan_result_tanpa_crash(self):
        df = pd.DataFrame()
        result = calculate_latest("BBCA", df)
        assert result.kode_saham == "BBCA"
        assert result.rsi_14 is None

    def test_to_dict_berisi_semua_kunci(self):
        df = _make_ohlcv(250)
        result = calculate_latest("BBCA", df)
        d = result.to_dict()
        expected_keys = {
            "kode_saham", "timestamp_bar", "rsi_14", "macd", "macd_signal",
            "ema_50", "ema_200", "bb_upper", "bb_lower", "volume_ratio",
        }
        assert expected_keys == set(d.keys())

    def test_macd_dan_signal_tersedia(self):
        df = _make_ohlcv(250)
        result = calculate_latest("BBCA", df)
        assert result.macd is not None
        assert result.macd_signal is not None


class TestCalculateFullSeries:
    def test_kembalikan_full_series_result(self):
        df = _make_ohlcv(250)
        result = calculate_full_series("TLKM", df)
        assert isinstance(result, FullSeriesResult)

    def test_panjang_deret_sejajar_dengan_ohlcv(self):
        n = 250
        df = _make_ohlcv(n)
        result = calculate_full_series("TLKM", df)
        assert len(result.timestamps) == n
        assert len(result.rsi_14) == n
        assert len(result.macd) == n
        assert len(result.ema_50) == n
        assert len(result.ema_200) == n
        assert len(result.bb_upper) == n
        assert len(result.bb_lower) == n

    def test_nilai_awal_none_karena_warmup(self):
        df = _make_ohlcv(250)
        result = calculate_full_series("TLKM", df)
        # Bar pertama tidak memiliki cukup data untuk EMA_200
        assert result.ema_200[0] is None

    def test_df_kosong_kembalikan_list_kosong(self):
        df = pd.DataFrame()
        result = calculate_full_series("TLKM", df)
        assert result.timestamps == []
        assert result.rsi_14 == []
