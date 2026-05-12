"""Repository layer: seluruh operasi baca/tulis ke PostgreSQL."""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import func, select, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Stock, StockIndicator, StockLatest, StockOHLCV

logger = logging.getLogger(__name__)

_RETRY_COUNT = 3
_RETRY_DELAY = 2.0


async def _with_retry(coro_fn, *args, **kwargs):  # type: ignore[no-untyped-def]
    last_exc: Optional[Exception] = None
    for attempt in range(1, _RETRY_COUNT + 1):
        try:
            return await coro_fn(*args, **kwargs)
        except Exception as exc:
            last_exc = exc
            if attempt < _RETRY_COUNT:
                logger.warning(
                    "Percobaan %d/%d gagal: %s. Mencoba ulang dalam %.0f detik.",
                    attempt, _RETRY_COUNT, exc, _RETRY_DELAY,
                )
                await asyncio.sleep(_RETRY_DELAY)
            else:
                logger.error("Seluruh %d percobaan gagal: %s", _RETRY_COUNT, exc)
    raise last_exc  # type: ignore[misc]


async def get_active_stocks(session: AsyncSession) -> List[Stock]:
    result = await session.execute(
        select(Stock).where(Stock.aktif.is_(True)).order_by(Stock.kode_saham)
    )
    return list(result.scalars().all())


async def get_stock_by_kode(session: AsyncSession, kode_saham: str) -> Optional[Stock]:
    result = await session.execute(
        select(Stock).where(Stock.kode_saham == kode_saham)
    )
    return result.scalar_one_or_none()


async def upsert_stock(
    session: AsyncSession,
    kode_saham: str,
    nama_perusahaan: str,
    aktif: bool = True,
) -> None:
    stmt = (
        pg_insert(Stock)
        .values(
            kode_saham=kode_saham,
            nama_perusahaan=nama_perusahaan,
            aktif=aktif,
            updated_at=func.now(),
        )
        .on_conflict_do_update(
            index_elements=["kode_saham"],
            set_={
                "nama_perusahaan": nama_perusahaan,
                "aktif": aktif,
                "updated_at": func.now(),
            },
        )
    )
    await _with_retry(session.execute, stmt)


async def upsert_ohlcv_batch(
    session: AsyncSession,
    rows: List[Dict[str, Any]],
) -> None:
    if not rows:
        return

    async def _execute() -> None:
        stmt = (
            pg_insert(StockOHLCV)
            .values(rows)
            .on_conflict_do_update(
                index_elements=["kode_saham", "timestamp_bar"],
                set_={
                    "open": text("EXCLUDED.open"),
                    "high": text("EXCLUDED.high"),
                    "low": text("EXCLUDED.low"),
                    "close": text("EXCLUDED.close"),
                    "volume": text("EXCLUDED.volume"),
                },
            )
        )
        await session.execute(stmt)

    await _with_retry(_execute)


async def get_ohlcv_series(
    session: AsyncSession,
    kode_saham: str,
    since: datetime,
) -> List[StockOHLCV]:
    result = await session.execute(
        select(StockOHLCV)
        .where(
            StockOHLCV.kode_saham == kode_saham,
            StockOHLCV.timestamp_bar >= since,
        )
        .order_by(StockOHLCV.timestamp_bar.asc())
    )
    return list(result.scalars().all())


async def upsert_indicators_batch(
    session: AsyncSession,
    rows: List[Dict[str, Any]],
) -> None:
    if not rows:
        return

    async def _execute() -> None:
        stmt = (
            pg_insert(StockIndicator)
            .values(rows)
            .on_conflict_do_update(
                index_elements=["kode_saham", "timestamp_bar"],
                set_={
                    "rsi_14": text("EXCLUDED.rsi_14"),
                    "macd": text("EXCLUDED.macd"),
                    "macd_signal": text("EXCLUDED.macd_signal"),
                    "ema_50": text("EXCLUDED.ema_50"),
                    "ema_200": text("EXCLUDED.ema_200"),
                    "bb_upper": text("EXCLUDED.bb_upper"),
                    "bb_lower": text("EXCLUDED.bb_lower"),
                    "volume_ratio": text("EXCLUDED.volume_ratio"),
                    "last_updated_at": func.now(),
                },
            )
        )
        await session.execute(stmt)

    await _with_retry(_execute)


async def get_indicator_series(
    session: AsyncSession,
    kode_saham: str,
    since: datetime,
) -> List[StockIndicator]:
    result = await session.execute(
        select(StockIndicator)
        .where(
            StockIndicator.kode_saham == kode_saham,
            StockIndicator.timestamp_bar >= since,
        )
        .order_by(StockIndicator.timestamp_bar.asc())
    )
    return list(result.scalars().all())


async def upsert_stock_latest(
    session: AsyncSession,
    row: Dict[str, Any],
) -> None:
    async def _execute() -> None:
        stmt = (
            pg_insert(StockLatest)
            .values({**row, "last_updated_at": func.now()})
            .on_conflict_do_update(
                index_elements=["kode_saham"],
                set_={
                    "nama_perusahaan": text("EXCLUDED.nama_perusahaan"),
                    "harga_terakhir": text("EXCLUDED.harga_terakhir"),
                    "timestamp_bar": text("EXCLUDED.timestamp_bar"),
                    "rsi_14": text("EXCLUDED.rsi_14"),
                    "macd": text("EXCLUDED.macd"),
                    "macd_signal": text("EXCLUDED.macd_signal"),
                    "ema_50": text("EXCLUDED.ema_50"),
                    "ema_200": text("EXCLUDED.ema_200"),
                    "bb_upper": text("EXCLUDED.bb_upper"),
                    "bb_lower": text("EXCLUDED.bb_lower"),
                    "volume_ratio": text("EXCLUDED.volume_ratio"),
                    "last_updated_at": func.now(),
                },
            )
        )
        await session.execute(stmt)

    await _with_retry(_execute)


async def query_stocks_latest(
    session: AsyncSession,
    *,
    filters: Optional[Dict[str, Dict[str, Optional[float]]]] = None,
    sort_by: str = "kode_saham",
    sort_order: str = "asc",
    page: int = 1,
    page_size: int = 50,
) -> Tuple[List[StockLatest], int]:
    SORTABLE_COLUMNS: Dict[str, Any] = {
        "kode_saham": StockLatest.kode_saham,
        "harga_terakhir": StockLatest.harga_terakhir,
        "rsi_14": StockLatest.rsi_14,
        "macd": StockLatest.macd,
        "macd_signal": StockLatest.macd_signal,
        "ema_50": StockLatest.ema_50,
        "ema_200": StockLatest.ema_200,
        "bb_upper": StockLatest.bb_upper,
        "bb_lower": StockLatest.bb_lower,
        "volume_ratio": StockLatest.volume_ratio,
        "last_updated_at": StockLatest.last_updated_at,
    }
    FILTERABLE_COLUMNS: Dict[str, Any] = {
        "rsi_14": StockLatest.rsi_14,
        "macd": StockLatest.macd,
        "macd_signal": StockLatest.macd_signal,
        "ema_50": StockLatest.ema_50,
        "ema_200": StockLatest.ema_200,
        "bb_upper": StockLatest.bb_upper,
        "bb_lower": StockLatest.bb_lower,
        "volume_ratio": StockLatest.volume_ratio,
    }

    base_query = select(StockLatest)
    count_query = select(func.count()).select_from(StockLatest)

    conditions = []
    for col_name, bounds in (filters or {}).items():
        col = FILTERABLE_COLUMNS.get(col_name)
        if col is None:
            continue
        if bounds.get("min") is not None:
            conditions.append(col >= bounds["min"])
        if bounds.get("max") is not None:
            conditions.append(col <= bounds["max"])

    if conditions:
        base_query = base_query.where(*conditions)
        count_query = count_query.where(*conditions)

    total_result = await session.execute(count_query)
    total: int = total_result.scalar_one()

    sort_col = SORTABLE_COLUMNS.get(sort_by, StockLatest.kode_saham)
    if sort_order.lower() == "desc":
        sort_col = sort_col.desc()
    else:
        sort_col = sort_col.asc()

    offset = (page - 1) * page_size
    base_query = base_query.order_by(sort_col).offset(offset).limit(page_size)

    result = await session.execute(base_query)
    items = list(result.scalars().all())

    return items, total
