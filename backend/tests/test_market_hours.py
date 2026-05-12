"""Unit test untuk modul core.market_hours."""

from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

import pytest

from app.core.market_hours import is_market_open, is_weekday, is_within_trading_window

WIB = ZoneInfo("Asia/Jakarta")


def _dt(weekday_offset: int, hour: int, minute: int = 0) -> datetime:
    """Buat datetime WIB pada hari Senin (2024-01-08) + offset hari."""
    base = datetime(2024, 1, 8, hour, minute, tzinfo=WIB)  # Senin
    from datetime import timedelta
    return base + timedelta(days=weekday_offset)


class TestIsWeekday:
    def test_senin_adalah_hari_kerja(self):
        assert is_weekday(_dt(0, 10)) is True

    def test_jumat_adalah_hari_kerja(self):
        assert is_weekday(_dt(4, 10)) is True

    def test_sabtu_bukan_hari_kerja(self):
        assert is_weekday(_dt(5, 10)) is False

    def test_minggu_bukan_hari_kerja(self):
        assert is_weekday(_dt(6, 10)) is False


class TestIsWithinTradingWindow:
    def test_jam_09_00_buka(self):
        assert is_within_trading_window(_dt(0, 9, 0)) is True

    def test_jam_12_00_buka(self):
        assert is_within_trading_window(_dt(0, 12, 0)) is True

    def test_jam_16_00_buka(self):
        assert is_within_trading_window(_dt(0, 16, 0)) is True

    def test_jam_08_59_tutup(self):
        assert is_within_trading_window(_dt(0, 8, 59)) is False

    def test_jam_16_01_tutup(self):
        assert is_within_trading_window(_dt(0, 16, 1)) is False

    def test_jam_00_00_tutup(self):
        assert is_within_trading_window(_dt(0, 0, 0)) is False


class TestIsMarketOpen:
    def test_senin_jam_10_buka(self):
        now = _dt(0, 10)
        assert is_market_open(now=now) is True

    def test_senin_jam_08_tutup(self):
        now = _dt(0, 8)
        assert is_market_open(now=now) is False

    def test_sabtu_jam_10_tutup(self):
        now = _dt(5, 10)
        assert is_market_open(now=now) is False

    def test_minggu_jam_10_tutup(self):
        now = _dt(6, 10)
        assert is_market_open(now=now) is False

    def test_jumat_jam_15_59_buka(self):
        now = _dt(4, 15, 59)
        assert is_market_open(now=now) is True

    def test_jumat_jam_16_01_tutup(self):
        now = _dt(4, 16, 1)
        assert is_market_open(now=now) is False
