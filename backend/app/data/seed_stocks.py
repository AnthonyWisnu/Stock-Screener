"""Pengisian awal tabel referensi saham.

Modul ini menyediakan fungsi yang dapat dipanggil dari endpoint administratif
atau dari skrip startup untuk memastikan tabel stocks terisi.
"""

from __future__ import annotations

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.repository import upsert_stock

logger = logging.getLogger(__name__)

# Daftar saham default (LQ45 + saham populer IDX).
# Kode tanpa suffix .JK; suffix ditambahkan oleh fetcher.
DEFAULT_STOCKS: list[tuple[str, str]] = [
    ("AALI", "Astra Agro Lestari Tbk"),
    ("ADRO", "Adaro Energy Indonesia Tbk"),
    ("AKRA", "AKR Corporindo Tbk"),
    ("AMRT", "Sumber Alfaria Trijaya Tbk"),
    ("ANTM", "Aneka Tambang Tbk"),
    ("ASII", "Astra International Tbk"),
    ("BBCA", "Bank Central Asia Tbk"),
    ("BBNI", "Bank Negara Indonesia Tbk"),
    ("BBRI", "Bank Rakyat Indonesia Tbk"),
    ("BBTN", "Bank Tabungan Negara Tbk"),
    ("BFIN", "BFI Finance Indonesia Tbk"),
    ("BMRI", "Bank Mandiri Tbk"),
    ("BRIS", "Bank Syariah Indonesia Tbk"),
    ("BRPT", "Barito Pacific Tbk"),
    ("BUKA", "Bukalapak.com Tbk"),
    ("CPIN", "Charoen Pokphand Indonesia Tbk"),
    ("EMTK", "Elang Mahkota Teknologi Tbk"),
    ("ERAA", "Erajaya Swasembada Tbk"),
    ("EXCL", "XL Axiata Tbk"),
    ("GGRM", "Gudang Garam Tbk"),
    ("GOTO", "GoTo Gojek Tokopedia Tbk"),
    ("HMSP", "HM Sampoerna Tbk"),
    ("HRUM", "Harum Energy Tbk"),
    ("ICBP", "Indofood CBP Sukses Makmur Tbk"),
    ("INCO", "Vale Indonesia Tbk"),
    ("INDF", "Indofood Sukses Makmur Tbk"),
    ("INKP", "Indah Kiat Pulp and Paper Tbk"),
    ("INTP", "Indocement Tunggal Prakarsa Tbk"),
    ("ISAT", "Indosat Tbk"),
    ("ITMG", "Indo Tambangraya Megah Tbk"),
    ("JPFA", "Japfa Comfeed Indonesia Tbk"),
    ("JSMR", "Jasa Marga Tbk"),
    ("KLBF", "Kalbe Farma Tbk"),
    ("MAPI", "Mitra Adiperkasa Tbk"),
    ("MBMA", "Merdeka Battery Materials Tbk"),
    ("MDKA", "Merdeka Copper Gold Tbk"),
    ("MEDC", "Medco Energi Internasional Tbk"),
    ("MIKA", "Mitra Keluarga Karyasehat Tbk"),
    ("MNCN", "Media Nusantara Citra Tbk"),
    ("PGAS", "Perusahaan Gas Negara Tbk"),
    ("PGEO", "Pertamina Geothermal Energy Tbk"),
    ("PTBA", "Bukit Asam Tbk"),
    ("PTPP", "PP Tbk"),
    ("SIDO", "Industri Jamu dan Farmasi Sido Muncul Tbk"),
    ("SMGR", "Semen Indonesia Tbk"),
    ("SMRA", "Summarecon Agung Tbk"),
    ("SRTG", "Saratoga Investama Sedaya Tbk"),
    ("TINS", "Timah Tbk"),
    ("TLKM", "Telkom Indonesia Tbk"),
    ("TOWR", "Sarana Menara Nusantara Tbk"),
    ("TPIA", "Chandra Asri Pacific Tbk"),
    ("UNTR", "United Tractors Tbk"),
    ("UNVR", "Unilever Indonesia Tbk"),
    ("WIFI", "Solusi Sinergi Digital Tbk"),
    ("WSKT", "Waskita Karya Tbk"),
]


async def seed_default_stocks(session: AsyncSession) -> int:
    """Isi tabel stocks dengan daftar default bila belum ada.

    Kembalikan jumlah baris yang di-upsert.
    """
    count = 0
    for kode, nama in DEFAULT_STOCKS:
        await upsert_stock(session, kode_saham=kode, nama_perusahaan=nama, aktif=True)
        count += 1
    logger.info("Seed saham selesai: %d kode saham di-upsert.", count)
    return count
