import asyncio
import asyncpg
import platform
import os
import ssl
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / ".env")
except ImportError:
    pass

if platform.system() == "Windows":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def check():
    database_url = os.environ.get("DATABASE_URL")
    connect_kwargs = {}
    if database_url:
        parts = urlsplit(database_url)
        query = [
            (key, value)
            for key, value in parse_qsl(parts.query, keep_blank_values=True)
            if key != "sslmode"
        ]
        dsn = urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))
        connect_kwargs["dsn"] = dsn
        if "sslmode=require" in database_url:
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            connect_kwargs["ssl"] = ssl_context
    else:
        connect_kwargs.update(
            host=os.environ.get("POSTGRES_HOST", "localhost"),
            port=int(os.environ.get("POSTGRES_PORT", "5432")),
            user=os.environ.get("POSTGRES_USER", "postgres"),
            password=os.environ.get("POSTGRES_PASSWORD", ""),
            database=os.environ.get("POSTGRES_DB", "idx_screener"),
        )

    conn = await asyncpg.connect(**connect_kwargs)
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
