"""Unit test untuk skema Pydantic API."""

from __future__ import annotations

from datetime import datetime, timezone

import pytest

from app.api.schemas import (
    BarOHLCV,
    DaftarSahamResponse,
    DeretIndikator,
    DetailSahamResponse,
    IndikatorTeknikal,
    Paginasi,
    SahamRingkas,
)


class TestIndikatorTeknikal:
    def test_semua_field_none_valid(self):
        ind = IndikatorTeknikal()
        assert ind.rsi_14 is None
        assert ind.macd is None

    def test_field_terisi(self):
        ind = IndikatorTeknikal(rsi_14=55.5, macd=0.12, ema_50=1500.0)
        assert ind.rsi_14 == 55.5
        assert ind.macd == 0.12
        assert ind.ema_50 == 1500.0


class TestSahamRingkas:
    def test_buat_saham_ringkas(self):
        saham = SahamRingkas(
            kode_saham="BBCA",
            nama_perusahaan="Bank Central Asia Tbk",
            harga_terakhir=9500.0,
            indikator=IndikatorTeknikal(rsi_14=60.0),
            last_updated_at=datetime(2024, 1, 8, 10, 0, tzinfo=timezone.utc),
        )
        assert saham.kode_saham == "BBCA"
        assert saham.harga_terakhir == 9500.0
        assert saham.indikator.rsi_14 == 60.0


class TestDaftarSahamResponse:
    def test_response_kosong_valid(self):
        resp = DaftarSahamResponse(
            items=[],
            paginasi=Paginasi(page=1, page_size=50, total=0, total_pages=0),
        )
        assert resp.paginasi.total == 0
        assert resp.items == []


class TestDeretIndikator:
    def test_deret_kosong_valid(self):
        deret = DeretIndikator(
            rsi_14=[], macd=[], macd_signal=[],
            ema_50=[], ema_200=[], bb_upper=[], bb_lower=[],
        )
        assert deret.rsi_14 == []

    def test_deret_dengan_none(self):
        deret = DeretIndikator(
            rsi_14=[None, 55.0, 60.0],
            macd=[None, 0.1, 0.2],
            macd_signal=[None, 0.05, 0.1],
            ema_50=[None, 1000.0, 1001.0],
            ema_200=[None, None, 990.0],
            bb_upper=[None, 1010.0, 1012.0],
            bb_lower=[None, 990.0, 991.0],
        )
        assert deret.rsi_14[0] is None
        assert deret.rsi_14[1] == 55.0
