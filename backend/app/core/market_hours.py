"""Utilitas penentuan jam bursa IDX.

Jam bursa yang dimaksud aplikasi ini adalah pukul 09:00 sampai 16:00 WIB
pada hari Senin sampai Jumat. Hari Sabtu, Minggu, dan di luar jendela
waktu tersebut dianggap di luar jam bursa.
"""

from __future__ import annotations

from datetime import datetime, time
from typing import Optional
from zoneinfo import ZoneInfo

MARKET_OPEN = time(9, 0)
MARKET_CLOSE = time(16, 0)
WEEKDAY_FRIDAY = 4  # Monday=0 ... Friday=4


def now_in_timezone(tz_name: str) -> datetime:
    """Kembalikan waktu saat ini pada zona waktu yang diminta."""
    return datetime.now(tz=ZoneInfo(tz_name))


def is_weekday(dt: datetime) -> bool:
    """True bila hari kerja (Senin sampai Jumat)."""
    return dt.weekday() <= WEEKDAY_FRIDAY


def is_within_trading_window(dt: datetime) -> bool:
    """True bila jam dt berada di jendela 09:00 sampai 16:00 inklusif."""
    return MARKET_OPEN <= dt.time() <= MARKET_CLOSE


def is_market_open(tz_name: str = "Asia/Jakarta", now: Optional[datetime] = None) -> bool:
    """True bila pasar sedang buka berdasarkan zona waktu yang diberikan."""
    current = now if now is not None else now_in_timezone(tz_name)
    return is_weekday(current) and is_within_trading_window(current)
