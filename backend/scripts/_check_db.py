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
    stocks   = await conn.fetchval("SELECT COUNT(*) FROM stocks")
    latest   = await conn.fetchval("SELECT COUNT(*) FROM stocks_latest")
    ohlcv    = await conn.fetchval("SELECT COUNT(*) FROM stock_ohlcv")
    indikator = await conn.fetchval("SELECT COUNT(*) FROM stock_indicators")
    sample   = await conn.fetch("SELECT kode_saham, harga_terakhir, rsi_14 FROM stocks_latest LIMIT 5")
    await conn.close()

    print(f"Tabel stocks        : {stocks} baris")
    print(f"Tabel stocks_latest : {latest} baris")
    print(f"Tabel stock_ohlcv   : {ohlcv} baris")
    print(f"Tabel stock_indicators: {indikator} baris")
    print()
    if sample:
        print("Sample stocks_latest:")
        for row in sample:
            print(f"  {row['kode_saham']} | harga={row['harga_terakhir']} | rsi={row['rsi_14']}")
    else:
        print("stocks_latest KOSONG - force_fetch belum dijalankan atau gagal")

asyncio.run(check())
