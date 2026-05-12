"""Definisi tabel SQLAlchemy 2.0 — kompatibel Python 3.9+."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Stock(Base):
    __tablename__ = "stocks"

    kode_saham: Mapped[str] = mapped_column(String(4), primary_key=True)
    nama_perusahaan: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    aktif: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("NOW()")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("NOW()")
    )


class StockOHLCV(Base):
    __tablename__ = "stock_ohlcv"

    kode_saham: Mapped[str] = mapped_column(
        String(4), ForeignKey("stocks.kode_saham", ondelete="CASCADE"), primary_key=True
    )
    timestamp_bar: Mapped[datetime] = mapped_column(DateTime(timezone=True), primary_key=True)
    open: Mapped[float] = mapped_column(Numeric(18, 4), nullable=False)
    high: Mapped[float] = mapped_column(Numeric(18, 4), nullable=False)
    low: Mapped[float] = mapped_column(Numeric(18, 4), nullable=False)
    close: Mapped[float] = mapped_column(Numeric(18, 4), nullable=False)
    volume: Mapped[int] = mapped_column(BigInteger, nullable=False)

    __table_args__ = (
        Index("idx_stock_ohlcv_kode_ts", "kode_saham", "timestamp_bar"),
    )


class StockIndicator(Base):
    __tablename__ = "stock_indicators"

    kode_saham: Mapped[str] = mapped_column(
        String(4), ForeignKey("stocks.kode_saham", ondelete="CASCADE"), primary_key=True
    )
    timestamp_bar: Mapped[datetime] = mapped_column(DateTime(timezone=True), primary_key=True)
    rsi_14: Mapped[Optional[float]] = mapped_column(Numeric(10, 4), nullable=True)
    macd: Mapped[Optional[float]] = mapped_column(Numeric(18, 6), nullable=True)
    macd_signal: Mapped[Optional[float]] = mapped_column(Numeric(18, 6), nullable=True)
    ema_50: Mapped[Optional[float]] = mapped_column(Numeric(18, 4), nullable=True)
    ema_200: Mapped[Optional[float]] = mapped_column(Numeric(18, 4), nullable=True)
    bb_upper: Mapped[Optional[float]] = mapped_column(Numeric(18, 4), nullable=True)
    bb_lower: Mapped[Optional[float]] = mapped_column(Numeric(18, 4), nullable=True)
    volume_ratio: Mapped[Optional[float]] = mapped_column(Numeric(10, 4), nullable=True)
    last_updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("NOW()")
    )

    __table_args__ = (
        Index("idx_stock_indicators_kode_ts", "kode_saham", "timestamp_bar"),
    )


class StockLatest(Base):
    __tablename__ = "stocks_latest"

    kode_saham: Mapped[str] = mapped_column(
        String(4), ForeignKey("stocks.kode_saham", ondelete="CASCADE"), primary_key=True
    )
    nama_perusahaan: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    harga_terakhir: Mapped[Optional[float]] = mapped_column(Numeric(18, 4), nullable=True)
    timestamp_bar: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    rsi_14: Mapped[Optional[float]] = mapped_column(Numeric(10, 4), nullable=True)
    macd: Mapped[Optional[float]] = mapped_column(Numeric(18, 6), nullable=True)
    macd_signal: Mapped[Optional[float]] = mapped_column(Numeric(18, 6), nullable=True)
    ema_50: Mapped[Optional[float]] = mapped_column(Numeric(18, 4), nullable=True)
    ema_200: Mapped[Optional[float]] = mapped_column(Numeric(18, 4), nullable=True)
    bb_upper: Mapped[Optional[float]] = mapped_column(Numeric(18, 4), nullable=True)
    bb_lower: Mapped[Optional[float]] = mapped_column(Numeric(18, 4), nullable=True)
    volume_ratio: Mapped[Optional[float]] = mapped_column(Numeric(10, 4), nullable=True)
    last_updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("NOW()")
    )
