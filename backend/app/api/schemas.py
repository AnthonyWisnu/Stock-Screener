"""Skema Pydantic untuk request dan response API."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class IndikatorTeknikal(BaseModel):
    """Himpunan 7 nilai indikator teknikal untuk satu bar."""

    rsi_14: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    ema_50: Optional[float] = None
    ema_200: Optional[float] = None
    bb_upper: Optional[float] = None
    bb_lower: Optional[float] = None
    volume_ratio: Optional[float] = None


class SahamRingkas(BaseModel):
    """Baris pada tabel screener daftar saham."""

    kode_saham: str = Field(..., description="Kode saham IDX 4 karakter alfabet kapital.")
    nama_perusahaan: Optional[str] = None
    harga_terakhir: Optional[float] = None
    indikator: IndikatorTeknikal
    last_updated_at: Optional[datetime] = Field(
        None, description="Waktu pembaruan terakhir dalam zona waktu Asia/Jakarta."
    )


class Paginasi(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int


class DaftarSahamResponse(BaseModel):
    items: List[SahamRingkas]
    paginasi: Paginasi


class BarOHLCV(BaseModel):
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float


class DeretIndikator(BaseModel):
    """Deret nilai indikator sejajar dengan deret OHLCV."""

    rsi_14: List[Optional[float]]
    macd: List[Optional[float]]
    macd_signal: List[Optional[float]]
    ema_50: List[Optional[float]]
    ema_200: List[Optional[float]]
    bb_upper: List[Optional[float]]
    bb_lower: List[Optional[float]]


class DetailSahamResponse(BaseModel):
    kode_saham: str
    nama_perusahaan: Optional[str] = None
    range: str
    ohlcv: List[BarOHLCV]
    indikator: DeretIndikator
    last_updated_at: Optional[datetime] = None


class StatusResponse(BaseModel):
    status: str
    versi: str
    waktu_server: datetime
    pasar_buka: bool
