"""Cek kenapa volume_ratio banyak yang 0."""
import asyncio
import asyncpg
import platform
import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / ".env")
except ImportError:
    pass

if platform.system() == "Windows":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def check():
    conn = await asyncpg.connect(
        host=os.environ.get("POSTGRES_HOST", "localhost"),
        port=int(os.environ.get("POSTGRES_PORT", "5432")),
        user=os.environ.get("POSTGRES_USER", "postgres"),
        password=os.environ.get("POSTGRES_PASSWORD", ""),
        database=os.environ.get("POSTGRES_DB", "idx_screener"),
    )

    # Ambil 5 bar terakhir BBCA untuk lihat pola volume
    rows = await conn.fetch("""
        SELECT kode_saham, timestamp_bar, close, volume
        FROM stock_ohlcv
        WHERE kode_saham = 'BBCA'
        ORDER BY timestamp_bar DESC
        LIMIT 10
    """)
    print("=== 10 bar terakhir BBCA ===")
    for r in rows:
        print(f"  {r['timestamp_bar'].strftime('%Y-%m-%d %H:%M')} | close={r['close']} | volume={r['volume']}")

    # Cek distribusi volume_ratio di stocks_latest
    rows2 = await conn.fetch("""
        SELECT kode_saham, volume_ratio,
               harga_terakhir, timestamp_bar
        FROM stocks_latest
        ORDER BY volume_ratio DESC NULLS LAST
        LIMIT 10
    """)
    print()
    print("=== Top 10 volume_ratio di stocks_latest ===")
    for r in rows2:
        print(f"  {r['kode_saham']} | ratio={r['volume_ratio']} | harga={r['harga_terakhir']} | bar={r['timestamp_bar']}")

    # Hitung berapa yang 0 vs non-0
    zero = await conn.fetchval("SELECT COUNT(*) FROM stocks_latest WHERE volume_ratio = 0")
    nonzero = await conn.fetchval("SELECT COUNT(*) FROM stocks_latest WHERE volume_ratio > 0")
    null = await conn.fetchval("SELECT COUNT(*) FROM stocks_latest WHERE volume_ratio IS NULL")
    print()
    print(f"=== Distribusi volume_ratio ===")
    print(f"  Nilai 0    : {zero}")
    print(f"  Nilai > 0  : {nonzero}")
    print(f"  NULL       : {null}")

    # Lihat bar terakhir yang dipakai untuk kalkulasi
    sample = await conn.fetch("""
        SELECT kode_saham, timestamp_bar
        FROM stocks_latest
        ORDER BY kode_saham
        LIMIT 5
    """)
    print()
    print("=== Timestamp bar terakhir (sample) ===")
    for r in sample:
        # Ambil volume 5 bar terakhir untuk kode ini
        vols = await conn.fetch("""
            SELECT timestamp_bar, volume
            FROM stock_ohlcv
            WHERE kode_saham = $1
            ORDER BY timestamp_bar DESC
            LIMIT 5
        """, r['kode_saham'])
        vol_str = " | ".join([f"{v['timestamp_bar'].strftime('%m-%d %H:%M')}={v['volume']}" for v in vols])
        print(f"  {r['kode_saham']}: {vol_str}")

    await conn.close()

asyncio.run(check())
