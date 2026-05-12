"""Router endpoint terkait saham."""

from __future__ import annotations

import logging
import math
import re
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas import (
    BarOHLCV,
    DaftarSahamResponse,
    DeretIndikator,
    DetailSahamResponse,
    IndikatorTeknikal,
    Paginasi,
    SahamRingkas,
    StatusResponse,
)
from app.config import get_settings
from app.core.errors import InvalidParameterError, StockNotFoundError
from app.core.market_hours import is_market_open
from app.db.engine import get_db
from app.db.repository import (
    get_ohlcv_series,
    get_stock_by_kode,
    query_stocks_latest,
)
from app.indicators.calculator import calculate_full_series

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["saham"])

ALLOWED_SORT_FIELDS = {
    "kode_saham", "harga_terakhir", "rsi_14", "macd", "macd_signal",
    "ema_50", "ema_200", "bb_upper", "bb_lower", "volume_ratio", "last_updated_at",
}
ALLOWED_RANGES = {"1d", "5d", "1mo", "3mo"}
KODE_SAHAM_RE = re.compile(r"^[A-Z]{4}$")

_RANGE_TO_DAYS: Dict[str, int] = {
    "1d": 1,
    "5d": 5,
    "1mo": 30,
    "3mo": 90,
}


def _get_db_dep():
    return Depends(get_db)


@router.get("/status", response_model=StatusResponse, summary="Status aplikasi")
async def status_aplikasi() -> StatusResponse:
    """Endpoint health check ringan; tidak menyentuh database."""
    settings = get_settings()
    tz = ZoneInfo(settings.market_timezone)
    return StatusResponse(
        status="ok",
        versi="0.1.0",
        waktu_server=datetime.now(tz=tz),
        pasar_buka=is_market_open(settings.market_timezone),
    )


@router.get(
    "/stocks",
    response_model=DaftarSahamResponse,
    summary="Daftar saham dengan filter, sort, dan paginasi",
)
async def daftar_saham(
    db: AsyncSession = Depends(get_db),
    sort_by: str = Query("kode_saham"),
    sort_order: str = Query("asc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    rsi_14_min: Optional[float] = Query(None),
    rsi_14_max: Optional[float] = Query(None),
    macd_min: Optional[float] = Query(None),
    macd_max: Optional[float] = Query(None),
    macd_signal_min: Optional[float] = Query(None),
    macd_signal_max: Optional[float] = Query(None),
    ema_50_min: Optional[float] = Query(None),
    ema_50_max: Optional[float] = Query(None),
    ema_200_min: Optional[float] = Query(None),
    ema_200_max: Optional[float] = Query(None),
    bb_upper_min: Optional[float] = Query(None),
    bb_upper_max: Optional[float] = Query(None),
    bb_lower_min: Optional[float] = Query(None),
    bb_lower_max: Optional[float] = Query(None),
    volume_ratio_min: Optional[float] = Query(None),
    volume_ratio_max: Optional[float] = Query(None),
) -> DaftarSahamResponse:
    if sort_by not in ALLOWED_SORT_FIELDS:
        raise InvalidParameterError(
            f"Parameter sort_by '{sort_by}' tidak valid. "
            f"Pilih salah satu dari: {', '.join(sorted(ALLOWED_SORT_FIELDS))}."
        )
    if sort_order.lower() not in {"asc", "desc"}:
        raise InvalidParameterError(
            "Parameter sort_order hanya menerima nilai 'asc' atau 'desc'."
        )

    filters: Dict[str, Dict[str, Optional[float]]] = {}
    _add_filter(filters, "rsi_14", rsi_14_min, rsi_14_max)
    _add_filter(filters, "macd", macd_min, macd_max)
    _add_filter(filters, "macd_signal", macd_signal_min, macd_signal_max)
    _add_filter(filters, "ema_50", ema_50_min, ema_50_max)
    _add_filter(filters, "ema_200", ema_200_min, ema_200_max)
    _add_filter(filters, "bb_upper", bb_upper_min, bb_upper_max)
    _add_filter(filters, "bb_lower", bb_lower_min, bb_lower_max)
    _add_filter(filters, "volume_ratio", volume_ratio_min, volume_ratio_max)

    items, total = await query_stocks_latest(
        db,
        filters=filters,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )

    settings = get_settings()
    tz = ZoneInfo(settings.market_timezone)

    saham_list = [
        SahamRingkas(
            kode_saham=row.kode_saham,
            nama_perusahaan=row.nama_perusahaan,
            harga_terakhir=_to_float(row.harga_terakhir),
            indikator=IndikatorTeknikal(
                rsi_14=_to_float(row.rsi_14),
                macd=_to_float(row.macd),
                macd_signal=_to_float(row.macd_signal),
                ema_50=_to_float(row.ema_50),
                ema_200=_to_float(row.ema_200),
                bb_upper=_to_float(row.bb_upper),
                bb_lower=_to_float(row.bb_lower),
                volume_ratio=_to_float(row.volume_ratio),
            ),
            last_updated_at=row.last_updated_at.astimezone(tz) if row.last_updated_at else None,
        )
        for row in items
    ]

    total_pages = math.ceil(total / page_size) if total > 0 else 0

    return DaftarSahamResponse(
        items=saham_list,
        paginasi=Paginasi(page=page, page_size=page_size, total=total, total_pages=total_pages),
    )


@router.get(
    "/stocks/{kode_saham}",
    response_model=DetailSahamResponse,
    summary="Detail OHLCV dan deret indikator untuk chart",
)
async def detail_saham(
    kode_saham: str,
    db: AsyncSession = Depends(get_db),
    range: str = Query("1mo"),  # noqa: A002
) -> DetailSahamResponse:
    if not KODE_SAHAM_RE.match(kode_saham):
        raise InvalidParameterError(
            "Format kode saham tidak valid. Harus 4 karakter alfabet kapital, contoh: BBCA."
        )
    if range not in ALLOWED_RANGES:
        raise InvalidParameterError(
            f"Parameter range '{range}' tidak valid. Gunakan salah satu dari: "
            f"{', '.join(sorted(ALLOWED_RANGES))}."
        )

    stock = await get_stock_by_kode(db, kode_saham)
    if stock is None:
        raise StockNotFoundError(f"Kode saham '{kode_saham}' tidak ditemukan dalam database.")

    settings = get_settings()
    tz = ZoneInfo(settings.market_timezone)
    days = _RANGE_TO_DAYS[range]
    since = datetime.now(tz=timezone.utc) - timedelta(days=days)

    ohlcv_rows = await get_ohlcv_series(db, kode_saham, since)

    if not ohlcv_rows:
        return DetailSahamResponse(
            kode_saham=kode_saham,
            nama_perusahaan=stock.nama_perusahaan,
            range=range,
            ohlcv=[],
            indikator=DeretIndikator(
                rsi_14=[], macd=[], macd_signal=[],
                ema_50=[], ema_200=[], bb_upper=[], bb_lower=[],
            ),
            last_updated_at=None,
        )

    import pandas as pd

    df = pd.DataFrame(
        [
            {
                "timestamp": row.timestamp_bar,
                "open": float(row.open),
                "high": float(row.high),
                "low": float(row.low),
                "close": float(row.close),
                "volume": float(row.volume),
            }
            for row in ohlcv_rows
        ]
    ).set_index("timestamp")

    full = calculate_full_series(kode_saham, df)

    ohlcv_response = [
        BarOHLCV(
            timestamp=row.timestamp_bar.astimezone(tz),
            open=float(row.open),
            high=float(row.high),
            low=float(row.low),
            close=float(row.close),
            volume=float(row.volume),
        )
        for row in ohlcv_rows
    ]

    last_updated = ohlcv_rows[-1].timestamp_bar.astimezone(tz) if ohlcv_rows else None

    return DetailSahamResponse(
        kode_saham=kode_saham,
        nama_perusahaan=stock.nama_perusahaan,
        range=range,
        ohlcv=ohlcv_response,
        indikator=DeretIndikator(
            rsi_14=full.rsi_14,
            macd=full.macd,
            macd_signal=full.macd_signal,
            ema_50=full.ema_50,
            ema_200=full.ema_200,
            bb_upper=full.bb_upper,
            bb_lower=full.bb_lower,
        ),
        last_updated_at=last_updated,
    )


def _add_filter(
    filters: Dict,
    col: str,
    min_val: Optional[float],
    max_val: Optional[float],
) -> None:
    if min_val is not None or max_val is not None:
        filters[col] = {"min": min_val, "max": max_val}


def _to_float(value: object) -> Optional[float]:
    if value is None:
        return None
    try:
        import decimal
        if isinstance(value, decimal.Decimal):
            return float(value)
        return float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None
